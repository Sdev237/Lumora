/**
 * ChatConversation Model
 * Direct message conversation between users
 */

const mongoose = require("mongoose");

const chatConversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatMessage",
      default: null,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

chatConversationSchema.index({ participants: 1 });

module.exports = mongoose.model("ChatConversation", chatConversationSchema);

