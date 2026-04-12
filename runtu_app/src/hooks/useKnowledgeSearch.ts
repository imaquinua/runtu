"use client";

// ============================================
// useKnowledgeSearch Hook
// ============================================
// Hook para búsqueda RAG en el conocimiento del negocio

import { useState, useCallback, useRef, useEffect } from "react";
import type { ChunkType } from "@/types/database";

// ============================================
// Types
// ============================================

export interface SearchResult {
  id: string;
  content: string;
  snippet: string;
  score: number;
  similarity: number;
  chunkType: ChunkType;
  source: {
    type: ChunkType;
    context: string | null;
    filename?: string;
    page?: number;
    sheet?: string;
  };
  matchedKeywords: string[];
}

export interface SearchContext {
  text: string;
  tokensUsed: number;
  chunksIncluded: number;
  sources: Array<{
    type: ChunkType;
    context: string | null;
    chunkCount: number;
    filename?: string;
  }>;
  wasTruncated: boolean;
}

export interface QueryAnalysis {
  intent: string;
  category: string;
  keywords: string[];
  specificity: number;
}

export interface SearchMetrics {
  searchTimeMs: number;
  totalTimeMs: number;
  totalMatches: number;
  fromCache: boolean;
}

export interface SearchResponse {
  success: boolean;
  query: string;
  results: SearchResult[];
  context: SearchContext | null;
  queryAnalysis: QueryAnalysis | null;
  metrics: SearchMetrics;
}

export interface UseKnowledgeSearchOptions {
  /** ID del negocio (opcional, usa el default del usuario) */
  businessId?: string;
  /** Debounce en ms para búsqueda automática */
  debounceMs?: number;
  /** Límite de resultados */
  limit?: number;
  /** Umbral de similitud */
  threshold?: number;
  /** Incluir contexto construido */
  includeContext?: boolean;
  /** Tipos de chunk a buscar */
  chunkTypes?: ChunkType[];
  /** Usar búsqueda híbrida */
  hybridSearch?: boolean;
  /** Callback cuando hay resultados */
  onResults?: (results: SearchResult[]) => void;
  /** Callback cuando hay error */
  onError?: (error: Error) => void;
}

export interface UseKnowledgeSearchReturn {
  /** Query actual */
  query: string;
  /** Setter para el query */
  setQuery: (query: string) => void;
  /** Resultados de búsqueda */
  results: SearchResult[];
  /** Contexto construido */
  context: SearchContext | null;
  /** Análisis del query */
  queryAnalysis: QueryAnalysis | null;
  /** Estado de carga */
  isLoading: boolean;
  /** Error si ocurrió */
  error: Error | null;
  /** Métricas de la última búsqueda */
  metrics: SearchMetrics | null;
  /** Función para buscar manualmente */
  search: (query?: string) => Promise<void>;
  /** Limpiar resultados */
  clear: () => void;
  /** Si hay resultados */
  hasResults: boolean;
}

// ============================================
// Hook Implementation
// ============================================

export function useKnowledgeSearch(
  options: UseKnowledgeSearchOptions = {}
): UseKnowledgeSearchReturn {
  const {
    businessId,
    debounceMs = 300,
    limit = 10,
    threshold = 0.65,
    includeContext = false,
    chunkTypes,
    hybridSearch = true,
    onResults,
    onError,
  } = options;

  // State
  const [query, setQueryState] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [context, setContext] = useState<SearchContext | null>(null);
  const [queryAnalysis, setQueryAnalysis] = useState<QueryAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [metrics, setMetrics] = useState<SearchMetrics | null>(null);

  // Refs
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Search function
  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery || searchQuery.trim().length < 2) {
        setResults([]);
        setContext(null);
        setQueryAnalysis(null);
        setMetrics(null);
        return;
      }

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: searchQuery.trim(),
            businessId,
            limit,
            threshold,
            chunkTypes,
            hybridSearch,
            includeContext,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Error en la búsqueda");
        }

        const data: SearchResponse = await response.json();

        setResults(data.results);
        setContext(data.context);
        setQueryAnalysis(data.queryAnalysis);
        setMetrics(data.metrics);

        onResults?.(data.results);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          // Request was cancelled, ignore
          return;
        }

        const error = err instanceof Error ? err : new Error("Error desconocido");
        setError(error);
        setResults([]);
        setContext(null);
        setQueryAnalysis(null);
        setMetrics(null);

        onError?.(error);
      } finally {
        setIsLoading(false);
      }
    },
    [businessId, limit, threshold, chunkTypes, hybridSearch, includeContext, onResults, onError]
  );

  // Debounced search
  const setQuery = useCallback(
    (newQuery: string) => {
      setQueryState(newQuery);

      // Clear previous timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new timer
      debounceTimerRef.current = setTimeout(() => {
        performSearch(newQuery);
      }, debounceMs);
    },
    [debounceMs, performSearch]
  );

  // Manual search
  const search = useCallback(
    async (overrideQuery?: string) => {
      const searchQuery = overrideQuery ?? query;
      await performSearch(searchQuery);
    },
    [query, performSearch]
  );

  // Clear
  const clear = useCallback(() => {
    setQueryState("");
    setResults([]);
    setContext(null);
    setQueryAnalysis(null);
    setMetrics(null);
    setError(null);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    query,
    setQuery,
    results,
    context,
    queryAnalysis,
    isLoading,
    error,
    metrics,
    search,
    clear,
    hasResults: results.length > 0,
  };
}

// ============================================
// Quick Search Hook (for autocomplete)
// ============================================

export interface QuickSearchResult {
  id: string;
  snippet: string;
  type: string;
}

export interface UseQuickSearchOptions {
  businessId?: string;
  debounceMs?: number;
}

export interface UseQuickSearchReturn {
  query: string;
  setQuery: (query: string) => void;
  suggestions: QuickSearchResult[];
  isLoading: boolean;
  clear: () => void;
}

export function useQuickSearch(
  options: UseQuickSearchOptions = {}
): UseQuickSearchReturn {
  const { businessId, debounceMs = 200 } = options;

  const [query, setQueryState] = useState("");
  const [suggestions, setSuggestions] = useState<QuickSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery || searchQuery.length < 2) {
        setSuggestions([]);
        return;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      setIsLoading(true);

      try {
        const params = new URLSearchParams({ q: searchQuery });
        if (businessId) {
          params.set("businessId", businessId);
        }

        const response = await fetch(`/api/search?${params.toString()}`, {
          signal: abortControllerRef.current.signal,
        });

        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.results || []);
        }
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          setSuggestions([]);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [businessId]
  );

  const setQuery = useCallback(
    (newQuery: string) => {
      setQueryState(newQuery);

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        performSearch(newQuery);
      }, debounceMs);
    },
    [debounceMs, performSearch]
  );

  const clear = useCallback(() => {
    setQueryState("");
    setSuggestions([]);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    query,
    setQuery,
    suggestions,
    isLoading,
    clear,
  };
}

// ============================================
// Export default
// ============================================

export default useKnowledgeSearch;
