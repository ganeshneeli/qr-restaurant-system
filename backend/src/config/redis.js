const redis = require("redis");
const logger = require("./logger");

const redisClient = redis.createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379",
    socket: {
        reconnectStrategy: (retries) => {
            if (retries > 20) {
                logger.error("Redis reconnection failed after 20 attempts");
                return new Error("Redis reconnection failed");
            }
            return Math.min(retries * 500, 5000); // Backoff: 0.5s, 1s, 1.5s... max 5s
        }
    }
});

let isConnected = false;

redisClient.on("error", (err) => {
    isConnected = false;
    // Log cleaner error messages
    const message = err.message || "Unknown Redis error";
    if (message.includes("ECONNREFUSED") || message.includes("Socket closed unexpectedly")) {
        logger.error(`Redis Error: ${message}. Attempting reconnect...`);
    } else {
        logger.error("Redis Client Error:", message);
    }
});

redisClient.on("connect", () => {
    logger.info("Redis: Attempting connection...");
});

redisClient.on("ready", () => {
    if (!isConnected) {
        logger.info("Redis Connected successfully (Ready)");
        isConnected = true;
    }
});

redisClient.on("end", () => {
    isConnected = false;
    logger.warn("Redis connection ended");
});

// Connect initially
(async () => {
    try {
        if (!redisClient.isOpen) {
            await redisClient.connect();
        }
    } catch (err) {
        logger.error("Failed to connect to Redis initially:", err.message);
    }
})();

// Helper to check if redis is actually ready for commands (not just open but not connected)
redisClient.isReadyForCommands = () => redisClient.isReady;

module.exports = redisClient;
