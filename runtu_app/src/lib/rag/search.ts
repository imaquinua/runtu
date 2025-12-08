// ============================================
// RAG - Search Service
// ============================================
// Servicio principal de búsqueda semántica e híbrida

import { searchKnowledge, searchKnowledgeSimple } from "@/lib/db/knowledge";
import { generateQueryEmbedding } from "@/lib/embeddings";
import type { ChunkSearchResult, ChunkTextSearchResult, ChunkType, KnowledgeChunkMetadata } from "@/types/database";
import {
  type RAGSearchOptions,
  type RAGSearchResult,
  type RAGSearchResponse,
  RAGError,
  RAG_DEFAULTS,
  CHUNK_TYPE_DISPLAY,
} from "./types";
import { getCachedEmbedding } from "./cache";
import {
  analyzeQuery,
  extractKeywords,
  generateSnippet,
} from "./utils";

// ============================================
// Main Search Function
// ============================================

/**
 * Realiza una búsqueda RAG completa.
 * Soporta búsqueda semántica, por texto, e híbrida.
 */
export async function ragSearch(
  options: RAGSearchOptions
): Promise<RAGSearchResponse> {
  const startTime = Date.now();

  const {
    businessId,
    query,
    threshold = RAG_DEFAULTS.SIMILARITY_THRESHOLD,
    limit = RAG_DEFAULTS.MAX_RESULTS,
    chunkTypes,
    hybridSearch = true,
    semanticWeight = RAG_DEFAULTS.SEMANTIC_WEIGHT,
    useCache = true,
    analyzeQuery: shouldAnalyze = true,
  } = options;

  // Validar query
  if (!query || query.trim().length < 2) {
    throw new RAGError(
      "La búsqueda debe tener al menos 2 caracteres",
      "INVALID_QUERY"
    );
  }

  // Analizar query si está habilitado
  const queryAnalysis = shouldAnalyze ? analyzeQuery(query) : undefined;
  const keywords = extractKeywords(query);

  let semanticResults: ChunkSearchResult[] = [];
  let textResults: ChunkTextSearchResult[] = [];
  let fromCache = false;

  // 1. Búsqueda semántica
  try {
    const embeddingResult = await getCachedEmbedding(
      query,
      async (q) => {
        const result = await generateQueryEmbedding(q);
        return result.data;
      },
      useCache
    );

    fromCache = embeddingResult.fromCache;

    if (embeddingResult.embedding) {
      semanticResults = await searchKnowledge({
        businessId,
        queryEmbedding: embeddingResult.embedding,
        threshold,
        limit: hybridSearch ? limit * 2 : limit, // Obtener más para fusionar
        chunkTypes,
      });
    }
  } catch (error) {
    console.error("[RAG/search] Error en búsqueda semántica:", error);
    // Continuar con búsqueda de texto si la semántica falla
  }

  // 2. Búsqueda por texto (si híbrida o semántica falló)
  if (hybridSearch || semanticResults.length === 0) {
    try {
      textResults = await searchKnowledgeSimple({
        businessId,
        query,
        limit: hybridSearch ? limit * 2 : limit,
      });
    } catch (error) {
      console.error("[RAG/search] Error en búsqueda de texto:", error);
    }
  }

  // 3. Fusionar y rankear resultados
  const fusedResults = hybridSearch
    ? fuseResults(semanticResults, textResults, semanticWeight)
    : convertSemanticResults(semanticResults);

  // 4. Enriquecer con snippets y metadata
  const enrichedResults = enrichResults(fusedResults, keywords, limit);

  const searchTimeMs = Date.now() - startTime;

  return {
    results: enrichedResults,
    searchTimeMs,
    totalMatches: fusedResults.length,
    queryAnalysis,
    fromCache,
  };
}

// ============================================
// Semantic-Only Search
// ============================================

/**
 * Búsqueda puramente semántica (más rápida, menos resultados)
 */
