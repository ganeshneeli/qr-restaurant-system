const redis = require("redis");
const logger = require("./logger");

const redisClient = redis.createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379"
});

let isConnected = false;

redisClient.on("error", (err) => {
    isConnected = false;
    logger.error("Redis Client Error", err);
});

redisClient.on("connect", () => {
    if (!isConnected) {
        logger.info("Redis Connected successfully");
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
        logger.error("Failed to connect to Redis initially", err);
    }
})();

module.exports = redisClient;
