// ============================================
// Reports API Routes
// ============================================
// GET: Listar reportes
// POST: Generar nuevo reporte

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateReport } from "@/lib/reports";
import { getReports, saveReport } from "@/lib/db/reports";
import type { ReportConfig, ReportType, ReportPeriod } from "@/types/reports";

export const maxDuration = 60; // 60 segundos para generación

// ============================================
// GET /api/reports
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

    // Obtener negocio del usuario
    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    // Parámetros de paginación
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Obtener reportes
    const { reports, total } = await getReports(business.id, { limit, offset });

    return NextResponse.json({
      reports: reports.map((r) => ({
        ...r,
        generatedAt: r.generatedAt.toISOString(),
      })),
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("[API/Reports] Error:", error);
    return NextResponse.json(
      { error: "Error al obtener reportes" },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/reports
// ============================================

export async function POST(request: NextRequest) {
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

    // Obtener negocio del usuario
    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    // Parsear body
    const body = await request.json();

    // Validar tipo de reporte
    const validTypes: ReportType[] = ["executive", "detailed", "financial", "operational", "custom"];
    if (!body.type || !validTypes.includes(body.type)) {
      return NextResponse.json(
        { error: "Tipo de reporte inválido" },
        { status: 400 }
      );
    }

    // Validar período
    const validPeriods: ReportPeriod[] = ["last_week", "last_month", "last_quarter", "last_year", "custom"];
    if (!body.period || !validPeriods.includes(body.period)) {
      return NextResponse.json(
        { error: "Período inválido" },
        { status: 400 }
      );
    }

    // Construir configuración
    const config: ReportConfig = {
      type: body.type,
      period: body.period,
      includeCharts: body.includeCharts || false,
      language: body.language || "es",
      title: body.title,
      sections: body.sections,
    };

    // Período personalizado
    if (body.period === "custom") {
      if (!body.customPeriodStart || !body.customPeriodEnd) {
        return NextResponse.json(
          { error: "Período personalizado requiere fechas de inicio y fin" },
          { status: 400 }
        );
      }
      config.customPeriod = {
        start: new Date(body.customPeriodStart),
        end: new Date(body.customPeriodEnd),
      };
    }

    console.log(`[API/Reports] Generating ${config.type} report for business ${business.id}`);

    // Generar reporte
    const report = await generateReport(business.id, config);

    // Guardar en base de datos
    const savedReport = await saveReport(report);

    console.log(`[API/Reports] Report saved: ${savedReport.id}`);

    return NextResponse.json({
      report: {
        id: savedReport.id,
        title: savedReport.title,
        type: savedReport.config.type,
        period: savedReport.config.period,
        generatedAt: savedReport.generatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[API/Reports] Error generating report:", error);
    return NextResponse.json(
      {
        error: "Error al generar reporte",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