export async function semanticSearch(
  businessId: string,
  query: string,
  options: {
    threshold?: number;
    limit?: number;
    chunkTypes?: ChunkType[];
    useCache?: boolean;
  } = {}
): Promise<RAGSearchResult[]> {
  const {
    threshold = RAG_DEFAULTS.SIMILARITY_THRESHOLD,
    limit = RAG_DEFAULTS.MAX_RESULTS,
    chunkTypes,
    useCache = true,
  } = options;

  // Obtener embedding
  const embeddingResult = await getCachedEmbedding(
    query,
    async (q) => {
      const result = await generateQueryEmbedding(q);
      return result.data;
    },
    useCache
  );

  if (!embeddingResult.embedding) {
    throw new RAGError(
      "No se pudo generar el embedding para la búsqueda",
      "EMBEDDING_FAILED"
    );
  }

  // Buscar
  const results = await searchKnowledge({
    businessId,
    queryEmbedding: embeddingResult.embedding,
    threshold,
    limit,
    chunkTypes,
  });

  // Enriquecer
  const keywords = extractKeywords(query);
  return enrichResults(convertSemanticResults(results), keywords, limit);
}

// ============================================
// Text-Only Search
// ============================================

/**
 * Búsqueda puramente por texto (no requiere embeddings)
 */
export async function textSearch(
  businessId: string,
  query: string,
  options: {
    limit?: number;
  } = {}
): Promise<RAGSearchResult[]> {
  const { limit = RAG_DEFAULTS.MAX_RESULTS } = options;

  const results = await searchKnowledgeSimple({
    businessId,
    query,
    limit,
  });

  // Convertir a formato RAG
  const keywords = extractKeywords(query);
  const converted = convertTextResults(results);
  return enrichResults(converted, keywords, limit);
}

// ============================================
// Result Fusion (Hybrid Search)
// ============================================

interface ScoredResult {
  id: string;
  content: string;
  chunk_type: ChunkType;
  source_context: string | null;
  metadata: Record<string, unknown>;
  semanticScore: number;
  textScore: number;
  combinedScore: number;
}

/**
 * Fusiona resultados semánticos y de texto usando Reciprocal Rank Fusion
 */
function fuseResults(
  semanticResults: ChunkSearchResult[],
  textResults: ChunkTextSearchResult[],
  semanticWeight: number
): ScoredResult[] {
  const k = 60; // Constante RRF
  const resultMap = new Map<string, ScoredResult>();

  // Procesar resultados semánticos
  semanticResults.forEach((result, index) => {
    const rrfScore = 1 / (k + index + 1);
    const entry: ScoredResult = {
      id: result.id,
      content: result.content,
      chunk_type: result.chunk_type,
      source_context: result.source_context,
      metadata: result.metadata as Record<string, unknown>,
      semanticScore: result.similarity,
      textScore: 0,
      combinedScore: rrfScore * semanticWeight,
    };
    resultMap.set(result.id, entry);
  });

  // Procesar resultados de texto
  textResults.forEach((result, index) => {
    const rrfScore = 1 / (k + index + 1);
    const textWeight = 1 - semanticWeight;

    const existing = resultMap.get(result.id);
    if (existing) {
      // Combinar scores
      existing.textScore = result.relevance;
      existing.combinedScore += rrfScore * textWeight;
    } else {
      // Nuevo resultado
      resultMap.set(result.id, {
        id: result.id,
        content: result.content,
        chunk_type: result.chunk_type,
        source_context: result.source_context,
        metadata: result.metadata as Record<string, unknown>,
        semanticScore: 0,
        textScore: result.relevance,
        combinedScore: rrfScore * textWeight,
      });
    }
  });

  // Ordenar por score combinado
  return Array.from(resultMap.values()).sort(
    (a, b) => b.combinedScore - a.combinedScore
  );
}

/**
 * Convierte resultados semánticos a formato scored
 */
function convertSemanticResults(results: ChunkSearchResult[]): ScoredResult[] {
  return results.map((result) => ({
    id: result.id,
    content: result.content,
    chunk_type: result.chunk_type,
    source_context: result.source_context,
    metadata: result.metadata as Record<string, unknown>,
    semanticScore: result.similarity,
    textScore: 0,
    combinedScore: result.similarity,
  }));
}

/**
 * Convierte resultados de texto a formato scored
 */
