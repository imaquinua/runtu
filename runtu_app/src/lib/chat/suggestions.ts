// ============================================
// Chat Suggestions Generator
// ============================================
// Genera preguntas de seguimiento basadas en la conversación

import { GoogleGenerativeAI } from "@google/generative-ai";

interface GenerateFollowUpsParams {
  lastUserMessage: string;
  lastAssistantResponse: string;
  businessName?: string;
}

const FOLLOW_UP_PROMPT = `Basándote en esta conversación de negocio, sugiere 3 preguntas de seguimiento que el usuario podría querer hacer.

Las preguntas deben ser:
- Cortas (máximo 8 palabras)
- Accionables y específicas
- Relacionadas con el tema discutido
- En español, tono informal (tú)

Usuario preguntó: {userMessage}
Runtu respondió: {assistantResponse}

Responde SOLO con las 3 preguntas, una por línea, sin números ni guiones ni comillas.`;

/**
 * Genera preguntas de seguimiento usando Gemini
 */
export async function generateFollowUps(
  params: GenerateFollowUpsParams
): Promise<string[]> {
  const { lastUserMessage, lastAssistantResponse } = params;

  // Si la respuesta es muy corta o es un error, no generar
  if (
    !lastAssistantResponse ||
    lastAssistantResponse.length < 50 ||
    lastAssistantResponse.includes("no tengo información") ||
    lastAssistantResponse.includes("Error")
  ) {
    return getDefaultFollowUps(lastUserMessage);
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return getDefaultFollowUps(lastUserMessage);
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        maxOutputTokens: 100,
        temperature: 0.7,
      },
    });

    const prompt = FOLLOW_UP_PROMPT
      .replace("{userMessage}", lastUserMessage)
      .replace("{assistantResponse}", lastAssistantResponse.slice(0, 500));

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Parsear respuesta
    const suggestions = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && line.length < 60)
      .slice(0, 3);

    if (suggestions.length === 0) {
      return getDefaultFollowUps(lastUserMessage);
    }

    return suggestions;
  } catch (error) {
    console.error("[Suggestions] Error generating follow-ups:", error);
    return getDefaultFollowUps(lastUserMessage);
  }
}

/**
 * Sugerencias por defecto basadas en categoría
 */
function getDefaultFollowUps(userMessage: string): string[] {
  const message = userMessage.toLowerCase();

  // Detectar categoría y devolver sugerencias relevantes
  if (message.includes("venta") || message.includes("vendí")) {
    return [
      "¿Cuál fue mi mejor día?",
      "Compara con el mes pasado",
      "¿Qué producto se vendió más?",
    ];
  }

  if (message.includes("gasto") || message.includes("costo")) {
    return [
      "¿Dónde puedo ahorrar?",
      "Compara con meses anteriores",
      "¿Cuál es mi gasto más grande?",
    ];
  }

  if (message.includes("semana") || message.includes("mes") || message.includes("hoy")) {
    return [
      "Compara con el periodo anterior",
      "¿Qué día fue el mejor?",
      "Dame recomendaciones",
    ];
  }

  if (message.includes("producto") || message.includes("inventario")) {
    return [
      "¿Qué debería reabastecer?",
      "¿Cuál tiene más margen?",
      "Muestra tendencias de venta",
    ];
  }

  if (message.includes("cliente") || message.includes("clientes")) {
    return [
      "¿Quiénes compran más?",
      "¿Hay clientes frecuentes?",
      "¿Cómo puedo retenerlos?",
    ];
  }

  // Default genérico
  return [
    "Dame más detalles",
    "¿Qué recomiendas?",
    "Compara con antes",
  ];
}

/**
 * Sugerencias inteligentes basadas en contexto del negocio
 */
export interface BusinessContext {
  hasRecentUploads: boolean;
  lastUploadDate?: Date;
  hasFinancialData: boolean;
  hasSalesData: boolean;
  hasInventoryData: boolean;
}

export function getSmartInitialSuggestions(context: BusinessContext): string[] {
  const suggestions: string[] = [];
  const now = new Date();
  const dayOfWeek = now.getDay();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  // Si es lunes, sugerir resumen semanal
  if (dayOfWeek === 1) {
    suggestions.push("¿Cómo me fue la semana pasada?");
  }

  // Si es fin de mes (últimos 3 días)
  if (dayOfMonth >= daysInMonth - 2) {
    suggestions.push("Resume cómo me fue este mes");
  }

  // Si hay uploads recientes (últimas 24h)
  if (context.hasRecentUploads && context.lastUploadDate) {
    const hoursSinceUpload = (now.getTime() - context.lastUploadDate.getTime()) / (1000 * 60 * 60);
    if (hoursSinceUpload < 24) {
      suggestions.push("¿Qué aprendiste de mis últimos archivos?");
    }
  }

  // Basado en tipo de datos disponibles
  if (context.hasSalesData) {
    suggestions.push("¿Cuál es mi tendencia de ventas?");
  }

  if (context.hasFinancialData && !suggestions.includes("gasto")) {
    suggestions.push("¿Cuáles son mis principales gastos?");
  }

  if (context.hasInventoryData) {
    suggestions.push("¿Qué productos debería reabastecer?");
  }

  // Llenar hasta 4 con defaults si no hay suficientes
  const defaults = [
    "¿Cómo me fue esta semana?",
    "Resume mis últimas ventas",
    "¿Qué tendencias ves en mi negocio?",
    "Dame recomendaciones para mejorar",
  ];

  for (const def of defaults) {
    if (suggestions.length >= 4) break;
    if (!suggestions.includes(def)) {
      suggestions.push(def);
    }
  }

  return suggestions.slice(0, 4);
}
