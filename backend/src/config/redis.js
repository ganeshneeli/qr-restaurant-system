const redis = require("redis");
const logger = require("./logger");

// Log warning if REDIS_URL is missing in production
if (process.env.NODE_ENV === "production" && !process.env.REDIS_URL) {
    logger.warn("REDIS_URL is not set. Falling back to localhost:6379");
}

const redisClient = redis.createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379",
    socket: {
        reconnectStrategy: (retries) => {
            if (retries > 20) {
                logger.error("Redis reconnection failed after 20 attempts");
                return new Error("Redis reconnection failed");
            }
            return Math.min(retries * 200, 5000); // Backoff
        }
    }
});

let isConnected = false;

redisClient.on("error", (err) => {
    isConnected = false;
    // Log cleaner error messages
    const message = err.message || "Unknown Redis error";
    if (message.includes("ECONNREFUSED")) {
        logger.error(`Redis Connection Refused. Is REDIS_URL correct?`);
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
        // Don't throw, let the app continue (Socket.IO will fallback)
    }
})();

module.exports = redisClient;
