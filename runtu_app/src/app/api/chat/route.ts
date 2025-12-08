// ============================================
// Chat API Route
// ============================================
// POST /api/chat - Procesa un mensaje de chat

import { NextRequest, NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { processChat, ChatError, type ChatHistoryMessage } from "@/lib/chat";

// ============================================
// Types
// ============================================

interface ChatRequestBody {
  message: string;
  history?: ChatHistoryMessage[];
  conversationId?: string;
}

// ============================================
// POST Handler
// ============================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Verificar configuración de Supabase
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        {
          error: "Servicio no disponible",
          code: "SERVICE_UNAVAILABLE",
        },
        { status: 503 }
      );
    }

    // 2. Autenticar usuario
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          error: "No autorizado",
          code: "UNAUTHORIZED",
        },
        { status: 401 }
      );
    }

    // 3. Obtener negocio del usuario
    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select("id, name")
      .eq("user_id", user.id)
      .single();

    if (businessError || !business) {
      return NextResponse.json(
        {
          error: "No se encontró el negocio",
          code: "NOT_FOUND",
        },
        { status: 404 }
      );
    }

    // 4. Parsear body
    let body: ChatRequestBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: "Body inválido",
          code: "INVALID_REQUEST",
        },
        { status: 400 }
      );
    }

    // 5. Validar mensaje
    if (!body.message || typeof body.message !== "string") {
      return NextResponse.json(
        {
          error: "El mensaje es requerido",
          code: "INVALID_REQUEST",
        },
        { status: 400 }
      );
    }

    const trimmedMessage = body.message.trim();
    if (trimmedMessage.length === 0) {
      return NextResponse.json(
        {
          error: "El mensaje no puede estar vacío",
          code: "INVALID_REQUEST",
        },
        { status: 400 }
      );
    }

    if (trimmedMessage.length > 4000) {
      return NextResponse.json(
        {
          error: "El mensaje es demasiado largo (máximo 4000 caracteres)",
          code: "INVALID_REQUEST",
        },
        { status: 400 }
      );
    }

    // 6. Procesar chat
    const response = await processChat(
      {
        businessId: business.id,
        message: trimmedMessage,
        history: body.history,
        conversationId: body.conversationId,
      },
      {
        businessName: business.name,
      }
    );

    // 7. Retornar respuesta
    return NextResponse.json({
      content: response.content,
      sources: response.sources,
      conversationId: response.conversationId,
      metrics: {
        totalTimeMs: response.metrics.totalTimeMs,
        chunksUsed: response.metrics.chunksUsed,
      },
    });
  } catch (error) {
    const elapsed = Date.now() - startTime;

    // Manejar ChatError
    if (error instanceof ChatError) {
      console.error("[API/Chat] ChatError:", {
        code: error.code,
        message: error.message,
        elapsed,
      });

      const statusMap: Record<string, number> = {
        INVALID_REQUEST: 400,
        UNAUTHORIZED: 401,
        NO_KNOWLEDGE: 200, // No es un error, es un estado válido
        RAG_FAILED: 500,
        LLM_FAILED: 500,
        RATE_LIMITED: 429,
        INTERNAL_ERROR: 500,
      };

      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
        },
        { status: statusMap[error.code] || 500 }
      );
    }

    // Error genérico
    console.error("[API/Chat] Unexpected error:", {
      error: error instanceof Error ? error.message : "Unknown",
      elapsed,
    });

    return NextResponse.json(
      {
        error: "Ocurrió un error inesperado. Por favor intenta de nuevo.",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}

// ============================================
// GET Handler (for health check)
// ============================================

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "chat",
    timestamp: new Date().toISOString(),
  });
}
