// ============================================
// Content Processing for Gemini Embeddings
// ============================================

import { generateEmbeddings, estimateEmbeddingCost } from "./index";
import {
  chunkText,
  chunkSpreadsheetData,
  chunkTranscript,
  countTokens,
  type SpreadsheetData,
} from "./chunking";

// ============================================
// Types
// ============================================

export type ContentType = "text" | "spreadsheet" | "transcript" | "image_description";

export interface ProcessContentParams {
  content: string;
  contentType: ContentType;
  sourceContext: string;
  metadata?: Record<string, unknown>;
  spreadsheetData?: SpreadsheetData;
}

export interface ProcessedChunk {
  content: string;
  embedding: number[];
  tokens: number;
  index: number;
  totalChunks: number;
  sourceContext: string;
  metadata: Record<string, unknown>;
}

export interface ProcessContentResult {
  chunks: ProcessedChunk[];
  totalTokens: number;
  estimatedCost: number;
}

// ============================================
// Error Types
// ============================================

export class ProcessingError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "ProcessingError";
  }
}

// ============================================
// Main Processing Function
// ============================================

/**
 * Procesa contenido completo: chunking + embeddings con Gemini.
 * Retorna chunks listos para insertar en la base de datos.
 */
export async function processContentForEmbedding(
  params: ProcessContentParams
): Promise<ProcessContentResult> {
  const {
    content,
    contentType,
    sourceContext,
    metadata = {},
    spreadsheetData,
  } = params;

  if (!content && contentType !== "spreadsheet") {
    throw new ProcessingError("El contenido no puede estar vacío", "EMPTY_CONTENT");
  }

  console.log(`[ProcessContent] Iniciando procesamiento: tipo=${contentType}, contexto="${sourceContext}"`);

  // 1. Chunking según tipo de contenido
  let textChunks: string[];

  try {
    switch (contentType) {
      case "spreadsheet":
        if (!spreadsheetData) {
          throw new ProcessingError(
            "spreadsheetData es requerido para contentType 'spreadsheet'",
            "MISSING_SPREADSHEET_DATA"
          );
        }
        textChunks = chunkSpreadsheetData(spreadsheetData);
        break;

      case "transcript":
        textChunks = chunkTranscript(content);
        break;

      case "image_description":
        textChunks = chunkText(content, {
          maxTokens: 500,
          preserveParagraphs: true,
        });
        break;

      case "text":
      default:
        textChunks = chunkText(content, {
          maxTokens: 500,
          overlap: 50,
          preserveParagraphs: true,
        });
        break;
    }
  } catch (error) {
    if (error instanceof ProcessingError) {
      throw error;
    }
    throw new ProcessingError(
      `Error al chunkar contenido: ${error instanceof Error ? error.message : "Error desconocido"}`,
      "CHUNKING_ERROR",
      error
    );
  }

  if (textChunks.length === 0) {
    console.log("[ProcessContent] No se generaron chunks");
    return {
      chunks: [],
      totalTokens: 0,
      estimatedCost: 0,
    };
  }

  console.log(`[ProcessContent] Generados ${textChunks.length} chunks`);

  // 2. Generar embeddings en batch con Gemini
  const result = await generateEmbeddings(textChunks);

  if (result.error) {
    throw new ProcessingError(
      `Error generando embeddings: ${result.error.message}`,
      "EMBEDDING_ERROR",
      result.error
    );
  }

  const embeddings = result.data!.embeddings;
  const totalTokensUsed = result.data!.total_tokens_used;

  // 3. Ensamblar resultados
  const processedChunks: ProcessedChunk[] = textChunks.map((content, index) => ({
    content,
    embedding: embeddings[index],
    tokens: countTokens(content),
    index,
    totalChunks: textChunks.length,
    sourceContext: buildSourceContext(sourceContext, index, textChunks.length),
    metadata: {
      ...metadata,
      chunkIndex: index,
      totalChunks: textChunks.length,
      contentType,
    },
  }));

  const estimatedCost = estimateEmbeddingCost(totalTokensUsed);

  console.log(
    `[ProcessContent] Procesamiento completo: ${processedChunks.length} chunks, ${totalTokensUsed} tokens, $${estimatedCost.toFixed(6)} estimado`
  );

  return {
    chunks: processedChunks,
    totalTokens: totalTokensUsed,
    estimatedCost,
  };
}

