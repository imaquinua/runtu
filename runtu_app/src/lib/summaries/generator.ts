// ============================================
// Summary Generator
// ============================================
// Genera resúmenes automáticos usando Gemini

import { GoogleGenerativeAI } from "@google/generative-ai";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildSummaryPrompt, HIGHLIGHTS_EXTRACTION_PROMPT } from "./prompts";
import type {
  Summary,
  SummaryType,
  SummaryHighlight,
  SummaryMetrics,
  SummaryContext,
  ChunkForSummary,
  UploadForSummary,
  GenerateSummaryParams,
} from "@/types/summaries";

// ============================================
// Main Generator Function
// ============================================

export async function generateSummary(
  params: GenerateSummaryParams
): Promise<Summary> {
  const { businessId, type, periodStart, periodEnd, force = false } = params;

  console.log(`[Summary] Generating ${type} summary for business ${businessId}`);
  console.log(`[Summary] Period: ${periodStart.toISOString()} - ${periodEnd.toISOString()}`);

  const supabase = createAdminClient();

  // 1. Verificar si ya existe (a menos que force=true)
  if (!force) {
    const { data: existing } = await supabase
      .from("summaries")
      .select("id")
      .eq("business_id", businessId)
      .eq("type", type)
      .eq("period_start", periodStart.toISOString().split("T")[0])
      .single();

    if (existing) {
      console.log(`[Summary] Summary already exists: ${existing.id}`);
      throw new Error("Summary already exists for this period");
    }
  }

  // 2. Obtener info del negocio
  const { data: business, error: bizError } = await supabase
    .from("businesses")
    .select("name, industry")
    .eq("id", businessId)
    .single();

  if (bizError || !business) {
    throw new Error(`Business not found: ${bizError?.message}`);
  }

  // 3. Obtener chunks del período
  const chunks = await getChunksForPeriod(businessId, periodStart, periodEnd);
  console.log(`[Summary] Found ${chunks.length} chunks for period`);

  // 4. Obtener chunks del período anterior (para comparación)
  const previousPeriodChunks = await getPreviousPeriodChunks(
    businessId,
    type,
    periodStart
  );

  // 5. Obtener uploads del período
  const uploads = await getUploadsForPeriod(businessId, periodStart, periodEnd);

  // 6. Construir contexto
  const context: SummaryContext = {
    businessName: business.name,
    businessType: business.industry || undefined,
    chunks,
    previousPeriodChunks,
    uploadsInPeriod: uploads,
  };

  // 7. Generar resumen con Gemini
  const { content, tokensUsed } = await callGemini(
    buildSummaryPrompt(type, context, periodStart, periodEnd)
  );

  // 8. Extraer highlights estructurados
  const highlights = await extractHighlights(content);

  // 9. Calcular métricas
  const metrics = calculateMetrics(chunks, previousPeriodChunks, uploads);

  // 10. Guardar en BD
  const summaryData = {
    business_id: businessId,
    type,
    period_start: periodStart.toISOString().split("T")[0],
    period_end: periodEnd.toISOString().split("T")[0],
    content,
    highlights,
    metrics,
    chunks_analyzed: chunks.length,
    model_used: "gemini-1.5-flash",
    tokens_used: tokensUsed,
  };

  // Si force=true, hacer upsert
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: saved, error: saveError } = force
    ? await supabase
        .from("summaries")
        .upsert(summaryData as any, {
          onConflict: "business_id,type,period_start",
        })
        .select()
        .single()
    : await supabase.from("summaries").insert(summaryData as any).select().single();

  if (saveError) {
    throw new Error(`Failed to save summary: ${saveError.message}`);
  }

  console.log(`[Summary] Generated and saved summary: ${saved.id}`);

  return {
    id: saved.id,
    businessId: saved.business_id,
    type: saved.type as SummaryType,
    periodStart: new Date(saved.period_start),
    periodEnd: new Date(saved.period_end),
    content: saved.content,
    highlights: (saved.highlights || []) as unknown as SummaryHighlight[],
    metrics: (saved.metrics || {}) as unknown as SummaryMetrics,
    chunksAnalyzed: saved.chunks_analyzed,
    modelUsed: saved.model_used || undefined,
    tokensUsed: saved.tokens_used || undefined,
    generatedAt: new Date(saved.generated_at),
    readAt: null,
  };
}

// ============================================
// Helper Functions
// ============================================

