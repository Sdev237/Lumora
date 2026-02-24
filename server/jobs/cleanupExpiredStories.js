/**
 * Story Cleanup Job
 * Remove expired stories (backup job, MongoDB TTL should handle this)
 * Run this job periodically (e.g., daily)
 */

const Story = require("../models/Story");

/**
 * Clean up expired stories
 */
const cleanupExpiredStories = async () => {
  try {
    const now = new Date();

    // Find expired stories
    const expiredStories = await Story.find({
      expiresAt: { $lt: now },
      isActive: true,
    });

    console.log(
      `🧹 Nettoyage de ${expiredStories.length} story(s) expirée(s)...`
    );

    // Mark as inactive (MongoDB TTL should delete them, but this is a backup)
    await Story.updateMany(
      {
        expiresAt: { $lt: now },
        isActive: true,
      },
      {
        $set: { isActive: false },
      }
    );

    console.log(
      `✅ ${expiredStories.length} story(s) marquée(s) comme inactive(s)`
    );

    return { cleaned: expiredStories.length };
  } catch (error) {
    console.error("❌ Erreur dans cleanupExpiredStories:", error);
    throw error;
  }
};

/**
 * Run job immediately
 */
if (require.main === module) {
  cleanupExpiredStories()
    .then((result) => {
      console.log(`✅ Job terminé: ${result.cleaned} story(s) nettoyée(s)`);
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Erreur job:", error);
      process.exit(1);
    });
}

module.exports = cleanupExpiredStories;
