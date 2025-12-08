// ============================================
// Chat Streaming API - Gemini
// ============================================
// POST /api/chat/stream-manual - Chat con streaming usando Gemini

import { NextRequest } from "next/server";
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { queryBusinessKnowledge } from "@/lib/rag";
import { RUNTU_SYSTEM_PROMPT, NO_KNOWLEDGE_RESPONSE } from "@/lib/chat/types";

// ============================================
// Gemini Client
// ============================================

function getGeminiClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY no configurada");
  }
  return new GoogleGenerativeAI(apiKey);
}

// ============================================
// Types
// ============================================

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface StreamRequestBody {
  message: string;
  history?: ChatMessage[];
}

// ============================================
// POST Handler
// ============================================

export async function POST(request: NextRequest) {
  try {
    // 1. Verificar configuración
    if (!isSupabaseConfigured()) {
      return jsonResponse({ error: "Servicio no disponible" }, 503);
    }

    if (!process.env.GEMINI_API_KEY) {
      return jsonResponse({ error: "API key no configurada" }, 500);
    }

    // 2. Autenticar usuario
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return jsonResponse({ error: "No autorizado" }, 401);
    }

    // 3. Obtener negocio
    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select("id, name")
      .eq("user_id", user.id)
      .single();

    if (businessError || !business) {
      return jsonResponse({ error: "No se encontró el negocio" }, 404);
    }

    // 4. Parsear body
    const body: StreamRequestBody = await request.json();

    if (!body.message?.trim()) {
      return jsonResponse({ error: "Mensaje requerido" }, 400);
    }

    const message = body.message.trim();

    // 5. Buscar contexto con RAG
    const ragResult = await queryBusinessKnowledge({
      businessId: business.id,
      query: message,
      limit: 8,
      threshold: 0.5,
      hybridSearch: true,
      includeContext: true,
      contextOptions: {
        maxTokens: 4000,
        includeSourceInfo: true,
        format: "structured",
      },
      businessName: business.name,
    });

    // 6. Si no hay conocimiento, responder sin streaming
    if (ragResult.results.length === 0) {
      return jsonResponse({
        content: NO_KNOWLEDGE_RESPONSE,
        sources: [],
        noKnowledge: true,
      });
    }

    // 7. Construir prompt con contexto
    const systemPrompt = buildSystemPrompt(
      business.name,
      ragResult.context?.context ?? ""
    );

    // 8. Configurar Gemini
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.7,
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

    // 9. Construir historial para Gemini
    const geminiHistory = buildGeminiHistory(body.history ?? []);

    // 10. Iniciar chat con contexto
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

    // 11. Crear stream con Gemini
    const result = await chat.sendMessageStream(message);

    // 12. Crear ReadableStream para SSE
    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
              // Formato SSE
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
            }
          }

          // Señal de fin
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        } catch (error) {
          console.error("[Stream] Error:", error);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: "Stream error" })}\n\n`)
          );
          controller.close();
        }
      },
    });

    // 13. Retornar respuesta SSE
    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });

  } catch (error) {
    console.error("[API/Chat/Stream] Error:", error);
    return jsonResponse({
      error: "Error procesando el mensaje",
      details: error instanceof Error ? error.message : "Unknown",
    }, 500);
  }
}

// ============================================
// Helpers
// ============================================

function jsonResponse(data: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function buildSystemPrompt(businessName: string, context: string): string {
  return `${RUNTU_SYSTEM_PROMPT}

NEGOCIO: ${businessName}

---

INFORMACIÓN DEL NEGOCIO:

${context}

---

Responde la siguiente pregunta del usuario basándote en la información anterior.`;
}

function buildGeminiHistory(
  history: ChatMessage[]
): Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> {
  if (history.length === 0) {
    return [];
  }

  // Tomar solo los últimos 10 mensajes
  const recentHistory = history.slice(-10);

  return recentHistory.map((msg) => ({
    role: msg.role === "user" ? "user" : "model",
    parts: [{ text: msg.content }],
  }));
}