async function getChunksForPeriod(
  businessId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<ChunkForSummary[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("knowledge_chunks")
    .select(
      `
      content,
      metadata,
      created_at,
      uploads!inner(filename)
    `
    )
    .eq("business_id", businessId)
    .gte("created_at", periodStart.toISOString())
    .lte("created_at", periodEnd.toISOString())
    .order("created_at", { ascending: false })
    .limit(50); // Limitar para no sobrecargar el prompt

  if (error) {
    console.error("[Summary] Error fetching chunks:", error);
    return [];
  }

  return (data || []).map((chunk) => ({
    content: chunk.content,
    source: (chunk.uploads as unknown as { filename: string })?.filename || "Desconocido",
    type: (chunk.metadata as Record<string, string>)?.type,
    createdAt: new Date(chunk.created_at),
  }));
}

async function getPreviousPeriodChunks(
  businessId: string,
  type: SummaryType,
  currentPeriodStart: Date
): Promise<ChunkForSummary[]> {
  const supabase = createAdminClient();

  // Calcular período anterior
  let prevStart: Date;
  let prevEnd: Date;

  switch (type) {
    case "daily":
      prevStart = new Date(currentPeriodStart);
      prevStart.setDate(prevStart.getDate() - 1);
      prevEnd = new Date(prevStart);
      prevEnd.setHours(23, 59, 59, 999);
      break;

    case "weekly":
      prevStart = new Date(currentPeriodStart);
      prevStart.setDate(prevStart.getDate() - 7);
      prevEnd = new Date(currentPeriodStart);
      prevEnd.setDate(prevEnd.getDate() - 1);
      break;

    case "monthly":
      prevStart = new Date(currentPeriodStart);
      prevStart.setMonth(prevStart.getMonth() - 1);
      prevEnd = new Date(currentPeriodStart);
      prevEnd.setDate(prevEnd.getDate() - 1);
      break;
  }

  const { data } = await supabase
    .from("knowledge_chunks")
    .select(
      `
      content,
      metadata,
      created_at,
      uploads!inner(filename)
    `
    )
    .eq("business_id", businessId)
    .gte("created_at", prevStart.toISOString())
    .lte("created_at", prevEnd.toISOString())
    .order("created_at", { ascending: false })
    .limit(20);

  return (data || []).map((chunk) => ({
    content: chunk.content,
    source: (chunk.uploads as unknown as { filename: string })?.filename || "Desconocido",
    type: (chunk.metadata as Record<string, string>)?.type,
    createdAt: new Date(chunk.created_at),
  }));
}

async function getUploadsForPeriod(
  businessId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<UploadForSummary[]> {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("uploads")
    .select("filename, file_type, created_at")
    .eq("business_id", businessId)
    .eq("processing_status", "completed")
    .gte("created_at", periodStart.toISOString())
    .lte("created_at", periodEnd.toISOString())
    .order("created_at", { ascending: false });

  return (data || []).map((upload) => ({
    name: upload.filename,
    type: upload.file_type,
    createdAt: new Date(upload.created_at),
  }));
}

async function callGemini(
  prompt: string
): Promise<{ content: string; tokensUsed: number }> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      maxOutputTokens: 1000,
      temperature: 0.7,
    },
  });

  const result = await model.generateContent(prompt);
  const response = result.response;

  return {
    content: response.text(),
    tokensUsed: response.usageMetadata?.totalTokenCount || 0,
  };
}

async function extractHighlights(summary: string): Promise<SummaryHighlight[]> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return getDefaultHighlights(summary);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.3,
      },
    });

    const prompt = HIGHLIGHTS_EXTRACTION_PROMPT.replace("{summary}", summary);
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Parsear JSON
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return getDefaultHighlights(summary);
    }

    const highlights = JSON.parse(jsonMatch[0]) as SummaryHighlight[];
    return highlights.slice(0, 5);
  } catch (error) {
    console.error("[Summary] Error extracting highlights:", error);
    return getDefaultHighlights(summary);
  }
}

function getDefaultHighlights(summary: string): SummaryHighlight[] {
  // Analizar el texto para extraer highlights básicos
  const highlights: SummaryHighlight[] = [];

  if (summary.includes("📈") || summary.toLowerCase().includes("aument")) {
    highlights.push({
      type: "positive",
      icon: "📈",
      title: "Tendencia positiva",
      description: "Se detectó crecimiento en el período",
    });
  }

  if (summary.includes("📉") || summary.toLowerCase().includes("baj")) {
    highlights.push({
      type: "negative",
      icon: "📉",
      title: "Área de atención",
      description: "Hay indicadores que revisar",
    });
  }

  if (
    summary.toLowerCase().includes("recomend") ||
    summary.toLowerCase().includes("suger")
  ) {
    highlights.push({
      type: "action",
      icon: "🎯",
      title: "Acción sugerida",
      description: "Revisa las recomendaciones del resumen",
    });
  }

  // Si no hay highlights, agregar uno genérico
  if (highlights.length === 0) {
    highlights.push({
      type: "neutral",
      icon: "ℹ️",
      title: "Resumen disponible",
      description: "Revisa el análisis del período",
    });
  }

  return highlights;
}

