// ============================================
// Single Summary API
// ============================================
// GET /api/summaries/[id] - Obtiene un resumen específico
// DELETE /api/summaries/[id] - Elimina un resumen

import { NextRequest, NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getSummary, markAsRead, deleteSummary } from "@/lib/db/summaries";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// ============================================
// GET - Obtener resumen específico
// ============================================

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Servicio no disponible" },
        { status: 503 }
      );
    }

    const { id } = await context.params;

    // Autenticar usuario
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener resumen
    const summary = await getSummary(id);

    if (!summary) {
      return NextResponse.json(
        { error: "Resumen no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que pertenece al usuario
    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("owner_id", user.id)
      .eq("id", summary.businessId)
      .single();

    if (!business) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Marcar como leído si no lo estaba
    if (!summary.readAt) {
      await markAsRead(id);
      summary.readAt = new Date();
    }

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("[API/Summaries/ID] GET error:", error);
    return NextResponse.json(
      { error: "Error obteniendo resumen" },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE - Eliminar resumen
// ============================================

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Servicio no disponible" },
        { status: 503 }
      );
    }

    const { id } = await context.params;

    // Autenticar usuario
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener resumen para verificar ownership
    const summary = await getSummary(id);

    if (!summary) {
      return NextResponse.json(
        { error: "Resumen no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que pertenece al usuario
    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("owner_id", user.id)
      .eq("id", summary.businessId)
      .single();

    if (!business) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Eliminar
    await deleteSummary(id);

    return NextResponse.json({ message: "Resumen eliminado" });
  } catch (error) {
    console.error("[API/Summaries/ID] DELETE error:", error);
    return NextResponse.json(
      { error: "Error eliminando resumen" },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH - Marcar como leído
// ============================================

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Servicio no disponible" },
        { status: 503 }
      );
    }

    const { id } = await context.params;

    // Autenticar usuario
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener resumen para verificar ownership
    const summary = await getSummary(id);

    if (!summary) {
      return NextResponse.json(
        { error: "Resumen no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que pertenece al usuario
    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("owner_id", user.id)
      .eq("id", summary.businessId)
      .single();

    if (!business) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Marcar como leído
    await markAsRead(id);

    return NextResponse.json({ message: "Marcado como leído" });
  } catch (error) {
    console.error("[API/Summaries/ID] PATCH error:", error);
    return NextResponse.json(
      { error: "Error marcando como leído" },
      { status: 500 }
    );
  }
}
