import { Redis } from 'ioredis';
import { env } from '../config/env.js';

class RedisService {
  private client: Redis | null = null;
  private inMemoryStore = new Map<string, { value: string; expiresAt: number | null }>();
  private isConnected = false;

  constructor() {
    try {
      this.client = new Redis(env.REDIS_URL, {
        maxRetriesPerRequest: 2,
        connectTimeout: 2000,
        retryStrategy: (times) => {
          if (times > 3) {
            return null; // Stop retrying and use in-memory fallback
          }
          return Math.min(times * 100, 2000);
        },
        lazyConnect: true
      });

      this.client.connect().then(() => {
        this.isConnected = true;
        console.log('✅ Connected to Redis successfully');
      }).catch((err) => {
        console.warn('⚠️ Redis not available, using in-memory cache fallback:', err.message);
        this.isConnected = false;
      });

      this.client.on('error', (err) => {
        if (this.isConnected) {
          console.warn('⚠️ Redis connection error:', err.message);
        }
        this.isConnected = false;
      });
    } catch (e) {
      console.warn('⚠️ Redis initialization fallback triggered');
      this.isConnected = false;
    }
  }

  async get(key: string): Promise<string | null> {
    if (this.isConnected && this.client) {
      try {
        return await this.client.get(key);
      } catch {
        // Fallback to in-memory
      }
    }

    const item = this.inMemoryStore.get(key);
    if (!item) return null;
    if (item.expiresAt && item.expiresAt < Date.now()) {
      this.inMemoryStore.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        if (ttlSeconds) {
          await this.client.set(key, value, 'EX', ttlSeconds);
        } else {
          await this.client.set(key, value);
        }
        return;
      } catch {
        // Fallback to in-memory
      }
    }

    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.inMemoryStore.set(key, { value, expiresAt });
  }

  async del(key: string): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        await this.client.del(key);
        return;
      } catch {
        // Fallback
      }
    }
    this.inMemoryStore.delete(key);
  }

  async incr(key: string): Promise<number> {
    if (this.isConnected && this.client) {
      try {
        return await this.client.incr(key);
      } catch {
        // Fallback
      }
    }
    const current = parseInt((await this.get(key)) || '0', 10);
    const next = current + 1;
    await this.set(key, next.toString());
    return next;
  }
}

export const cache = new RedisService();
