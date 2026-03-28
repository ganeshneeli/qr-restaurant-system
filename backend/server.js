require("dotenv").config()
const http = require("http")
const express = require("express")
const path = require("path")
const app = require("./src/app")
const { initSocket } = require("./src/config/socket")

const PORT = process.env.PORT || 5001

const server = http.createServer(app)

server.keepAliveTimeout = 65000; // 65 seconds
server.headersTimeout = 66000;

initSocket(server).then(() => {
  server.listen(PORT, () => {
    console.log(`Server started and running on port ${PORT}`)
  })
}).catch(err => {
  console.error("Socket init failed", err);
});

// Graceful Shutdown - REAL WORLD PRODUCTION READY
const gracefulShutdown = async () => {
  console.log("⚠️  Received shutdown signal. Closing server...");
  server.close(async () => {
    console.log("HTTP server closed.");
    try {
      const mongoose = require("mongoose");
      await mongoose.connection.close(false);
      console.log("MongoDB connection closed.");
      process.exit(0);
    } catch (err) {
      console.error("Error during shutdown", err);
      process.exit(1);
    }
  });

  // Force close after 10s
  setTimeout(() => {
    console.error("Could not close connections in time, forcefully shutting down");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);