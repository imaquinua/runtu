// ============================================
// Alerts API - Main Routes
// ============================================
// GET: Lista alertas activas
// PATCH: Marca todas como vistas

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getActiveAlerts,
  getUnseenCount,
  markAllAsSeen,
  dismissAllAlerts,
} from "@/lib/db/alerts";
import type { Alert } from "@/types/alerts";

// ============================================
// GET /api/alerts
// ============================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener business del usuario
    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (bizError || !business) {
      return NextResponse.json(
        { error: "Negocio no encontrado" },
        { status: 404 }
      );
    }

    // Parámetros opcionales
    const { searchParams } = new URL(request.url);
    const includeSeen = searchParams.get("includeSeen") !== "false";
    const limit = parseInt(searchParams.get("limit") || "10");
    const countOnly = searchParams.get("countOnly") === "true";

    // Si solo se pide el conteo
    if (countOnly) {
      const count = await getUnseenCount(business.id);
      return NextResponse.json({ count });
    }

    // Obtener alertas
    const alerts = await getActiveAlerts(business.id, { includeSeen, limit });

    // Serializar fechas
    const serializedAlerts = alerts.map(serializeAlert);

    return NextResponse.json({
      alerts: serializedAlerts,
      total: alerts.length,
      unseen: alerts.filter((a) => !a.seenAt).length,
    });
  } catch (error) {
    console.error("[API/Alerts] Error:", error);
    return NextResponse.json(
      { error: "Error al obtener alertas" },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH /api/alerts
// ============================================
// Acciones masivas: markAllSeen, dismissAll

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener business
    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!business) {
      return NextResponse.json(
        { error: "Negocio no encontrado" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { action } = body;

    if (action === "markAllSeen") {
      const count = await markAllAsSeen(business.id);
      return NextResponse.json({ success: true, marked: count });
    }

    if (action === "dismissAll") {
      const count = await dismissAllAlerts(business.id);
      return NextResponse.json({ success: true, dismissed: count });
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  } catch (error) {
    console.error("[API/Alerts] Error:", error);
    return NextResponse.json(
      { error: "Error al actualizar alertas" },
      { status: 500 }
    );
  }
}

// ============================================
// Helpers
// ============================================

function serializeAlert(alert: Alert) {
  return {
    ...alert,
    createdAt: alert.createdAt.toISOString(),
    seenAt: alert.seenAt?.toISOString() || null,
    dismissedAt: alert.dismissedAt?.toISOString() || null,
    expiresAt: alert.expiresAt?.toISOString() || null,
  };
}
