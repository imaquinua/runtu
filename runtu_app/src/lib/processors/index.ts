// ============================================
// Processors - Orchestrator
// ============================================

import { processPDF } from "./pdf";
import { processSpreadsheet } from "./spreadsheet";
import { processImage } from "./image";
import { processAudio } from "./audio";
import { processText } from "./text";
import { getUploadInfo, updateUploadStatus } from "./utils";
import {
  ProcessingError,
  ProcessingErrorCodes,
  detectFileType,
  logProcessor,
  logProcessorError,
  type ProcessingResult,
  type SupportedFileType,
} from "./types";

const PROCESSOR_NAME = "Orchestrator";

// ============================================
// Main Orchestrator
// ============================================

/**
 * Procesa un upload detectando automáticamente el tipo de archivo.
 */
export async function processUpload(uploadId: string): Promise<ProcessingResult> {
  const startTime = Date.now();

  logProcessor(PROCESSOR_NAME, uploadId, "Iniciando procesamiento");

  try {
    // 1. Get upload info
    const upload = await getUploadInfo(uploadId);

    if (!upload) {
      throw new ProcessingError(
        "Upload no encontrado",
        ProcessingErrorCodes.FILE_NOT_FOUND,
        uploadId,
        false
      );
    }

    // Check if already processed
    if (upload.processed) {
      logProcessor(PROCESSOR_NAME, uploadId, "Upload ya fue procesado anteriormente");
      return {
        success: true,
        uploadId,
        chunksCreated: 0,
        totalTokens: 0,
        processingTimeMs: Date.now() - startTime,
        error: "El archivo ya fue procesado",
      };
    }

    // Check if already processing
    if (upload.processing_status === "processing") {
      logProcessor(PROCESSOR_NAME, uploadId, "Upload ya está siendo procesado");
      return {
        success: false,
        uploadId,
        chunksCreated: 0,
        totalTokens: 0,
        processingTimeMs: Date.now() - startTime,
        error: "El archivo ya está siendo procesado",
      };
    }

    // 2. Detect file type
    const fileType = detectFileType(upload.file_type, upload.filename);

    if (!fileType) {
      throw new ProcessingError(
        `Tipo de archivo no soportado: ${upload.file_type}`,
        ProcessingErrorCodes.UNSUPPORTED_TYPE,
        uploadId,
        false
      );
    }

    logProcessor(PROCESSOR_NAME, uploadId, `Tipo detectado: ${fileType}`, {
      filename: upload.filename,
      mimeType: upload.file_type,
    });

    // 3. Route to appropriate processor
    const params = {
      uploadId,
      businessId: upload.business_id,
      filePath: upload.storage_path,
    };

    let result: ProcessingResult;

    switch (fileType) {
      case "pdf":
        result = await processPDF(params);
        break;

      case "xlsx":
      case "xls":
      case "csv":
        result = await processSpreadsheet({
          ...params,
          fileType,
        });
        break;

      case "image":
        result = await processImage(params);
        break;

      case "audio":
        result = await processAudio(params);
        break;

      case "text":
        result = await processText(params);
        break;

      case "video":
        // Video processing requires ffmpeg, returning not supported for now
        throw new ProcessingError(
          "El procesamiento de video aún no está disponible",
          ProcessingErrorCodes.UNSUPPORTED_TYPE,
          uploadId,
          false
        );

      default:
        throw new ProcessingError(
          `Tipo de archivo no soportado: ${fileType}`,
          ProcessingErrorCodes.UNSUPPORTED_TYPE,
          uploadId,
          false
        );
    }

    logProcessor(
      PROCESSOR_NAME,
      uploadId,
      `Procesamiento completado: ${result.success ? "exitoso" : "fallido"}`,
      {
        chunksCreated: result.chunksCreated,
        totalTokens: result.totalTokens,
        timeMs: result.processingTimeMs,
      }
    );

    return result;
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
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// ============================================
// Batch Processing
// ============================================

/**
 * Procesa múltiples uploads en secuencia.
 */
export async function processUploads(uploadIds: string[]): Promise<ProcessingResult[]> {
  const results: ProcessingResult[] = [];

  for (const uploadId of uploadIds) {
    try {
      const result = await processUpload(uploadId);
      results.push(result);
    } catch (error) {
      results.push({
        success: false,
        uploadId,
        chunksCreated: 0,
        totalTokens: 0,
        processingTimeMs: 0,
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  return results;
}

// ============================================
// Re-exports
// ============================================

export { processPDF } from "./pdf";
export { processSpreadsheet } from "./spreadsheet";
export { processImage } from "./image";
export { processAudio } from "./audio";
export { processText } from "./text";
export { getUploadInfo, updateUploadStatus } from "./utils";
export {
  ProcessingError,
  ProcessingErrorCodes,
  detectFileType,
  type ProcessingResult,
  type ProcessingProgress,
  type ProcessorParams,
  type SupportedFileType,
} from "./types";
