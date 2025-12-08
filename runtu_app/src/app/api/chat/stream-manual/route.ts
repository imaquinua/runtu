// ============================================
// Chat Streaming API - Opción B: Manual
// ============================================
// POST /api/chat/stream-manual - Chat con streaming manual

import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { queryBusinessKnowledge } from "@/lib/rag";
import { RUNTU_SYSTEM_PROMPT, NO_KNOWLEDGE_RESPONSE } from "@/lib/chat/types";

// ============================================
// Anthropic Client
// ============================================

function getAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY no configurada");
  }
  return new Anthropic({ apiKey });
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

    if (!process.env.ANTHROPIC_API_KEY) {
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

    // 8. Construir mensajes para Claude
    const messages = buildMessages(body.history ?? [], message);

    // 9. Crear stream con Anthropic SDK
    const anthropic = getAnthropicClient();

    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages,
    });

    // 10. Crear ReadableStream
    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              const text = event.delta.text;
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

    // 11. Retornar respuesta SSE
    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });

  } catch (error) {
    console.error("[API/Chat/Stream-Manual] Error:", error);
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

function buildMessages(
  history: ChatMessage[],
  currentMessage: string
): Array<{ role: "user" | "assistant"; content: string }> {
  const messages: Array<{ role: "user" | "assistant"; content: string }> = [];

  // Agregar historial (últimos 10 mensajes)
  const recentHistory = history.slice(-10);
  for (const msg of recentHistory) {
    messages.push({
      role: msg.role,
      content: msg.content,
    });
  }

  // Agregar mensaje actual
  messages.push({
    role: "user",
    content: currentMessage,
  });

  return messages;
}
