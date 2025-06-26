import multer from "multer";
import DatauriParser from "datauri/parser.js";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import { CustomError } from "../utils/CustomError.js";

const parser = new DatauriParser();

// Debug middleware to log request details
const debugRequest = (req, res, next) => {
  console.log("=== REQUEST DEBUG INFO ===");
  console.log("Content-Type:", req.headers['content-type']);
  console.log("Content-Length:", req.headers['content-length']);
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  console.log("Headers:", JSON.stringify(req.headers, null, 2));
  
  // Log when request ends
  req.on('end', () => {
    console.log("Request stream ended normally");
  });
  
  req.on('close', () => {
    console.log("Request connection closed");
  });
  
  req.on('error', (err) => {
    console.log("Request stream error:", err);
  });
  
  next();
};

const storage = multer.memoryStorage();

const multerUpload = multer({
  storage,
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB
    fieldSize: 1024 * 1024,    // 1MB
    fields: 20,
    files: 10,
    parts: 30 // Add parts limit
  },
  fileFilter: (req, file, cb) => {
    console.log("File filter - Original name:", file.originalname);
    console.log("File filter - Mimetype:", file.mimetype);
    console.log("File filter - Field name:", file.fieldname);
    
    const ext = path.extname(file.originalname).toLowerCase();
    if (![".jpg", ".jpeg", ".png", ".webp"].includes(ext)) {
      console.log("File rejected - Invalid extension:", ext);
      return cb(new CustomError("Only image files are allowed", 400));
    }
    console.log("File accepted");
    cb(null, true);
  },
});

// Enhanced error handling with more specific error detection
const handleMulterError = (err, req, res, next) => {
  console.log("=== MULTER ERROR HANDLER ===");
  console.log("Error type:", err.constructor.name);
  console.log("Error message:", err.message);
  console.log("Error code:", err.code);
  console.log("Full error:", err);
  
  if (err instanceof multer.MulterError) {
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          message: 'File too large. Maximum size is 5MB'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Too many files'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          message: 'Unexpected field name. Expected "avatar"'
        });
      case 'LIMIT_FIELD_VALUE':
        return res.status(400).json({
          success: false,
          message: 'Field value too long'
        });
      case 'LIMIT_PART_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Too many parts in multipart data'
        });
      default:
        return res.status(400).json({
          success: false,
          message: 'Multer error: ' + err.message
        });
    }
  }
  
  // Check for various form parsing errors
  if (err.message && (
    err.message.includes('Unexpected end of form') ||
    err.message.includes('Unexpected end of multipart data') ||
    err.message.includes('Part terminated early') ||
    err.message.includes('boundary')
  )) {
    return res.status(400).json({
      success: false,
      message: 'Upload was interrupted or malformed. Please try again.',
      debug: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
  
  // Check for request size errors
  if (err.type === 'entity.too.large') {
    return res.status(400).json({
      success: false,
      message: 'Request entity too large'
    });
  }
  
  next(err);
};

// Alternative multer setup with more permissive settings for debugging
const multerUploadDebug = multer({
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 10 * 1024 * 1024, // Increase to 10MB for testing
    fieldSize: 2 * 1024 * 1024,  // Increase field size
    fields: 50,
    files: 20,
    parts: 100
  },
  fileFilter: (req, file, cb) => {
    console.log("DEBUG: Processing file:", file.originalname);
    cb(null, true); // Accept all files for debugging
  },
});

const bufferToDataURI = (file) => {
  try {
    if (!file || !file.buffer) {
      throw new Error("File or buffer is missing");
    }
    console.log("Converting file to DataURI - Size:", file.buffer.length);
    return parser.format(path.extname(file.originalname).toString(), file.buffer);
  } catch (error) {
    console.error("bufferToDataURI error:", error);
    throw new CustomError("Failed to process file: " + error.message, 400);
  }
};

const uploadSingleImageToCloudinary = async (file) => {
  try {
    console.log("=== CLOUDINARY UPLOAD START ===");
    console.log("File details:", {
      originalname: file?.originalname,
      mimetype: file?.mimetype,
      size: file?.size,
      bufferLength: file?.buffer?.length
    });

    if (!file || !file.buffer) {
      throw new CustomError("No file or buffer provided", 400);
    }

    const file64 = bufferToDataURI(file);
    console.log("DataURI created, uploading to Cloudinary...");
    
    const uploaded = await cloudinary.uploader.upload(file64.content, {
      folder: "realestate/avatars",
      resource_type: "image",
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
    });
    
    console.log("Cloudinary upload successful:", uploaded.public_id);
    
    return {
      public_id: uploaded.public_id,
      url: uploaded.secure_url,
    };
  } catch (error) {
    console.error("=== CLOUDINARY UPLOAD ERROR ===");
    console.error("Error details:", error);
    throw new CustomError("Failed to upload image: " + error.message, 500);
  }
};

export {
  multerUpload,
  multerUploadDebug, // Export debug version
  handleMulterError,
  debugRequest,
  uploadSingleImageToCloudinary,
  bufferToDataURI
};