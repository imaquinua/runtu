// ============================================
// Summaries API
// ============================================
// GET /api/summaries - Lista resúmenes del usuario
// POST /api/summaries - Genera resumen on-demand

import { NextRequest, NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getSummaries, getUnreadCount, markAllAsRead } from "@/lib/db/summaries";
import { generateSummary } from "@/lib/summaries/generator";
import { getPeriodDates } from "@/types/summaries";
import type { SummaryType } from "@/types/summaries";

// ============================================
// GET - Lista resúmenes
// ============================================

export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Servicio no disponible" },
        { status: 503 }
      );
    }

    // Autenticar usuario
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener business del usuario
    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (!business) {
      return NextResponse.json(
        { error: "Negocio no encontrado" },
        { status: 404 }
      );
    }

    // Parsear query params
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as SummaryType | null;
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const unreadOnly = searchParams.get("unread") === "true";

    // Obtener resúmenes
    const { summaries, total } = await getSummaries({
      businessId: business.id,
      type: type || undefined,
      limit,
      offset,
      unreadOnly,
    });

    // Obtener conteo de no leídos
    const unreadCount = await getUnreadCount(business.id);

    return NextResponse.json({
      summaries,
      total,
      unreadCount,
      pagination: {
        limit,
        offset,
        hasMore: offset + summaries.length < total,
      },
    });
  } catch (error) {
    console.error("[API/Summaries] GET error:", error);
    return NextResponse.json(
      { error: "Error obteniendo resúmenes" },
      { status: 500 }
    );
  }
}

// ============================================
// POST - Generar resumen on-demand
// ============================================

interface GenerateRequestBody {
  type: SummaryType;
  force?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Servicio no disponible" },
        { status: 503 }
      );
    }

    // Autenticar usuario
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener business del usuario
    const { data: business } = await supabase
      .from("businesses")
      .select("id, name")
      .eq("owner_id", user.id)
      .single();

    if (!business) {
      return NextResponse.json(
        { error: "Negocio no encontrado" },
        { status: 404 }
      );
    }

    // Parsear body
    const body: GenerateRequestBody = await request.json();

    if (!body.type || !["daily", "weekly", "monthly"].includes(body.type)) {
      return NextResponse.json(
        { error: "Tipo de resumen inválido" },
        { status: 400 }
      );
    }

    // Calcular período
    const { start, end } = getPeriodDates(body.type);

    // Generar resumen
    const summary = await generateSummary({
      businessId: business.id,
      type: body.type,
      periodStart: start,
      periodEnd: end,
      force: body.force || false,
    });

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("[API/Summaries] POST error:", error);

    // Si ya existe, retornar error específico
    if (error instanceof Error && error.message.includes("already exists")) {
      return NextResponse.json(
        { error: "Ya existe un resumen para este período" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Error generando resumen" },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH - Marcar todos como leídos
// ============================================

export async function PATCH(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Servicio no disponible" },
        { status: 503 }
      );
    }

    // Autenticar usuario
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener business del usuario
    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (!business) {
      return NextResponse.json(
        { error: "Negocio no encontrado" },
        { status: 404 }
      );
    }

    // Marcar todos como leídos
    const count = await markAllAsRead(business.id);

    return NextResponse.json({
      message: `${count} resúmenes marcados como leídos`,
      count,
    });
  } catch (error) {
    console.error("[API/Summaries] PATCH error:", error);
    return NextResponse.json(
      { error: "Error marcando como leídos" },
      { status: 500 }
    );
  }
}
