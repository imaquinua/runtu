// ============================================
// RAG Search Layer - Types
// ============================================

import type { ChunkType, ChunkSearchResult, KnowledgeChunkMetadata } from "@/types/database";

// ============================================
// Query Types
// ============================================

/**
 * Tipo de intención de query detectada
 */
export type QueryIntent =
  | "informational"   // Busca información general
  | "analytical"      // Busca datos/métricas para análisis
  | "procedural"      // Busca cómo hacer algo
  | "comparative"     // Compara opciones
  | "temporal"        // Relacionado con tiempo/fechas
  | "specific"        // Busca dato específico
  | "exploratory";    // Exploración general

/**
 * Categoría de query para optimizar búsqueda
 */
export type QueryCategory =
  | "ventas"          // Relacionado con ventas
  | "inventario"      // Productos, stock
  | "clientes"        // Información de clientes
  | "finanzas"        // Costos, gastos, ingresos
  | "operaciones"     // Procesos del negocio
  | "proveedores"     // Información de proveedores
  | "menu"            // Para restaurantes: menú, platillos
  | "recetas"         // Recetas, ingredientes
  | "empleados"       // Personal, horarios
  | "general";        // Sin categoría específica

// ============================================
// Search Options
// ============================================

export interface RAGSearchOptions {
  /** ID del negocio para filtrar */
  businessId: string;

  /** Query de búsqueda del usuario */
  query: string;

  /** Umbral mínimo de similitud (0-1) */
  threshold?: number;

  /** Máximo de resultados */
  limit?: number;

  /** Tipos de chunk a incluir */
  chunkTypes?: ChunkType[];

  /** Usar búsqueda híbrida (semántica + texto) */
  hybridSearch?: boolean;

  /** Peso para búsqueda semántica en híbrida (0-1) */
  semanticWeight?: number;

  /** Usar cache de embeddings */
  useCache?: boolean;

  /** Incluir análisis de query */
  analyzeQuery?: boolean;
}

// ============================================
// Search Results
// ============================================

export interface RAGSearchResult extends ChunkSearchResult {
  /** Score combinado (semántico + texto si híbrido) */
  score: number;

  /** Snippet relevante del contenido */
  snippet: string;

  /** Palabras clave encontradas */
  matchedKeywords: string[];

  /** Fuente del resultado */
  source: {
    type: ChunkType;
    context: string | null;
    filename?: string;
    page?: number;
    sheet?: string;
  };
}

export interface RAGSearchResponse {
  /** Resultados de búsqueda ordenados por relevancia */
  results: RAGSearchResult[];

  /** Tiempo de búsqueda en ms */
  searchTimeMs: number;

  /** Total de resultados antes de limitar */
  totalMatches: number;

  /** Análisis de la query */
  queryAnalysis?: QueryAnalysis;

  /** Si se usó cache */
  fromCache: boolean;
}

// ============================================
// Query Analysis
// ============================================

export interface QueryAnalysis {
  /** Query original */
  originalQuery: string;

  /** Query normalizada */
  normalizedQuery: string;

  /** Palabras clave extraídas */
  keywords: string[];

  /** Entidades detectadas (nombres, números, fechas) */
  entities: QueryEntity[];

  /** Intención detectada */
  intent: QueryIntent;

  /** Categoría del negocio */
  category: QueryCategory;

  /** Idioma detectado */
  language: "es" | "en" | "other";

  /** Nivel de especificidad (1-5) */
  specificity: number;
}

export interface QueryEntity {
  type: "date" | "number" | "money" | "product" | "person" | "location" | "other";
  value: string;
  normalized?: string;
}

// ============================================
// Context Building
// ============================================

export interface ContextOptions {
  /** Máximo de tokens para el contexto */
  maxTokens?: number;

  /** Incluir metadata de fuentes */
  includeSourceInfo?: boolean;

  /** Agrupar por fuente */
  groupBySource?: boolean;

  /** Formato de salida */
  format?: "plain" | "structured" | "markdown";

  /** Incluir separadores entre chunks */
  includeSeparators?: boolean;

  /** Priorizar chunks más recientes */
  prioritizeRecent?: boolean;
}

export interface BuiltContext {
  /** Contexto formateado para el LLM */
  context: string;

  /** Tokens usados */
  tokensUsed: number;

  /** Número de chunks incluidos */
  chunksIncluded: number;

  /** Fuentes únicas */
  sources: ContextSource[];

  /** Si fue truncado */
  wasTruncated: boolean;
}

export interface ContextSource {
  type: ChunkType;
  context: string | null;
  chunkCount: number;
  filename?: string;
}

// ============================================
// Structured Context
// ============================================

export interface StructuredContext {
  /** Secciones organizadas por tipo */
  sections: ContextSection[];

  /** Resumen de fuentes */
  sourcesSummary: string;

  /** Tokens totales */
  totalTokens: number;
}

export interface ContextSection {
  /** Título de la sección */
  title: string;

  /** Tipo de chunk */
  type: ChunkType;

  /** Contenido de la sección */
  content: string;

  /** Tokens de esta sección */
  tokens: number;

  /** Fuentes de esta sección */
  sources: string[];
}

// ============================================
// Cache Types
// ============================================

export interface CacheEntry {
  embedding: number[];
  createdAt: number;
  hitCount: number;
}

export interface CacheStats {
  size: number;
  maxSize: number;
  hitRate: number;
  totalHits: number;
  totalMisses: number;
}

// ============================================
// Error Types
// ============================================

export class RAGError extends Error {
  constructor(
    message: string,
    public code: RAGErrorCode,
    public details?: unknown
  ) {
    super(message);
    this.name = "RAGError";
  }
}

export type RAGErrorCode =
  | "EMBEDDING_FAILED"
  | "SEARCH_FAILED"
  | "CONTEXT_TOO_LARGE"
  | "NO_RESULTS"
  | "INVALID_QUERY"
  | "BUSINESS_NOT_FOUND"
  | "RATE_LIMITED"
  | "CACHE_ERROR";

// ============================================
// Constants
// ============================================

export const RAG_DEFAULTS = {
  /** Umbral de similitud por defecto */
  SIMILARITY_THRESHOLD: 0.65,

  /** Máximo de resultados por defecto */
  MAX_RESULTS: 10,

  /** Máximo de tokens para contexto */
  MAX_CONTEXT_TOKENS: 4000,

  /** Peso semántico para búsqueda híbrida */
  SEMANTIC_WEIGHT: 0.7,

  /** Tamaño máximo del cache */
  MAX_CACHE_SIZE: 1000,

  /** TTL del cache en ms (15 minutos) */
  CACHE_TTL_MS: 15 * 60 * 1000,

  /** Longitud máxima de snippet */
  MAX_SNIPPET_LENGTH: 200,
} as const;

/** Mapeo de tipos de chunk a etiquetas legibles */
export const CHUNK_TYPE_DISPLAY: Record<ChunkType, string> = {
  document: "Documento",
  spreadsheet: "Hoja de cálculo",
  image_analysis: "Imagen",
  audio_transcript: "Audio",
  video_analysis: "Video",
  manual_note: "Nota",
};
