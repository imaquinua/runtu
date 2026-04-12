// ============================================
// Image Processor (with Gemini Vision)
// ============================================

import { GoogleGenerativeAI } from "@google/generative-ai";
import { generateEmbeddings, countTokens } from "@/lib/embeddings";
import {
  downloadFile,
  saveChunks,
  updateUploadStatus,
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

const PROCESSOR_NAME = "Image";

// Gemini Vision model
const VISION_MODEL = "gemini-1.5-flash";

// Image analysis prompt for business context
const ANALYSIS_PROMPT = `Analiza esta imagen en el contexto de un negocio latinoamericano.

La imagen puede ser:
- Factura o recibo
- Menú de restaurante
- Inventario o lista de productos
- Foto de producto
- Local comercial
- Documento comercial

EXTRAE TODA LA INFORMACIÓN VISIBLE:
1. Todo el texto legible
2. Números, cantidades, precios
3. Fechas
4. Items/productos listados con sus detalles
5. Totales o subtotales
6. Nombres de personas o empresas
7. Direcciones o contactos
8. Cualquier dato relevante para el negocio

Responde en español de forma estructurada y detallada.
Si es un documento financiero, incluye un resumen de montos.
Si es un menú o catálogo, lista todos los items con precios.`;

// ============================================
// Main Processor
// ============================================

/**
 * Procesa una imagen:
 * 1. Descarga de Storage
 * 2. Analiza con Gemini Vision
 * 3. Genera embeddings del análisis
 * 4. Guarda en knowledge_chunks
 */
export async function processImage(params: ProcessorParams): Promise<ProcessingResult> {
  const { uploadId, businessId, filePath } = params;
  const startTime = Date.now();

  logProcessor(PROCESSOR_NAME, uploadId, "Iniciando procesamiento de imagen", { filePath });

  try {
    // Update status to processing
    await updateUploadStatus(uploadId, "processing");

    // 1. Download image from Storage
    logProcessor(PROCESSOR_NAME, uploadId, "Descargando imagen...");
    const { result: buffer, timeMs: downloadTime } = await measureTime(() =>
      downloadFile(filePath, uploadId)
    );
    logProcessor(PROCESSOR_NAME, uploadId, `Imagen descargada en ${downloadTime}ms: ${buffer.length} bytes`);

    // 2. Determine MIME type from file extension
    const mimeType = getMimeType(filePath);

    // 3. Analyze image with Gemini Vision
    logProcessor(PROCESSOR_NAME, uploadId, "Analizando imagen con Gemini Vision...");
    const { result: analysis, timeMs: analysisTime } = await measureTime(() =>
      analyzeImageWithGemini(buffer, mimeType, uploadId)
    );
    logProcessor(
      PROCESSOR_NAME,
      uploadId,
      `Análisis completado en ${analysisTime}ms: ${analysis.length} caracteres`
    );

    if (!analysis || analysis.trim().length < 20) {
      throw new ProcessingError(
        "No se pudo extraer información útil de la imagen",
        ProcessingErrorCodes.INVALID_CONTENT,
        uploadId,
        false
      );
    }

    // 4. Generate embeddings for the analysis
    const filename = filePath.split("/").pop() ?? "imagen";
    logProcessor(PROCESSOR_NAME, uploadId, "Generando embeddings...");

    const result = await generateEmbeddings([analysis]);

    if (!result.data || result.data.embeddings.length === 0) {
      throw new ProcessingError(
        "Error generando embeddings del análisis",
        ProcessingErrorCodes.EMBEDDING_FAILED,
        uploadId,
        true
      );
    }

    // 5. Create and save chunk
    const chunks: ChunkData[] = [
      {
        content: analysis,
        embedding: result.data.embeddings[0],
        chunkType: "image_analysis",
        sourceContext: `Imagen: ${filename}`,
        metadata: {
          filename,
          fileType: mimeType,
          fileSize: buffer.length,
          analysisModel: VISION_MODEL,
        },
        tokensCount: countTokens(analysis),
      },
    ];

    logProcessor(PROCESSOR_NAME, uploadId, "Guardando chunk...");
    const { result: savedCount, timeMs: saveTime } = await measureTime(() =>
      saveChunks(chunks, businessId, uploadId)
    );
    logProcessor(PROCESSOR_NAME, uploadId, `Guardado en ${saveTime}ms`);

    // 6. Update upload status
    await updateUploadStatus(uploadId, "completed", {
      processingResult: {
        chunksCreated: savedCount,
        totalTokens: result.data.total_tokens_used,
        analysisLength: analysis.length,
      },
    });

    const totalTime = Date.now() - startTime;
    logProcessor(PROCESSOR_NAME, uploadId, `Procesamiento completado en ${totalTime}ms`);

    return {
      success: true,
      uploadId,
      chunksCreated: savedCount,
      totalTokens: result.data.total_tokens_used,
      processingTimeMs: totalTime,
      details: {
        contentSummary: `Imagen analizada: ${analysis.substring(0, 100)}...`,
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

/**
 * Analiza una imagen usando Gemini Vision.
 */
async function analyzeImageWithGemini(
  buffer: Buffer,
  mimeType: string,
  uploadId: string
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new ProcessingError(
      "GEMINI_API_KEY no está configurada",
      ProcessingErrorCodes.EXTRACTION_FAILED,
      uploadId,
      false
    );
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: VISION_MODEL });

    // Convert buffer to base64
    const base64Image = buffer.toString("base64");

    // Create the image part
    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: mimeType,
      },
    };

    // Generate content
    const result = await model.generateContent([ANALYSIS_PROMPT, imagePart]);
    const response = result.response;
    const text = response.text();

    return text;
  } catch (error) {
    throw new ProcessingError(
      `Error analizando imagen con Gemini: ${error instanceof Error ? error.message : "Error desconocido"}`,
      ProcessingErrorCodes.EXTRACTION_FAILED,
      uploadId,
      true,
      error
    );
  }
}

/**
 * Determina el MIME type de una imagen por su extensión.
 */
function getMimeType(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase();

  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    default:
      return "image/jpeg"; // Default
  }
}
