import express from "express";
import {
  getMyProfile,
  updateMyProfile,
  getAllUsers,
  makeUserAdmin,
} from "../controllers/user.controller.js";

import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/authorize.middleware.js";
import { 
  multerUpload, 
  multerUploadDebug,
  handleMulterError, 
  debugRequest 
} from "../middlewares/multer.middleware.js";

const router = express.Router();

// ✅ Get logged-in user's profile
router.get("/me", isAuthenticated, getMyProfile);

// ✅ Update profile photo + address details - DEBUG VERSION
router.put(
  "/update-profile",
  debugRequest,           // Add request debugging
  isAuthenticated,
  (req, res, next) => {
    console.log("=== BEFORE MULTER ===");
    console.log("Body keys:", Object.keys(req.body || {}));
    console.log("Files:", req.files);
    console.log("File:", req.file);
    next();
  },
  multerUploadDebug.single("avatar"), // Use debug version temporarily
  (req, res, next) => {
    console.log("=== AFTER MULTER ===");
    console.log("Body:", req.body);
    console.log("File:", req.file);
    next();
  },
  handleMulterError,
  updateMyProfile
);

// Alternative route for testing without multer
router.put(
  "/update-profile-no-file",
  debugRequest,
  isAuthenticated,
  (req, res, next) => {
    console.log("=== NO FILE UPDATE ===");
    console.log("Body:", req.body);
    console.log("Content-Type:", req.headers['content-type']);
    next();
  },
  updateMyProfile
);

// ✅ Admin - Get all users
router.get("/all", isAuthenticated, authorizeRoles("ADMIN"), getAllUsers);

// ✅ Admin - Promote user to admin
router.put(
  "/make-admin/:id",
  isAuthenticated,
  authorizeRoles("ADMIN"),
  makeUserAdmin
);

export default router;