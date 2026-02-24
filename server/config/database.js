/**
 * Database Configuration
 * MongoDB connection setup with error handling
 */

const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/voyageo",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );

    console.log(`✅ MongoDB connecté: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on("error", (err) => {
      console.error("❌ Erreur MongoDB:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("⚠️ MongoDB déconnecté");
    });

    return conn;
  } catch (error) {
    console.error("❌ Erreur de connexion MongoDB:", error);
    process.exit(1);
  }
};

module.exports = connectDB;
