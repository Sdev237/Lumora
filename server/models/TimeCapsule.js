/**
 * Time Capsule Model
 * Posts that unlock at a future date
 */

const mongoose = require("mongoose");

const timeCapsuleSchema = new mongoose.Schema(
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
    images: [
      {
        type: String, // Path to uploaded image
      },
    ],
    // Location where capsule was created
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
      placeName: String,
    },
    // When the capsule should unlock
    unlockDate: {
      type: Date,
      required: [true, "La date de déverrouillage est requise"],
      index: true,
      validate: {
        validator: function (value) {
          return value > new Date(); // Must be in the future
        },
        message: "La date de déverrouillage doit être dans le futur",
      },
    },
    // When unlocked, this becomes a regular post
    unlockedPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      default: null,
    },
    isUnlocked: {
      type: Boolean,
      default: false,
      index: true,
    },
    unlockedAt: {
      type: Date,
      default: null,
    },
    // Recipients (who will see this when unlocked)
    recipients: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // If empty, it's public
    isPublic: {
      type: Boolean,
      default: true,
    },
    tags: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes
timeCapsuleSchema.index({ author: 1, unlockDate: 1 });
timeCapsuleSchema.index({ isUnlocked: 1, unlockDate: 1 });
timeCapsuleSchema.index({ location: "2dsphere" });

/**
 * Check if capsule should be unlocked
 */
timeCapsuleSchema.methods.shouldUnlock = function () {
  return !this.isUnlocked && new Date() >= this.unlockDate;
};

/**
 * Unlock the capsule and create a post
 */
timeCapsuleSchema.methods.unlock = async function () {
  if (this.isUnlocked) {
    throw new Error("Cette capsule temporelle est déjà déverrouillée");
  }

  const Post = mongoose.model("Post");

  // Create post from capsule
  const postData = {
    author: this.author,
    content: this.content,
    images: this.images,
    location: this.location,
    tags: this.tags,
    isPublic: this.isPublic,
  };

  const post = await Post.create(postData);

  this.unlockedPost = post._id;
  this.isUnlocked = true;
  this.unlockedAt = new Date();

  await this.save();

  return post;
};

module.exports = mongoose.model("TimeCapsule", timeCapsuleSchema);
