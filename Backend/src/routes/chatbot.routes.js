import express from "express";
import {
  sendMessageToBot,
  getChatBySession,
  getAllChats,
} from "../controllers/chatbot.controller.js";

import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/authorize.middleware.js";
import { assignChatSession } from "../middlewares/chatbot.middleware.js";

const router = express.Router();

// ✅ Send a message to chatbot (Guest or Logged-in user)
// Apply session middleware for guest users
router.post("/", assignChatSession, sendMessageToBot);

// ✅ Admin: Get all chatbot conversations
// Place this BEFORE the parameterized route to avoid conflicts
router.get("/admin/all", isAuthenticated, authorizeRoles("ADMIN"), getAllChats);

// ✅ Get chat history by sessionId (Guest or Logged-in user)
// This should come AFTER specific routes to avoid matching conflicts
router.get("/:sessionId", getChatBySession);

// ✅ Alternative: More explicit routing structure
// Uncomment below if you prefer more explicit paths

// router.post("/message", assignChatSession, sendMessageToBot);
// router.get("/session/:sessionId", getChatBySession);
// router.get("/admin/conversations", isAuthenticated, authorizeRoles("admin"), getAllChats);

export default router;