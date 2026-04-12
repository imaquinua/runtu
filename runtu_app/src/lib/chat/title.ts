// ============================================
// Conversation Title Generator
// ============================================
// Genera títulos cortos para conversaciones usando Gemini

import { GoogleGenerativeAI } from "@google/generative-ai";

// ============================================
// Generate Title
// ============================================

export async function generateConversationTitle(
  firstUserMessage: string,
  firstAssistantResponse: string
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  // Si no hay API key, usar fallback
  if (!apiKey) {
    return createFallbackTitle(firstUserMessage);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        maxOutputTokens: 30,
        temperature: 0.3,
      },
    });

    const prompt = `Genera un título de 3-5 palabras en español para esta conversación de negocio.
El título debe ser descriptivo y conciso.

Usuario preguntó: "${firstUserMessage.slice(0, 200)}"
Asistente respondió: "${firstAssistantResponse.slice(0, 200)}"

Solo responde con el título, sin comillas, sin explicación, sin puntuación final.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const title = response.text().trim();

    // Limpiar el título
    const cleanTitle = cleanGeneratedTitle(title);

    if (cleanTitle && cleanTitle.length > 0 && cleanTitle.length <= 60) {
      return cleanTitle;
    }

    return createFallbackTitle(firstUserMessage);
  } catch (error) {
    console.error("[Title] Error generating title:", error);
    return createFallbackTitle(firstUserMessage);
  }
}

// ============================================
// Helpers
// ============================================

function cleanGeneratedTitle(title: string): string {
  return title
    // Quitar comillas
    .replace(/^["'«»]|["'«»]$/g, "")
    // Quitar puntuación final
    .replace(/[.!?:]+$/, "")
    // Quitar prefijos comunes
    .replace(/^(Título:|Title:|Tema:|Subject:)\s*/i, "")
    // Capitalizar primera letra
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

function createFallbackTitle(message: string): string {
  // Usar primeras palabras del mensaje
  const words = message.trim().split(/\s+/);
  const titleWords = words.slice(0, 5);
  let title = titleWords.join(" ");

  // Truncar si es muy largo
  if (title.length > 40) {
    title = title.slice(0, 37) + "...";
  }

  // Capitalizar primera letra
  return title.replace(/^./, (c) => c.toUpperCase());
}
