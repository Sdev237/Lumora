/**
 * Chat Routes
 * Direct messaging endpoints
 */

const express = require("express");
const {
  getConversations,
  getMessages,
  startConversation,
  sendMessage,
} = require("../controllers/chatController");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// All chat routes require authentication
router.use(authMiddleware);

// List conversations
router.get("/conversations", getConversations);

// Start a new conversation (or get existing)
router.post("/conversations", startConversation);

// Get messages for a conversation
router.get("/conversations/:id/messages", getMessages);

// Send a message
router.post("/conversations/:id/messages", sendMessage);

module.exports = router;

