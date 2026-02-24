/**
 * Explore Controller
 * Handle explore page with smart filtering
 */

const Post = require("../models/Post");
const User = require("../models/User");

/**
 * Explore posts with filters
 */
exports.explorePosts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      location, // city name
      popularity, // 'trending', 'recent', 'popular'
      interests, // comma-separated interests
      longitude,
      latitude,
      maxDistance = 50000,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    let query = { isPublic: true };

    // Location filter
    if (location) {
      query.city = new RegExp(location, "i");
    } else if (longitude && latitude) {
      query.location = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          $maxDistance: parseInt(maxDistance),
        },
      };
    }

    // Interests filter
    if (interests) {
      const interestArray = Array.isArray(interests)
        ? interests
        : interests.split(",").map((i) => i.trim());
      query.tags = { $in: interestArray };
    }

    // Sort by popularity or recency
    let sort = {};
    if (popularity === "trending" || popularity === "popular") {
      sort = { popularityScore: -1, createdAt: -1 };
    } else {
      sort = { createdAt: -1 };
    }

    const posts = await Post.find(query)
      .populate("author", "username avatar firstName lastName")
      .populate("likes", "username avatar")
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: posts.length === parseInt(limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get trending posts
 */
exports.getTrending = async (req, res, next) => {
  try {
    const { limit = 20 } = req.query;

    // Get posts with high popularity score from last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const posts = await Post.find({
      isPublic: true,
      createdAt: { $gte: sevenDaysAgo },
      popularityScore: { $gt: 0 },
    })
      .populate("author", "username avatar firstName lastName")
      .populate("likes", "username avatar")
      .sort({ popularityScore: -1, createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      posts,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get posts by interest
 */
exports.getPostsByInterest = async (req, res, next) => {
  try {
    const { interest, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    if (!interest) {
      return res.status(400).json({
        success: false,
        message: "Intérêt requis",
      });
    }

    const posts = await Post.find({
      isPublic: true,
      tags: { $in: [interest] },
    })
      .populate("author", "username avatar firstName lastName")
      .populate("likes", "username avatar")
      .sort({ popularityScore: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: posts.length === parseInt(limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get nearby posts (for map view)
 */
exports.getNearbyPosts = async (req, res, next) => {
  try {
    const { longitude, latitude, maxDistance = 10000 } = req.query;

    if (!longitude || !latitude) {
      return res.status(400).json({
        success: false,
        message: "Coordonnées requises",
      });
    }

    const posts = await Post.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          $maxDistance: parseInt(maxDistance),
        },
      },
      isPublic: true,
    })
      .populate("author", "username avatar firstName lastName")
      .limit(100);

    res.json({
      success: true,
      posts,
    });
  } catch (error) {
    next(error);
  }
};
