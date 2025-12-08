// ============================================
// Knowledge Chunks - Data Access Layer
// ============================================
// Funciones tipadas para acceso a knowledge_chunks
// con validaciones y manejo de errores

import { createClient } from "@/lib/supabase/server";
import type {
  KnowledgeChunk,
  ChunkInsert,
  ChunkSearchResult,
  ChunkTextSearchResult,
  BusinessKnowledgeStats,
  ChunkListOptions,
  SemanticSearchOptions,
  TextSearchOptions,
  ChunkType,
} from "@/types/database";

// ============================================
// Constants
// ============================================

const MAX_CONTENT_LENGTH = 10000; // 10K caracteres máximo por chunk
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

// ============================================
// Error Types
// ============================================

export class KnowledgeError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "KnowledgeError";
  }
}

// ============================================
// Validation Helpers
// ============================================

function sanitizeContent(content: string): string {
  return content
    .trim()
    .replace(/\x00/g, "") // Remove null bytes
    .slice(0, MAX_CONTENT_LENGTH);
}

function validateChunkInsert(data: ChunkInsert): void {
  if (!data.business_id) {
    throw new KnowledgeError("business_id es requerido", "INVALID_BUSINESS_ID");
  }

  if (!data.content || data.content.trim().length === 0) {
    throw new KnowledgeError("content no puede estar vacío", "INVALID_CONTENT");
  }

  if (!data.embedding || data.embedding.length !== 768) {
    throw new KnowledgeError(
      "embedding debe ser un array de 768 dimensiones",
      "INVALID_EMBEDDING"
    );
  }

  if (!data.chunk_type) {
    throw new KnowledgeError("chunk_type es requerido", "INVALID_CHUNK_TYPE");
  }

  if (data.tokens_count < 0) {
    throw new KnowledgeError("tokens_count no puede ser negativo", "INVALID_TOKENS");
  }
}

// ============================================
// CRUD Operations
// ============================================

/**
 * Crea un nuevo chunk de conocimiento
 */
export async function createChunk(data: ChunkInsert): Promise<KnowledgeChunk> {
  validateChunkInsert(data);

  const supabase = await createClient();

  // Verificar que el business existe y pertenece al usuario
  const { data: business, error: bizError } = await supabase
    .from("businesses")
    .select("id")
    .eq("id", data.business_id)
    .single();

  if (bizError || !business) {
    throw new KnowledgeError(
      "No tienes acceso a este negocio",
      "BUSINESS_NOT_FOUND",
      bizError
    );
  }

  // Verificar que el upload (si se provee) pertenece al business
  if (data.upload_id) {
    const { data: upload, error: uploadError } = await supabase
      .from("uploads")
      .select("id, business_id")
      .eq("id", data.upload_id)
      .single();

    if (uploadError || !upload) {
      throw new KnowledgeError(
        "Upload no encontrado",
        "UPLOAD_NOT_FOUND",
        uploadError
      );
    }

    if (upload.business_id !== data.business_id) {
      throw new KnowledgeError(
        "El upload no pertenece a este negocio",
        "UPLOAD_MISMATCH"
      );
    }
  }

  // Insertar el chunk
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: chunk, error } = await (supabase as any)
    .from("knowledge_chunks")
    .insert({
      business_id: data.business_id,
      upload_id: data.upload_id || null,
      content: sanitizeContent(data.content),
      embedding: data.embedding,
      chunk_type: data.chunk_type,
      source_context: data.source_context || null,
      metadata: data.metadata || {},
      tokens_count: data.tokens_count,
    })
    .select()
    .single();

  if (error) {
    throw new KnowledgeError(
      "Error al crear chunk",
      "INSERT_ERROR",
      error
    );
  }

  return chunk as KnowledgeChunk;
}

/**
 * Crea múltiples chunks de conocimiento en batch
 * Más eficiente que llamadas individuales
 */
export async function createChunks(data: ChunkInsert[]): Promise<KnowledgeChunk[]> {
  if (data.length === 0) {
    return [];
  }

  // Validar todos los chunks
  data.forEach((chunk, index) => {
    try {
      validateChunkInsert(chunk);
    } catch (error) {
      if (error instanceof KnowledgeError) {
        throw new KnowledgeError(
          `Error en chunk ${index}: ${error.message}`,
          error.code,
          error.details
        );
      }
      throw error;
    }
  });

  const supabase = await createClient();

  // Verificar que todos pertenecen al mismo business
  const businessIds = [...new Set(data.map((d) => d.business_id))];
  if (businessIds.length > 1) {
    throw new KnowledgeError(
      "Todos los chunks deben pertenecer al mismo negocio",
      "MULTIPLE_BUSINESSES"
    );
  }

  const businessId = businessIds[0];

  // Verificar acceso al business
  const { data: business, error: bizError } = await supabase
    .from("businesses")
    .select("id")
    .eq("id", businessId)
    .single();

  if (bizError || !business) {
    throw new KnowledgeError(
      "No tienes acceso a este negocio",
      "BUSINESS_NOT_FOUND",
      bizError
    );
  }

  // Preparar records para inserción
  const records = data.map((d) => ({
    business_id: d.business_id,
    upload_id: d.upload_id || null,
    content: sanitizeContent(d.content),
    embedding: d.embedding,
    chunk_type: d.chunk_type,
    source_context: d.source_context || null,
    metadata: d.metadata || {},
    tokens_count: d.tokens_count,
  }));

  // Insertar en batch
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: chunks, error } = await (supabase as any)
    .from("knowledge_chunks")
    .insert(records)
    .select();

  if (error) {
    throw new KnowledgeError(
      "Error al crear chunks en batch",
      "BATCH_INSERT_ERROR",
      error
    );
  }

  return chunks as KnowledgeChunk[];
}

