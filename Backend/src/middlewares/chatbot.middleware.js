import { v4 as uuidv4 } from "uuid";

// ================================================
// @desc    Assign chat session for guest users
// @middleware chatSession.middleware.js
// ================================================
export const assignChatSession = (req, res, next) => {
  try {
    // Skip session assignment for authenticated users (they use userId)
    if (req.user) {
      return next();
    }

    // Check if session exists in cookies
    if (!req.cookies.chatSessionId) {
      const sessionId = uuidv4();
      
      // Set cookie with secure options
      res.cookie("chatSessionId", sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // HTTPS in production
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours (increased from 8)
      });
      
      req.chatSessionId = sessionId;
      
      // Optional: Log session creation for debugging
      console.log(`New chat session created: ${sessionId}`);
    } else {
      req.chatSessionId = req.cookies.chatSessionId;
    }
    
    next();
  } catch (error) {
    console.error("Error in assignChatSession middleware:", error);
    // Don't block the request, just proceed without session
    next();
  }
};

// ================================================
// @desc    Validate session ID format
// @middleware Optional validation middleware
// ================================================
export const validateSessionId = (req, res, next) => {
  const sessionId = req.params.sessionId || req.body.sessionId || req.chatSessionId;
  
  if (sessionId) {
    // Basic UUID format validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(sessionId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid session ID format"
      });
    }
  }
  
  next();
};

// ================================================
// @desc    Rate limiting for chat messages
// @middleware Optional rate limiting
// ================================================
export const chatRateLimit = (req, res, next) => {
  // Simple in-memory rate limiting (consider Redis for production)
  if (!global.chatRateLimit) {
    global.chatRateLimit = new Map();
  }
  
  const identifier = req.user ? req.user._id.toString() : req.ip;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 20; // Max 20 messages per minute
  
  const userRequests = global.chatRateLimit.get(identifier) || [];
  
  // Remove old requests outside the window
  const recentRequests = userRequests.filter(time => now - time < windowMs);
  
  if (recentRequests.length >= maxRequests) {
    return res.status(429).json({
      success: false,
      message: "Too many messages. Please wait before sending another message.",
      retryAfter: Math.ceil((recentRequests[0] + windowMs - now) / 1000)
    });
  }
  
  // Add current request
  recentRequests.push(now);
  global.chatRateLimit.set(identifier, recentRequests);
  
  next();
};