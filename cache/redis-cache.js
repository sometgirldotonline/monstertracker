// Redis-based cache for serverless environments
const redis = require('redis');

class RedisCache {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.ttl = 5 * 60; // 5 minutes in seconds
  }

  async connect() {
    if (this.isConnected) return;
    
    try {
      // Use Upstash Redis or similar serverless Redis
      this.client = redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          connectTimeout: 2000,
          commandTimeout: 1000,
        }
      });
      
      await this.client.connect();
      this.isConnected = true;
      console.log('Connected to Redis');
    } catch (error) {
      console.error('Redis connection failed:', error);
      // Fallback to in-memory for development
      this.client = null;
    }
  }

  async get(key) {
    if (!this.client) return null;
    
    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async set(key, value, ttlOverride = null) {
    if (!this.client) return false;
    
    try {
      const ttl = ttlOverride || this.ttl;
      await this.client.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Redis set error:', error);
      return false;
    }
  }

  async exists(key) {
    if (!this.client) return false;
    
    try {
      return await this.client.exists(key) === 1;
    } catch (error) {
      console.error('Redis exists error:', error);
      return false;
    }
  }

  async delete(key) {
    if (!this.client) return false;
    
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Redis delete error:', error);
      return false;
    }
  }

  async disconnect() {
    if (this.client && this.isConnected) {
      await this.client.disconnect();
      this.isConnected = false;
    }
  }
}

module.exports = new RedisCache();
