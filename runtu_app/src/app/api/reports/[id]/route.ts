// ============================================
// Reports API - Single Report Routes
// ============================================
// GET: Obtener reporte específico
// DELETE: Eliminar reporte

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getReportForBusiness, deleteReport } from "@/lib/db/reports";
import { exportReport, getPrintReadyHtml } from "@/lib/reports";
import type { ExportFormat } from "@/types/reports";

// ============================================
// GET /api/reports/[id]
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

    // Obtener negocio del usuario
    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    // Verificar si se solicita descarga
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get("format") as ExportFormat | null;

    // Obtener reporte
    const report = await getReportForBusiness(id, business.id);

    if (!report) {
      return NextResponse.json({ error: "Reporte no encontrado" }, { status: 404 });
    }

    // Si se solicita formato de descarga
    if (format) {
      const validFormats: ExportFormat[] = ["pdf", "docx", "md", "html"];
      if (!validFormats.includes(format)) {
        return NextResponse.json({ error: "Formato inválido" }, { status: 400 });
      }

      // Para PDF, retornar HTML para impresión del lado del cliente
      if (format === "pdf") {
        const html = getPrintReadyHtml(report);
        return new NextResponse(html, {
          headers: {
            "Content-Type": "text/html",
            "Content-Disposition": `attachment; filename="${encodeURIComponent(report.title)}.html"`,
          },
        });
      }

      // Otros formatos
      const { content, mimeType, filename } = await exportReport(report, format);

      return new NextResponse(content, {
        headers: {
          "Content-Type": mimeType,
          "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
        },
      });
    }

    // Retornar reporte completo
    return NextResponse.json({
      report: {
        id: report.id,
        businessId: report.businessId,
        config: report.config,
        title: report.title,
        content: report.content,
        metrics: report.metrics,
        generatedAt: report.generatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[API/Reports] Error:", error);
    return NextResponse.json(
      { error: "Error al obtener reporte" },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/reports/[id]
// ============================================

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

    // Obtener negocio del usuario
    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    // Verificar que el reporte existe y pertenece al negocio
    const report = await getReportForBusiness(id, business.id);

    if (!report) {
      return NextResponse.json({ error: "Reporte no encontrado" }, { status: 404 });
    }

    // Eliminar
    await deleteReport(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API/Reports] Error deleting:", error);
    return NextResponse.json(
      { error: "Error al eliminar reporte" },
      { status: 500 }
    );
  }
}
