import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { ConfigService } from '@nestjs/config';

interface CacheEntry {
  data: Record<string, any> | null;
  timestamp: number;
}

@Injectable()
export class CounterPointClient {
  private client: AxiosInstance;
  private base: string;
  private readonly logger = new Logger(CounterPointClient.name);
  
  // In-memory cache with 5-minute TTL for Counterpoint responses
  private cache: Map<string, CacheEntry> = new Map();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 1000; // Prevent memory issues

  constructor(private readonly cfg: ConfigService) {
    this.base =
      this.cfg.get<string>('COUNTERPOINT_BASE') ||
      'https://utility.rrgeneralsupply.com/Item';

    const timeout = parseInt(
      this.cfg.get<string>('COUNTERPOINT_TIMEOUT_MS') || '6000',
      10,
    );

    const apiKey = this.cfg.get<string>('COUNTERPOINT_API_KEY') || '';
    const authBasic = this.cfg.get<string>('COUNTERPOINT_AUTH_BASIC') || '';
    const cookie = this.cfg.get<string>('COUNTERPOINT_COOKIE') || '';

    this.client = axios.create({
      baseURL: this.base,
      timeout,
      headers: {
        APIKey: apiKey,
        Authorization: authBasic,
        ...(cookie ? { Cookie: cookie } : {}),
        Accept: 'application/json',
      },
    });
    
    // Clear old cache entries every 10 minutes
    setInterval(() => this.cleanCache(), 10 * 60 * 1000);
  }

  private cleanCache(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.CACHE_TTL_MS) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      this.logger.debug(`Cleaned ${cleaned} expired cache entries. Cache size: ${this.cache.size}`);
    }
    
    // If cache is still too large, remove oldest entries
    if (this.cache.size > this.MAX_CACHE_SIZE) {
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toRemove = entries.slice(0, entries.length - this.MAX_CACHE_SIZE);
      toRemove.forEach(([key]) => this.cache.delete(key));
      this.logger.warn(`Cache size exceeded limit. Removed ${toRemove.length} oldest entries.`);
    }
  }

  async getItemBySku(sku: string): Promise<Record<string, any> | null> {
    // Check cache first
    const cached = this.cache.get(sku);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL_MS) {
      this.logger.debug(`Cache HIT for SKU: ${sku}`);
      return cached.data;
    }

    try {
      const startTime = Date.now();
      const res = await this.client.get(`/${encodeURIComponent(sku)}`);
      const duration = Date.now() - startTime;
      
      const data = res.data;
      const item = data?.ErrorCode === 'SUCCESS' ? (data?.IM_ITEM ?? null) : null;
      
      // Cache the result (even if null to avoid repeated failed requests)
      this.cache.set(sku, { data: item, timestamp: Date.now() });
      
      this.logger.debug(`Cache MISS for SKU: ${sku} (${duration}ms) - cached result`);
      return item;
    } catch (err: any) {
      this.logger.warn(`Counterpoint API error for SKU ${sku}: ${err.message}`);
      // Cache null result for 1 minute to avoid hammering the API
      this.cache.set(sku, { data: null, timestamp: Date.now() });
      return null;
    }
  }
  
  /**
   * Batch fetch multiple items (makes parallel requests but still benefits from cache)
   */
  async getItemsBySkus(skus: string[]): Promise<Map<string, Record<string, any> | null>> {
    const results = new Map<string, Record<string, any> | null>();
    
    // Fetch all items in parallel
    const promises = skus.map(async (sku) => {
      const item = await this.getItemBySku(sku);
      results.set(sku, item);
    });
    
    await Promise.all(promises);
    return results;
  }
  
  /**
   * Clear cache for a specific SKU or entire cache
   */
  clearCache(sku?: string): void {
    if (sku) {
      this.cache.delete(sku);
      this.logger.log(`Cleared cache for SKU: ${sku}`);
    } else {
      this.cache.clear();
      this.logger.log('Cleared entire Counterpoint cache');
    }
  }
  
  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; maxSize: number; ttlMs: number } {
    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
      ttlMs: this.CACHE_TTL_MS,
    };
  }
}
