/**
 * Socket.io Handler
 * Real-time communication for live location sharing and notifications
 */

const socketIo = require("socket.io");
const User = require("../models/User");
const ChatConversation = require("../models/ChatConversation");
const LiveSession = require("../models/LiveSession");

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

    // Join a chat conversation room
    socket.on("chat:join", async ({ conversationId }) => {
      if (!conversationId) return;
      socket.join(`chat-${conversationId}`);
    });

    socket.on("chat:leave", ({ conversationId }) => {
      if (!conversationId) return;
      socket.leave(`chat-${conversationId}`);
    });

    // Typing indicators in chat
    socket.on("chat:typing", ({ conversationId, userId }) => {
      if (!conversationId || !userId) return;
      socket.broadcast.to(`chat-${conversationId}`).emit("chat:user-typing", {
        conversationId,
        userId,
      });
    });

    socket.on("chat:stop-typing", ({ conversationId, userId }) => {
      if (!conversationId || !userId) return;
      socket
        .broadcast
        .to(`chat-${conversationId}`)
        .emit("chat:user-stopped-typing", {
          conversationId,
          userId,
        });
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

    // Typing indicator on posts (comments)
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

    // Live viewers & reactions (lightweight, TikTok-style)
    socket.on("live:join", ({ sessionId, userId }) => {
      if (!sessionId) return;
      socket.join(`live-${sessionId}`);
      io.to(`live-${sessionId}`).emit("live:viewer-joined", {
        sessionId,
        userId,
      });
    });

    socket.on("live:leave", ({ sessionId, userId }) => {
      if (!sessionId) return;
      socket.leave(`live-${sessionId}`);
      io.to(`live-${sessionId}`).emit("live:viewer-left", {
        sessionId,
        userId,
      });
    });

    socket.on("live:comment", ({ sessionId, userId, message }) => {
      if (!sessionId || !message) return;
      io.to(`live-${sessionId}`).emit("live:comment", {
        sessionId,
        userId,
        message,
        createdAt: new Date(),
      });
    });

    socket.on("live:like", ({ sessionId, userId, emoji }) => {
      if (!sessionId) return;
      io.to(`live-${sessionId}`).emit("live:like", {
        sessionId,
        userId,
        emoji: emoji || "heart",
        createdAt: new Date(),
      });
    });

    // Viewer requests to join "on stage"
    socket.on("live:request-join", async ({ sessionId, userId }) => {
      try {
        if (!sessionId || !userId) return;

        const session = await LiveSession.findById(sessionId).select("host joinRequests guests isActive");
        if (!session || !session.isActive) return;

        // Do not allow host to request
        if (session.host.toString() === userId.toString()) return;

        // If already a guest, ignore
        if (session.guests?.some((g) => g.toString() === userId.toString())) {
          return;
        }

        const existing = session.joinRequests?.find(
          (r) => r.user.toString() === userId.toString() && r.status === "pending"
        );

        if (!existing) {
          session.joinRequests.push({ user: userId, status: "pending" });
          await session.save();
        }

        const requester = await User.findById(userId).select(
          "username avatar firstName lastName"
        );

        io.to(`user-${session.host}`).emit("live:join-request", {
          sessionId,
          user: requester,
          createdAt: new Date(),
        });
      } catch (error) {
        console.error("Erreur live:request-join:", error);
      }
    });

    // Host approves a join request
    socket.on("live:approve-join", async ({ sessionId, targetUserId }) => {
      try {
        if (!sessionId || !targetUserId) return;

        const session = await LiveSession.findById(sessionId).select("host joinRequests guests isActive");
        if (!session || !session.isActive) return;

        // Host-only action: rely on socket.userId set by join-room
        if (!socket.userId || session.host.toString() !== socket.userId.toString()) {
          return;
        }

        // Update request status and add guest
        session.joinRequests = (session.joinRequests || []).map((r) => {
          if (r.user.toString() === targetUserId.toString() && r.status === "pending") {
            return { ...r.toObject(), status: "approved" };
          }
          return r;
        });

        if (!session.guests.some((g) => g.toString() === targetUserId.toString())) {
          session.guests.push(targetUserId);
        }

        await session.save();

        io.to(`user-${targetUserId}`).emit("live:join-approved", {
          sessionId,
        });

        io.to(`live-${sessionId}`).emit("live:guest-joined", {
          sessionId,
          userId: targetUserId,
          createdAt: new Date(),
        });
      } catch (error) {
        console.error("Erreur live:approve-join:", error);
      }
    });

    // Host rejects a join request
    socket.on("live:reject-join", async ({ sessionId, targetUserId }) => {
      try {
        if (!sessionId || !targetUserId) return;

        const session = await LiveSession.findById(sessionId).select("host joinRequests isActive");
        if (!session || !session.isActive) return;

        if (!socket.userId || session.host.toString() !== socket.userId.toString()) {
          return;
        }

        session.joinRequests = (session.joinRequests || []).map((r) => {
          if (r.user.toString() === targetUserId.toString() && r.status === "pending") {
            return { ...r.toObject(), status: "rejected" };
          }
          return r;
        });
        await session.save();

        io.to(`user-${targetUserId}`).emit("live:join-rejected", {
          sessionId,
        });
      } catch (error) {
        console.error("Erreur live:reject-join:", error);
      }
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
