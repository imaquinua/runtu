// ============================================
// Embeddings Service - Google Gemini text-embedding-004
// ============================================

import { GoogleGenerativeAI } from "@google/generative-ai";

// Configuración
const EMBEDDING_MODEL = "text-embedding-004";
const EMBEDDING_DIMENSIONS = 768; // Gemini text-embedding-004 default
const MAX_BATCH_SIZE = 100; // Gemini permite hasta 100 textos por batch

// Cliente Gemini (inicialización lazy)
let genAI: GoogleGenerativeAI | null = null;

function getGeminiClient(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY no está configurada en las variables de entorno");
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

// ============================================
// Types
// ============================================

export interface EmbeddingResult {
  embedding: number[];
  tokens_used: number;
}

export interface BatchEmbeddingResult {
  embeddings: number[][];
  total_tokens_used: number;
}

// ============================================
// Single Embedding
// ============================================

/**
 * Genera embedding para un texto usando Gemini
 */
export async function generateEmbedding(
  text: string
): Promise<{ data: EmbeddingResult | null; error: Error | null }> {
  try {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });

    // Limpiar texto
    const cleanedText = cleanText(text);

    const result = await model.embedContent(cleanedText);
    const embedding = result.embedding.values;

    // Gemini no retorna token count directamente, estimamos
    const tokensUsed = estimateTokens(cleanedText);

    return {
      data: {
        embedding,
        tokens_used: tokensUsed,
      },
      error: null,
    };
  } catch (error) {
    console.error("[Embeddings] Error generating embedding:", error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error("Error desconocido al generar embedding"),
    };
  }
}

// ============================================
// Batch Embeddings
// ============================================

/**
 * Genera embeddings para múltiples textos en batch
 * Más eficiente que llamadas individuales
 */
export async function generateEmbeddings(
  texts: string[]
): Promise<{ data: BatchEmbeddingResult | null; error: Error | null }> {
  try {
    if (texts.length === 0) {
      return {
        data: { embeddings: [], total_tokens_used: 0 },
        error: null,
      };
    }

    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });

    // Limpiar cada texto
    const cleanedTexts = texts.map(cleanText);

    const allEmbeddings: number[][] = [];
    let totalTokens = 0;

    // Procesar en batches - Gemini requiere procesar uno por uno para embeddings
    for (let i = 0; i < cleanedTexts.length; i += MAX_BATCH_SIZE) {
      const batch = cleanedTexts.slice(i, i + MAX_BATCH_SIZE);

      // Procesar cada texto del batch
      for (const text of batch) {
        const result = await model.embedContent(text);
        allEmbeddings.push(result.embedding.values);
        totalTokens += estimateTokens(text);
      }
    }

    return {
      data: {
        embeddings: allEmbeddings,
        total_tokens_used: totalTokens,
      },
      error: null,
    };
  } catch (error) {
    console.error("[Embeddings] Error generating batch embeddings:", error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error("Error desconocido al generar embeddings"),
    };
  }
}

// ============================================
// Query Embedding (para búsquedas)
// ============================================

/**
 * Genera embedding para una query de búsqueda
 * Optimizado para búsqueda semántica
 */
export async function generateQueryEmbedding(
  query: string
): Promise<{ data: number[] | null; error: Error | null }> {
  const result = await generateEmbedding(query);

  if (result.error) {
    return { data: null, error: result.error };
  }

  return { data: result.data?.embedding ?? null, error: null };
}

// ============================================
// Utility Functions
// ============================================

/**
 * Limpia texto para embedding
 */
function cleanText(text: string): string {
  return text
    // Normalizar espacios en blanco
    .replace(/\s+/g, " ")
    // Eliminar caracteres de control
    .replace(/[\x00-\x1F\x7F]/g, "")
    // Trim
    .trim();
}

/**
 * Estima el número de tokens en un texto
 * Aproximación para Gemini (~4 caracteres por token)
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Estima el costo de embeddings con Gemini
 * Gemini embeddings son gratuitos hasta cierto límite
 * Precio: $0.00001 por 1K caracteres aproximadamente
 */
export function estimateEmbeddingCost(totalTokens: number): number {
  // Gemini es más económico que OpenAI
  const costPer1kTokens = 0.00001;
  return (totalTokens / 1000) * costPer1kTokens;
}

/**
 * Calcula similitud coseno entre dos embeddings
 * Útil para comparaciones locales sin ir a la DB
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Los embeddings deben tener la misma dimensión");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ============================================
// Export Constants
// ============================================

export { EMBEDDING_MODEL, EMBEDDING_DIMENSIONS };

// ============================================
// Re-export Chunking Utilities
// ============================================

export {
  chunkText,
  chunkTextWithMetadata,
  chunkByParagraphs,
  chunkBySentences,
  chunkByWords,
  chunkSpreadsheetData,
  chunkTranscript,
  countTokens,
  MAX_TOKENS_PER_CHUNK,
  CHUNK_OVERLAP,
} from "./chunking";

export type {
  ChunkOptions,
  SpreadsheetData,
  ChunkMetadata,
  TextChunk,
} from "./chunking";

// ============================================
// Re-export Content Processing
// ============================================

export {
  processContentForEmbedding,
  processDocument,
  processSpreadsheet,
  processTranscript,
  processImageDescription,
  processContentBatch,
  ProcessingError,
} from "./process-content";

export type {
  ContentType,
  ProcessContentParams,
  ProcessedChunk,
  ProcessContentResult,
  BatchContentItem,
} from "./process-content";
