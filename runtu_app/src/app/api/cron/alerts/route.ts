// ============================================
// Alerts Cron Job
// ============================================
// Se ejecuta cada 6 horas para detectar alertas
// en todos los negocios activos.

import { NextRequest, NextResponse } from "next/server";
import {
  runAlertDetectionForAllBusinesses,
  cleanupExpiredAlerts,
} from "@/lib/alerts";
import { cleanupDismissedAlerts } from "@/lib/db/alerts";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // 60 segundos máximo

export async function GET(request: NextRequest) {
  console.log("[Cron/Alerts] Starting alert detection job");

  // Verificar autorización
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // En Vercel, el cron viene con un header especial
  const isVercelCron = request.headers.get("x-vercel-cron") === "true";

  if (!isVercelCron && cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.log("[Cron/Alerts] Unauthorized request");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    // 1. Ejecutar detección de alertas
    console.log("[Cron/Alerts] Running alert detection...");
    const detectionResult = await runAlertDetectionForAllBusinesses();

    console.log(
      `[Cron/Alerts] Detection complete: ${detectionResult.totalAlerts} alerts generated for ${detectionResult.processed} businesses`
    );

    // 2. Limpiar alertas expiradas
    console.log("[Cron/Alerts] Cleaning up expired alerts...");
    const expiredCleaned = await cleanupExpiredAlerts();

    // 3. Limpiar alertas descartadas antiguas
    console.log("[Cron/Alerts] Cleaning up old dismissed alerts...");
    const dismissedCleaned = await cleanupDismissedAlerts();

    console.log(
      `[Cron/Alerts] Cleanup complete: ${expiredCleaned} expired, ${dismissedCleaned} dismissed`
    );

    return NextResponse.json({
      success: true,
      detection: {
        processed: detectionResult.processed,
        alertsGenerated: detectionResult.totalAlerts,
        errors: detectionResult.errors,
      },
      cleanup: {
        expiredRemoved: expiredCleaned,
        dismissedRemoved: dismissedCleaned,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Cron/Alerts] Error:", error);

    return NextResponse.json(
      {
        error: "Error en el cron de alertas",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
