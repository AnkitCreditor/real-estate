import User from "../models/user.model.js";
import { CustomError } from "../utils/CustomError.js";
import { generateAccessToken, generateRefreshToken } from "../utils/generateTokens.js";
import { sendEmail } from "../utils/sendEmail.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";

// ==============================
// Register User
// ==============================
export const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, confirmPassword, phone, dob } = req.body;

    if (password !== confirmPassword) {
      throw new CustomError("Passwords do not match", 400);
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      throw new CustomError("Email already registered", 400);
    }

    const user = await User.create({ firstName, lastName, email, password, phone, dob });

    // generate verification token
    const token = jwt.sign({ userId: user._id }, process.env.EMAIL_TOKEN_SECRET, {
      expiresIn: "1h",
    });

    const verificationLink = `${process.env.CLIENT_URL}/verify-email?token=${token}`;

    await sendEmail({
      to: user.email,
      subject: "Verify your email",
      html: `<p>Click the link to verify your email:</p><a href="${verificationLink}">${verificationLink}</a>`,
    });

    res.status(201).json({
      message: "User registered. Please check your email to verify your account.",
    });
  } catch (err) {
    next(err);
  }
};

// ==============================
// Verify Email
// ==============================
export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;
    const decoded = jwt.verify(token, process.env.EMAIL_TOKEN_SECRET);

    const user = await User.findById(decoded.userId);
    if (!user) throw new CustomError("User not found", 404);
    if (user.isVerified) return res.json({ message: "Email already verified" });

    user.isVerified = true;
    await user.save();

    res.json({ message: "Email verified successfully" });
  } catch (err) {
    next(err);
  }
};

// ==============================
// Resend Verification Email
// ==============================
export const resendVerificationEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) throw new CustomError("User not found", 404);
    if (user.isVerified) throw new CustomError("Email is already verified", 400);

    const token = jwt.sign({ userId: user._id }, process.env.EMAIL_TOKEN_SECRET, {
      expiresIn: "1h",
    });

    const verificationLink = `${process.env.CLIENT_URL}/verify-email?token=${token}`;

    await sendEmail({
      to: user.email,
      subject: "Resend: Verify your email",
      html: `<p>Click the link to verify your email:</p><a href="${verificationLink}">${verificationLink}</a>`,
    });

    res.json({ message: "Verification email resent" });
  } catch (err) {
    next(err);
  }
};

// ==============================
// Login
// ==============================
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) throw new CustomError("Invalid email or password", 401);

    const isMatch = await user.comparePassword(password);
    if (!isMatch) throw new CustomError("Invalid email or password", 401);

    if (!user.isVerified) throw new CustomError("Please verify your email", 403);

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    res
      .cookie("accessToken", accessToken, {
        httpOnly: true,
        sameSite: "Strict",
        maxAge: 15 * 60 * 1000, // 15 mins
      })
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        sameSite: "Strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      })
      .json({
        message: "Login successful",
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          email: user.email,
        },
      });
  } catch (err) {
    next(err);
  }
};

// ==============================
// Refresh Token
// ==============================
export const refreshAccessToken = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) throw new CustomError("No refresh token provided", 401);

    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user || user.refreshToken !== token) {
      throw new CustomError("Invalid refresh token", 403);
    }

    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    user.refreshToken = newRefreshToken;
    await user.save();

    res
      .cookie("accessToken", newAccessToken, {
        httpOnly: true,
        sameSite: "Strict",
        maxAge: 15 * 60 * 1000,
      })
      .cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        sameSite: "Strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .json({ message: "Access token refreshed" });
  } catch (err) {
    next(err);
  }
};

// ==============================
// Logout
// ==============================
export const logout = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
      const user = await User.findById(decoded.userId);
      if (user) {
        user.refreshToken = null;
        await user.save();
      }
    }

    res.clearCookie("accessToken").clearCookie("refreshToken").json({
      message: "Logged out successfully",
    });
  } catch (err) {
    next(err);
  }
};
