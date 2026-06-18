"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCacheKeys = exports.delCache = exports.setCache = exports.getCache = exports.initRedis = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const REDIS_URL = process.env.REDIS_URL || '';
let redisClient = null;
let isRedisAvailable = false;
// Local In-Memory fallback store
class InMemoryStore {
    store = new Map();
    async get(key) {
        return this.store.get(key) || null;
    }
    async set(key, value, expiryMode, time) {
        this.store.set(key, value);
        if (expiryMode === 'EX' && time) {
            setTimeout(() => {
                this.store.delete(key);
            }, time * 1000);
        }
        return 'OK';
    }
    async del(key) {
        const existed = this.store.has(key);
        this.store.delete(key);
        return existed ? 1 : 0;
    }
    async keys(pattern) {
        const keysArray = Array.from(this.store.keys());
        const regexPattern = pattern.replace(/\*/g, '.*');
        const regex = new RegExp('^' + regexPattern + '$');
        return keysArray.filter(key => regex.test(key));
    }
}
const memoryStore = new InMemoryStore();
const initRedis = () => {
    if (!REDIS_URL) {
        console.warn('[REDIS WARNING]: REDIS_URL is not set. Defaulting to local In-Memory fallback store.');
        return;
    }
    try {
        redisClient = new ioredis_1.default(REDIS_URL, {
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
    }
    catch (error) {
        isRedisAvailable = false;
        console.warn('[Redis SETUP ERROR]: Error initializing Redis client. Falling back to In-Memory store.');
    }
};
exports.initRedis = initRedis;
const getCache = async (key) => {
    if (isRedisAvailable && redisClient) {
        try {
            return await redisClient.get(key);
        }
        catch {
            return await memoryStore.get(key);
        }
    }
    return await memoryStore.get(key);
};
exports.getCache = getCache;
const setCache = async (key, value, expirySeconds) => {
    if (isRedisAvailable && redisClient) {
        try {
            if (expirySeconds) {
                await redisClient.set(key, value, 'EX', expirySeconds);
            }
            else {
                await redisClient.set(key, value);
            }
            return;
        }
        catch {
            // Fallback
        }
    }
    await memoryStore.set(key, value, expirySeconds ? 'EX' : undefined, expirySeconds);
};
exports.setCache = setCache;
const delCache = async (key) => {
    if (isRedisAvailable && redisClient) {
        try {
            await redisClient.del(key);
            return;
        }
        catch {
            // Fallback
        }
    }
    await memoryStore.del(key);
};
exports.delCache = delCache;
const getCacheKeys = async (pattern) => {
    if (isRedisAvailable && redisClient) {
        try {
            return await redisClient.keys(pattern);
        }
        catch {
            return await memoryStore.keys(pattern);
        }
    }
    return await memoryStore.keys(pattern);
};
exports.getCacheKeys = getCacheKeys;
