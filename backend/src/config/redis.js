const redis = require("redis");
const logger = require("./logger");

const redisClient = redis.createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379",
    socket: {
        reconnectStrategy: (retries) => {
            if (retries > 10) {
                logger.error("Redis reconnection failed after 10 attempts");
                return new Error("Redis reconnection failed");
            }
            return Math.min(retries * 100, 3000);
        }
    }
});

let isConnected = false;

redisClient.on("error", (err) => {
    isConnected = false;
    logger.error("Redis Client Error:", err.message);
});

redisClient.on("connect", () => {
    logger.info("Redis: Connecting to server...");
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


module.exports = redisClient;
