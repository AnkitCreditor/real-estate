import express from "express";
import {
  createBlog,
  getAllBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
} from "../controllers/blog.controller.js";

import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/authorize.middleware.js";
import { multerUpload } from "../middlewares/multer.middleware.js"; // ✅ Use named import

const router = express.Router();

// Public - Get all blogs
router.get("/", getAllBlogs);

// Public - Get blog by ID
router.get("/:id", getBlogById);

// Admin - Create blog (with single image)
router.post(
  "/",
  isAuthenticated,
  authorizeRoles("admin"),
  multerUpload.single("image"), // ✅ corrected
  createBlog
);

// Admin - Update blog (with new image if provided)
router.put(
  "/:id",
  isAuthenticated,
  authorizeRoles("admin"),
  multerUpload.single("image"), // ✅ corrected
  updateBlog
);

// Admin - Delete blog
router.delete(
  "/:id",
  isAuthenticated,
  authorizeRoles("admin"),
  deleteBlog
);

export default router;
