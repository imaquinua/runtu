// ============================================
// Single Conversation API
// ============================================
// GET /api/conversations/[id] - Obtener conversación con mensajes
// DELETE /api/conversations/[id] - Eliminar conversación
// PATCH /api/conversations/[id] - Actualizar título

import { NextRequest, NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import {
  getConversation,
  deleteConversation,
  updateConversationTitle,
} from "@/lib/db/conversations";

// ============================================
// GET - Get Conversation with Messages
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Servicio no disponible" }, { status: 503 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const conversation = await getConversation(id);

    if (!conversation) {
      return NextResponse.json({ error: "Conversación no encontrada" }, { status: 404 });
    }

    return NextResponse.json({ conversation });
  } catch (error) {
    console.error("[API/Conversations] GET Error:", error);
    return NextResponse.json(
      { error: "Error al obtener conversación" },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE - Delete Conversation
// ============================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Servicio no disponible" }, { status: 503 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    await deleteConversation(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API/Conversations] DELETE Error:", error);
    return NextResponse.json(
      { error: "Error al eliminar conversación" },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH - Update Title
// ============================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Servicio no disponible" }, { status: 503 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();

    if (!body.title) {
      return NextResponse.json({ error: "Título requerido" }, { status: 400 });
    }

    await updateConversationTitle(id, body.title);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API/Conversations] PATCH Error:", error);
    return NextResponse.json(
      { error: "Error al actualizar título" },
      { status: 500 }
    );
  }
}
