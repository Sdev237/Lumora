/**
 * Post Model
 * Post schema with geolocation and image support
 */

const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "L'auteur est requis"],
      index: true,
    },
    content: {
      type: String,
      required: [true, "Le contenu est requis"],
      maxlength: [2000, "Le contenu ne peut pas dépasser 2000 caractères"],
      trim: true,
    },
    // New unified media field (images/videos)
    media: [
      {
        type: {
          type: String,
          enum: ["image", "video"],
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
      },
    ],
    // Legacy images field kept for backward compatibility
    images: [
      {
        type: String, // Path to uploaded image
        required: false,
      },
    ],
    // Geolocation for the post
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
      address: String,
      city: String,
      country: String,
      placeName: String, // e.g., "Eiffel Tower"
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
    shares: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    tags: [
      {
        type: String,
      },
    ],
    // For local network mode - prioritize posts from same city
    city: {
      type: String,
      index: true,
    },
    // Popularity score (calculated based on likes, comments, shares, recency)
    popularityScore: {
      type: Number,
      default: 0,
      index: true,
    },
    // Optional music attached to the post
    musicURL: {
      type: String,
    },
    // Stored as 0–1; UI can map 0–100 %
    musicVolume: {
      type: Number,
      min: 0,
      max: 1,
      default: 0,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    // Optional link to a live session (for "published live" posts)
    liveSession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LiveSession",
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Geospatial index for location-based queries
postSchema.index({ location: "2dsphere" });
postSchema.index({ city: 1, createdAt: -1 });
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ popularityScore: -1, createdAt: -1 });
postSchema.index({ tags: 1 });

/**
 * Calculate popularity score
 * Formula: (likes * 2) + (comments * 3) + (shares * 5) + (views * 0.1) - age_penalty
 */
postSchema.methods.calculatePopularityScore = function () {
  const likesCount = this.likes.length;
  const commentsCount = this.comments.length;
  const sharesCount = this.shares.length;
  const viewsCount = this.views || 0;

  // Age penalty: reduce score based on post age (in hours)
  const ageInHours = (Date.now() - this.createdAt) / (1000 * 60 * 60);
  const agePenalty = Math.min(ageInHours * 0.1, 50); // Max 50 point penalty

  const score =
    likesCount * 2 +
    commentsCount * 3 +
    sharesCount * 5 +
    viewsCount * 0.1 -
    agePenalty;
  this.popularityScore = Math.max(0, Math.round(score * 100) / 100); // Round to 2 decimals, min 0
  return this.popularityScore;
};

/**
 * Update popularity score before saving
 */
postSchema.pre("save", function (next) {
  if (
    this.isModified("likes") ||
    this.isModified("comments") ||
    this.isModified("shares") ||
    this.isModified("views")
  ) {
    this.calculatePopularityScore();
  }
  // Extract city from location if available
  if (this.location && this.location.city && !this.city) {
    this.city = this.location.city;
  }
  next();
});

module.exports = mongoose.model("Post", postSchema);