// ============================================
// Helper Functions
// ============================================

function buildSourceContext(
  baseContext: string,
  chunkIndex: number,
  totalChunks: number
): string {
  if (totalChunks === 1) {
    return baseContext;
  }
  return `${baseContext} (parte ${chunkIndex + 1} de ${totalChunks})`;
}

// ============================================
// Convenience Functions
// ============================================

/**
 * Procesa un documento de texto simple.
 */
export async function processDocument(
  content: string,
  filename: string,
  metadata?: Record<string, unknown>
): Promise<ProcessContentResult> {
  return processContentForEmbedding({
    content,
    contentType: "text",
    sourceContext: `Documento: ${filename}`,
    metadata,
  });
}

/**
 * Procesa una hoja de cálculo.
 */
export async function processSpreadsheet(
  data: SpreadsheetData,
  filename: string,
  metadata?: Record<string, unknown>
): Promise<ProcessContentResult> {
  const textContent = formatSpreadsheetAsText(data);

  return processContentForEmbedding({
    content: textContent,
    contentType: "spreadsheet",
    sourceContext: `Archivo: ${filename}, Hoja: ${data.sheetName}`,
    metadata: {
      ...metadata,
      sheetName: data.sheetName,
      rowCount: data.rows.length,
      columnCount: data.headers.length,
    },
    spreadsheetData: data,
  });
}

/**
 * Procesa una transcripción de audio/video.
 */
export async function processTranscript(
  transcript: string,
  sourceFile: string,
  metadata?: Record<string, unknown>
): Promise<ProcessContentResult> {
  return processContentForEmbedding({
    content: transcript,
    contentType: "transcript",
    sourceContext: `Transcripción: ${sourceFile}`,
    metadata: {
      ...metadata,
      mediaType: "audio/video",
    },
  });
}

/**
 * Procesa una descripción de imagen.
 */
export async function processImageDescription(
  description: string,
  imageFile: string,
  metadata?: Record<string, unknown>
): Promise<ProcessContentResult> {
  return processContentForEmbedding({
    content: description,
    contentType: "image_description",
    sourceContext: `Imagen: ${imageFile}`,
    metadata: {
      ...metadata,
      mediaType: "image",
    },
  });
}

function formatSpreadsheetAsText(data: SpreadsheetData): string {
  const { headers, rows, sheetName } = data;

  const lines: string[] = [];

  if (sheetName) {
    lines.push(`Hoja: ${sheetName}`);
  }

  if (headers.length > 0) {
    lines.push(`Columnas: ${headers.join(" | ")}`);
    lines.push("");
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const values = row.map((v) => {
      if (v === null || v === undefined) return "";
      if (typeof v === "number") return v.toLocaleString("es-MX");
      return String(v);
    });

    if (headers.length > 0) {
      const pairs = headers.map((h, j) => `${h}: ${values[j] || ""}`);
      lines.push(`Fila ${i + 1}: ${pairs.join(" | ")}`);
    } else {
      lines.push(`Fila ${i + 1}: ${values.join(" | ")}`);
    }
  }

  return lines.join("\n");
}

// ============================================
// Batch Processing
// ============================================

export interface BatchContentItem {
  content: string;
  contentType: ContentType;
  sourceContext: string;
  metadata?: Record<string, unknown>;
  spreadsheetData?: SpreadsheetData;
}

/**
 * Procesa múltiples contenidos en batch.
 */
export async function processContentBatch(
  items: BatchContentItem[]
): Promise<ProcessContentResult[]> {
  const results: ProcessContentResult[] = [];

  for (const item of items) {
    try {
      const result = await processContentForEmbedding(item);
      results.push(result);
    } catch (error) {
      console.error(`[ProcessContent] Error procesando "${item.sourceContext}":`, error);
      results.push({
        chunks: [],
        totalTokens: 0,
        estimatedCost: 0,
      });
    }
  }

  return results;
}
