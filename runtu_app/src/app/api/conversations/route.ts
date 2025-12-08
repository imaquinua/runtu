// ============================================
// Conversations API
// ============================================
// GET /api/conversations - Lista conversaciones
// POST /api/conversations - Crear conversación

import { NextRequest, NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import {
  getConversations,
  createConversation,
} from "@/lib/db/conversations";

// ============================================
// GET - List Conversations
// ============================================

export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Servicio no disponible" }, { status: 503 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener negocio del usuario
    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (bizError || !business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    const conversations = await getConversations(business.id);

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("[API/Conversations] GET Error:", error);
    return NextResponse.json(
      { error: "Error al obtener conversaciones" },
      { status: 500 }
    );
  }
}

// ============================================
// POST - Create Conversation
// ============================================

export async function POST() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Servicio no disponible" }, { status: 503 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener negocio del usuario
    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (bizError || !business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    const conversation = await createConversation(business.id);

    return NextResponse.json({ conversation }, { status: 201 });
  } catch (error) {
    console.error("[API/Conversations] POST Error:", error);
    return NextResponse.json(
      { error: "Error al crear conversación" },
      { status: 500 }
    );
  }
}
