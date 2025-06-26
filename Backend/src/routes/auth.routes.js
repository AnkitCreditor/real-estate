import express from "express";
import {
  register,
  login,
  logout,
  verifyEmail,
  resendVerificationEmail,
  refreshAccessToken
} from "../controllers/auth.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";

const router = express.Router();

// ✅ Register
router.post("/register", register);

// ✅ Verify email
router.get("/verify-email", verifyEmail);

// ✅ Resend email verification
router.post("/resend-verification", resendVerificationEmail);

// ✅ Login
router.post("/login", login);

// ✅ Logout
router.post("/logout", isAuthenticated, logout);

// ✅ Refresh token
router.post("/refresh-token", refreshAccessToken);

export default router;
