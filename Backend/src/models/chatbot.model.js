import mongoose from "mongoose";

// ================================================
// 🧩 Embedded Message Schema
// ================================================
const messageSchema = new mongoose.Schema({
  sender: {
    type: String,
    enum: ["user", "bot"],
    required: [true, "Sender is required"],
  },
  text: {
    type: String,
    required: [true, "Message text is required"],
    trim: true,
    maxlength: [2000, "Message cannot exceed 2000 characters"],
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  // Optional: message metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  }
}, {
  _id: true // Keep _id for individual messages
});

// ================================================
// 💬 Chat Schema
// ================================================
const chatSchema = new mongoose.Schema(
  {
    // For logged-in users
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      sparse: true, // Allows multiple null values
    },

    // For guest users - required for all chats
    sessionId: {
      type: String,
      required: [true, "Session ID is required"],
      unique: true,
      trim: true,
      index: true,
    },

    // Conversation thread
    messages: {
      type: [messageSchema],
      default: [],
      validate: {
        validator: function(messages) {
          return messages.length <= 1000; // Limit messages per chat
        },
        message: "Chat cannot have more than 1000 messages"
      }
    },

    // Chat status
    status: {
      type: String,
      enum: ["active", "archived", "deleted"],
      default: "active",
    },

    // Optional: Chat metadata
    tags: [{
      type: String,
      trim: true,
    }],
    
    // Optional: Last activity tracking
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    
    // Optional: IP address for guest users (for analytics)
    ipAddress: {
      type: String,
      default: null,
    }
  },
  {
    timestamps: true, // includes createdAt and updatedAt
    // Optimize for queries
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ================================================
// Indexes for better performance
// ================================================
chatSchema.index({ user: 1 });
chatSchema.index({ sessionId: 1 });
chatSchema.index({ updatedAt: -1 });
chatSchema.index({ status: 1 });
chatSchema.index({ user: 1, status: 1 });
chatSchema.index({ sessionId: 1, status: 1 });

// Compound index for guest user queries
chatSchema.index({ sessionId: 1, user: 1 });

// ================================================
// Virtual properties
// ================================================
chatSchema.virtual('messageCount').get(function() {
  return this.messages ? this.messages.length : 0;
});

chatSchema.virtual('lastMessage').get(function() {
  return this.messages && this.messages.length > 0 
    ? this.messages[this.messages.length - 1] 
    : null;
});

chatSchema.virtual('isGuest').get(function() {
  return !this.user;
});

// ================================================
// Middleware hooks
// ================================================

// Update lastActivity before saving
chatSchema.pre('save', function(next) {
  if (this.isModified('messages')) {
    this.lastActivity = new Date();
  }
  next();
});

// ================================================
// Instance methods
// ================================================

// Add a message to the chat
chatSchema.methods.addMessage = function(sender, text, metadata = null) {
  const message = {
    sender,
    text: text.trim(),
    timestamp: new Date(),
    metadata
  };
  
  this.messages.push(message);
  this.lastActivity = new Date();
  
  return this.save();
};

// Get messages with pagination
chatSchema.methods.getMessages = function(page = 1, limit = 50) {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  return {
    messages: this.messages.slice(startIndex, endIndex),
    totalMessages: this.messages.length,
    currentPage: page,
    totalPages: Math.ceil(this.messages.length / limit),
    hasMore: endIndex < this.messages.length
  };
};

// Archive the chat
chatSchema.methods.archive = function() {
  this.status = 'archived';
  return this.save();
};

// ================================================
// Static methods
// ================================================

// Find or create chat for user/session
chatSchema.statics.findOrCreateChat = async function(userId, sessionId, ipAddress = null) {
  let chat;
  
  if (userId) {
    // Try to find existing chat for user
    chat = await this.findOne({ user: userId, status: 'active' });
    
    if (!chat) {
      // Check if there's a guest session to migrate
      const guestChat = await this.findOne({ 
        sessionId, 
        user: null, 
        status: 'active' 
      });
      
      if (guestChat) {
        // Migrate guest session to user account
        guestChat.user = userId;
        chat = await guestChat.save();
      }
    }
  }
  
  if (!chat) {
    // Create new chat
    chat = await this.create({
      user: userId,
      sessionId,
      ipAddress,
      messages: []
    });
  }
  
  return chat;
};

// Find active chats with filters
chatSchema.statics.findActiveChats = function(filters = {}) {
  return this.find({ ...filters, status: 'active' })
    .populate('user', 'firstName lastName email')
    .sort({ updatedAt: -1 });
};

// Clean up old guest chats (for maintenance)
chatSchema.statics.cleanupOldGuestChats = function(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  return this.deleteMany({
    user: null,
    updatedAt: { $lt: cutoffDate },
    status: { $ne: 'archived' }
  });
};

// ================================================
// Export model
// ================================================
const Chat = mongoose.model("Chat", chatSchema);
export default Chat;