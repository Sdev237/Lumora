/**
 * ChatMessage Model
 * Messages exchanged in conversations
 */

const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatConversation",
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    content: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    mediaUrl: {
      type: String,
    },
    seenBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

chatMessageSchema.index({ conversation: 1, createdAt: -1 });

module.exports = mongoose.model("ChatMessage", chatMessageSchema);

