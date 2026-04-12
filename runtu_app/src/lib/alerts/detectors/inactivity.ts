// ============================================
// Inactivity Detector
// ============================================
// Detecta cuando un usuario no ha subido archivos
// en un período de tiempo prolongado.

import { createAdminClient } from "@/lib/supabase/admin";
import type { CreateAlertData } from "@/types/alerts";

const INACTIVITY_THRESHOLDS = {
  WARNING: 7, // días
  CRITICAL: 14, // días
};

export async function detectInactivity(
  businessId: string
): Promise<CreateAlertData | null> {
  const supabase = createAdminClient();

  // Obtener último upload
  const { data: lastUpload } = await supabase
    .from("uploads")
    .select("created_at")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // Si nunca ha subido nada, no alertar (el onboarding se encarga)
  if (!lastUpload) {
    return null;
  }

  const lastUploadDate = new Date(lastUpload.created_at);
  const now = new Date();
  const daysSinceUpload = Math.floor(
    (now.getTime() - lastUploadDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Si está dentro del umbral de advertencia, no alertar
  if (daysSinceUpload < INACTIVITY_THRESHOLDS.WARNING) {
    return null;
  }

  // Verificar si ya existe alerta de inactividad reciente
  const { data: existingAlert } = await supabase
    .from("alerts")
    .select("id")
    .eq("business_id", businessId)
    .eq("type", "inactivity")
    .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .limit(1)
    .single();

  if (existingAlert) {
    return null; // Ya hay una alerta reciente
  }

  // Determinar prioridad y mensaje
  const isCritical = daysSinceUpload >= INACTIVITY_THRESHOLDS.CRITICAL;

  return {
    businessId,
    type: "inactivity",
    priority: isCritical ? "high" : "medium",
    title: isCritical ? "Te extrañamos" : "¿Sigues ahí?",
    message: isCritical
      ? `Han pasado ${daysSinceUpload} días desde que subiste algo. Runtu funciona mejor mientras más información le des.`
      : `Han pasado ${daysSinceUpload} días desde tu último archivo. Mientras más me cuentes, mejor puedo ayudarte.`,
    actionUrl: "/app/subir",
    actionLabel: "Subir archivo",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Expira en 7 días
  };
}
