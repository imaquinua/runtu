// ============================================
// Summaries Database Functions
// ============================================
// CRUD operations para resúmenes automáticos

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  Summary,
  SummaryType,
  SummaryRow,
  GetSummariesParams,
  summaryFromRow,
} from "@/types/summaries";

// Re-export converter
export { summaryFromRow } from "@/types/summaries";

// ============================================
// Read Operations
// ============================================

/**
 * Obtener lista de resúmenes de un negocio
 */
export async function getSummaries(
  params: GetSummariesParams
): Promise<{ summaries: Summary[]; total: number }> {
  const supabase = await createClient();

  let query = supabase
    .from("summaries")
    .select("*", { count: "exact" })
    .eq("business_id", params.businessId)
    .order("period_start", { ascending: false });

  // Filtrar por tipo si se especifica
  if (params.type) {
    query = query.eq("type", params.type);
  }

  // Filtrar solo no leídos
  if (params.unreadOnly) {
    query = query.is("read_at", null);
  }

  // Paginación
  const limit = params.limit || 20;
  const offset = params.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error) {
    console.error("[DB/Summaries] Error fetching summaries:", error);
    throw new Error(`Failed to fetch summaries: ${error.message}`);
  }

  const { summaryFromRow } = await import("@/types/summaries");

  return {
    summaries: (data || []).map((row) => summaryFromRow(row as unknown as SummaryRow)),
    total: count || 0,
  };
}

/**
 * Obtener un resumen específico por ID
 */
export async function getSummary(id: string): Promise<Summary | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("summaries")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null; // No encontrado
    }
    throw new Error(`Failed to fetch summary: ${error.message}`);
  }

  const { summaryFromRow } = await import("@/types/summaries");
  return summaryFromRow(data as unknown as SummaryRow);
}

/**
 * Obtener el último resumen de un tipo específico
 */
export async function getLatestSummary(
  businessId: string,
  type: SummaryType
): Promise<Summary | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("summaries")
    .select("*")
    .eq("business_id", businessId)
    .eq("type", type)
    .order("period_start", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Failed to fetch latest summary: ${error.message}`);
  }

  const { summaryFromRow } = await import("@/types/summaries");
  return summaryFromRow(data as unknown as SummaryRow);
}

/**
 * Obtener los últimos resúmenes de cada tipo
 */
export async function getLatestSummaries(
  businessId: string
): Promise<Record<SummaryType, Summary | null>> {
  const supabase = await createClient();

  // Obtener el más reciente de cada tipo
  const types: SummaryType[] = ["daily", "weekly", "monthly"];
  const result: Record<SummaryType, Summary | null> = {
    daily: null,
    weekly: null,
    monthly: null,
  };

  for (const type of types) {
    const summary = await getLatestSummary(businessId, type);
    result[type] = summary;
  }

  return result;
}

/**
 * Contar resúmenes no leídos
 */
export async function getUnreadCount(businessId: string): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("summaries")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId)
    .is("read_at", null);

  if (error) {
    console.error("[DB/Summaries] Error counting unread:", error);
    return 0;
  }

  return count || 0;
}

// ============================================
// Write Operations
// ============================================

/**
 * Marcar resumen como leído
 */
export async function markAsRead(id: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("summaries")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .is("read_at", null); // Solo si no está ya leído

  if (error) {
    throw new Error(`Failed to mark summary as read: ${error.message}`);
  }
}

/**
 * Marcar todos los resúmenes como leídos
 */
export async function markAllAsRead(businessId: string): Promise<number> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("summaries")
    .update({ read_at: new Date().toISOString() })
    .eq("business_id", businessId)
    .is("read_at", null)
    .select("id");

  if (error) {
    throw new Error(`Failed to mark all as read: ${error.message}`);
  }

  return data?.length || 0;
}

/**
 * Eliminar un resumen
 */
export async function deleteSummary(id: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from("summaries").delete().eq("id", id);

  if (error) {
    throw new Error(`Failed to delete summary: ${error.message}`);
  }
}

// ============================================
// Admin Operations (usando service role)
// ============================================

/**
 * Verificar si ya existe un resumen para un período
 */
export async function summaryExists(
  businessId: string,
  type: SummaryType,
  periodStart: Date
): Promise<boolean> {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("summaries")
    .select("id")
    .eq("business_id", businessId)
    .eq("type", type)
    .eq("period_start", periodStart.toISOString().split("T")[0])
    .single();

  return !!data;
}

/**
 * Crear resumen (usado internamente por el generador)
 */
export async function createSummary(
  data: Omit<SummaryRow, "id" | "generated_at">
): Promise<Summary> {
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: created, error } = await supabase
    .from("summaries")
    .insert(data as any)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create summary: ${error.message}`);
  }

  const { summaryFromRow } = await import("@/types/summaries");
  return summaryFromRow(created as unknown as SummaryRow);
}

/**
 * Obtener businesses que necesitan resumen
 */
export async function getBusinessesNeedingSummary(
  type: SummaryType,
  periodStart: Date
): Promise<string[]> {
  const supabase = createAdminClient();

  // Obtener todos los businesses
  const { data: businesses } = await supabase
    .from("businesses")
    .select("id");

  if (!businesses) return [];

  // Obtener los que ya tienen resumen
  const { data: existing } = await supabase
    .from("summaries")
    .select("business_id")
    .eq("type", type)
    .eq("period_start", periodStart.toISOString().split("T")[0]);

  const existingIds = new Set((existing || []).map((e) => e.business_id));

  // Retornar los que no tienen
  return businesses
    .map((b) => b.id)
    .filter((id) => !existingIds.has(id));
}

// ============================================
// Stats
// ============================================

/**
 * Obtener estadísticas de resúmenes de un negocio
 */
export async function getSummaryStats(businessId: string): Promise<{
  total: number;
  unread: number;
  byType: Record<SummaryType, number>;
  lastGenerated: Date | null;
}> {
  const supabase = await createClient();

  // Total y por tipo
  const { data: all } = await supabase
    .from("summaries")
    .select("type, read_at, generated_at")
    .eq("business_id", businessId);

  if (!all || all.length === 0) {
    return {
      total: 0,
      unread: 0,
      byType: { daily: 0, weekly: 0, monthly: 0 },
      lastGenerated: null,
    };
  }

  const byType: Record<SummaryType, number> = { daily: 0, weekly: 0, monthly: 0 };
  let unread = 0;
  let lastGenerated: Date | null = null;

  for (const summary of all) {
    byType[summary.type as SummaryType]++;
    if (!summary.read_at) unread++;

    const genDate = new Date(summary.generated_at);
    if (!lastGenerated || genDate > lastGenerated) {
      lastGenerated = genDate;
    }
  }

  return {
    total: all.length,
    unread,
    byType,
    lastGenerated,
  };
}
