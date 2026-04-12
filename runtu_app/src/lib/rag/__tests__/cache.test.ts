// ============================================
// RAG Cache - Unit Tests
// ============================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getCachedEmbedding,
  getCacheStats,
  clearEmbeddingCache,
} from "../cache";

describe("embedding cache", () => {
  beforeEach(() => {
    clearEmbeddingCache();
  });

  it("should cache embeddings", async () => {
    const mockGenerator = vi.fn().mockResolvedValue([0.1, 0.2, 0.3]);

    // First call - should generate
    const result1 = await getCachedEmbedding("test query", mockGenerator, true);
    expect(result1.fromCache).toBe(false);
    expect(result1.embedding).toEqual([0.1, 0.2, 0.3]);
    expect(mockGenerator).toHaveBeenCalledTimes(1);

    // Second call - should use cache
    const result2 = await getCachedEmbedding("test query", mockGenerator, true);
    expect(result2.fromCache).toBe(true);
    expect(result2.embedding).toEqual([0.1, 0.2, 0.3]);
    expect(mockGenerator).toHaveBeenCalledTimes(1); // Not called again
  });

  it("should not cache when disabled", async () => {
    const mockGenerator = vi.fn().mockResolvedValue([0.1, 0.2, 0.3]);

    // First call
    const result1 = await getCachedEmbedding("test query", mockGenerator, false);
    expect(result1.fromCache).toBe(false);

    // Second call - should still generate
    const result2 = await getCachedEmbedding("test query", mockGenerator, false);
    expect(result2.fromCache).toBe(false);
    expect(mockGenerator).toHaveBeenCalledTimes(2);
  });

  it("should normalize queries before caching", async () => {
    const mockGenerator = vi.fn().mockResolvedValue([0.1, 0.2, 0.3]);

    await getCachedEmbedding("  HELLO WORLD  ", mockGenerator, true);
    const result = await getCachedEmbedding("hello world", mockGenerator, true);

    expect(result.fromCache).toBe(true);
    expect(mockGenerator).toHaveBeenCalledTimes(1);
  });

  it("should differentiate different queries", async () => {
    const mockGenerator = vi
      .fn()
      .mockResolvedValueOnce([0.1, 0.2])
      .mockResolvedValueOnce([0.3, 0.4]);

    const result1 = await getCachedEmbedding("query one", mockGenerator, true);
    const result2 = await getCachedEmbedding("query two", mockGenerator, true);

    expect(result1.embedding).toEqual([0.1, 0.2]);
    expect(result2.embedding).toEqual([0.3, 0.4]);
    expect(mockGenerator).toHaveBeenCalledTimes(2);
  });

  it("should handle generator errors gracefully", async () => {
    const mockGenerator = vi.fn().mockRejectedValue(new Error("API Error"));

    await expect(
      getCachedEmbedding("test", mockGenerator, true)
    ).rejects.toThrow("API Error");
  });

  it("should handle null embeddings", async () => {
    const mockGenerator = vi.fn().mockResolvedValue(null);

    const result = await getCachedEmbedding("test", mockGenerator, true);
    expect(result.embedding).toBeNull();
    expect(result.fromCache).toBe(false);

    // Null should not be cached
    const result2 = await getCachedEmbedding("test", mockGenerator, true);
    expect(mockGenerator).toHaveBeenCalledTimes(2);
  });
});

describe("cache stats", () => {
  beforeEach(() => {
    clearEmbeddingCache();
  });

  it("should track cache statistics", async () => {
    const mockGenerator = vi.fn().mockResolvedValue([0.1, 0.2, 0.3]);

    // Initial stats
    let stats = getCacheStats();
    expect(stats.size).toBe(0);
    expect(stats.hits).toBe(0);
    expect(stats.misses).toBe(0);

    // Add some entries
    await getCachedEmbedding("query 1", mockGenerator, true);
    await getCachedEmbedding("query 2", mockGenerator, true);

    stats = getCacheStats();
    expect(stats.size).toBe(2);
    expect(stats.misses).toBe(2);

    // Hit the cache
    await getCachedEmbedding("query 1", mockGenerator, true);
    await getCachedEmbedding("query 2", mockGenerator, true);

    stats = getCacheStats();
    expect(stats.hits).toBe(2);
    expect(stats.hitRate).toBeCloseTo(0.5); // 2 hits / 4 total
  });

  it("should calculate correct hit rate", async () => {
    const mockGenerator = vi.fn().mockResolvedValue([0.1]);

    // 1 miss
    await getCachedEmbedding("test", mockGenerator, true);
    // 3 hits
    await getCachedEmbedding("test", mockGenerator, true);
    await getCachedEmbedding("test", mockGenerator, true);
    await getCachedEmbedding("test", mockGenerator, true);

    const stats = getCacheStats();
    expect(stats.hitRate).toBe(0.75); // 3 hits / 4 total
  });
});

