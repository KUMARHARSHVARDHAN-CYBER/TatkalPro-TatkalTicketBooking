import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

let redisClient: Redis | null = null;

/**
 * Returns a configured Redis client.
 * Connects to live Redis (local or Upstash via REDIS_URL) if available.
 * If USE_REDIS_MOCK is set or live Redis is not running locally,
 * seamlessly falls back to an in-memory ioredis-mock instance.
 */
export function getRedisClient(): Redis {
  if (redisClient) {
    return redisClient;
  }

  const useMock =
    process.env.USE_REDIS_MOCK === "true" ||
    process.env.NODE_ENV === "test" ||
    !process.env.REDIS_URL;

  if (useMock) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const RedisMock = require("ioredis-mock");
    redisClient = new RedisMock();
    console.log("[Redis] Using in-memory Redis (ioredis-mock) with full atomic Lua support.");
    return redisClient as Redis;
  }

  const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

  redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: 2,
    connectTimeout: 3000,
    commandTimeout: 2000,
    enableReadyCheck: true,
    retryStrategy(times) {
      if (times > 3) {
        return null;
      }
      return Math.min(times * 100, 1000);
    },
    lazyConnect: false,
  });

  redisClient.on("error", (err) => {
    console.error("[Redis Client Warning]:", err.message);
  });

  redisClient.on("connect", () => {
    console.log(`[Redis] Connected to Redis instance at ${redisUrl}`);
  });

  return redisClient as Redis;
}

export function resetRedisClientForTest(): void {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const RedisMock = require("ioredis-mock");
  redisClient = new RedisMock();
}

export default getRedisClient;
