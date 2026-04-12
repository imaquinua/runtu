// ============================================
// PDF Processor
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

const PROCESSOR_NAME = "PDF";

// ============================================
// Main Processor
// ============================================

/**
 * Procesa un archivo PDF:
 * 1. Descarga de Storage
 * 2. Extrae texto
 * 3. Divide en chunks preservando estructura
 * 4. Genera embeddings
 * 5. Guarda en knowledge_chunks
 */
export async function processPDF(params: ProcessorParams): Promise<ProcessingResult> {
  const { uploadId, businessId, filePath } = params;
  const startTime = Date.now();

  logProcessor(PROCESSOR_NAME, uploadId, "Iniciando procesamiento de PDF", { filePath });

  try {
    // Update status to processing
    await updateUploadStatus(uploadId, "processing");

    // 1. Download PDF from Storage
    logProcessor(PROCESSOR_NAME, uploadId, "Descargando PDF...");
    const { result: buffer, timeMs: downloadTime } = await measureTime(() =>
      downloadFile(filePath, uploadId)
    );
    logProcessor(PROCESSOR_NAME, uploadId, `PDF descargado en ${downloadTime}ms`);

    // 2. Extract text from PDF
    logProcessor(PROCESSOR_NAME, uploadId, "Extrayendo texto...");
    const { result: pdfData, timeMs: extractTime } = await measureTime(() =>
      extractPDFText(buffer, uploadId)
    );
    logProcessor(
      PROCESSOR_NAME,
      uploadId,
      `Texto extraído en ${extractTime}ms: ${pdfData.text.length} caracteres, ${pdfData.numPages} páginas`
    );

    // Check if we got any meaningful content
    if (!pdfData.text || pdfData.text.trim().length < 10) {
      throw new ProcessingError(
        "El PDF no contiene texto extraíble. Puede ser un documento escaneado.",
        ProcessingErrorCodes.INVALID_CONTENT,
        uploadId,
        false
      );
    }

    // 3. Clean extracted text
    const cleanedText = cleanExtractedText(pdfData.text);
    logProcessor(PROCESSOR_NAME, uploadId, `Texto limpiado: ${cleanedText.length} caracteres`);

    // 4. Process content and generate embeddings
    logProcessor(PROCESSOR_NAME, uploadId, "Generando chunks y embeddings...");
    const filename = filePath.split("/").pop() ?? "documento.pdf";

    const { result: processedResult, timeMs: processTime } = await measureTime(() =>
      processContentForEmbedding({
        content: cleanedText,
        contentType: "text",
        sourceContext: `PDF: ${filename}`,
        metadata: {
          filename,
          pageCount: pdfData.numPages,
          fileType: "pdf",
        },
      })
    );

    logProcessor(
      PROCESSOR_NAME,
      uploadId,
      `Generados ${processedResult.chunks.length} chunks en ${processTime}ms`
    );

    // 5. Convert to ChunkData and save
    const chunks = convertToChunkData(processedResult.chunks, pdfData.numPages);

    logProcessor(PROCESSOR_NAME, uploadId, "Guardando chunks en BD...");
    const { result: savedCount, timeMs: saveTime } = await measureTime(() =>
      saveChunks(chunks, businessId, uploadId)
    );
    logProcessor(PROCESSOR_NAME, uploadId, `Guardados ${savedCount} chunks en ${saveTime}ms`);

    // 6. Update upload status
    await updateUploadStatus(uploadId, "completed", {
      processingResult: {
        chunksCreated: savedCount,
        totalTokens: processedResult.totalTokens,
        pageCount: pdfData.numPages,
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
        pageCount: pdfData.numPages,
        contentSummary: `${cleanedText.length} caracteres extraídos de ${pdfData.numPages} páginas`,
      },
    };
  } catch (error) {
    logProcessorError(PROCESSOR_NAME, uploadId, error);

    // Update status to failed
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
      error: error instanceof Error ? error.message : "Error desconocido al procesar PDF",
    };
  }
}

// ============================================
// Helper Functions
// ============================================

interface PDFExtractResult {
  text: string;
  numPages: number;
  info: Record<string, unknown>;
}

/**
 * Extrae texto de un buffer de PDF.
 * Usa dynamic import para evitar problemas con el build.
 */
async function extractPDFText(buffer: Buffer, uploadId: string): Promise<PDFExtractResult> {
  try {
    // Dynamic import to avoid build-time issues with pdf-parse
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfModule = await import("pdf-parse") as any;
    const pdfParse = pdfModule.default || pdfModule;
    const data = await pdfParse(buffer);

    return {
      text: data.text,
      numPages: data.numpages,
      info: data.info ?? {},
    };
  } catch (error) {
    throw new ProcessingError(
      `Error extrayendo texto del PDF: ${error instanceof Error ? error.message : "Error desconocido"}`,
      ProcessingErrorCodes.EXTRACTION_FAILED,
      uploadId,
      false,
      error
    );
  }
}

/**
 * Convierte ProcessedChunks a ChunkData para guardar.
 */
function convertToChunkData(
  processedChunks: ProcessedChunk[],
  pageCount: number
): ChunkData[] {
  return processedChunks.map((chunk) => ({
    content: chunk.content,
    embedding: chunk.embedding,
    chunkType: "document" as const,
    sourceContext: chunk.sourceContext,
    metadata: {
      ...chunk.metadata,
      pageCount,
    },
    tokensCount: chunk.tokens,
  }));
}
