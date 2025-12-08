// ============================================
// Reports Database Functions
// ============================================
// CRUD operations para reportes generados

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { GeneratedReport, ReportRow, ReportListItem } from "@/types/reports";
import { reportFromRow, reportToRow, getReportPreview } from "@/types/reports";

// ============================================
// Read Operations
// ============================================

/**
 * Obtener lista de reportes de un negocio
 */
export async function getReports(
  businessId: string,
  options: { limit?: number; offset?: number } = {}
): Promise<{ reports: ReportListItem[]; total: number }> {
  const supabase = await createClient();
  const { limit = 20, offset = 0 } = options;

  // Obtener reportes
  const { data, error, count } = await supabase
    .from("reports")
    .select("id, type, period, title, content, generated_at", { count: "exact" })
    .eq("business_id", businessId)
    .order("generated_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("[DB/Reports] Error fetching reports:", error);
    throw new Error(`Error al obtener reportes: ${error.message}`);
  }

  const reports: ReportListItem[] = (data || []).map((row) => ({
    id: row.id,
    type: row.type as ReportListItem["type"],
    period: row.period as ReportListItem["period"],
    title: row.title,
    generatedAt: new Date(row.generated_at),
    preview: getReportPreview(row.content),
  }));

  return { reports, total: count || 0 };
}

/**
 * Obtener un reporte específico
 */
export async function getReport(id: string): Promise<GeneratedReport | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    console.error("[DB/Reports] Error fetching report:", error);
    throw new Error(`Error al obtener reporte: ${error.message}`);
  }

  return reportFromRow(data as ReportRow);
}

/**
 * Obtener reporte por ID con validación de negocio
 */
export async function getReportForBusiness(
  id: string,
  businessId: string
): Promise<GeneratedReport | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("id", id)
    .eq("business_id", businessId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    console.error("[DB/Reports] Error fetching report:", error);
    throw new Error(`Error al obtener reporte: ${error.message}`);
  }

  return reportFromRow(data as ReportRow);
}

// ============================================
// Write Operations
// ============================================

/**
 * Guardar un reporte generado
 */
export async function saveReport(report: GeneratedReport): Promise<GeneratedReport> {
  const supabase = createAdminClient();

  const row = reportToRow(report);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const insertData: any = {
    id: report.id,
    business_id: row.business_id,
    type: row.type,
    period: row.period,
    custom_period_start: row.custom_period_start,
    custom_period_end: row.custom_period_end,
    title: row.title,
    content: row.content,
    html_content: row.html_content,
    metrics: row.metrics,
    config: row.config,
    generated_at: row.generated_at,
    expires_at: row.expires_at,
  };

  const { data, error } = await supabase
    .from("reports")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error("[DB/Reports] Error saving report:", error);
    throw new Error(`Error al guardar reporte: ${error.message}`);
  }

  return reportFromRow(data as ReportRow);
}

/**
 * Eliminar un reporte
 */
export async function deleteReport(id: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from("reports").delete().eq("id", id);

  if (error) {
    console.error("[DB/Reports] Error deleting report:", error);
    throw new Error(`Error al eliminar reporte: ${error.message}`);
  }
}

/**
 * Actualizar HTML cacheado de un reporte
 */
export async function updateReportHtml(
  id: string,
  htmlContent: string
): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("reports")
    .update({ html_content: htmlContent })
    .eq("id", id);

  if (error) {
    console.error("[DB/Reports] Error updating HTML:", error);
  }
}

// ============================================
// Admin Operations
// ============================================

/**
 * Limpiar reportes expirados
 */
export async function cleanupExpiredReports(): Promise<number> {
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("cleanup_expired_reports");

  if (error) {
    console.error("[DB/Reports] Error cleaning up reports:", error);
    return 0;
  }

  return data || 0;
}

/**
 * Obtener estadísticas de reportes de un negocio
 */
export async function getReportStats(
  businessId: string
): Promise<{ total: number; byType: Record<string, number> }> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("reports")
    .select("type")
    .eq("business_id", businessId);

  if (error) {
    console.error("[DB/Reports] Error fetching stats:", error);
    return { total: 0, byType: {} };
  }

  const byType: Record<string, number> = {};
  for (const row of data || []) {
    byType[row.type] = (byType[row.type] || 0) + 1;
  }

  return {
    total: data?.length || 0,
    byType,
  };
}
