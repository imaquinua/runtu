// ============================================
// Alert Engine
// ============================================
// Orquestador principal que ejecuta todos los
// detectores y gestiona la creación de alertas.

import { createAdminClient } from "@/lib/supabase/admin";
import {
  detectInactivity,
  detectMilestones,
  detectTips,
  detectInsights,
} from "./detectors";
import type { CreateAlertData, AlertPriority } from "@/types/alerts";
import { alertToRow, getPriorityWeight } from "@/types/alerts";

// Máximo de alertas por ejecución (para no spamear)
const MAX_ALERTS_PER_RUN = 3;

// Cooldown entre alertas del mismo tipo (en días)
const ALERT_TYPE_COOLDOWN: Record<string, number> = {
  inactivity: 7,
  milestone: 0, // Milestones son únicos, no necesitan cooldown
  tip: 7,
  insight: 7,
  anomaly: 3,
  reminder: 1,
};

export interface AlertDetectionResult {
  businessId: string;
  generated: number;
  alerts: CreateAlertData[];
  errors: string[];
}

/**
 * Ejecuta todos los detectores de alertas para un negocio
 */
export async function runAlertDetection(
  businessId: string
): Promise<AlertDetectionResult> {
  console.log(`[AlertEngine] Starting detection for business ${businessId}`);

  const result: AlertDetectionResult = {
    businessId,
    generated: 0,
    alerts: [],
    errors: [],
  };

  // Ejecutar todos los detectores en paralelo
  const detectorResults = await Promise.allSettled([
    detectInactivity(businessId),
    detectMilestones(businessId),
    detectTips(businessId),
    detectInsights(businessId),
  ]);

  // Recolectar alertas y errores
  const allAlerts: CreateAlertData[] = [];

  detectorResults.forEach((dr, index) => {
    const detectorName = ["inactivity", "milestones", "tips", "insights"][index];

    if (dr.status === "fulfilled") {
      const alerts = dr.value;
      if (Array.isArray(alerts)) {
        allAlerts.push(...alerts);
      } else if (alerts) {
        allAlerts.push(alerts);
      }
    } else {
      console.error(`[AlertEngine] ${detectorName} failed:`, dr.reason);
      result.errors.push(`${detectorName}: ${dr.reason?.message || "Unknown error"}`);
    }
  });

  console.log(`[AlertEngine] Found ${allAlerts.length} potential alerts`);

  // Filtrar alertas duplicadas o con cooldown activo
  const filteredAlerts = await filterAlerts(businessId, allAlerts);

  console.log(`[AlertEngine] ${filteredAlerts.length} alerts after filtering`);

  // Priorizar y limitar
  const prioritizedAlerts = prioritizeAlerts(filteredAlerts).slice(
    0,
    MAX_ALERTS_PER_RUN
  );

  // Guardar alertas
  if (prioritizedAlerts.length > 0) {
    const saved = await saveAlerts(prioritizedAlerts);
    result.generated = saved;
    result.alerts = prioritizedAlerts;
  }

  console.log(`[AlertEngine] Saved ${result.generated} alerts`);

  return result;
}

/**
 * Ejecuta detección de alertas para todos los negocios activos
 */
export async function runAlertDetectionForAllBusinesses(): Promise<{
  processed: number;
  totalAlerts: number;
  errors: number;
}> {
  const supabase = createAdminClient();

  // Obtener negocios con actividad en los últimos 30 días
  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data: activeBusinesses } = await supabase
    .from("businesses")
    .select("id")
    .or(
      `id.in.(${supabase
        .from("uploads")
        .select("business_id")
        .gte("created_at", thirtyDaysAgo)
        .limit(1000)}),` +
        `id.in.(${supabase
          .from("conversations")
          .select("business_id")
          .gte("created_at", thirtyDaysAgo)
          .limit(1000)})`
    );

  // Fallback: si la query compleja falla, obtener todos
  let businesses = activeBusinesses;
  if (!businesses || businesses.length === 0) {
    const { data: allBusinesses } = await supabase
      .from("businesses")
      .select("id")
      .limit(100);
    businesses = allBusinesses;
  }

  if (!businesses || businesses.length === 0) {
    console.log("[AlertEngine] No businesses to process");
    return { processed: 0, totalAlerts: 0, errors: 0 };
  }

  console.log(`[AlertEngine] Processing ${businesses.length} businesses`);

  const results = await Promise.allSettled(
    businesses.map((b) => runAlertDetection(b.id))
  );

  let totalAlerts = 0;
  let errors = 0;

  results.forEach((r) => {
    if (r.status === "fulfilled") {
      totalAlerts += r.value.generated;
      if (r.value.errors.length > 0) errors++;
    } else {
      errors++;
    }
  });

  return {
    processed: businesses.length,
    totalAlerts,
    errors,
  };
}

/**
 * Filtra alertas duplicadas y con cooldown activo
 */
async function filterAlerts(
  businessId: string,
  alerts: CreateAlertData[]
): Promise<CreateAlertData[]> {
  const supabase = createAdminClient();

  // Obtener alertas recientes
  const { data: recentAlerts } = await supabase
    .from("alerts")
    .select("type, title, created_at")
    .eq("business_id", businessId)
    .gte(
      "created_at",
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    );

  const recentByType = new Map<string, Date>();
  const recentTitles = new Set<string>();

  (recentAlerts || []).forEach((a) => {
    const existing = recentByType.get(a.type);
    const alertDate = new Date(a.created_at);

    if (!existing || alertDate > existing) {
      recentByType.set(a.type, alertDate);
    }

    recentTitles.add(a.title);
  });

  return alerts.filter((alert) => {
    // Verificar duplicado por título exacto
    if (recentTitles.has(alert.title)) {
      return false;
    }

    // Verificar cooldown por tipo
    const cooldownDays = ALERT_TYPE_COOLDOWN[alert.type] || 7;
    const lastOfType = recentByType.get(alert.type);

    if (lastOfType) {
      const daysSince = Math.floor(
        (Date.now() - lastOfType.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSince < cooldownDays) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Ordena alertas por prioridad
 */
function prioritizeAlerts(alerts: CreateAlertData[]): CreateAlertData[] {
  return [...alerts].sort((a, b) => {
    const priorityDiff =
      getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
    return priorityDiff;
  });
}

/**
 * Guarda alertas en la base de datos
 */
async function saveAlerts(alerts: CreateAlertData[]): Promise<number> {
  const supabase = createAdminClient();

  const rows = alerts.map((a) => alertToRow(a));

  const { error, data } = await supabase
    .from("alerts")
    .insert(rows)
    .select("id");

  if (error) {
    console.error("[AlertEngine] Error saving alerts:", error);
    return 0;
  }

  return data?.length || 0;
}

/**
 * Limpia alertas expiradas
 */
export async function cleanupExpiredAlerts(): Promise<number> {
  const supabase = createAdminClient();

  const { error, data } = await supabase
    .from("alerts")
    .delete()
    .lt("expires_at", new Date().toISOString())
    .not("expires_at", "is", null)
    .select("id");

  if (error) {
    console.error("[AlertEngine] Error cleaning up alerts:", error);
    return 0;
  }

  return data?.length || 0;
}
