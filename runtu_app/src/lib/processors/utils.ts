// ============================================
// Processors - Utility Functions
// ============================================

import { createClient } from "@/lib/supabase/server";
import { createChunks } from "@/lib/db";
import type { ChunkInsert, KnowledgeChunkMetadata } from "@/types/database";
import {
  ProcessingError,
  ProcessingErrorCodes,
  logProcessor,
  type ChunkData,
} from "./types";

// ============================================
// File Download from Supabase Storage
// ============================================

/**
 * Descarga un archivo de Supabase Storage y retorna su contenido como Buffer.
 */
export async function downloadFile(
  filePath: string,
  uploadId: string
): Promise<Buffer> {
  logProcessor("Utils", uploadId, `Descargando archivo: ${filePath}`);

  const supabase = await createClient();

  const { data, error } = await supabase.storage
    .from("uploads")
    .download(filePath);

  if (error || !data) {
    throw new ProcessingError(
      `Error descargando archivo: ${error?.message ?? "Archivo no encontrado"}`,
      ProcessingErrorCodes.DOWNLOAD_FAILED,
      uploadId,
      true,
      error
    );
  }

  // Convert Blob to Buffer
  const arrayBuffer = await data.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  logProcessor("Utils", uploadId, `Archivo descargado: ${buffer.length} bytes`);

  return buffer;
}

/**
 * Descarga un archivo y retorna su contenido como base64.
 */
export async function downloadFileAsBase64(
  filePath: string,
  uploadId: string
): Promise<string> {
  const buffer = await downloadFile(filePath, uploadId);
  return buffer.toString("base64");
}

/**
 * Obtiene la URL pública de un archivo en Storage.
 */
export async function getPublicUrl(filePath: string): Promise<string> {
  const supabase = await createClient();

  const { data } = supabase.storage.from("uploads").getPublicUrl(filePath);

  return data.publicUrl;
}

// ============================================
// Chunk Saving
// ============================================

/**
 * Guarda múltiples chunks en la base de datos.
 */
export async function saveChunks(
  chunks: ChunkData[],
  businessId: string,
  uploadId: string
): Promise<number> {
  if (chunks.length === 0) {
    logProcessor("Utils", uploadId, "No hay chunks para guardar");
    return 0;
  }

  logProcessor("Utils", uploadId, `Guardando ${chunks.length} chunks`);

  const chunkInserts: ChunkInsert[] = chunks.map((chunk) => ({
    business_id: businessId,
    upload_id: uploadId,
    content: chunk.content,
    embedding: chunk.embedding,
    chunk_type: chunk.chunkType,
    source_context: chunk.sourceContext,
    metadata: (chunk.metadata ?? {}) as KnowledgeChunkMetadata,
    tokens_count: chunk.tokensCount,
  }));

  try {
    const created = await createChunks(chunkInserts);
    logProcessor("Utils", uploadId, `Guardados ${created.length} chunks exitosamente`);
    return created.length;
  } catch (error) {
    throw new ProcessingError(
      `Error guardando chunks: ${error instanceof Error ? error.message : "Error desconocido"}`,
      ProcessingErrorCodes.SAVE_FAILED,
      uploadId,
      true,
      error
    );
  }
}

// ============================================
// Upload Status Update
// ============================================

/**
 * Actualiza el estado de procesamiento de un upload.
 */
export async function updateUploadStatus(
  uploadId: string,
  status: "pending" | "processing" | "completed" | "failed",
  metadata?: Record<string, unknown>
): Promise<void> {
  logProcessor("Utils", uploadId, `Actualizando estado a: ${status}`);

  const supabase = await createClient();

  const updateData: Record<string, unknown> = {
    processing_status: status,
    processed: status === "completed",
    updated_at: new Date().toISOString(),
  };

  if (metadata) {
    // Merge with existing metadata
    const { data: current } = await supabase
      .from("uploads")
      .select("metadata")
      .eq("id", uploadId)
      .single();

    updateData.metadata = {
      ...(current?.metadata ?? {}),
      ...metadata,
    };
  }

  const { error } = await supabase
    .from("uploads")
    .update(updateData)
    .eq("id", uploadId);

  if (error) {
    logProcessor("Utils", uploadId, `Error actualizando estado: ${error.message}`);
    // Don't throw - this is not critical
  }
}

/**
 * Obtiene información de un upload.
 */
export async function getUploadInfo(uploadId: string): Promise<{
  id: string;
  business_id: string;
  filename: string;
  file_type: string;
  storage_path: string;
  file_size: number | null;
  processed: boolean;
  processing_status: string;
} | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("uploads")
    .select("*")
    .eq("id", uploadId)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

// ============================================
// Text Utilities
// ============================================

/**
 * Limpia texto extraído de documentos.
 */
export function cleanExtractedText(text: string): string {
  return text
    // Remove excessive whitespace
    .replace(/\s+/g, " ")
    // Remove control characters
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    // Normalize line breaks
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    // Remove excessive newlines
    .replace(/\n{3,}/g, "\n\n")
    // Trim
    .trim();
}

/**
 * Trunca texto a un máximo de caracteres.
 */
export function truncateText(text: string, maxChars: number): string {
  if (text.length <= maxChars) {
    return text;
  }
  return text.slice(0, maxChars - 3) + "...";
}

// ============================================
// Timing Utilities
// ============================================

/**
 * Mide el tiempo de ejecución de una función async.
 */
export async function measureTime<T>(
  fn: () => Promise<T>
): Promise<{ result: T; timeMs: number }> {
  const start = Date.now();
  const result = await fn();
  const timeMs = Date.now() - start;
  return { result, timeMs };
}

// ============================================
// Retry Logic
// ============================================

/**
 * Ejecuta una función con reintentos.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    delayMs?: number;
    backoff?: boolean;
    onRetry?: (attempt: number, error: Error) => void;
  } = {}
): Promise<T> {
  const { maxRetries = 3, delayMs = 1000, backoff = true, onRetry } = options;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries) {
        onRetry?.(attempt, lastError);
        const delay = backoff ? delayMs * Math.pow(2, attempt - 1) : delayMs;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}
