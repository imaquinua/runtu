// ============================================
// Chat Suggestions API
// ============================================
// POST /api/chat/suggestions - Generate follow-up questions

import { NextRequest, NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { generateFollowUps } from "@/lib/chat/suggestions";

interface SuggestionsRequestBody {
  lastUserMessage: string;
  lastAssistantResponse: string;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Verificar configuración
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Servicio no disponible" },
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
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // 3. Parsear body
    const body: SuggestionsRequestBody = await request.json();

    if (!body.lastUserMessage || !body.lastAssistantResponse) {
      return NextResponse.json(
        { error: "Mensajes requeridos" },
        { status: 400 }
      );
    }

    // 4. Generar sugerencias
    const suggestions = await generateFollowUps({
      lastUserMessage: body.lastUserMessage,
      lastAssistantResponse: body.lastAssistantResponse,
    });

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("[API/Chat/Suggestions] Error:", error);
    return NextResponse.json(
      { error: "Error generando sugerencias" },
      { status: 500 }
    );
  }
}
