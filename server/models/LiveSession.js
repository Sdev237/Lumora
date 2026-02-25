/**
 * LiveSession Model
 * Basic live streaming session metadata
 */

const mongoose = require("mongoose");

const liveSessionSchema = new mongoose.Schema(
  {
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    viewersCount: {
      type: Number,
      default: 0,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    endedAt: {
      type: Date,
    },
    // Requests from viewers to join the live "on stage"
    joinRequests: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        status: {
          type: String,
          enum: ["pending", "approved", "rejected"],
          default: "pending",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Guests approved to join the live (on stage)
    guests: [
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

liveSessionSchema.index({ isActive: 1, startedAt: -1 });
liveSessionSchema.index({ host: 1, isActive: 1 });

module.exports = mongoose.model("LiveSession", liveSessionSchema);

