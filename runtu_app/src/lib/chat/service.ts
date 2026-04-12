// ============================================
// Chat Service - Main Orchestrator
// ============================================
// Orquesta RAG + LLM para responder preguntas del usuario

import { queryBusinessKnowledge, type RAGSearchResult } from "@/lib/rag";
import type { Source } from "@/types/chat";
import {
  type ChatRequest,
  type ChatResponse,
  type ChatMetrics,
  type ChatConfig,
  ChatError,
  DEFAULT_CHAT_CONFIG,
  NO_KNOWLEDGE_RESPONSE,
} from "./types";
import { generateWithRetry } from "./gemini";

// ============================================
// Main Chat Function
// ============================================

export interface ProcessChatOptions {
  /** Nombre del negocio para contexto */
  businessName: string;

  /** Configuración opcional */
  config?: Partial<ChatConfig>;
}

/**
 * Procesa un mensaje de chat y genera una respuesta.
 * Orquesta la búsqueda RAG y la generación con Gemini.
 */
export async function processChat(
  request: ChatRequest,
  options: ProcessChatOptions
): Promise<ChatResponse> {
  const startTime = Date.now();
  const config = { ...DEFAULT_CHAT_CONFIG, ...options.config };

  // Validar request
  validateRequest(request);

  // Métricas iniciales
  const metrics: ChatMetrics = {
    totalTimeMs: 0,
    ragTimeMs: 0,
    llmTimeMs: 0,
    fromCache: false,
    inputTokens: 0,
    outputTokens: 0,
    chunksUsed: 0,
  };

  try {
    // 1. Buscar contexto relevante con RAG
    const ragStart = Date.now();
    const ragResult = await queryBusinessKnowledge({
      businessId: request.businessId,
      query: request.message,
      limit: config.maxChunks,
      threshold: config.ragThreshold,
      hybridSearch: true,
      includeContext: true,
      contextOptions: {
        maxTokens: config.maxContextTokens,
        includeSourceInfo: true,
        format: "structured",
      },
      businessName: options.businessName,
    });

    metrics.ragTimeMs = Date.now() - ragStart;
    metrics.fromCache = ragResult.metrics.fromCache;
    metrics.chunksUsed = ragResult.results.length;

    // 2. Verificar si hay conocimiento
    if (ragResult.results.length === 0) {
      // Sin conocimiento - responder con mensaje predeterminado
      metrics.totalTimeMs = Date.now() - startTime;

      return {
        content: NO_KNOWLEDGE_RESPONSE,
        sources: [],
        conversationId: request.conversationId,
        metrics,
      };
    }

    // 3. Generar respuesta con Gemini
    const llmStart = Date.now();
    const llmResult = await generateWithRetry({
      businessContext: ragResult.context?.context ?? "",
      businessName: options.businessName,
      currentMessage: request.message,
      history: request.history,
      config,
    });

    metrics.llmTimeMs = Date.now() - llmStart;
    metrics.inputTokens = llmResult.inputTokens;
    metrics.outputTokens = llmResult.outputTokens;
    metrics.totalTimeMs = Date.now() - startTime;

    // 4. Extraer fuentes de los chunks usados
    const sources = extractSources(ragResult.results);

    // 5. Log de métricas (sin contenido para privacidad)
    logChatMetrics(request.businessId, metrics);

    return {
      content: llmResult.content,
      sources,
      conversationId: request.conversationId,
      metrics,
    };
  } catch (error) {
    metrics.totalTimeMs = Date.now() - startTime;

    // Log del error
    console.error("[Chat/Service] Error processing chat:", {
      businessId: request.businessId,
      error: error instanceof Error ? error.message : "Unknown",
      metrics,
    });

    // Re-throw ChatErrors
    if (error instanceof ChatError) {
      throw error;
    }

    // Wrap otros errores
    throw new ChatError(
      "Tuve un problema procesando tu pregunta. ¿Puedes intentar de nuevo?",
      "INTERNAL_ERROR",
      { originalError: error instanceof Error ? error.message : "Unknown" }
    );
  }
}

// ============================================
// Validation
// ============================================

function validateRequest(request: ChatRequest): void {
  if (!request.businessId) {
    throw new ChatError("businessId es requerido", "INVALID_REQUEST");
  }

  if (!request.message || request.message.trim().length === 0) {
    throw new ChatError("El mensaje no puede estar vacío", "INVALID_REQUEST");
  }

  if (request.message.length > 4000) {
    throw new ChatError(
      "El mensaje es demasiado largo. Máximo 4000 caracteres.",
      "INVALID_REQUEST"
    );
  }
}

// ============================================
// Source Extraction
// ============================================

function extractSources(results: RAGSearchResult[]): Source[] {
  const sourcesMap = new Map<string, Source>();

  for (const result of results) {
    const sourceId = result.source.filename ?? result.id;

    if (!sourcesMap.has(sourceId)) {
      sourcesMap.set(sourceId, {
        id: result.id,
        name: result.source.context ?? result.source.filename ?? "Documento",
        type: result.chunk_type,
        preview: result.snippet.slice(0, 100) + (result.snippet.length > 100 ? "..." : ""),
      });
    }
  }

  // Retornar máximo 5 fuentes únicas
  return Array.from(sourcesMap.values()).slice(0, 5);
}

// ============================================
// Logging
// ============================================

function logChatMetrics(businessId: string, metrics: ChatMetrics): void {
  // Log estructurado para métricas (sin contenido del mensaje)
  console.log("[Chat/Metrics]", {
    businessId,
    totalTimeMs: metrics.totalTimeMs,
    ragTimeMs: metrics.ragTimeMs,
    llmTimeMs: metrics.llmTimeMs,
    fromCache: metrics.fromCache,
    inputTokens: metrics.inputTokens,
    outputTokens: metrics.outputTokens,
    chunksUsed: metrics.chunksUsed,
    timestamp: new Date().toISOString(),
  });
}

// ============================================
// Helper Functions
// ============================================

/**
 * Verifica si un negocio tiene conocimiento disponible
 */
export async function hasBusinessKnowledge(businessId: string): Promise<boolean> {
  try {
    const result = await queryBusinessKnowledge({
      businessId,
      query: "información del negocio",
      limit: 1,
      threshold: 0.3,
      analyzeQuery: false,
    });

    return result.results.length > 0;
  } catch {
    return false;
  }
}

/**
 * Obtiene sugerencias de preguntas basadas en el conocimiento del negocio
 */
export async function getSuggestedQuestions(
  businessId: string
): Promise<string[]> {
  const defaultSuggestions = [
    "¿Cómo me fue esta semana?",
    "¿Cuáles son mis principales gastos?",
    "Resume mis últimas ventas",
    "¿Qué debería mejorar?",
  ];

  // Por ahora retornar sugerencias por defecto
  // En el futuro, podríamos personalizar basado en el contenido disponible
  return defaultSuggestions;
}
