/**
 * Story Model
 * Stories that auto-delete after 24 hours
 */

const mongoose = require("mongoose");

const storySchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "L'auteur est requis"],
      index: true,
    },
    content: {
      type: String,
      maxlength: [500, "Le contenu ne peut pas dépasser 500 caractères"],
      trim: true,
    },
    image: {
      type: String, // Path to uploaded image
      required: [true, "Une image est requise pour une story"],
    },
    // Optional location
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: null,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: null,
      },
      address: String,
      city: String,
      placeName: String,
    },
    views: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        viewedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // Auto-delete after expiration
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
storySchema.index({ author: 1, createdAt: -1 });
storySchema.index({ expiresAt: 1 });
storySchema.index({ location: "2dsphere" });

/**
 * Create story with 24-hour expiration
 */
storySchema.statics.createStory = async function (storyData) {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours from now

  storyData.expiresAt = expiresAt;
  return await this.create(storyData);
};

/**
 * Check if story is expired
 */
storySchema.methods.isExpired = function () {
  return new Date() >= this.expiresAt;
};

/**
 * Add view to story
 */
storySchema.methods.addView = function (userId) {
  // Check if user already viewed
  const hasViewed = this.views.some(
    (view) => view.user.toString() === userId.toString()
  );
  if (!hasViewed) {
    this.views.push({ user: userId });
    return true;
  }
  return false;
};

module.exports = mongoose.model("Story", storySchema);
