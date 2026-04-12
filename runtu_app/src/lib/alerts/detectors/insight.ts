// ============================================
// Insight Detector
// ============================================
// Usa IA para detectar oportunidades y patrones
// interesantes en los datos del negocio.

import { createAdminClient } from "@/lib/supabase/admin";
import Anthropic from "@anthropic-ai/sdk";
import type { CreateAlertData } from "@/types/alerts";

const INSIGHT_CHECK_INTERVAL_DAYS = 7; // Solo buscar insights cada 7 días

export async function detectInsights(
  businessId: string
): Promise<CreateAlertData[]> {
  const supabase = createAdminClient();

  // Verificar si ya buscamos insights recientemente
  const { data: recentInsight } = await supabase
    .from("alerts")
    .select("id")
    .eq("business_id", businessId)
    .eq("type", "insight")
    .gte(
      "created_at",
      new Date(
        Date.now() - INSIGHT_CHECK_INTERVAL_DAYS * 24 * 60 * 60 * 1000
      ).toISOString()
    )
    .limit(1)
    .single();

  if (recentInsight) {
    return []; // Ya generamos un insight recientemente
  }

  // Obtener chunks recientes para análisis
  const { data: recentChunks } = await supabase
    .from("knowledge_chunks")
    .select("content, chunk_type, source_context")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(30);

  if (!recentChunks || recentChunks.length < 10) {
    return []; // No hay suficientes datos para generar insights
  }

  // Obtener info del negocio
  const { data: business } = await supabase
    .from("businesses")
    .select("name, industry")
    .eq("id", businessId)
    .single();

  if (!business) {
    return [];
  }

  try {
    const insights = await generateInsightsWithAI(
      business.name,
      business.industry || "general",
      recentChunks
    );

    return insights.map((insight) => ({
      businessId,
      type: "insight" as const,
      priority: "low" as const,
      title: insight.title,
      message: insight.message,
      actionUrl: "/app/chat",
      actionLabel: "Preguntarle a Runtu",
      metadata: { source: "ai_analysis" },
    }));
  } catch (error) {
    console.error("[Alerts/Insight] Error generating insights:", error);
    return [];
  }
}

interface InsightResult {
  title: string;
  message: string;
}

async function generateInsightsWithAI(
  businessName: string,
  industry: string,
  chunks: { content: string; chunk_type: string; source_context: string | null }[]
): Promise<InsightResult[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.log("[Alerts/Insight] ANTHROPIC_API_KEY not configured");
    return [];
  }

  const anthropic = new Anthropic({ apiKey });

  // Construir contexto resumido
  const context = chunks
    .slice(0, 20)
    .map((c) => `[${c.chunk_type}] ${c.content.substring(0, 300)}`)
    .join("\n\n");

  const prompt = `Eres un analista de negocios amigable. Analiza esta información de "${businessName}" (${industry}) y detecta 1-2 oportunidades o insights positivos que el dueño debería saber.

REGLAS:
- Solo menciona cosas ESPECÍFICAS basadas en los datos
- Si no hay nada notable o interesante, responde exactamente: NINGUNO
- Sé breve y directo
- El tono debe ser amigable, como un consejero cercano
- No inventes datos que no estén en el contexto

INFORMACIÓN DEL NEGOCIO:
${context}

Responde en JSON con este formato exacto (sin markdown):
[{"title": "título corto", "message": "descripción en 1-2 oraciones"}]

O responde: NINGUNO`;

  const response = await anthropic.messages.create({
    model: "claude-3-haiku-20240307",
    max_tokens: 500,
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  if (text.trim() === "NINGUNO" || !text.includes("[")) {
    return [];
  }

  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const insights = JSON.parse(jsonMatch[0]) as InsightResult[];
    return insights.slice(0, 2); // Máximo 2 insights
  } catch {
    return [];
  }
}
