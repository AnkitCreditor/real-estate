import Property from "../models/property.model.js";
import { CustomError } from "../utils/CustomError.js";
import { getDataUri } from "../utils/dataUri.js";
import cloudinary from "../config/cloudinary.js";

// ===============================
// Create Property (Admin only)
// ===============================
export const createProperty = async (req, res, next) => {
  try {
    const {
      title, description, price, address,
      city, state, country, pincode,
      type, status, availabilityDate, tags,
    } = req.body;

    if (!req.files || req.files.length < 4 || req.files.length > 10) {
      throw new CustomError("Upload between 4 and 10 property images", 400);
    }

    const uploadPromises = req.files.map(file => {
      const fileUri = getDataUri(file);
      return cloudinary.uploader.upload(fileUri.content, {
        folder: "realestate/properties"
      });
    });

    const uploadResults = await Promise.all(uploadPromises);

    const images = uploadResults.map(file => ({
      public_id: file.public_id,
      url: file.secure_url,
    }));

    const property = await Property.create({
      title,
      description,
      price,
      address,
      city,
      state,
      country,
      pincode,
      type,
      status,
      availabilityDate,
      tags: tags?.split(",").map(tag => tag.trim()) || [],
      images,
      listedBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Property listed successfully",
      property,
    });
  } catch (err) {
    next(err);
  }
};

// ===============================
// Get All Properties (User View)
// ===============================
export const getAllProperties = async (req, res, next) => {
  try {
    const properties = await Property.find({
      isDeleted: false,
      status: "Available",
      showPublic: true,
    })
      .populate("listedBy", "firstName lastName")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, properties });
  } catch (err) {
    next(err);
  }
};

// ===============================
// Get All Properties (Admin View)
// ===============================
export const getAllAdminProperties = async (req, res, next) => {
  try {
    const properties = await Property.find({ isDeleted: false })
      .populate("listedBy", "firstName lastName")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, properties });
  } catch (err) {
    next(err);
  }
};

// ===============================
// Get Property by ID
// ===============================
export const getPropertyById = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate("listedBy", "firstName lastName");

    if (!property || property.isDeleted) {
      throw new CustomError("Property not found", 404);
    }

    res.status(200).json({ success: true, property });
  } catch (err) {
    next(err);
  }
};

// ===============================
// ✅ Get Properties by Status
// ===============================
export const getPropertiesByStatus = async (req, res, next) => {
  try {
    const category = req.params.status.toLowerCase();

    const statusMap = {
      rent: "Rent",
      sell: "Sell",
      rented: "Rented",
      sold: "Sold",
    };

    const mappedStatus = statusMap[category] || category;

    const properties = await Property.find({
      status: mappedStatus,
      isDeleted: false,
      showPublic: true,
    })
      .populate("listedBy", "firstName lastName")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, properties });
  } catch (err) {
    next(err);
  }
};

// ===============================
// Get Properties by Type
// ===============================
export const getPropertiesByType = async (req, res, next) => {
  try {
    const type = req.params.type;

    const allowedTypes = ["Apartment", "Villa", "Plot", "Commercial", "Other"];
    if (!allowedTypes.includes(type)) {
      throw new CustomError("Invalid property type", 400);
    }

    const properties = await Property.find({
      type,
      isDeleted: false,
      status: "Available",
      showPublic: true,
    })
      .populate("listedBy", "firstName lastName")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, properties });
  } catch (err) {
    next(err);
  }
};

// ===============================
// Update Property (Admin)
// ===============================
export const updateProperty = async (req, res, next) => {
  try {
    const {
      title, description, price, address,
      city, state, country, pincode,
      type, status, availabilityDate, tags,
      showPublic,
    } = req.body;

    const property = await Property.findById(req.params.id);
    if (!property) {
      throw new CustomError("Property not found", 404);
    }

    if (req.files && req.files.length) {
      for (const img of property.images) {
        await cloudinary.uploader.destroy(img.public_id);
      }

      const uploadResults = await Promise.all(
        req.files.map(file => {
          const fileUri = getDataUri(file);
          return cloudinary.uploader.upload(fileUri.content, {
            folder: "realestate/properties",
          });
        })
      );

      property.images = uploadResults.map(file => ({
        public_id: file.public_id,
        url: file.secure_url,
      }));
    }

    property.title = title || property.title;
    property.description = description || property.description;
    property.price = price || property.price;
    property.address = address || property.address;
    property.city = city || property.city;
    property.state = state || property.state;
    property.country = country || property.country;
    property.pincode = pincode || property.pincode;
    property.type = type || property.type;
    property.status = status || property.status;
    property.availabilityDate = availabilityDate || property.availabilityDate;
    property.tags = tags?.split(",").map(tag => tag.trim()) || property.tags;
    property.showPublic = showPublic !== undefined ? showPublic : property.showPublic;

    await property.save();

    res.json({ success: true, message: "Property updated", property });
  } catch (err) {
    next(err);
  }
};

// ===============================
// Delete Property (Soft Delete)
// ===============================
export const deleteProperty = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      throw new CustomError("Property not found", 404);
    }

    property.isDeleted = true;

    for (const img of property.images) {
      await cloudinary.uploader.destroy(img.public_id);
    }

    await property.save();

    res.json({ success: true, message: "Property archived (soft deleted)" });
  } catch (err) {
    next(err);
  }
};
