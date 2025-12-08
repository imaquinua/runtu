// ============================================
// Daily Summary Cron Job
// ============================================
// Ejecutado por Vercel Cron cada día a las 6am

import { NextRequest, NextResponse } from "next/server";
import { generateSummariesForAllBusinesses } from "@/lib/summaries/generator";

// Vercel Cron config
export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutos máximo

export async function GET(request: NextRequest) {
  try {
    // Verificar que viene de Vercel Cron
    const authHeader = request.headers.get("authorization");

    // En desarrollo, permitir sin auth
    if (process.env.NODE_ENV === "production") {
      if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    console.log("[Cron] Starting daily summary generation...");

    const results = await generateSummariesForAllBusinesses("daily");

    console.log("[Cron] Daily summary generation complete:", results);

    return NextResponse.json({
      message: "Daily summaries generated",
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Cron] Daily summary error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate daily summaries",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
