import { createClient } from 'redis';

type RedisClient = ReturnType<typeof createClient>;

type GlobalRedisCache = {
  redisClient?: RedisClient;
  redisClientPromise?: Promise<RedisClient>;
};

const globalForRedis = globalThis as unknown as GlobalRedisCache;

export async function getRedis(): Promise<RedisClient> {
  if (globalForRedis.redisClient?.isOpen) return globalForRedis.redisClient;

  if (!globalForRedis.redisClientPromise) {
    const url = process.env.REDIS_URL;
    if (!url) {
      throw new Error('REDIS_URL is not set');
    }

    const client = createClient({ url });
    client.on('error', (err) => console.error('Redis Client Error', err));

    globalForRedis.redisClient = client;
    globalForRedis.redisClientPromise = client.connect().then(() => client);
  }

  return globalForRedis.redisClientPromise;
}
