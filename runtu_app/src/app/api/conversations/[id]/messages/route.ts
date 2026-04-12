// ============================================
// Messages API
// ============================================
// POST /api/conversations/[id]/messages - Agregar mensaje

import { NextRequest, NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { addMessage } from "@/lib/db/conversations";

// ============================================
// POST - Add Message
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

    if (!body.role || !body.content) {
      return NextResponse.json(
        { error: "Role y content son requeridos" },
        { status: 400 }
      );
    }

    if (!["user", "assistant"].includes(body.role)) {
      return NextResponse.json(
        { error: "Role debe ser 'user' o 'assistant'" },
        { status: 400 }
      );
    }

    const message = await addMessage({
      conversationId,
      role: body.role,
      content: body.content,
      sources: body.sources,
      tokensUsed: body.tokensUsed,
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("[API/Messages] POST Error:", error);
    return NextResponse.json(
      { error: "Error al agregar mensaje" },
      { status: 500 }
    );
  }
}
