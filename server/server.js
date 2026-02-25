/**
 * Lumora - Server Entry Point
 * Modern social media application
 */

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const http = require("http");
const path = require("path");

// Charger .env depuis la racine du projet (au-dessus de /server)
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });

// Import routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const postRoutes = require("./routes/posts");
const storyRoutes = require("./routes/stories");
const timeCapsuleRoutes = require("./routes/timeCapsules");
const commentRoutes = require("./routes/comments");
const likeRoutes = require("./routes/likes");
const followRoutes = require("./routes/follows");
const notificationRoutes = require("./routes/notifications");
const exploreRoutes = require("./routes/explore");
const chatRoutes = require("./routes/chat");
const liveRoutes = require("./routes/live");

// Import socket handler
const socketHandler = require("./sockets/socketHandler");

// Import job scheduler
const { initScheduler } = require("./jobs/scheduler");

// Import middleware
const errorHandler = require("./middleware/errorHandler");
const rateLimiter = require("./middleware/rateLimiter");

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = socketHandler.initSocket(server);
app.set("io", io);

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// CORS configuration
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Serve static files (uploaded images)
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Rate limiting
app.use("/api/", rateLimiter);

// MongoDB Connection - construire l'URL pour éviter "option voyageo is not supported"
function getMongoUri() {
  const raw = process.env.MONGODB_URI || "mongodb://localhost:27017/voyageo";
  // Si l'URL contient ?voyageo= (mauvais format Atlas), on corrige
  if (raw.includes("?voyageo=") || raw.includes("&voyageo=")) {
    const base = raw.split("?")[0].replace(/\/?$/, "");
    const rest = raw.includes("?")
      ? raw
          .substring(raw.indexOf("?"))
          .replace(/[?&]voyageo=[^&]*/g, "")
          .replace(/^&/, "?")
      : "";
    const opts = rest && rest !== "?" ? rest : "?retryWrites=true&w=majority";
    return (
      base + "/voyageo" + (opts === "?" ? "?retryWrites=true&w=majority" : opts)
    );
  }
  // S'assurer que le chemin se termine par /voyageo (nom de la base)
  if (/mongodb(\+srv)?:\/\/[^/]+\/?$/.test(raw)) {
    return raw.replace(/\/?$/, "") + "/voyageo?retryWrites=true&w=majority";
  }
  return raw;
}

const mongoUri = getMongoUri();

mongoose
  .connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("✅ MongoDB connecté avec succès");

    // Nettoyage de l'index géospatial incorrect sur homeLocation (hérité d'une ancienne version)
    try {
      const User = require("./models/User");
      const indexes = await User.collection.indexes();
      const homeIndex = indexes.find(
        (idx) => idx.key && idx.key.homeLocation === "2dsphere"
      );
      if (homeIndex) {
        await User.collection.dropIndex(homeIndex.name);
        console.log(
          "🧹 Index 2dsphere sur homeLocation supprimé (données invalides null)"
        );
      }
    } catch (cleanupErr) {
      // On ne bloque pas le démarrage du serveur pour ça
      console.warn(
        "⚠️ Impossible de supprimer l'index homeLocation (peut-être déjà supprimé) :",
        cleanupErr.message
      );
    }
  })
  .catch((err) => {
    console.error("❌ Erreur de connexion MongoDB:", err);
    process.exit(1);
  });

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/stories", storyRoutes);
app.use("/api/time-capsules", timeCapsuleRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/likes", likeRoutes);
app.use("/api/follows", followRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/explore", exploreRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/live", liveRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Lumora API is running",
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Initialize job scheduler
initScheduler();

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Serveur Lumora démarré sur le port ${PORT}`);
  console.log(`📡 Socket.io prêt pour les connexions temps réel`);
  console.log(`⏰ Planificateur de jobs actif`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
    mongoose.connection.close(false, () => {
      console.log("MongoDB connection closed");
      process.exit(0);
    });
  });
});

module.exports = { app, server, io };
