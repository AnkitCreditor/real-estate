import Blog from "../models/blog.model.js";
import { CustomError } from "../utils/CustomError.js";
import { getDataUri } from "../utils/dataUri.js";
import cloudinary from "../config/cloudinary.js";

// ==============================
// @desc  Create a blog post (Admin only)
// @route POST /api/v1/blogs
// @access Private (Admin only)
// ==============================
export const createBlog = async (req, res, next) => {
  try {
    const { title, content, tags } = req.body;

    if (!req.file) {
      throw new CustomError("Blog image is required", 400);
    }

    const fileUri = getDataUri(req.file);
    const upload = await cloudinary.uploader.upload(fileUri.content, {
      folder: "realestate/blogs",
    });

    const blog = await Blog.create({
      title,
      content,
      tags: tags?.split(",").map(tag => tag.trim()) || [],
      image: {
        public_id: upload.public_id,
        url: upload.secure_url,
      },
      author: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Blog created successfully",
      blog,
    });
  } catch (err) {
    next(err);
  }
};

// ==============================
// @desc  Get all blogs (Public)
// @route GET /api/v1/blogs
// @access Public
// ==============================
export const getAllBlogs = async (req, res, next) => {
  try {
    const blogs = await Blog.find()
      .populate("author", "firstName lastName email")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, blogs });
  } catch (err) {
    next(err);
  }
};

// ==============================
// @desc  Get a blog by ID (Public)
// @route GET /api/v1/blogs/:id
// @access Public
// ==============================
export const getBlogById = async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.id).populate("author", "firstName lastName");

    if (!blog) throw new CustomError("Blog not found", 404);

    res.status(200).json({ success: true, blog });
  } catch (err) {
    next(err);
  }
};

// ==============================
// @desc  Update blog post (Admin only)
// @route PUT /api/v1/blogs/:id
// @access Private (Admin only)
// ==============================
export const updateBlog = async (req, res, next) => {
  try {
    const { title, content, tags } = req.body;

    const blog = await Blog.findById(req.params.id);
    if (!blog) throw new CustomError("Blog not found", 404);

    // If new image is uploaded, replace the old one
    if (req.file) {
      if (blog.image?.public_id) {
        await cloudinary.uploader.destroy(blog.image.public_id);
      }

      const fileUri = getDataUri(req.file);
      const upload = await cloudinary.uploader.upload(fileUri.content, {
        folder: "realestate/blogs",
      });

      blog.image = {
        public_id: upload.public_id,
        url: upload.secure_url,
      };
    }

    blog.title = title || blog.title;
    blog.content = content || blog.content;
    blog.tags = tags?.split(",").map(tag => tag.trim()) || blog.tags;

    await blog.save();

    res.json({ success: true, message: "Blog updated", blog });
  } catch (err) {
    next(err);
  }
};

// ==============================
// @desc  Delete a blog post (Admin only)
// @route DELETE /api/v1/blogs/:id
// @access Private (Admin only)
// ==============================
export const deleteBlog = async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) throw new CustomError("Blog not found", 404);

    if (blog.image?.public_id) {
      await cloudinary.uploader.destroy(blog.image.public_id);
    }

    await blog.deleteOne();

    res.json({ success: true, message: "Blog deleted successfully" });
  } catch (err) {
    next(err);
  }
};
