import { describe, it, expect, beforeEach } from 'vitest';
import { aiCache } from '../server/lruCache';

describe('lruCache', () => {
  beforeEach(() => {
    aiCache.clear();
  });

  it('generates deterministic SHA-256 hash keys', () => {
    const key1 = aiCache.generateKey('gemini-2.5-flash', 'Analyze game 1', 'sys-inst');
    const key2 = aiCache.generateKey('gemini-2.5-flash', 'Analyze game 1', 'sys-inst');
    const key3 = aiCache.generateKey('gemini-2.5-flash', 'Analyze game 2', 'sys-inst');

    expect(key1).toBe(key2);
    expect(key1).toHaveLength(64); // SHA-256 hex string
    expect(key1).not.toBe(key3);
  });

  it('correctly sets and retrieves cached entries with hit tracking', () => {
    const key = aiCache.generateKey('gemini-2.5-flash', 'Test prompt');
    expect(aiCache.get(key)).toBeUndefined();

    aiCache.set(key, 'Cached analysis output', 'gemini-2.5-flash');

    const entry = aiCache.get(key);
    expect(entry).toBeDefined();
    expect(entry?.response).toBe('Cached analysis output');

    const stats = aiCache.getStats();
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(1);
    expect(stats.size).toBe(1);
    expect(stats.hitRatePct).toBe(50);
  });

  it('detects sensitive keywords to prevent caching PII / keys', () => {
    expect(aiCache.isSensitive('my secret api_key is xyz')).toBe(true);
    expect(aiCache.isSensitive('Bearer eyJhbGciOi...')).toBe(true);
    expect(aiCache.isSensitive('Password123!')).toBe(true);
    expect(aiCache.isSensitive('FEI game breakdown for Ohio State vs Michigan')).toBe(false);
  });
});