/**
 * Obtiene todos los chunks de un upload específico
 */
export async function getChunksByUpload(uploadId: string): Promise<KnowledgeChunk[]> {
  if (!uploadId) {
    throw new KnowledgeError("uploadId es requerido", "INVALID_UPLOAD_ID");
  }

  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: chunks, error } = await (supabase as any)
    .from("knowledge_chunks")
    .select("*")
    .eq("upload_id", uploadId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new KnowledgeError(
      "Error al obtener chunks del upload",
      "FETCH_ERROR",
      error
    );
  }

  return chunks as KnowledgeChunk[];
}

/**
 * Obtiene chunks de un negocio con opciones de paginación y filtrado
 */
export async function getChunksByBusiness(
  businessId: string,
  options: ChunkListOptions = {}
): Promise<KnowledgeChunk[]> {
  if (!businessId) {
    throw new KnowledgeError("businessId es requerido", "INVALID_BUSINESS_ID");
  }

  const supabase = await createClient();

  const {
    limit = DEFAULT_LIMIT,
    offset = 0,
    chunkTypes,
    uploadId,
    orderBy = "created_at",
    orderDirection = "desc",
  } = options;

  // Limitar máximo de resultados
  const safeLimit = Math.min(limit, MAX_LIMIT);

  // Construir query
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from("knowledge_chunks")
    .select("id, business_id, upload_id, content, chunk_type, source_context, metadata, tokens_count, created_at, updated_at")
    .eq("business_id", businessId);

  // Filtrar por tipos
  if (chunkTypes && chunkTypes.length > 0) {
    query = query.in("chunk_type", chunkTypes);
  }

  // Filtrar por upload
  if (uploadId) {
    query = query.eq("upload_id", uploadId);
  }

  // Ordenamiento
  query = query.order(orderBy, { ascending: orderDirection === "asc" });

  // Paginación
  query = query.range(offset, offset + safeLimit - 1);

  const { data: chunks, error } = await query;

  if (error) {
    throw new KnowledgeError(
      "Error al obtener chunks del negocio",
      "FETCH_ERROR",
      error
    );
  }

  return chunks as KnowledgeChunk[];
}

/**
 * Elimina todos los chunks de un upload
 * Útil cuando se elimina un archivo
 */
export async function deleteChunksByUpload(uploadId: string): Promise<{ deleted: number }> {
  if (!uploadId) {
    throw new KnowledgeError("uploadId es requerido", "INVALID_UPLOAD_ID");
  }

  const supabase = await createClient();

  // Primero contar cuántos hay
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count, error: countError } = await (supabase as any)
    .from("knowledge_chunks")
    .select("*", { count: "exact", head: true })
    .eq("upload_id", uploadId);

  if (countError) {
    throw new KnowledgeError(
      "Error al contar chunks",
      "COUNT_ERROR",
      countError
    );
  }

  // Eliminar
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("knowledge_chunks")
    .delete()
    .eq("upload_id", uploadId);

  if (error) {
    throw new KnowledgeError(
      "Error al eliminar chunks",
      "DELETE_ERROR",
      error
    );
  }

  return { deleted: count || 0 };
}

/**
 * Elimina un chunk específico por ID
 */
export async function deleteChunk(chunkId: string): Promise<void> {
  if (!chunkId) {
    throw new KnowledgeError("chunkId es requerido", "INVALID_CHUNK_ID");
  }

  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("knowledge_chunks")
    .delete()
    .eq("id", chunkId);

  if (error) {
    throw new KnowledgeError(
      "Error al eliminar chunk",
      "DELETE_ERROR",
      error
    );
  }
}

// ============================================
// Statistics
// ============================================

/**
 * Obtiene estadísticas del conocimiento de un negocio
 */
