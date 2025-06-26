import User from "../models/user.model.js";
import cloudinary from "../config/cloudinary.js";
import { getDataUri } from "../utils/dataUri.js";
import { CustomError } from "../utils/CustomError.js";
import { uploadSingleImageToCloudinary } from "../middlewares/multer.middleware.js";

// ===============================
// @desc   Get current user's profile
// @route  GET /api/v1/users/profile
// @access Private
// ===============================
export const getMyProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("-password -refreshToken");
    if (!user) throw new CustomError("User not found", 404);

    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// ===============================
// @desc   Update profile (not name/email)
// @route  PUT /api/v1/users/profile
// @access Private
// ===============================
export const updateMyProfile = async (req, res, next) => {
  try {
    console.log("=== UPDATE PROFILE CONTROLLER START ===");
    console.log("Request body:", req.body);
    console.log("Request file:", req.file);
    console.log("User ID:", req.user?._id);

    const {
      phone,
      dob,
      address,
      landmark,
      country,
      pincode,
      city,
      state,
    } = req.body;

    // Validate user exists
    const user = await User.findById(req.user._id);
    if (!user) {
      console.log("User not found:", req.user._id);
      throw new CustomError("User not found", 404);
    }

    console.log("User found:", user.email);

    // Update basic fields
    const fieldsToUpdate = {
      phone: phone || user.phone,
      dob: dob || user.dob,
      address: address || user.address,
      landmark: landmark || user.landmark,
      country: country || user.country,
      pincode: pincode || user.pincode,
      city: city || user.city,
      state: state || user.state,
    };

    console.log("Fields to update:", fieldsToUpdate);

    // Apply updates
    Object.keys(fieldsToUpdate).forEach(key => {
      user[key] = fieldsToUpdate[key];
    });

    // Handle avatar upload if file exists
    if (req.file) {
      console.log("=== AVATAR UPLOAD PROCESS ===");
      console.log("File details:", {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        fieldname: req.file.fieldname
      });

      try {
        // Delete old avatar if exists
        if (user.avatar?.public_id) {
          console.log("Deleting old avatar:", user.avatar.public_id);
          await cloudinary.uploader.destroy(user.avatar.public_id);
          console.log("Old avatar deleted successfully");
        }

        // Upload new avatar
        console.log("Uploading new avatar...");
        const uploadResult = await uploadSingleImageToCloudinary(req.file);
        console.log("Upload result:", uploadResult);
        
        user.avatar = {
          public_id: uploadResult.public_id,
          url: uploadResult.url,
        };

        console.log("Avatar updated successfully");
      } catch (uploadError) {
        console.error("Avatar upload failed:", uploadError);
        // Don't throw here, continue with other updates
        console.log("Continuing without avatar update...");
      }
    } else {
      console.log("No file provided, skipping avatar update");
    }

    // Save user
    console.log("Saving user...");
    await user.save();
    console.log("User saved successfully");

    // Prepare response
    const userResponse = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      dob: user.dob,
      address: user.address,
      landmark: user.landmark,
      city: user.city,
      state: user.state,
      country: user.country,
      pincode: user.pincode,
      avatar: user.avatar,
      role: user.role,
    };

    console.log("=== SUCCESS RESPONSE ===");
    res.json({
      success: true,
      message: "Profile updated successfully",
      user: userResponse,
    });

  } catch (err) {
    console.error("=== CONTROLLER ERROR ===");
    console.error("Error type:", err.constructor.name);
    console.error("Error message:", err.message);
    console.error("Error stack:", err.stack);
    console.error("Full error:", err);
    next(err);
  }
};

// ===============================
// @desc   Get all users (admin)
// @route  GET /api/v1/users
// @access Admin
// ===============================
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password -refreshToken");
    res.json({ success: true, users });
  } catch (err) {
    next(err);
  }
};

// ===============================
// @desc   Update user role (admin)
// @route  PUT /api/v1/users/:id/role
// @access Admin
// ===============================
export const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!["admin", "user"].includes(role)) {
      throw new CustomError("Invalid role", 400);
    }

    const user = await User.findById(req.params.id);
    if (!user) throw new CustomError("User not found", 404);

    user.role = role;
    await user.save();

    res.json({ success: true, message: "User role updated", user });
  } catch (err) {
    next(err);
  }
};

// ===============================
// @desc   Make user admin (admin)
// @route  PUT /api/v1/users/:id/make-admin
// @access Admin
// ===============================
export const makeUserAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) throw new CustomError("User not found", 404);

    if (user.role === "admin") {
      return res.status(400).json({
        success: false,
        message: "User is already an admin",
      });
    }

    user.role = "admin";
    await user.save();

    res.json({ success: true, message: "User promoted to admin", user });
  } catch (err) {
    next(err);
  }
};

// ===============================
// @desc   Delete user (admin)
// @route  DELETE /api/v1/users/:id
// @access Admin
// ===============================
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) throw new CustomError("User not found", 404);

    if (user.avatar?.public_id) {
      await cloudinary.uploader.destroy(user.avatar.public_id);
    }

    await user.deleteOne();

    res.json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    next(err);
  }
};
