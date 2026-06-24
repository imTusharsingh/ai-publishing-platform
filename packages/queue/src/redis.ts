import type { ConnectionOptions } from 'bullmq';

export function createRedisConnection(redisUrl = process.env.REDIS_URL): ConnectionOptions {
  if (!redisUrl) {
    throw new Error('REDIS_URL is required for queue connections');
  }

  return {
    url: redisUrl,
    maxRetriesPerRequest: null,
  };
}
