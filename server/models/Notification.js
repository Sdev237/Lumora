/**
 * Notification Model
 * Real-time notifications for user activities
 */

const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Le destinataire est requis"],
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "L'expéditeur est requis"],
    },
    type: {
      type: String,
      enum: [
        "like",
        "comment",
        "follow",
        "mention",
        "share",
        "story_view",
        "time_capsule_unlocked",
      ],
      required: [true, "Le type de notification est requis"],
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      default: null,
    },
    comment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
    story: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Story",
      default: null,
    },
    timeCapsule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TimeCapsule",
      default: null,
    },
    message: {
      type: String,
      default: "",
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ sender: 1 });

module.exports = mongoose.model("Notification", notificationSchema);