function convertTextResults(results: ChunkTextSearchResult[]): ScoredResult[] {
  return results.map((result) => ({
    id: result.id,
    content: result.content,
    chunk_type: result.chunk_type,
    source_context: result.source_context,
    metadata: result.metadata as Record<string, unknown>,
    semanticScore: 0,
    textScore: result.relevance,
    combinedScore: result.relevance,
  }));
}

// ============================================
// Result Enrichment
// ============================================

/**
 * Enriquece resultados con snippets y metadata formateada
 */
function enrichResults(
  results: ScoredResult[],
  keywords: string[],
  limit: number
): RAGSearchResult[] {
  return results.slice(0, limit).map((result) => {
    // Generar snippet
    const snippet = generateSnippet(
      result.content,
      keywords,
      RAG_DEFAULTS.MAX_SNIPPET_LENGTH
    );

    // Encontrar keywords que coinciden
    const matchedKeywords = keywords.filter((kw) =>
      result.content.toLowerCase().includes(kw.toLowerCase())
    );

    // Extraer info de fuente
    const source = {
      type: result.chunk_type,
      context: result.source_context,
      filename: result.metadata.filename as string | undefined,
      page: result.metadata.page as number | undefined,
      sheet: result.metadata.sheetName as string | undefined,
    };

    return {
      id: result.id,
      content: result.content,
      chunk_type: result.chunk_type,
      source_context: result.source_context,
      metadata: result.metadata as KnowledgeChunkMetadata,
      similarity: result.semanticScore,
      score: result.combinedScore,
      snippet,
      matchedKeywords,
      source,
    };
  });
}

// ============================================
// Quick Search (for autocomplete/suggestions)
// ============================================

/**
 * Búsqueda rápida para autocompletado (solo top 5)
 */
export async function quickSearch(
  businessId: string,
  query: string
): Promise<{ id: string; snippet: string; type: string }[]> {
  if (query.length < 2) return [];

  try {
    const results = await ragSearch({
      businessId,
      query,
      limit: 5,
      threshold: 0.5,
      hybridSearch: false,
      analyzeQuery: false,
    });

    return results.results.map((r) => ({
      id: r.id,
      snippet: r.snippet,
      type: CHUNK_TYPE_DISPLAY[r.chunk_type],
    }));
  } catch {
    return [];
  }
}

// ============================================
// Search with Re-ranking
// ============================================

/**
 * Búsqueda con re-ranking basado en análisis de query
 * Prioriza resultados que coinciden con la categoría detectada
 */
export async function searchWithReranking(
  options: RAGSearchOptions
): Promise<RAGSearchResponse> {
  const response = await ragSearch({
    ...options,
    limit: (options.limit ?? RAG_DEFAULTS.MAX_RESULTS) * 2,
    analyzeQuery: true,
  });

  if (!response.queryAnalysis) {
    return response;
  }

  const { category, intent } = response.queryAnalysis;

  // Re-rankear basado en categoría
  const rerankedResults = response.results.map((result) => {
    let boost = 0;

    // Boost por categoría
    const content = result.content.toLowerCase();
    const categoryKeywords = getCategoryKeywords(category);
    const matchCount = categoryKeywords.filter((kw) =>
      content.includes(kw)
    ).length;
    boost += matchCount * 0.05;

    // Boost por tipo de chunk según intent
    if (intent === "analytical" && result.chunk_type === "spreadsheet") {
      boost += 0.1;
    }
    if (
      intent === "procedural" &&
      (result.chunk_type === "document" || result.chunk_type === "manual_note")
    ) {
      boost += 0.1;
    }

    return {
      ...result,
      score: result.score + boost,
    };
  });

  // Re-ordenar
  rerankedResults.sort((a, b) => b.score - a.score);

  return {
    ...response,
    results: rerankedResults.slice(0, options.limit ?? RAG_DEFAULTS.MAX_RESULTS),
  };
}

// Helper para obtener keywords de categoría
function getCategoryKeywords(category: string): string[] {
  const keywords: Record<string, string[]> = {
    ventas: ["venta", "vendido", "factura", "ingreso", "cliente"],
    inventario: ["producto", "stock", "cantidad", "existencia"],
    finanzas: ["gasto", "costo", "pago", "dinero", "cuenta"],
    menu: ["platillo", "comida", "bebida", "precio"],
  };
  return keywords[category] ?? [];
}
