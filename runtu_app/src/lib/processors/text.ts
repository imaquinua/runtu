// ============================================
// Text Processor (Plain text files)
// ============================================

import {
  processContentForEmbedding,
  type ProcessedChunk,
} from "@/lib/embeddings";
import {
  downloadFile,
  saveChunks,
  updateUploadStatus,
  cleanExtractedText,
  measureTime,
} from "./utils";
import {
  ProcessingError,
  ProcessingErrorCodes,
  logProcessor,
  logProcessorError,
  type ProcessorParams,
  type ProcessingResult,
  type ChunkData,
} from "./types";

const PROCESSOR_NAME = "Text";

// ============================================
// Main Processor
// ============================================

/**
 * Procesa un archivo de texto plano:
 * 1. Descarga de Storage
 * 2. Extrae y limpia texto
 * 3. Divide en chunks
 * 4. Genera embeddings
 * 5. Guarda en knowledge_chunks
 */
export async function processText(params: ProcessorParams): Promise<ProcessingResult> {
  const { uploadId, businessId, filePath } = params;
  const startTime = Date.now();

  logProcessor(PROCESSOR_NAME, uploadId, "Iniciando procesamiento de texto", { filePath });

  try {
    // Update status to processing
    await updateUploadStatus(uploadId, "processing");

    // 1. Download file from Storage
    logProcessor(PROCESSOR_NAME, uploadId, "Descargando archivo...");
    const { result: buffer, timeMs: downloadTime } = await measureTime(() =>
      downloadFile(filePath, uploadId)
    );
    logProcessor(PROCESSOR_NAME, uploadId, `Archivo descargado en ${downloadTime}ms`);

    // 2. Convert to string and clean
    const rawText = buffer.toString("utf-8");
    const cleanedText = cleanExtractedText(rawText);

    logProcessor(PROCESSOR_NAME, uploadId, `Texto extraído: ${cleanedText.length} caracteres`);

    if (!cleanedText || cleanedText.length < 10) {
      throw new ProcessingError(
        "El archivo no contiene texto procesable",
        ProcessingErrorCodes.INVALID_CONTENT,
        uploadId,
        false
      );
    }

    // 3. Process content and generate embeddings
    const filename = filePath.split("/").pop() ?? "documento.txt";

    logProcessor(PROCESSOR_NAME, uploadId, "Generando chunks y embeddings...");
    const { result: processedResult, timeMs: processTime } = await measureTime(() =>
      processContentForEmbedding({
        content: cleanedText,
        contentType: "text",
        sourceContext: `Texto: ${filename}`,
        metadata: {
          filename,
          fileType: "text",
          originalLength: rawText.length,
        },
      })
    );

    logProcessor(
      PROCESSOR_NAME,
      uploadId,
      `Generados ${processedResult.chunks.length} chunks en ${processTime}ms`
    );

    // 4. Convert and save chunks
    const chunks = convertToChunkData(processedResult.chunks);

    logProcessor(PROCESSOR_NAME, uploadId, "Guardando chunks...");
    const { result: savedCount, timeMs: saveTime } = await measureTime(() =>
      saveChunks(chunks, businessId, uploadId)
    );
    logProcessor(PROCESSOR_NAME, uploadId, `Guardados ${savedCount} chunks en ${saveTime}ms`);

    // 5. Update upload status
    await updateUploadStatus(uploadId, "completed", {
      processingResult: {
        chunksCreated: savedCount,
        totalTokens: processedResult.totalTokens,
        extractedChars: cleanedText.length,
      },
    });

    const totalTime = Date.now() - startTime;
    logProcessor(PROCESSOR_NAME, uploadId, `Procesamiento completado en ${totalTime}ms`);

    return {
      success: true,
      uploadId,
      chunksCreated: savedCount,
      totalTokens: processedResult.totalTokens,
      processingTimeMs: totalTime,
      details: {
        contentSummary: `${cleanedText.length} caracteres procesados`,
      },
    };
  } catch (error) {
    logProcessorError(PROCESSOR_NAME, uploadId, error);

    await updateUploadStatus(uploadId, "failed", {
      error: error instanceof Error ? error.message : "Error desconocido",
    });

    if (error instanceof ProcessingError) {
      return {
        success: false,
        uploadId,
        chunksCreated: 0,
        totalTokens: 0,
        processingTimeMs: Date.now() - startTime,
        error: error.message,
      };
    }

    return {
      success: false,
      uploadId,
      chunksCreated: 0,
      totalTokens: 0,
      processingTimeMs: Date.now() - startTime,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// ============================================
// Helper Functions
// ============================================

function convertToChunkData(processedChunks: ProcessedChunk[]): ChunkData[] {
  return processedChunks.map((chunk) => ({
    content: chunk.content,
    embedding: chunk.embedding,
    chunkType: "document" as const,
    sourceContext: chunk.sourceContext,
    metadata: chunk.metadata,
    tokensCount: chunk.tokens,
  }));
}
