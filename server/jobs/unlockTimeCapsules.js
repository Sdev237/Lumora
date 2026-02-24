/**
 * Time Capsule Unlock Job
 * Automatically unlock time capsules when their unlock date arrives
 * Run this job periodically (e.g., every hour)
 */

const TimeCapsule = require("../models/TimeCapsule");
const User = require("../models/User");
const { emitNotification } = require("../sockets/socketHandler");

/**
 * Unlock time capsules that should be unlocked
 */
const unlockTimeCapsules = async () => {
  try {
    const now = new Date();

    // Find capsules that should be unlocked but aren't yet
    const capsulesToUnlock = await TimeCapsule.find({
      isUnlocked: false,
      unlockDate: { $lte: now },
    }).populate("author", "username");

    console.log(
      `🔓 Déverrouillage de ${capsulesToUnlock.length} capsule(s) temporelle(s)...`
    );

    for (const capsule of capsulesToUnlock) {
      try {
        // Unlock the capsule (creates a post)
        const post = await capsule.unlock();

        // Get recipients
        let recipients = [];
        if (capsule.recipients && capsule.recipients.length > 0) {
          recipients = capsule.recipients;
        } else {
          // If public, notify followers
          const followers = await User.find({
            following: capsule.author,
          }).select("_id");
          recipients = followers.map((f) => f._id);
        }

        // Notify recipients
        recipients.forEach((recipientId) => {
          emitNotification(recipientId, {
            type: "time_capsule_unlocked",
            message: `Une capsule temporelle de ${capsule.author.username} a été déverrouillée`,
            timeCapsuleId: capsule._id,
            postId: post._id,
          });
        });

        console.log(`✅ Capsule ${capsule._id} déverrouillée`);
      } catch (error) {
        console.error(
          `❌ Erreur lors du déverrouillage de la capsule ${capsule._id}:`,
          error
        );
      }
    }

    return { unlocked: capsulesToUnlock.length };
  } catch (error) {
    console.error("❌ Erreur dans unlockTimeCapsules:", error);
    throw error;
  }
};

/**
 * Run job immediately
 */
if (require.main === module) {
  unlockTimeCapsules()
    .then((result) => {
      console.log(
        `✅ Job terminé: ${result.unlocked} capsule(s) déverrouillée(s)`
      );
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Erreur job:", error);
      process.exit(1);
    });
}

module.exports = unlockTimeCapsules;
