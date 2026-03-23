/**
 * Chat Controller
 * Basic DM-style chat like TikTok messages
 */

const ChatConversation = require("../models/ChatConversation");
const ChatMessage = require("../models/ChatMessage");
const { getIO } = require("../sockets/socketHandler");

/**
 * Get conversations for current user
 */
exports.getConversations = async (req, res, next) => {
  try {
    const conversations = await ChatConversation.find({
      participants: req.user._id,
    })
      .sort({ lastUpdated: -1 })
      .populate("participants", "username avatar firstName lastName isLive")
      .populate("lastMessage");

    res.json({
      success: true,
      conversations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get messages for a conversation
 */
exports.getMessages = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 30 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const conversation = await ChatConversation.findById(id);
    if (!conversation || !conversation.participants.includes(req.user._id)) {
      return res.status(404).json({
        success: false,
        message: "Conversation introuvable",
      });
    }

    const messages = await ChatMessage.find({ conversation: id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("sender", "username avatar firstName lastName");

    res.json({
      success: true,
      messages: messages.reverse(),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: messages.length === parseInt(limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Start a conversation (or return existing)
 */
exports.startConversation = async (req, res, next) => {
  try {
    const { userId } = req.body;

    if (!userId || userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "Utilisateur cible invalide",
      });
    }

    let conversation = await ChatConversation.findOne({
      participants: { $all: [req.user._id, userId], $size: 2 },
    });

    if (!conversation) {
      conversation = await ChatConversation.create({
        participants: [req.user._id, userId],
      });
    }

    const populated = await ChatConversation.findById(conversation._id)
      .populate("participants", "username avatar firstName lastName isLive")
      .populate("lastMessage");

    res.status(201).json({
      success: true,
      conversation: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Send a message in an existing conversation
 */
exports.sendMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const conversation = await ChatConversation.findById(id);
    if (!conversation || !conversation.participants.includes(req.user._id)) {
      return res.status(404).json({
        success: false,
        message: "Conversation introuvable",
      });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Le message ne peut pas être vide",
      });
    }

    const message = await ChatMessage.create({
      conversation: id,
      sender: req.user._id,
      content: content.trim(),
      seenBy: [req.user._id],
    });

    conversation.lastMessage = message._id;
    conversation.lastUpdated = new Date();
    await conversation.save();

    const populatedMessage = await ChatMessage.findById(message._id).populate(
      "sender",
      "username avatar firstName lastName"
    );

    // Notify participants via Socket.io
    const io = getIO();
    io.to(`chat-${id}`).emit("chat:message", {
      conversationId: id,
      message: populatedMessage,
    });

    res.status(201).json({
      success: true,
      message: populatedMessage,
    });
  } catch (error) {
    next(error);
  }
};

