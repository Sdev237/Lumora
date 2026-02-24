/**
 * Socket.io Handler
 * Real-time communication for live location sharing and notifications
 */

const socketIo = require("socket.io");
const User = require("../models/User");

let io;

/**
 * Initialize Socket.io server
 */
const initSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on("connection", (socket) => {
    console.log("👤 Client connecté:", socket.id);

    // User joins their personal room
    socket.on("join-room", async (userId) => {
      try {
        socket.join(`user-${userId}`);
        socket.userId = userId;

        // Update user's online status
        await User.findByIdAndUpdate(userId, {
          lastActive: new Date(),
          "currentLocation.isSharing": true,
        });

        // Notify followers that user is online
        const user = await User.findById(userId).select("followers");
        if (user && user.followers.length > 0) {
          user.followers.forEach((followerId) => {
            io.to(`user-${followerId}`).emit("user-online", {
              userId: userId,
              timestamp: new Date(),
            });
          });
        }

        console.log(`✅ Utilisateur ${userId} a rejoint sa room`);
      } catch (error) {
        console.error("Erreur join-room:", error);
      }
    });

    // Live location sharing
    socket.on("update-location", async (data) => {
      try {
        const { userId, location } = data;

        if (!userId || !location || !location.coordinates) {
          return socket.emit("error", {
            message: "Données de localisation invalides",
          });
        }

        // Update user's current location
        await User.findByIdAndUpdate(userId, {
          "currentLocation.coordinates": [
            location.coordinates[0],
            location.coordinates[1],
          ],
          "currentLocation.address": location.address || "",
          "currentLocation.city": location.city || "",
          "currentLocation.country": location.country || "",
          "currentLocation.lastUpdated": new Date(),
          "currentLocation.isSharing": true,
          lastActive: new Date(),
        });

        // Notify followers about location update (if they're subscribed)
        const user = await User.findById(userId).select("followers");
        if (user && user.followers.length > 0) {
          user.followers.forEach((followerId) => {
            io.to(`user-${followerId}`).emit("location-update", {
              userId: userId,
              location: location,
              timestamp: new Date(),
            });
          });
        }

        // Broadcast to nearby users (for map view)
        socket.broadcast.emit("nearby-user-location", {
          userId: userId,
          location: location,
          timestamp: new Date(),
        });
      } catch (error) {
        console.error("Erreur update-location:", error);
        socket.emit("error", {
          message: "Erreur lors de la mise à jour de la localisation",
        });
      }
    });

    // Stop sharing location
    socket.on("stop-sharing-location", async (userId) => {
      try {
        await User.findByIdAndUpdate(userId, {
          "currentLocation.isSharing": false,
        });

        // Notify followers
        const user = await User.findById(userId).select("followers");
        if (user && user.followers.length > 0) {
          user.followers.forEach((followerId) => {
            io.to(`user-${followerId}`).emit("location-sharing-stopped", {
              userId: userId,
              timestamp: new Date(),
            });
          });
        }
      } catch (error) {
        console.error("Erreur stop-sharing-location:", error);
      }
    });

    // Typing indicator
    socket.on("typing", (data) => {
      const { postId, userId } = data;
      socket.broadcast.to(`post-${postId}`).emit("user-typing", {
        userId,
        postId,
      });
    });

    socket.on("stop-typing", (data) => {
      const { postId, userId } = data;
      socket.broadcast.to(`post-${postId}`).emit("user-stopped-typing", {
        userId,
        postId,
      });
    });

    // Disconnect handler
    socket.on("disconnect", async () => {
      try {
        if (socket.userId) {
          // Update user's offline status
          await User.findByIdAndUpdate(socket.userId, {
            "currentLocation.isSharing": false,
            lastActive: new Date(),
          });

          // Notify followers
          const user = await User.findById(socket.userId).select("followers");
          if (user && user.followers.length > 0) {
            user.followers.forEach((followerId) => {
              io.to(`user-${followerId}`).emit("user-offline", {
                userId: socket.userId,
                timestamp: new Date(),
              });
            });
          }
        }
        console.log("👤 Client déconnecté:", socket.id);
      } catch (error) {
        console.error("Erreur disconnect:", error);
      }
    });
  });

  return io;
};

/**
 * Get Socket.io instance
 */
const getIO = () => {
  if (!io) {
    throw new Error("Socket.io n'est pas initialisé");
  }
  return io;
};

/**
 * Emit notification to user
 */
const emitNotification = (userId, notification) => {
  if (io) {
    io.to(`user-${userId}`).emit("new-notification", notification);
  }
};

module.exports = {
  initSocket,
  getIO,
  emitNotification,
};
