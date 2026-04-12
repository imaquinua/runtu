// ============================================
// Title Generation API
// ============================================
// POST /api/conversations/[id]/title - Generar y guardar título

import { NextRequest, NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { updateConversationTitle } from "@/lib/db/conversations";
import { generateConversationTitle } from "@/lib/chat/title";

// ============================================
// POST - Generate and Save Title
// ============================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Servicio no disponible" }, { status: 503 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();

    if (!body.userMessage || !body.assistantResponse) {
      return NextResponse.json(
        { error: "userMessage y assistantResponse son requeridos" },
        { status: 400 }
      );
    }

    // Generar título con IA
    const title = await generateConversationTitle(
      body.userMessage,
      body.assistantResponse
    );

    // Guardar en BD
    await updateConversationTitle(conversationId, title);

    return NextResponse.json({ title });
  } catch (error) {
    console.error("[API/Title] POST Error:", error);
    return NextResponse.json(
      { error: "Error al generar título" },
      { status: 500 }
    );
  }
}
