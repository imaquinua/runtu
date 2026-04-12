// ============================================
// Alerts Database Functions
// ============================================
// CRUD operations para alertas proactivas

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Alert, AlertRow, AlertType, CreateAlertData } from "@/types/alerts";
import { alertFromRow, alertToRow } from "@/types/alerts";

// ============================================
// Read Operations
// ============================================

/**
 * Obtener alertas activas (no descartadas, no expiradas)
 */
export async function getActiveAlerts(
  businessId: string,
  options: { includeSeen?: boolean; limit?: number } = {}
): Promise<Alert[]> {
  const supabase = await createClient();
  const { includeSeen = true, limit = 10 } = options;

  let query = supabase
    .from("alerts")
    .select("*")
    .eq("business_id", businessId)
    .is("dismissed_at", null)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!includeSeen) {
    query = query.is("seen_at", null);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[DB/Alerts] Error fetching alerts:", error);
    throw new Error(`Failed to fetch alerts: ${error.message}`);
  }

  // Sort by priority then by date
  const alerts = (data || []).map((row) => alertFromRow(row as AlertRow));

  return alerts.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
}

/**
 * Obtener una alerta por ID
 */
export async function getAlert(id: string): Promise<Alert | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("alerts")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Failed to fetch alert: ${error.message}`);
  }

  return alertFromRow(data as AlertRow);
}

/**
 * Contar alertas no vistas
 */
export async function getUnseenCount(businessId: string): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("alerts")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId)
    .is("seen_at", null)
    .is("dismissed_at", null)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

  if (error) {
    console.error("[DB/Alerts] Error counting unseen:", error);
    return 0;
  }

  return count || 0;
}

// ============================================
// Write Operations
// ============================================

/**
 * Marcar alerta como vista
 */
export async function markAsSeen(id: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("alerts")
    .update({ seen_at: new Date().toISOString() })
    .eq("id", id)
    .is("seen_at", null);

  if (error) {
    throw new Error(`Failed to mark alert as seen: ${error.message}`);
  }
}

/**
 * Marcar todas las alertas como vistas
 */
export async function markAllAsSeen(businessId: string): Promise<number> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("alerts")
    .update({ seen_at: new Date().toISOString() })
    .eq("business_id", businessId)
    .is("seen_at", null)
    .is("dismissed_at", null)
    .select("id");

  if (error) {
    throw new Error(`Failed to mark all as seen: ${error.message}`);
  }

  return data?.length || 0;
}

/**
 * Descartar alerta
 */
export async function dismissAlert(id: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("alerts")
    .update({ dismissed_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to dismiss alert: ${error.message}`);
  }
}

/**
 * Descartar todas las alertas
 */
export async function dismissAllAlerts(businessId: string): Promise<number> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("alerts")
    .update({ dismissed_at: new Date().toISOString() })
    .eq("business_id", businessId)
    .is("dismissed_at", null)
    .select("id");

  if (error) {
    throw new Error(`Failed to dismiss all alerts: ${error.message}`);
  }

  return data?.length || 0;
}

// ============================================
// Admin Operations (service role)
// ============================================

/**
 * Crear alerta (usado internamente por el engine)
 */
export async function createAlert(data: CreateAlertData): Promise<Alert> {
  const supabase = createAdminClient();

  const row = alertToRow(data);

  const { data: created, error } = await supabase
    .from("alerts")
    .insert(row)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create alert: ${error.message}`);
  }

  return alertFromRow(created as AlertRow);
}

/**
 * Crear múltiples alertas
 */
export async function createAlerts(alerts: CreateAlertData[]): Promise<number> {
  const supabase = createAdminClient();

  const rows = alerts.map((a) => alertToRow(a));

  const { error, data } = await supabase
    .from("alerts")
    .insert(rows)
    .select("id");

  if (error) {
    throw new Error(`Failed to create alerts: ${error.message}`);
  }

  return data?.length || 0;
}

/**
 * Verificar si existe alerta similar reciente
 */
export async function alertExistsRecent(
  businessId: string,
  type: AlertType,
  title: string,
  withinDays: number = 7
): Promise<boolean> {
  const supabase = createAdminClient();

  const cutoffDate = new Date(
    Date.now() - withinDays * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data } = await supabase
    .from("alerts")
    .select("id")
    .eq("business_id", businessId)
    .eq("type", type)
    .eq("title", title)
    .gte("created_at", cutoffDate)
    .limit(1)
    .single();

  return !!data;
}

/**
 * Limpiar alertas expiradas (más de 7 días desde expiración)
 */
export async function cleanupExpiredAlerts(): Promise<number> {
  const supabase = createAdminClient();

  const cutoffDate = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000
  ).toISOString();

  const { error, data } = await supabase
    .from("alerts")
    .delete()
    .lt("expires_at", cutoffDate)
    .not("expires_at", "is", null)
    .select("id");

  if (error) {
    console.error("[DB/Alerts] Error cleaning up alerts:", error);
    return 0;
  }

  return data?.length || 0;
}

/**
 * Limpiar alertas antiguas descartadas (más de 30 días)
 */
export async function cleanupDismissedAlerts(): Promise<number> {
  const supabase = createAdminClient();

  const cutoffDate = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000
  ).toISOString();

  const { error, data } = await supabase
    .from("alerts")
    .delete()
    .lt("dismissed_at", cutoffDate)
    .not("dismissed_at", "is", null)
    .select("id");

  if (error) {
    console.error("[DB/Alerts] Error cleaning up dismissed alerts:", error);
    return 0;
  }

  return data?.length || 0;
}

// ============================================
// Stats
// ============================================

/**
 * Obtener estadísticas de alertas de un negocio
 */
export async function getAlertStats(businessId: string): Promise<{
  total: number;
  unseen: number;
  byType: Record<string, number>;
}> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("alerts")
    .select("type, seen_at, dismissed_at")
    .eq("business_id", businessId)
    .is("dismissed_at", null);

  if (!data || data.length === 0) {
    return {
      total: 0,
      unseen: 0,
      byType: {},
    };
  }

  const byType: Record<string, number> = {};
  let unseen = 0;

  for (const alert of data) {
    byType[alert.type] = (byType[alert.type] || 0) + 1;
    if (!alert.seen_at) unseen++;
  }

  return {
    total: data.length,
    unseen,
    byType,
  };
}
