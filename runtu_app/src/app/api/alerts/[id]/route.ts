// ============================================
// Alerts API - Single Alert Routes
// ============================================
// GET: Obtener alerta específica
// PATCH: Marcar como vista
// DELETE: Descartar alerta

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAlert, markAsSeen, dismissAlert } from "@/lib/db/alerts";

// ============================================
// GET /api/alerts/[id]
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const alert = await getAlert(id);

    if (!alert) {
      return NextResponse.json(
        { error: "Alerta no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que la alerta pertenece al usuario
    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("user_id", user.id)
      .eq("id", alert.businessId)
      .single();

    if (!business) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    return NextResponse.json({
      alert: {
        ...alert,
        createdAt: alert.createdAt.toISOString(),
        seenAt: alert.seenAt?.toISOString() || null,
        dismissedAt: alert.dismissedAt?.toISOString() || null,
        expiresAt: alert.expiresAt?.toISOString() || null,
      },
    });
  } catch (error) {
    console.error("[API/Alerts] Error:", error);
    return NextResponse.json(
      { error: "Error al obtener alerta" },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH /api/alerts/[id]
// ============================================
// Marcar como vista

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar que la alerta existe y pertenece al usuario
    const alert = await getAlert(id);

    if (!alert) {
      return NextResponse.json(
        { error: "Alerta no encontrada" },
        { status: 404 }
      );
    }

    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("user_id", user.id)
      .eq("id", alert.businessId)
      .single();

    if (!business) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Marcar como vista
    await markAsSeen(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API/Alerts] Error:", error);
    return NextResponse.json(
      { error: "Error al marcar alerta" },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/alerts/[id]
// ============================================
// Descartar alerta

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar que la alerta existe y pertenece al usuario
    const alert = await getAlert(id);

    if (!alert) {
      return NextResponse.json(
        { error: "Alerta no encontrada" },
        { status: 404 }
      );
    }

    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("user_id", user.id)
      .eq("id", alert.businessId)
      .single();

    if (!business) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Descartar
    await dismissAlert(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API/Alerts] Error:", error);
    return NextResponse.json(
      { error: "Error al descartar alerta" },
      { status: 500 }
    );
  }
}
