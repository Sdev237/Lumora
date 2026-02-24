/**
 * Follow Controller
 * Handle user follow/unfollow operations
 */

const User = require('../models/User');
const Notification = require('../models/Notification');
const { emitNotification } = require('../sockets/socketHandler');

/**
 * Follow/Unfollow user
 */
exports.followUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.userId;

    if (targetUserId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas vous suivre vous-même'
      });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    const currentUser = await User.findById(req.user._id);
    const isFollowing = currentUser.following.some(
      id => id.toString() === targetUserId
    );

    if (isFollowing) {
      // Remove follow
      await User.findByIdAndUpdate(req.user._id, {
        $pull: { following: targetUserId }
      });
      await User.findByIdAndUpdate(targetUserId, {
        $pull: { followers: req.user._id }
      });

      // Delete notification
      await Notification.findOneAndDelete({
        recipient: targetUserId,
        sender: req.user._id,
        type: 'follow'
      });

      res.json({
        success: true,
        message: 'Abonnement retiré',
        following: false
      });
    } else {
      // Add follow
      await User.findByIdAndUpdate(req.user._id, {
        $push: { following: targetUserId }
      });
      await User.findByIdAndUpdate(targetUserId, {
        $push: { followers: req.user._id }
      });

      // Create notification
      await Notification.create({
        recipient: targetUserId,
        sender: req.user._id,
        type: 'follow'
      });

      emitNotification(targetUserId, {
        type: 'follow',
        message: `${req.user.username} vous suit maintenant`,
        userId: req.user._id
      });

      res.json({
        success: true,
        message: 'Abonnement ajouté',
        following: true
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Get followers
 */
exports.getFollowers = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate('followers', 'username avatar firstName lastName currentLocation')
      .select('followers');

    res.json({
      success: true,
      followers: user.followers
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get following
 */
exports.getFollowing = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate('following', 'username avatar firstName lastName currentLocation')
      .select('following');

    res.json({
      success: true,
      following: user.following
    });
  } catch (error) {
    next(error);
  }
};
