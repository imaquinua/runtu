// ============================================
// Weekly Summary Cron Job
// ============================================
// Ejecutado por Vercel Cron cada lunes a las 8am

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

    console.log("[Cron] Starting weekly summary generation...");

    const results = await generateSummariesForAllBusinesses("weekly");

    console.log("[Cron] Weekly summary generation complete:", results);

    return NextResponse.json({
      message: "Weekly summaries generated",
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Cron] Weekly summary error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate weekly summaries",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
