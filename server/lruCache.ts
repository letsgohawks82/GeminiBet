import crypto from 'crypto';
import { LRUCache } from 'lru-cache';

export interface CacheEntry {
  response: any;
  model: string;
  createdAt: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  size: number;
  hitRatePct: number;
}

const maxItems = Number(process.env.AI_CACHE_MAX_ITEMS) || 250;
const ttlSec = Number(process.env.AI_CACHE_TTL_SEC) || 600;

class AiHashedCache {
  private cache: LRUCache<string, CacheEntry>;
  private hits = 0;
  private misses = 0;
  private sets = 0;

  constructor() {
    this.cache = new LRUCache<string, CacheEntry>({
      max: maxItems,
      ttl: ttlSec * 1000,
    });
  }

  /**
   * Hashes the parameters to generate a deterministic, fixed-size cache key.
   */
  public generateKey(model: string, prompt: string, systemInstruction = '', userSalt = ''): string {
    const rawKey = `${model}::${systemInstruction.trim()}::${prompt.trim()}::${userSalt}`;
    return crypto.createHash('sha256').update(rawKey).digest('hex');
  }

  /**
   * Checks whether prompt contains sensitive keywords that should never be cached.
   */
  public isSensitive(prompt: string): boolean {
    const sensitivePatterns = [
      /password/i,
      /secret/i,
      /api[_-]?key/i,
      /bearer\s+/i,
      /token/i,
      /ssn/i,
      /credit[_-]?card/i,
      /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/,
    ];
    return sensitivePatterns.some((pattern) => pattern.test(prompt));
  }

  public get(key: string): CacheEntry | undefined {
    const entry = this.cache.get(key);
    if (entry) {
      this.hits += 1;
      return entry;
    }
    this.misses += 1;
    return undefined;
  }

  public set(key: string, response: any, model: string): void {
    this.sets += 1;
    this.cache.set(key, {
      response,
      model,
      createdAt: Date.now(),
    });
  }

  public clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
    this.sets = 0;
  }

  public getStats(): CacheStats {
    const totalRequests = this.hits + this.misses;
    const hitRatePct = totalRequests > 0 ? Number(((this.hits / totalRequests) * 100).toFixed(1)) : 0;
    return {
      hits: this.hits,
      misses: this.misses,
      sets: this.sets,
      size: this.cache.size,
      hitRatePct,
    };
  }
}

export const aiCache = new AiHashedCache();
