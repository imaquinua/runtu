// ============================================
// RAG - Query Embedding Cache
// ============================================
// Cache en memoria para embeddings de queries frecuentes
// Reduce latencia y llamadas a la API de embeddings

import { type CacheEntry, type CacheStats, RAG_DEFAULTS } from "./types";

// ============================================
// LRU Cache Implementation
// ============================================

/**
 * Cache LRU (Least Recently Used) para embeddings de queries.
 * Optimizado para búsquedas rápidas y gestión automática de memoria.
 */
class EmbeddingCache {
  private cache: Map<string, CacheEntry>;
  private maxSize: number;
  private ttlMs: number;
  private hits: number = 0;
  private misses: number = 0;

  constructor(maxSize?: number, ttlMs?: number) {
    this.cache = new Map();
    this.maxSize = maxSize ?? RAG_DEFAULTS.MAX_CACHE_SIZE;
    this.ttlMs = ttlMs ?? RAG_DEFAULTS.CACHE_TTL_MS;
  }

  /**
   * Genera una clave normalizada para el cache
   */
  private generateKey(query: string): string {
    return query
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " ")
      .replace(/[^\w\sáéíóúñü]/gi, "");
  }

  /**
   * Verifica si una entrada ha expirado
   */
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.createdAt > this.ttlMs;
  }

  /**
   * Elimina entradas expiradas
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.createdAt > this.ttlMs) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Evicta entradas LRU si el cache está lleno
   */
  private evictIfNeeded(): void {
    if (this.cache.size >= this.maxSize) {
      // Encontrar la entrada con menos hits (LFU) o más antigua
      let oldestKey: string | null = null;
      let lowestScore = Infinity;

      for (const [key, entry] of this.cache.entries()) {
        // Score = hits * recency (lower is worse)
        const age = Date.now() - entry.createdAt;
        const score = entry.hitCount / (age / 1000 + 1);

        if (score < lowestScore) {
          lowestScore = score;
          oldestKey = key;
        }
      }

      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
  }

  /**
   * Obtiene un embedding del cache
   */
  get(query: string): number[] | null {
    const key = this.generateKey(query);
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    // Actualizar hit count y mover al frente (LRU)
    entry.hitCount++;
    this.cache.delete(key);
    this.cache.set(key, entry);

    this.hits++;
    return entry.embedding;
  }

  /**
   * Guarda un embedding en el cache
   */
  set(query: string, embedding: number[]): void {
    // Limpiar entradas expiradas periódicamente
    if (Math.random() < 0.1) {
      this.cleanup();
    }

    this.evictIfNeeded();

    const key = this.generateKey(query);
    this.cache.set(key, {
      embedding,
      createdAt: Date.now(),
      hitCount: 0,
    });
  }

  /**
   * Verifica si una query está en cache
   */
  has(query: string): boolean {
    const key = this.generateKey(query);
    const entry = this.cache.get(key);

    if (!entry) return false;
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Elimina una entrada del cache
   */
  delete(query: string): boolean {
    const key = this.generateKey(query);
    return this.cache.delete(key);
  }

  /**
   * Limpia todo el cache
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Obtiene estadísticas del cache
   */
  getStats(): CacheStats {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: total > 0 ? this.hits / total : 0,
      totalHits: this.hits,
      totalMisses: this.misses,
    };
  }

  /**
   * Precalienta el cache con queries comunes
   */
  async warmup(
    queries: string[],
    embedFn: (query: string) => Promise<number[] | null>
  ): Promise<number> {
    let warmed = 0;

    for (const query of queries) {
      if (!this.has(query)) {
        const embedding = await embedFn(query);
        if (embedding) {
          this.set(query, embedding);
          warmed++;
        }
      }
    }

    return warmed;
  }
}

// ============================================
// Singleton Instance
// ============================================

// Cache global para la aplicación
let globalCache: EmbeddingCache | null = null;

/**
 * Obtiene la instancia global del cache
 */
export function getEmbeddingCache(): EmbeddingCache {
  if (!globalCache) {
    globalCache = new EmbeddingCache();
  }
  return globalCache;
}

/**
 * Reinicia el cache global (útil para tests)
 */
export function resetEmbeddingCache(): void {
  globalCache?.clear();
  globalCache = null;
}

/**
 * Alias for resetEmbeddingCache (útil para tests)
 */
export function clearEmbeddingCache(): void {
  resetEmbeddingCache();
}

/**
 * Obtiene estadísticas del cache global
 */
export function getCacheStats(): CacheStats & { hits: number; misses: number } {
  const cache = getEmbeddingCache();
  const stats = cache.getStats();
  return {
    ...stats,
    hits: stats.totalHits,
    misses: stats.totalMisses,
  };
}

// ============================================
// Helper Functions
// ============================================

/**
 * Obtiene o genera un embedding con cache
 */
export async function getCachedEmbedding(
  query: string,
  generateFn: (q: string) => Promise<number[] | null>,
  useCache = true
): Promise<{ embedding: number[] | null; fromCache: boolean }> {
  if (!useCache) {
    const embedding = await generateFn(query);
    return { embedding, fromCache: false };
  }

  const cache = getEmbeddingCache();

  // Intentar obtener del cache
  const cached = cache.get(query);
  if (cached) {
    return { embedding: cached, fromCache: true };
  }

  // Generar nuevo embedding
  const embedding = await generateFn(query);

  // Guardar en cache si fue exitoso
  if (embedding) {
    cache.set(query, embedding);
  }

  return { embedding, fromCache: false };
}

/**
 * Queries comunes para precalentamiento
 */
export const COMMON_QUERIES = [
  // Ventas
  "cuánto vendí hoy",
  "ventas del mes",
  "producto más vendido",
  "cuál fue mi mejor día de ventas",

  // Inventario
  "qué productos tengo",
  "productos con bajo stock",
  "cuánto inventario tengo",

  // Finanzas
  "cuáles son mis gastos",
  "cuál es mi ganancia",
  "costos del mes",

  // Clientes
  "quiénes son mis clientes",
  "cliente frecuente",
  "pedidos pendientes",

  // Menú (restaurantes)
  "cuál es el menú",
  "platillos disponibles",
  "precios del menú",

  // General
  "resumen del negocio",
  "información importante",
  "datos del negocio",
];

// ============================================
// Export Class
// ============================================

export { EmbeddingCache };
export type { CacheEntry, CacheStats };