export async function getBusinessStats(
  businessId: string
): Promise<BusinessKnowledgeStats> {
  if (!businessId) {
    throw new KnowledgeError("businessId es requerido", "INVALID_BUSINESS_ID");
  }

  const supabase = await createClient();

  // Llamar a la función SQL
  const { data, error } = await supabase.rpc("get_business_knowledge_stats", {
    target_business_id: businessId,
  });

  if (error) {
    throw new KnowledgeError(
      "Error al obtener estadísticas",
      "STATS_ERROR",
      error
    );
  }

  // La función retorna un array
  const stats = Array.isArray(data) ? data[0] : data;

  if (!stats) {
    // Retornar estadísticas vacías si no hay datos
    return {
      total_chunks: 0,
      total_tokens: 0,
      chunks_by_type: {},
      last_chunk_at: null,
      has_embeddings: false,
    };
  }

  return {
    total_chunks: stats.total_chunks || 0,
    total_tokens: stats.total_tokens || 0,
    chunks_by_type: stats.chunks_by_type || {},
    last_chunk_at: stats.last_chunk_at,
    has_embeddings: stats.has_embeddings || false,
  };
}

// ============================================
// Search Operations
// ============================================

/**
 * Búsqueda semántica usando embeddings
 * Llama a la función SQL match_knowledge
 */
export async function searchKnowledge(
  options: SemanticSearchOptions
): Promise<ChunkSearchResult[]> {
  const {
    businessId,
    queryEmbedding,
    threshold = 0.7,
    limit = 10,
    chunkTypes,
  } = options;

  if (!businessId) {
    throw new KnowledgeError("businessId es requerido", "INVALID_BUSINESS_ID");
  }

  if (!queryEmbedding || queryEmbedding.length !== 768) {
    throw new KnowledgeError(
      "queryEmbedding debe ser un array de 768 dimensiones",
      "INVALID_EMBEDDING"
    );
  }

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("match_knowledge", {
    query_embedding: queryEmbedding,
    match_threshold: threshold,
    match_count: Math.min(limit, MAX_LIMIT),
    filter_business_id: businessId,
    filter_chunk_types: chunkTypes || null,
  });

  if (error) {
    throw new KnowledgeError(
      "Error en búsqueda semántica",
      "SEARCH_ERROR",
      error
    );
  }

  return (data || []).map((item: Record<string, unknown>) => ({
    id: item.id as string,
    content: item.content as string,
    chunk_type: item.chunk_type as ChunkType,
    source_context: item.source_context as string | null,
    metadata: item.metadata as KnowledgeChunk["metadata"],
    similarity: item.similarity as number,
  }));
}

/**
 * Búsqueda por texto simple (full-text search)
 * No requiere embeddings
 */
export async function searchKnowledgeSimple(
  options: TextSearchOptions
): Promise<ChunkTextSearchResult[]> {
  const { businessId, query, limit = 20 } = options;

  if (!businessId) {
    throw new KnowledgeError("businessId es requerido", "INVALID_BUSINESS_ID");
  }

  if (!query || query.trim().length === 0) {
    throw new KnowledgeError("query no puede estar vacío", "INVALID_QUERY");
  }

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("search_knowledge_simple", {
    search_query: query.trim(),
    target_business_id: businessId,
    result_limit: Math.min(limit, MAX_LIMIT),
  });

  if (error) {
    throw new KnowledgeError(
      "Error en búsqueda de texto",
      "SEARCH_ERROR",
      error
    );
  }

  return (data || []).map((item: Record<string, unknown>) => ({
    id: item.id as string,
    content: item.content as string,
    chunk_type: item.chunk_type as ChunkType,
    source_context: item.source_context as string | null,
    metadata: item.metadata as KnowledgeChunk["metadata"],
    relevance: item.relevance as number,
  }));
}

// ============================================
// Utility Functions
// ============================================

/**
 * Cuenta chunks de un negocio (rápido, sin cargar datos)
 */
export async function countChunks(
  businessId: string,
  chunkTypes?: ChunkType[]
): Promise<number> {
  if (!businessId) {
    throw new KnowledgeError("businessId es requerido", "INVALID_BUSINESS_ID");
  }

  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from("knowledge_chunks")
    .select("*", { count: "exact", head: true })
    .eq("business_id", businessId);

  if (chunkTypes && chunkTypes.length > 0) {
    query = query.in("chunk_type", chunkTypes);
  }

  const { count, error } = await query;

  if (error) {
    throw new KnowledgeError(
      "Error al contar chunks",
      "COUNT_ERROR",
      error
    );
  }

  return count || 0;
}

/**
 * Verifica si un negocio tiene conocimiento indexado
 */
export async function hasKnowledge(businessId: string): Promise<boolean> {
  const count = await countChunks(businessId);
  return count > 0;
}

/**
 * Obtiene un chunk específico por ID
 */
export async function getChunkById(
  chunkId: string,
  includeEmbedding = false
): Promise<KnowledgeChunk | null> {
  if (!chunkId) {
    throw new KnowledgeError("chunkId es requerido", "INVALID_CHUNK_ID");
  }

  const supabase = await createClient();

  const selectFields = includeEmbedding
    ? "*"
    : "id, business_id, upload_id, content, chunk_type, source_context, metadata, tokens_count, created_at, updated_at";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("knowledge_chunks")
    .select(selectFields)
    .eq("id", chunkId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null; // Not found
    }
    throw new KnowledgeError(
      "Error al obtener chunk",
      "FETCH_ERROR",
      error
    );
  }

  return data as KnowledgeChunk;
}
