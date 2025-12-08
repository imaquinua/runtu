// ============================================
// RAG - Main Orchestrator
// ============================================
// Punto de entrada principal para búsqueda y contexto RAG

import {
  ragSearch,
  semanticSearch,
  textSearch,
  quickSearch,
  searchWithReranking,
} from "./search";
import {
  buildContext,
  buildStructuredContext,
  generateSystemPromptWithContext,
  summarizeContext,
} from "./context";
import { analyzeQuery, extractKeywords, enhanceQuery } from "./utils";
import {
  getEmbeddingCache,
  resetEmbeddingCache,
  getCachedEmbedding,
  COMMON_QUERIES,
} from "./cache";
import {
  type RAGSearchOptions,
  type RAGSearchResult,
  type RAGSearchResponse,
  type ContextOptions,
  type BuiltContext,
  type StructuredContext,
  type QueryAnalysis,
  RAGError,
  RAG_DEFAULTS,
} from "./types";

// ============================================
// Main Query Function
// ============================================

export interface QueryBusinessKnowledgeOptions extends RAGSearchOptions {
  /** Incluir contexto construido */
  includeContext?: boolean;

  /** Opciones para construcción de contexto */
  contextOptions?: ContextOptions;

  /** Nombre del negocio para prompt de sistema */
  businessName?: string;
}

export interface QueryBusinessKnowledgeResult {
  /** Resultados de búsqueda */
  results: RAGSearchResult[];

  /** Análisis de la query */
  queryAnalysis?: QueryAnalysis;

  /** Contexto construido (si se solicitó) */
  context?: BuiltContext;

  /** Prompt de sistema listo para usar */
  systemPrompt?: string;

  /** Métricas */
  metrics: {
    searchTimeMs: number;
    contextBuildTimeMs?: number;
    totalTimeMs: number;
    fromCache: boolean;
    totalMatches: number;
  };
}

/**
 * Función principal para consultar conocimiento de un negocio.
 * Combina búsqueda, análisis de query, y construcción de contexto.
 *
 * @example
 * ```typescript
 * const result = await queryBusinessKnowledge({
 *   businessId: "...",
 *   query: "cuánto vendí ayer",
 *   includeContext: true,
 *   businessName: "Mi Taquería"
 * });
 *
 * // Usar el contexto en un prompt
 * const response = await llm.chat({
 *   systemPrompt: result.systemPrompt,
 *   userMessage: "cuánto vendí ayer"
 * });
 * ```
 */
export async function queryBusinessKnowledge(
  options: QueryBusinessKnowledgeOptions
): Promise<QueryBusinessKnowledgeResult> {
  const startTime = Date.now();

  const {
    includeContext = true,
    contextOptions = {},
    businessName,
    ...searchOptions
  } = options;

  // 1. Realizar búsqueda
  const searchResponse = await ragSearch(searchOptions);

  let context: BuiltContext | undefined;
  let systemPrompt: string | undefined;
  let contextBuildTimeMs: number | undefined;

  // 2. Construir contexto si se solicita
  if (includeContext && searchResponse.results.length > 0) {
    const contextStart = Date.now();

    context = buildContext(searchResponse.results, contextOptions);

    // 3. Generar prompt de sistema
    systemPrompt = generateSystemPromptWithContext(context, businessName);

    contextBuildTimeMs = Date.now() - contextStart;
  }

  const totalTimeMs = Date.now() - startTime;

  return {
    results: searchResponse.results,
    queryAnalysis: searchResponse.queryAnalysis,
    context,
    systemPrompt,
    metrics: {
      searchTimeMs: searchResponse.searchTimeMs,
      contextBuildTimeMs,
      totalTimeMs,
      fromCache: searchResponse.fromCache,
      totalMatches: searchResponse.totalMatches,
    },
  };
}

// ============================================
// Convenience Functions
// ============================================

/**
 * Búsqueda rápida sin contexto (para autocompletado)
 */
export async function searchKnowledge(
  businessId: string,
  query: string,
  limit: number = 10
): Promise<RAGSearchResult[]> {
  const response = await ragSearch({
    businessId,
    query,
    limit,
    hybridSearch: true,
    analyzeQuery: false,
  });
  return response.results;
}

/**
 * Obtiene contexto listo para un LLM
 */
export async function getContextForLLM(
  businessId: string,
  query: string,
  options: {
    maxTokens?: number;
    businessName?: string;
  } = {}
): Promise<{
  context: string;
  systemPrompt: string;
  sources: string[];
}> {
  const { maxTokens = RAG_DEFAULTS.MAX_CONTEXT_TOKENS, businessName } = options;

  const result = await queryBusinessKnowledge({
    businessId,
    query,
    includeContext: true,
    contextOptions: {
      maxTokens,
      includeSourceInfo: true,
      format: "structured",
    },
    businessName,
  });

  return {
    context: result.context?.context ?? "",
    systemPrompt: result.systemPrompt ?? "",
    sources: result.context?.sources.map((s) => s.context ?? s.type) ?? [],
  };
}

/**
 * Verifica si un negocio tiene conocimiento disponible
 */
export async function hasKnowledgeForQuery(
  businessId: string,
  query: string
): Promise<{
  hasResults: boolean;
  topResultScore: number;
  suggestedQuery?: string;
}> {
  try {
    const response = await ragSearch({
      businessId,
      query,
      limit: 1,
      threshold: 0.5,
      analyzeQuery: false,
    });

    const hasResults = response.results.length > 0;
    const topResultScore = hasResults ? response.results[0].score : 0;

    // Si no hay resultados, sugerir mejorar la query
    let suggestedQuery: string | undefined;
    if (!hasResults) {
      suggestedQuery = enhanceQuery(query);
      if (suggestedQuery === query) {
        suggestedQuery = undefined;
      }
    }

    return { hasResults, topResultScore, suggestedQuery };
  } catch {
    return { hasResults: false, topResultScore: 0 };
  }
}

// ============================================
// Cache Management
// ============================================

/**
 * Precalienta el cache con queries comunes
 */
export async function warmupCache(
  embedFn: (query: string) => Promise<number[] | null>
): Promise<number> {
  const cache = getEmbeddingCache();
  return cache.warmup(COMMON_QUERIES, embedFn);
}

/**
 * Obtiene estadísticas del cache
 */
export function getCacheStats() {
  return getEmbeddingCache().getStats();
}

/**
 * Limpia el cache
 */
export function clearCache() {
  resetEmbeddingCache();
}

// ============================================
// Re-exports
// ============================================

// Search functions
export {
  ragSearch,
  semanticSearch,
  textSearch,
  quickSearch,
  searchWithReranking,
};

// Context functions
export {
  buildContext,
  buildStructuredContext,
  generateSystemPromptWithContext,
  summarizeContext,
};

// Query utilities
export {
  analyzeQuery,
  extractKeywords,
  enhanceQuery,
};

// Cache
export {
  getEmbeddingCache,
  getCachedEmbedding,
  COMMON_QUERIES,
};

// Types
export type {
  RAGSearchOptions,
  RAGSearchResult,
  RAGSearchResponse,
  ContextOptions,
  BuiltContext,
  StructuredContext,
  QueryAnalysis,
};

export { RAGError, RAG_DEFAULTS };
