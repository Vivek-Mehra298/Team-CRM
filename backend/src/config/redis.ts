import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || '';

let redisClient: Redis | null = null;
let isRedisAvailable = false;

// Local In-Memory fallback store
class InMemoryStore {
  private store = new Map<string, string>();

  async get(key: string): Promise<string | null> {
    return this.store.get(key) || null;
  }

  async set(key: string, value: string, expiryMode?: string, time?: number): Promise<string> {
    this.store.set(key, value);
    if (expiryMode === 'EX' && time) {
      setTimeout(() => {
        this.store.delete(key);
      }, time * 1000);
    }
    return 'OK';
  }

  async del(key: string): Promise<number> {
    const existed = this.store.has(key);
    this.store.delete(key);
    return existed ? 1 : 0;
  }

  async keys(pattern: string): Promise<string[]> {
    const keysArray = Array.from(this.store.keys());
    const regexPattern = pattern.replace(/\*/g, '.*');
    const regex = new RegExp('^' + regexPattern + '$');
    return keysArray.filter(key => regex.test(key));
  }
}

const memoryStore = new InMemoryStore();

export const initRedis = () => {
  if (!REDIS_URL) {
    console.warn('[REDIS WARNING]: REDIS_URL is not set. Defaulting to local In-Memory fallback store.');
    return;
  }

  try {
    redisClient = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 1,
      lazyConnect: true
    });

    redisClient.on('connect', () => {
      isRedisAvailable = true;
      console.log('[Redis]: Connected to Redis successfully.');
    });

    redisClient.on('error', (err) => {
      isRedisAvailable = false;
      console.warn('[Redis ERROR]: Redis client error. Falling back to In-Memory store. Error:', err.message);
    });

    redisClient.connect().catch((err) => {
      isRedisAvailable = false;
      console.warn('[Redis CONNECT ERROR]: Could not connect. Falling back to In-Memory store.');
    });
  } catch (error) {
    isRedisAvailable = false;
    console.warn('[Redis SETUP ERROR]: Error initializing Redis client. Falling back to In-Memory store.');
  }
};

export const getCache = async (key: string): Promise<string | null> => {
  if (isRedisAvailable && redisClient) {
    try {
      return await redisClient.get(key);
    } catch {
      return await memoryStore.get(key);
    }
  }
  return await memoryStore.get(key);
};

export const setCache = async (key: string, value: string, expirySeconds?: number): Promise<void> => {
  if (isRedisAvailable && redisClient) {
    try {
      if (expirySeconds) {
        await redisClient.set(key, value, 'EX', expirySeconds);
      } else {
        await redisClient.set(key, value);
      }
      return;
    } catch {
      // Fallback
    }
  }
  await memoryStore.set(key, value, expirySeconds ? 'EX' : undefined, expirySeconds);
};

export const delCache = async (key: string): Promise<void> => {
  if (isRedisAvailable && redisClient) {
    try {
      await redisClient.del(key);
      return;
    } catch {
      // Fallback
    }
  }
  await memoryStore.del(key);
};

export const getCacheKeys = async (pattern: string): Promise<string[]> => {
  if (isRedisAvailable && redisClient) {
    try {
      return await redisClient.keys(pattern);
    } catch {
      return await memoryStore.keys(pattern);
    }
  }
  return await memoryStore.keys(pattern);
};
