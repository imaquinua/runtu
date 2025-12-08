// ============================================
// Chat Service Types
// ============================================

import type { Source } from "@/types/chat";

// ============================================
// Request/Response Types
// ============================================

export interface ChatRequest {
  /** ID del negocio */
  businessId: string;

  /** Mensaje actual del usuario */
  message: string;

  /** Historial de conversación (opcional, últimos N mensajes) */
  history?: ChatHistoryMessage[];

  /** ID de conversación (para persistencia futura) */
  conversationId?: string;
}

export interface ChatHistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  /** Respuesta del asistente */
  content: string;

  /** Fuentes usadas para la respuesta */
  sources: Source[];

  /** ID de conversación */
  conversationId?: string;

  /** Métricas (para logging) */
  metrics: ChatMetrics;
}

export interface ChatMetrics {
  /** Tiempo total de respuesta en ms */
  totalTimeMs: number;

  /** Tiempo de búsqueda RAG en ms */
  ragTimeMs: number;

  /** Tiempo de generación LLM en ms */
  llmTimeMs: number;

  /** Si el contexto vino de cache */
  fromCache: boolean;

  /** Tokens de entrada estimados */
  inputTokens: number;

  /** Tokens de salida estimados */
  outputTokens: number;

  /** Número de chunks usados en contexto */
  chunksUsed: number;
}

// ============================================
// Error Types
// ============================================

export type ChatErrorCode =
  | "INVALID_REQUEST"
  | "NO_KNOWLEDGE"
  | "RAG_FAILED"
  | "LLM_FAILED"
  | "RATE_LIMITED"
  | "UNAUTHORIZED"
  | "INTERNAL_ERROR";

export class ChatError extends Error {
  code: ChatErrorCode;
  details?: Record<string, unknown>;

  constructor(
    message: string,
    code: ChatErrorCode,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ChatError";
    this.code = code;
    this.details = details;
  }
}

// ============================================
// Configuration
// ============================================

export interface ChatConfig {
  /** Modelo de Gemini a usar */
  model: string;

  /** Máximo de tokens para contexto RAG */
  maxContextTokens: number;

  /** Máximo de tokens para respuesta */
  maxOutputTokens: number;

  /** Temperatura para generación (0-1) */
  temperature: number;

  /** Máximo de mensajes de historial a incluir */
  maxHistoryMessages: number;

  /** Threshold de similitud para RAG */
  ragThreshold: number;

  /** Máximo de chunks a recuperar */
  maxChunks: number;
}

export const DEFAULT_CHAT_CONFIG: ChatConfig = {
  model: "gemini-2.0-flash",
  maxContextTokens: 4000,
  maxOutputTokens: 1024,
  temperature: 0.7,
  maxHistoryMessages: 10,
  ragThreshold: 0.5,
  maxChunks: 8,
};

// ============================================
// System Prompt
// ============================================

export const RUNTU_SYSTEM_PROMPT = `Eres Runtu, el asistente inteligente para negocios en Latinoamérica.

PERSONALIDAD:
- Eres amable, profesional y directo
- Hablas en español mexicano neutral (evita regionalismos fuertes)
- Usas "tú" para dirigirte al usuario
- Eres empático con los desafíos de emprendedores

REGLAS:
1. SOLO responde basándote en la información del negocio proporcionada
2. Si no tienes información suficiente, dilo honestamente
3. Si la pregunta no está relacionada con el negocio, responde brevemente y redirige
4. Sé conciso - respuestas de 1-3 párrafos máximo
5. Si hay datos numéricos, preséntalos de forma clara (tablas si es necesario)

CITACIÓN DE FUENTES:
- SIEMPRE cita las fuentes usando el formato: [[número]] al final de la oración relevante
- Ejemplo: "El producto más vendido fue la hamburguesa clásica [[1]]"
- Los números corresponden a las fuentes que recibes en la información del negocio
- Cita múltiples fuentes si aplica: "Las ventas totales fueron $5,000 [[1]][[2]]"

FORMATO:
- Usa markdown ligero para estructurar respuestas largas
- Para listas usa viñetas simples
- Para datos numéricos, considera usar formato de tabla`;

export const NO_KNOWLEDGE_RESPONSE = `Aún no tengo información sobre tu negocio.

Para poder ayudarte mejor, sube algunos archivos como:
- Reportes de ventas
- Inventarios
- Facturas
- Cualquier documento con información de tu negocio

Puedes hacerlo en la sección de **Archivos**.`;

export const UNRELATED_RESPONSE_HINT = `

(Recuerda que estoy aquí para ayudarte con tu negocio. Si tienes preguntas sobre ventas, inventario, gastos o cualquier tema relacionado, ¡pregúntame!)`;
