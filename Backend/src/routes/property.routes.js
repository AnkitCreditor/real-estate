import express from "express";
import {
  createProperty,
  getAllProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
  getPropertiesByStatus,
  getPropertiesByType,
} from "../controllers/property.controller.js";

import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/authorize.middleware.js";

// ✅ Correct way to import multerUpload
import { multerUpload as upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

// 🌐 Public - Get all listed (non-deleted) properties
router.get("/", getAllProperties);

// 🌐 Public - Get property by ID
router.get("/:id", getPropertyById);

// 🌐 Public - Get properties by status (Available, Rented, Sold)
router.get("/category/:status", getPropertiesByStatus);

// 🌐 Public - Get properties by type (Villa, Plot, etc.)
router.get("/type/:type", getPropertiesByType);

// 🔐 Admin - Create new property (4 to 10 images)
router.post(
  "/",
  isAuthenticated,
  authorizeRoles("ADMIN"),
  upload.array("images", 10),
  createProperty
);

// 🔐 Admin - Update property
router.put(
  "/update/:id",
  isAuthenticated,
  authorizeRoles("ADMIN"),
  upload.array("images", 10),
  updateProperty
);

// 🔐 Admin - Soft delete property (archives it)
router.delete(
  "/delete/:id",
  isAuthenticated,
  authorizeRoles(""),
  deleteProperty
);

export default router;