describe("clearEmbeddingCache", () => {
  it("should clear all cached entries", async () => {
    clearEmbeddingCache(); // Ensure clean state
    const mockGenerator = vi.fn().mockResolvedValue([0.1]);

    await getCachedEmbedding("unique query 1", mockGenerator, true);
    await getCachedEmbedding("unique query 2", mockGenerator, true);

    let stats = getCacheStats();
    expect(stats.size).toBeGreaterThanOrEqual(2);

    clearEmbeddingCache();

    stats = getCacheStats();
    expect(stats.size).toBe(0);
  });

  it("should reset hit/miss counters", async () => {
    const mockGenerator = vi.fn().mockResolvedValue([0.1]);

    await getCachedEmbedding("query", mockGenerator, true);
    await getCachedEmbedding("query", mockGenerator, true);

    clearEmbeddingCache();

    const stats = getCacheStats();
    expect(stats.hits).toBe(0);
    expect(stats.misses).toBe(0);
  });

  it("should require regeneration after clear", async () => {
    const mockGenerator = vi.fn().mockResolvedValue([0.1]);

    await getCachedEmbedding("query", mockGenerator, true);
    expect(mockGenerator).toHaveBeenCalledTimes(1);

    clearEmbeddingCache();

    const result = await getCachedEmbedding("query", mockGenerator, true);
    expect(result.fromCache).toBe(false);
    expect(mockGenerator).toHaveBeenCalledTimes(2);
  });
});

describe("cache edge cases", () => {
  beforeEach(() => {
    clearEmbeddingCache();
  });

  it("should handle empty queries", async () => {
    const mockGenerator = vi.fn().mockResolvedValue([0.1]);

    const result = await getCachedEmbedding("", mockGenerator, true);
    expect(result.embedding).toEqual([0.1]);
  });

  it("should handle very long queries", async () => {
    const mockGenerator = vi.fn().mockResolvedValue([0.1]);
    const longQuery = "a".repeat(10000);

    const result1 = await getCachedEmbedding(longQuery, mockGenerator, true);
    const result2 = await getCachedEmbedding(longQuery, mockGenerator, true);

    expect(result1.fromCache).toBe(false);
    expect(result2.fromCache).toBe(true);
  });

  it("should handle special characters in queries", async () => {
    const mockGenerator = vi.fn().mockResolvedValue([0.1]);
    const specialQuery = "¿Cuánto cuesta? $500 & más!";

    const result1 = await getCachedEmbedding(specialQuery, mockGenerator, true);
    const result2 = await getCachedEmbedding(specialQuery, mockGenerator, true);

    expect(result2.fromCache).toBe(true);
  });

  it("should handle unicode/emoji queries", async () => {
    const mockGenerator = vi.fn().mockResolvedValue([0.1]);
    const emojiQuery = "ventas del día 🎉 📊";

    const result1 = await getCachedEmbedding(emojiQuery, mockGenerator, true);
    const result2 = await getCachedEmbedding(emojiQuery, mockGenerator, true);

    expect(result2.fromCache).toBe(true);
  });

  it("should handle concurrent requests for same query", async () => {
    const mockGenerator = vi.fn().mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return [0.1, 0.2];
    });

    // Fire multiple concurrent requests
    const [r1, r2, r3] = await Promise.all([
      getCachedEmbedding("same query", mockGenerator, true),
      getCachedEmbedding("same query", mockGenerator, true),
      getCachedEmbedding("same query", mockGenerator, true),
    ]);

    // All should have same embedding
    expect(r1.embedding).toEqual(r2.embedding);
    expect(r2.embedding).toEqual(r3.embedding);
  });
});
