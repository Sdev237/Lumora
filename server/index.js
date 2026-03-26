const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const http = require("http");
const socketIo = require("socket.io");
require("dotenv").config();

// Enregistrer TOUS les modèles Mongoose immédiatement au démarrage
// Cela empêche définitivement les erreurs MissingSchemaError peu importe où les populate() se font
require('./models/User');
require('./models/Post');
require('./models/Comment');
require('./models/Story');
require('./models/Notification');
require('./models/TimeCapsule');
require('./models/LiveSession');
require('./models/ChatConversation');
require('./models/ChatMessage');

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const postRoutes = require("./routes/posts");
const commentRoutes = require("./routes/comments");
const likeRoutes = require("./routes/likes");
const followRoutes = require("./routes/follows");
const notificationRoutes = require("./routes/notifications");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: true, // Autorise de façon dynamique toutes les requêtes (localhost et les adresses IP du réseau local)
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

// Middleware
app.use(helmet({ crossOriginResourcePolicy: false })); // Permettre aux images d'être chargées sur l'IP locale
app.use(
  cors({
    origin: true, // Accepter la connexion venant du téléphone avec la vraie adresse IP
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Servir les fichiers statiques (images uploadées)
app.use("/uploads", express.static("uploads"));

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/voyageo")
  .then(() => console.log("✅ MongoDB connecté"))
  .catch((err) => console.error("❌ Erreur MongoDB:", err));

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log("👤 Utilisateur connecté:", socket.id);

  socket.on("join-room", (userId) => {
    socket.join(`user-${userId}`);
    console.log(`Utilisateur ${userId} a rejoint sa room`);
  });

  socket.on("disconnect", () => {
    console.log("👤 Utilisateur déconnecté:", socket.id);
  });
});

// Make io accessible to routes
app.set("io", io);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/likes", likeRoutes);
app.use("/api/follows", followRoutes);
app.use("/api/notifications", notificationRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Lumora API is running" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Erreur serveur interne",
    error: process.env.NODE_ENV === "development" ? err : {},
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
});
