/**
 * Job Scheduler
 * Schedule periodic jobs for time capsules and story cleanup
 */

const unlockTimeCapsules = require("./unlockTimeCapsules");
const cleanupExpiredStories = require("./cleanupExpiredStories");

/**
 * Initialize scheduler
 */
const initScheduler = () => {
  console.log("⏰ Planificateur de jobs initialisé");

  // Unlock time capsules every hour
  setInterval(async () => {
    try {
      await unlockTimeCapsules();
    } catch (error) {
      console.error("Erreur job unlockTimeCapsules:", error);
    }
  }, 60 * 60 * 1000); // Every hour

  // Cleanup expired stories daily
  setInterval(async () => {
    try {
      await cleanupExpiredStories();
    } catch (error) {
      console.error("Erreur job cleanupExpiredStories:", error);
    }
  }, 24 * 60 * 60 * 1000); // Daily

  // Run immediately on startup
  setTimeout(async () => {
    try {
      await unlockTimeCapsules();
    } catch (error) {
      console.error("Erreur job initial unlockTimeCapsules:", error);
    }
  }, 5000); // After 5 seconds
};

module.exports = { initScheduler };
