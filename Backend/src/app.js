import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";

// Import error middleware
import { errorHandler } from "./middlewares/error.middleware.js";

// Route imports
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import blogRoutes from "./routes/blog.routes.js";
import propertyRoutes from "./routes/property.routes.js";
import chatRoutes from "./routes/chatbot.routes.js";

const app = express();

// 🛡️ CORS setup
app.use(
  cors({
    origin:"https://real-estate-taupe-eight.vercel.app",
    credentials: true,
  })
);

// 🔧 Global middlewares
app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true, limit: "20kb" }));
app.use(cookieParser());
app.use(morgan("dev")); // optional for logging requests

// ✅ ❗️Removed express-fileupload to avoid conflict with multer
// ❌ Do NOT use express-fileupload with multer
// app.use(fileUpload({ useTempFiles: true }));

// 💡 Mount routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/blogs", blogRoutes);
app.use("/api/v1/properties", propertyRoutes);
app.use("/api/v1/chat", chatRoutes);

// ❌ Error handler
app.use(errorHandler);

export { app };
