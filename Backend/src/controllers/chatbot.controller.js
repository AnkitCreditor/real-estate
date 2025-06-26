import { v4 as uuidv4 } from "uuid";
import Chat from "../models/chatbot.model.js";
import { CustomError } from "../utils/CustomError.js";

// ================================================
// @desc    Send message to chatbot
// @route   POST /api/v1/chat
// @access  Public (Guest or Authenticated)
// ================================================
export const sendMessageToBot = async (req, res, next) => {
  try {
    const { message, sessionId } = req.body;

    // Validate message
    if (!message || message.trim() === "") {
      throw new CustomError("Message is required and cannot be empty", 400);
    }

    const userId = req.user ? req.user._id : null;
    
    // Priority: body sessionId > middleware sessionId > generate new
    const activeSessionId = sessionId || req.chatSessionId || uuidv4();

    // Generate bot reply
    const reply = generateBotReply(message);

    // Find existing chat - prioritize user-based chat for authenticated users
    let chat;
    if (userId) {
      // For authenticated users, find by userId first, then by sessionId
      chat = await Chat.findOne({ 
        $or: [
          { user: userId },
          { sessionId: activeSessionId, user: null }
        ]
      });
      
      // If found a guest session, migrate it to user account
      if (chat && !chat.user) {
        chat.user = userId;
      }
    } else {
      // For guest users, find by sessionId only
      chat = await Chat.findOne({ sessionId: activeSessionId, user: null });
    }

    const newMessages = [
      { 
        sender: "user", 
        text: message.trim(),
        timestamp: new Date()
      },
      { 
        sender: "bot", 
        text: reply,
        timestamp: new Date()
      },
    ];

    if (chat) {
      // Update existing chat
      chat.messages.push(...newMessages);
      await chat.save();
    } else {
      // Create new chat
      chat = await Chat.create({
        user: userId,
        sessionId: activeSessionId,
        messages: newMessages,
      });
    }

    res.status(200).json({
      success: true,
      sessionId: activeSessionId,
      reply,
      messageCount: chat.messages.length,
      chatId: chat._id
    });
  } catch (err) {
    next(err);
  }
};

// ================================================
// @desc    Get chat history by sessionId
// @route   GET /api/v1/chat/:sessionId
// @access  Public
// ================================================
export const getChatBySession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    // Validate sessionId format (basic UUID validation)
    if (!sessionId || sessionId.trim() === "") {
      throw new CustomError("Valid session ID is required", 400);
    }

    const chat = await Chat.findOne({ sessionId })
      .populate("user", "firstName lastName email")
      .lean(); // Use lean() for better performance when only reading

    if (!chat) {
      return res.status(404).json({ 
        success: false, 
        message: "No chat found for this session" 
      });
    }

    res.status(200).json({ 
      success: true, 
      chat: {
        ...chat,
        messageCount: chat.messages.length,
        lastActivity: chat.updatedAt
      }
    });
  } catch (err) {
    next(err);
  }
};

// ================================================
// @desc    Get all chat sessions (Admin)
// @route   GET /api/v1/chat/admin/all
// @access  Admin
// ================================================
export const getAllChats = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build query
    let query = {};
    if (search) {
      query = {
        $or: [
          { "messages.text": { $regex: search, $options: "i" } },
          { sessionId: { $regex: search, $options: "i" } }
        ]
      };
    }

    // Get total count for pagination
    const total = await Chat.countDocuments(query);

    const chats = await Chat.find(query)
      .populate("user", "firstName lastName email")
      .select("user sessionId messages createdAt updatedAt")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Add message count and last message to each chat
    const enrichedChats = chats.map(chat => ({
      ...chat,
      messageCount: chat.messages.length,
      lastMessage: chat.messages[chat.messages.length - 1],
      isGuest: !chat.user
    }));

    res.status(200).json({ 
      success: true, 
      chats: enrichedChats,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        count: chats.length,
        totalChats: total
      }
    });
  } catch (err) {
    next(err);
  }
};

// ================================================
// @desc    Get user's own chat history (Authenticated)
// @route   GET /api/v1/chat/my-chats
// @access  Private
// ================================================
export const getUserChats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const chats = await Chat.find({ user: userId })
      .select("sessionId messages createdAt updatedAt")
      .sort({ updatedAt: -1 })
      .lean();

    const enrichedChats = chats.map(chat => ({
      ...chat,
      messageCount: chat.messages.length,
      lastMessage: chat.messages[chat.messages.length - 1]
    }));

    res.status(200).json({ 
      success: true, 
      chats: enrichedChats 
    });
  } catch (err) {
    next(err);
  }
};

// ================================================
// Helper function to generate bot replies
// ================================================
const generateBotReply = (message) => {
  const lowerMsg = message.toLowerCase().trim();
  
  // Enhanced response patterns
  const responses = {
    greeting: {
      patterns: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'],
      replies: [
        'Hello! How can I help you with your real estate needs today?',
        'Hi there! What can I assist you with?',
        'Welcome! I\'m here to help with any property questions you have.'
      ]
    },
    rent: {
      patterns: ['rent', 'rental', 'lease', 'tenant', 'renting'],
      replies: [
        'I can help you find rental properties! What type of property are you looking for?',
        'Great! Are you looking for residential or commercial rentals?',
        'I\'d be happy to assist with rental listings. What\'s your preferred location?'
      ]
    },
    buy: {
      patterns: ['buy', 'purchase', 'sale', 'buying', 'purchasing'],
      replies: [
        'Excellent! Are you looking to buy residential or commercial property?',
        'I can help you find properties for sale. What\'s your budget range?',
        'Great choice! What type of property are you interested in purchasing?'
      ]
    },
    schedule: {
      patterns: ['schedule', 'meeting', 'appointment', 'visit', 'viewing'],
      replies: [
        'You can schedule a meeting with our agent using our contact form.',
        'I\'d be happy to help arrange a viewing. Please provide your preferred dates.',
        'Let\'s set up a meeting! What days work best for you?'
      ]
    },
    price: {
      patterns: ['price', 'cost', 'expensive', 'cheap', 'budget', 'affordable'],
      replies: [
        'Property prices vary by location and type. What\'s your budget range?',
        'I can help you find properties within your budget. What range are you considering?',
        'Pricing depends on many factors. Tell me more about what you\'re looking for.'
      ]
    }
  };

  // Check for patterns
  for (const [category, data] of Object.entries(responses)) {
    if (data.patterns.some(pattern => lowerMsg.includes(pattern))) {
      return data.replies[Math.floor(Math.random() * data.replies.length)];
    }
  }

  // Default responses
  const defaultReplies = [
    'Thank you for your message! How can I assist you with your real estate needs?',
    'I\'m here to help with any property questions you have. What would you like to know?',
    'Thanks for reaching out! What can I help you with today?'
  ];

  return defaultReplies[Math.floor(Math.random() * defaultReplies.length)];
};