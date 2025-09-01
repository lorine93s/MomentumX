import NodeCache from 'node-cache';
import { Logger } from './logger';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  checkperiod?: number; // How often to check for expired keys
  useClones?: boolean;
  deleteOnExpire?: boolean;
}

export class CacheManager {
  private cache: NodeCache;
  private logger: Logger;

  constructor(options: CacheOptions = {}) {
    const {
      ttl = 300, // 5 minutes default
      checkperiod = 60, // Check every minute
      useClones = false,
      deleteOnExpire = true
    } = options;

    this.cache = new NodeCache({
      stdTTL: ttl,
      checkperiod,
      useClones,
      deleteOnExpire
    });

    this.logger = new Logger('CacheManager');

    // Set up event listeners
    this.cache.on('expired', (key, value) => {
      this.logger.debug(`Cache key expired: ${key}`);
    });

    this.cache.on('flush', () => {
      this.logger.info('Cache flushed');
    });
  }

  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.cache.get<T>(key);
    if (cached !== undefined) {
      this.logger.debug(`Cache hit for key: ${key}`);
      return cached;
    }

    this.logger.debug(`Cache miss for key: ${key}, fetching...`);
    try {
      const fresh = await fetchFn();
      this.cache.set(key, fresh, ttl);
      this.logger.debug(`Cached fresh data for key: ${key}`);
      return fresh;
    } catch (error) {
      this.logger.error(`Failed to fetch data for key ${key}:`, error);
      throw error;
    }
  }

  get<T>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }

  set<T>(key: string, value: T, ttl?: number): boolean {
    return this.cache.set(key, value, ttl);
  }

  delete(key: string): number {
    return this.cache.del(key);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  keys(): string[] {
    return this.cache.keys();
  }

  flush(): void {
    this.cache.flushAll();
  }

  getStats(): NodeCache.Stats {
    return this.cache.getStats();
  }

  // Specialized methods for trading data
  async getPoolData(poolId: string, fetchFn: () => Promise<any>): Promise<any> {
    return this.getOrSet(`pool:${poolId}`, fetchFn, 60); // 1 minute TTL for pool data
  }

  async getPriceData(poolId: string, fetchFn: () => Promise<any>): Promise<any> {
    return this.getOrSet(`price:${poolId}`, fetchFn, 30); // 30 seconds TTL for price data
  }

  async getLiquidityData(poolId: string, fetchFn: () => Promise<any>): Promise<any> {
    return this.getOrSet(`liquidity:${poolId}`, fetchFn, 120); // 2 minutes TTL for liquidity data
  }

  // Cache arbitrage opportunities with short TTL
  async getArbitrageOpportunities(key: string, fetchFn: () => Promise<any[]>): Promise<any[]> {
    return this.getOrSet(`arbitrage:${key}`, fetchFn, 10); // 10 seconds TTL for arbitrage opportunities
  }

  // Cache wallet balances with longer TTL
  async getWalletBalance(address: string, fetchFn: () => Promise<any>): Promise<any> {
    return this.getOrSet(`balance:${address}`, fetchFn, 300); // 5 minutes TTL for balances
  }

  // Invalidate specific cache patterns
  invalidatePoolData(poolId: string): void {
    this.delete(`pool:${poolId}`);
    this.delete(`price:${poolId}`);
    this.delete(`liquidity:${poolId}`);
  }

  invalidateWalletData(address: string): void {
    this.delete(`balance:${address}`);
  }

  // Batch operations
  async getMultiple<T>(keys: string[]): Promise<Record<string, T | undefined>> {
    const result: Record<string, T | undefined> = {};
    for (const key of keys) {
      result[key] = this.get<T>(key);
    }
    return result;
  }

  setMultiple<T>(entries: Record<string, T>, ttl?: number): void {
    for (const [key, value] of Object.entries(entries)) {
      this.set(key, value, ttl);
    }
  }

  // Cache warming
  async warmCache<T>(
    keys: string[],
    fetchFn: (key: string) => Promise<T>,
    ttl?: number
  ): Promise<void> {
    const promises = keys.map(async (key) => {
      try {
        const value = await fetchFn(key);
        this.set(key, value, ttl);
      } catch (error) {
        this.logger.error(`Failed to warm cache for key ${key}:`, error);
      }
    });

    await Promise.allSettled(promises);
    this.logger.info(`Cache warming completed for ${keys.length} keys`);
  }

  // Cache monitoring
  getCacheMetrics(): {
    hits: number;
    misses: number;
    keys: number;
    hitRate: number;
  } {
    const stats = this.getStats();
    const hitRate = stats.hits / (stats.hits + stats.misses) * 100;
    
    return {
      hits: stats.hits,
      misses: stats.misses,
      keys: stats.keys,
      hitRate: isNaN(hitRate) ? 0 : hitRate
    };
  }
}