function calculateMetrics(
  chunks: ChunkForSummary[],
  previousChunks: ChunkForSummary[],
  uploads: UploadForSummary[]
): SummaryMetrics {
  const chunksThisPeriod = chunks.length;
  const chunksPreviousPeriod = previousChunks.length;

  // Calcular tendencia
  let activityTrend: "up" | "down" | "stable" = "stable";
  let percentageChange: number | undefined;

  if (chunksPreviousPeriod > 0) {
    const change =
      ((chunksThisPeriod - chunksPreviousPeriod) / chunksPreviousPeriod) * 100;
    percentageChange = Math.round(change);

    if (change > 10) activityTrend = "up";
    else if (change < -10) activityTrend = "down";
  }

  // Contar tipos de chunks
  const topChunkTypes: Record<string, number> = {};
  for (const chunk of chunks) {
    const type = chunk.type || "general";
    topChunkTypes[type] = (topChunkTypes[type] || 0) + 1;
  }

  return {
    chunksThisPeriod,
    chunksPreviousPeriod,
    uploadsThisPeriod: uploads.length,
    topChunkTypes,
    activityTrend,
    percentageChange,
  };
}

// ============================================
// Batch Generation (for cron)
// ============================================

export async function generateSummariesForAllBusinesses(
  type: SummaryType
): Promise<{ success: number; failed: number; skipped: number }> {
  const supabase = createAdminClient();

  // Obtener todos los businesses activos
  const { data: businesses, error } = await supabase
    .from("businesses")
    .select("id, name");

  if (error || !businesses) {
    throw new Error(`Failed to fetch businesses: ${error?.message}`);
  }

  console.log(`[Summary] Generating ${type} summaries for ${businesses.length} businesses`);

  const results = { success: 0, failed: 0, skipped: 0 };

  // Calcular período
  const { start, end } = getPeriodDatesForGeneration(type);

  for (const business of businesses) {
    try {
      // Verificar si ya existe
      const { data: existing } = await supabase
        .from("summaries")
        .select("id")
        .eq("business_id", business.id)
        .eq("type", type)
        .eq("period_start", start.toISOString().split("T")[0])
        .single();

      if (existing) {
        console.log(`[Summary] Skipping ${business.name} - already has summary`);
        results.skipped++;
        continue;
      }

      // Verificar si tiene datos en el período
      const { count } = await supabase
        .from("knowledge_chunks")
        .select("id", { count: "exact", head: true })
        .eq("business_id", business.id)
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());

      // Generar incluso si no hay datos (para dar mensaje de "sin actividad")
      await generateSummary({
        businessId: business.id,
        type,
        periodStart: start,
        periodEnd: end,
      });

      console.log(`[Summary] ✅ Generated for ${business.name}`);
      results.success++;
    } catch (err) {
      console.error(`[Summary] ❌ Failed for ${business.name}:`, err);
      results.failed++;
    }
  }

  console.log(`[Summary] Batch complete:`, results);
  return results;
}

function getPeriodDatesForGeneration(type: SummaryType): {
  start: Date;
  end: Date;
} {
  const now = new Date();

  switch (type) {
    case "daily": {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const endOfYesterday = new Date(yesterday);
      endOfYesterday.setHours(23, 59, 59, 999);

      return { start: yesterday, end: endOfYesterday };
    }

    case "weekly": {
      // Semana pasada (lunes a domingo)
      const dayOfWeek = now.getDay();
      const daysToLastMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

      const lastMonday = new Date(now);
      lastMonday.setDate(now.getDate() - daysToLastMonday - 7);
      lastMonday.setHours(0, 0, 0, 0);

      const lastSunday = new Date(lastMonday);
      lastSunday.setDate(lastMonday.getDate() + 6);
      lastSunday.setHours(23, 59, 59, 999);

      return { start: lastMonday, end: lastSunday };
    }

    case "monthly": {
      const firstOfLastMonth = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1
      );
      firstOfLastMonth.setHours(0, 0, 0, 0);

      const lastOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      lastOfLastMonth.setHours(23, 59, 59, 999);

      return { start: firstOfLastMonth, end: lastOfLastMonth };
    }

    default:
      throw new Error(`Unknown summary type: ${type}`);
  }
}
