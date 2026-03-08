const redis = require("redis");
const logger = require("./logger");

const redisClient = redis.createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379"
});

redisClient.on("error", (err) => logger.error("Redis Client Error", err));
redisClient.on("connect", () => logger.info("Redis Connected successfully"));

// Connect initially
(async () => {
    try {
        await redisClient.connect();
    } catch (err) {
        logger.error("Failed to connect to Redis initially", err);
    }
})();

module.exports = redisClient;
