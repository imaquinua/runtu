// ============================================
// Gemini Chat Client
// ============================================
// Wrapper para Gemini generative AI con configuración para Runtu

import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import {
  type ChatConfig,
  type ChatHistoryMessage,
  ChatError,
  DEFAULT_CHAT_CONFIG,
  RUNTU_SYSTEM_PROMPT,
} from "./types";

// ============================================
// Client Singleton
// ============================================

let genAI: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new ChatError(
        "GEMINI_API_KEY no está configurada",
        "INTERNAL_ERROR"
      );
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

// ============================================
// Chat Generation
// ============================================

export interface GenerateChatParams {
  /** Contexto del negocio (de RAG) */
  businessContext: string;

  /** Nombre del negocio */
  businessName: string;

  /** Mensaje actual del usuario */
  currentMessage: string;

  /** Historial de conversación */
  history?: ChatHistoryMessage[];

  /** Configuración opcional */
  config?: Partial<ChatConfig>;
}

export interface GenerateChatResult {
  content: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
}

/**
 * Genera una respuesta de chat usando Gemini
 */
export async function generateChatResponse(
  params: GenerateChatParams
): Promise<GenerateChatResult> {
  const startTime = Date.now();
  const config = { ...DEFAULT_CHAT_CONFIG, ...params.config };

  const client = getClient();
  const model = client.getGenerativeModel({
    model: config.model,
    generationConfig: {
      maxOutputTokens: config.maxOutputTokens,
      temperature: config.temperature,
    },
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
      },
    ],
  });

  // Construir el prompt completo
  const systemPrompt = buildSystemPrompt(
    params.businessName,
    params.businessContext
  );

  // Construir historial para Gemini
  const geminiHistory = buildGeminiHistory(params.history, config.maxHistoryMessages);

  try {
    // Iniciar chat con historial
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: "Por favor actúa según las siguientes instrucciones del sistema." }],
        },
        {
          role: "model",
          parts: [{ text: "Entendido. Seguiré las instrucciones." }],
        },
        {
          role: "user",
          parts: [{ text: systemPrompt }],
        },
        {
          role: "model",
          parts: [{ text: "Perfecto, estoy listo para ayudar con información del negocio." }],
        },
        ...geminiHistory,
      ],
    });

    // Enviar mensaje y obtener respuesta
    const result = await chat.sendMessage(params.currentMessage);
    const response = result.response;
    const content = response.text();

    // Estimar tokens (Gemini no siempre provee esto)
    const inputTokens = estimateTokens(systemPrompt + params.currentMessage);
    const outputTokens = estimateTokens(content);

    return {
      content,
      inputTokens,
      outputTokens,
      latencyMs: Date.now() - startTime,
    };
  } catch (error) {
    console.error("[Chat/Gemini] Error generating response:", error);

    // Manejar errores específicos
    if (error instanceof Error) {
      if (error.message.includes("quota") || error.message.includes("rate")) {
        throw new ChatError(
          "Se alcanzó el límite de uso. Intenta de nuevo en unos minutos.",
          "RATE_LIMITED"
        );
      }
      if (error.message.includes("blocked") || error.message.includes("safety")) {
        throw new ChatError(
          "No puedo responder a esa pregunta. ¿Puedes reformularla?",
          "LLM_FAILED",
          { reason: "safety_block" }
        );
      }
    }

    throw new ChatError(
      "Tuve un problema procesando tu pregunta. ¿Puedes intentar de nuevo?",
      "LLM_FAILED",
      { originalError: error instanceof Error ? error.message : "Unknown" }
    );
  }
}

// ============================================
// Prompt Building
// ============================================

function buildSystemPrompt(businessName: string, businessContext: string): string {
  return `${RUNTU_SYSTEM_PROMPT}

NEGOCIO: ${businessName}

---

INFORMACIÓN DEL NEGOCIO:

${businessContext}

---

Responde la siguiente pregunta del usuario basándote en la información anterior.`;
}

function buildGeminiHistory(
  history: ChatHistoryMessage[] | undefined,
  maxMessages: number
): Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> {
  if (!history || history.length === 0) {
    return [];
  }

  // Tomar solo los últimos N mensajes
  const recentHistory = history.slice(-maxMessages);

  return recentHistory.map((msg) => ({
    role: msg.role === "user" ? "user" : "model",
    parts: [{ text: msg.content }],
  }));
}

// ============================================
// Utilities
// ============================================

function estimateTokens(text: string): number {
  // Aproximación: ~4 caracteres por token para español
  return Math.ceil(text.length / 4);
}

// ============================================
// Retry Logic
// ============================================

export async function generateWithRetry(
  params: GenerateChatParams,
  maxRetries: number = 2
): Promise<GenerateChatResult> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await generateChatResponse(params);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown error");

      // No reintentar para ciertos errores
      if (error instanceof ChatError) {
        if (error.code === "RATE_LIMITED" || error.code === "UNAUTHORIZED") {
          throw error;
        }
      }

      // Esperar antes de reintentar (backoff exponencial)
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 500; // 500ms, 1s, 2s
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}
