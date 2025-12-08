// ============================================
// Knowledge Service - Funciones para búsqueda semántica
// ============================================

import { createClient } from "@/lib/supabase/client";
import type {
  KnowledgeChunk,
  KnowledgeChunkInsert,
  ChunkType,
  KnowledgeChunkMetadata,
} from "@/types/database";

// Re-export types for convenience
export type { KnowledgeChunk, ChunkType, KnowledgeChunkMetadata };

// ============================================
// Search Types
// ============================================

export interface SemanticSearchParams {
  query_embedding: number[];
  match_threshold?: number;
  match_count?: number;
  filter_business_id: string;
  filter_chunk_types?: ChunkType[];
}

export interface SemanticSearchResult {
  id: string;
  content: string;
  chunk_type: ChunkType;
  source_context: string | null;
  metadata: KnowledgeChunkMetadata;
  similarity: number;
}

export interface SimpleSearchParams {
  search_query: string;
  target_business_id?: string;
  result_limit?: number;
}

export interface SimpleSearchResult {
  id: string;
  content: string;
  chunk_type: ChunkType;
  source_context: string | null;
  metadata: KnowledgeChunkMetadata;
  relevance: number;
}

export interface KnowledgeStats {
  total_chunks: number;
  total_tokens: number;
  chunks_by_type: Record<ChunkType, number>;
  last_chunk_at: string | null;
  has_embeddings: boolean;
}

// Input type for creating chunks
export type CreateKnowledgeChunkInput = Omit<KnowledgeChunkInsert, "id" | "created_at" | "updated_at">;

// ============================================
// CRUD Operations
// ============================================

/**
 * Crear un nuevo chunk de conocimiento
 * Note: This uses type assertion because knowledge_chunks table
 * will only exist after running the 003_pgvector_knowledge.sql migration
 */
export async function createKnowledgeChunk(
  input: CreateKnowledgeChunkInput
): Promise<{ data: KnowledgeChunk | null; error: Error | null }> {
  const supabase = createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("knowledge_chunks")
    .insert({
      business_id: input.business_id,
      upload_id: input.upload_id || null,
      content: input.content,
      embedding: input.embedding || null,
      chunk_type: input.chunk_type || "document",
      source_context: input.source_context || null,
      metadata: input.metadata || {},
      tokens_count: input.tokens_count || 0,
    })
    .select()
    .single();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  return { data: data as KnowledgeChunk, error: null };
}

/**
 * Crear múltiples chunks de conocimiento (batch insert)
 */
export async function createKnowledgeChunks(
  inputs: CreateKnowledgeChunkInput[]
): Promise<{ data: KnowledgeChunk[] | null; error: Error | null }> {
  const supabase = createClient();

  const records = inputs.map((input) => ({
    business_id: input.business_id,
    upload_id: input.upload_id || null,
    content: input.content,
    embedding: input.embedding || null,
    chunk_type: input.chunk_type || "document",
    source_context: input.source_context || null,
    metadata: input.metadata || {},
    tokens_count: input.tokens_count || 0,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("knowledge_chunks")
    .insert(records)
    .select();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  return { data: data as KnowledgeChunk[], error: null };
}

/**
 * Obtener chunks de un archivo específico
 */
export async function getChunksByUploadId(
  uploadId: string
): Promise<{ data: KnowledgeChunk[] | null; error: Error | null }> {
  const supabase = createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("knowledge_chunks")
    .select("*")
    .eq("upload_id", uploadId)
    .order("created_at", { ascending: true });

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  return { data: data as KnowledgeChunk[], error: null };
}

/**
 * Eliminar chunks de un archivo (cuando se elimina el archivo)
 */
export async function deleteChunksByUploadId(
  uploadId: string
): Promise<{ error: Error | null }> {
  const supabase = createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("knowledge_chunks")
    .delete()
    .eq("upload_id", uploadId);

  if (error) {
    return { error: new Error(error.message) };
  }

  return { error: null };
}

// ============================================
// Search Operations
// ============================================

/**
 * Búsqueda semántica usando embeddings
 * Requiere que tengas el embedding de la query
 */
export async function semanticSearch(
  params: SemanticSearchParams
): Promise<{ data: SemanticSearchResult[] | null; error: Error | null }> {
  const supabase = createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc("match_knowledge", {
    query_embedding: params.query_embedding,
    match_threshold: params.match_threshold ?? 0.7,
    match_count: params.match_count ?? 10,
    filter_business_id: params.filter_business_id,
    filter_chunk_types: params.filter_chunk_types ?? null,
  });

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  return { data: data as SemanticSearchResult[], error: null };
}

/**
 * Búsqueda simple por texto (full-text search)
 * No requiere embeddings
 */
export async function simpleSearch(
  params: SimpleSearchParams
): Promise<{ data: SimpleSearchResult[] | null; error: Error | null }> {
  const supabase = createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc("search_knowledge_simple", {
    search_query: params.search_query,
    target_business_id: params.target_business_id ?? null,
    result_limit: params.result_limit ?? 20,
  });

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  return { data: data as SimpleSearchResult[], error: null };
}

// ============================================
// Stats Operations
// ============================================

/**
 * Obtener estadísticas de conocimiento del negocio
 */
export async function getKnowledgeStats(
  businessId?: string
): Promise<{ data: KnowledgeStats | null; error: Error | null }> {
  const supabase = createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc("get_business_knowledge_stats", {
    target_business_id: businessId ?? null,
  });

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  // La función retorna un array con un solo elemento
  const stats = Array.isArray(data) ? data[0] : data;

  return { data: stats as KnowledgeStats, error: null };
}

// ============================================
// Utility Functions
// ============================================

/**
 * Obtener chunks recientes del negocio
 */
export async function getRecentChunks(
  limit: number = 10,
  chunkTypes?: ChunkType[]
): Promise<{ data: KnowledgeChunk[] | null; error: Error | null }> {
  const supabase = createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from("knowledge_chunks")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (chunkTypes && chunkTypes.length > 0) {
    query = query.in("chunk_type", chunkTypes);
  }

  const { data, error } = await query;

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  return { data: data as KnowledgeChunk[], error: null };
}

/**
 * Actualizar embedding de un chunk existente
 */
export async function updateChunkEmbedding(
  chunkId: string,
  embedding: number[]
): Promise<{ error: Error | null }> {
  const supabase = createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("knowledge_chunks")
    .update({ embedding })
    .eq("id", chunkId);

  if (error) {
    return { error: new Error(error.message) };
  }

  return { error: null };
}

/**
 * Contar tokens en un texto (aproximación simple)
 * Para uso real, usar tiktoken o similar
 */
export function estimateTokenCount(text: string): number {
  // Aproximación: ~4 caracteres por token en español
  return Math.ceil(text.length / 4);
}

/**
 * Dividir texto largo en chunks más pequeños
 */
export function splitTextIntoChunks(
  text: string,
  maxTokens: number = 500,
  overlap: number = 50
): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/(?<=[.!?])\s+/);

  let currentChunk = "";
  let currentTokens = 0;

  for (const sentence of sentences) {
    const sentenceTokens = estimateTokenCount(sentence);

    if (currentTokens + sentenceTokens > maxTokens && currentChunk) {
      chunks.push(currentChunk.trim());

      // Overlap: mantener últimas palabras
      const words = currentChunk.split(" ");
      const overlapWords = words.slice(-Math.ceil(overlap / 4));
      currentChunk = overlapWords.join(" ") + " " + sentence;
      currentTokens = estimateTokenCount(currentChunk);
    } else {
      currentChunk += " " + sentence;
      currentTokens += sentenceTokens;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}
