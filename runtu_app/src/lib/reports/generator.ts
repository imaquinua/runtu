// ============================================
// Report Generator
// ============================================
// Genera reportes usando Claude API

import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase/admin";
import { getReportPrompt, getSystemPrompt } from "./prompts";
import type {
  ReportConfig,
  GeneratedReport,
  ReportMetrics,
  REPORT_TYPE_LABELS,
} from "@/types/reports";
import { getPeriodDates, formatPeriodLabel } from "@/types/reports";
import { v4 as uuidv4 } from "uuid";

// ============================================
// Main Generator Function
// ============================================

export async function generateReport(
  businessId: string,
  config: ReportConfig
): Promise<GeneratedReport> {
  console.log(`[ReportGenerator] Generating ${config.type} report for ${businessId}`);

  // 1. Obtener información del negocio
  const businessInfo = await getBusinessInfo(businessId);

  // 2. Obtener chunks del período
  const { start, end } = getPeriodDates(config.period, config.customPeriod);
  const context = await getContextForPeriod(businessId, start, end);

  // 3. Formatear fecha y período
  const date = new Date().toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const periodLabel = formatPeriodLabel(config.period, config.customPeriod);

  // 4. Generar el prompt
  const prompt = getReportPrompt(config.type, {
    businessName: businessInfo.name,
    periodLabel,
    context,
    date,
    language: config.language || "es",
    sections: config.sections,
  });

  // 5. Llamar a Claude
  const content = await callClaude(prompt);

  // 6. Generar título
  const title = generateTitle(config, businessInfo.name, periodLabel);

  // 7. Extraer métricas si es posible
  const metrics: ReportMetrics = {
    periodLabel,
    highlights: extractHighlights(content),
  };

  // 8. Crear reporte
  const report: GeneratedReport = {
    id: uuidv4(),
    businessId,
    config,
    title,
    content,
    metrics,
    generatedAt: new Date(),
  };

  console.log(`[ReportGenerator] Report generated: ${report.id}`);

  return report;
}

// ============================================
// Helper Functions
// ============================================

async function getBusinessInfo(
  businessId: string
): Promise<{ name: string; industry: string | null }> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("businesses")
    .select("name, industry")
    .eq("id", businessId)
    .single();

  if (error || !data) {
    console.error("[ReportGenerator] Error fetching business:", error);
    return { name: "Mi Negocio", industry: null };
  }

  return {
    name: data.name || "Mi Negocio",
    industry: data.industry,
  };
}

async function getContextForPeriod(
  businessId: string,
  start: Date,
  end: Date
): Promise<string> {
  const supabase = createAdminClient();

  // Obtener chunks del período
  const { data: chunks, error } = await supabase
    .from("knowledge_chunks")
    .select("content, chunk_type, source_context, created_at")
    .eq("business_id", businessId)
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString())
    .order("created_at", { ascending: false })
    .limit(50); // Limitar para no exceder contexto

  if (error) {
    console.error("[ReportGenerator] Error fetching chunks:", error);
    return "No hay información disponible para el período seleccionado.";
  }

  if (!chunks || chunks.length === 0) {
    // Intentar obtener chunks más recientes si no hay del período
    const { data: recentChunks } = await supabase
      .from("knowledge_chunks")
      .select("content, chunk_type, source_context, created_at")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(30);

    if (!recentChunks || recentChunks.length === 0) {
      return "No hay información disponible en la base de conocimiento.";
    }

    return formatChunksAsContext(recentChunks);
  }

  return formatChunksAsContext(chunks);
}

function formatChunksAsContext(
  chunks: Array<{
    content: string;
    chunk_type: string;
    source_context: string | null;
    created_at: string;
  }>
): string {
  const contextParts: string[] = [];

  for (const chunk of chunks) {
    let part = "";

    if (chunk.source_context) {
      part += `[Fuente: ${chunk.source_context}]\n`;
    }

    part += chunk.content;
    contextParts.push(part);
  }

  // Limitar contexto total a ~8000 tokens (~32000 chars)
  let context = contextParts.join("\n\n---\n\n");
  if (context.length > 32000) {
    context = context.substring(0, 32000) + "\n\n[... información adicional truncada]";
  }

  return context;
}

async function callClaude(prompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }

  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: getSystemPrompt(),
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }

  return textBlock.text;
}

function generateTitle(
  config: ReportConfig,
  businessName: string,
  periodLabel: string
): string {
  if (config.title) {
    return config.title;
  }

  const typeLabels: Record<string, string> = {
    executive: "Resumen Ejecutivo",
    detailed: "Reporte Detallado",
    financial: "Informe Financiero",
    operational: "Reporte Operativo",
    custom: "Reporte",
  };

  const typeLabel = typeLabels[config.type] || "Reporte";
  return `${typeLabel} - ${businessName} - ${periodLabel}`;
}

function extractHighlights(content: string): string[] {
  const highlights: string[] = [];

  // Buscar secciones de logros o puntos clave
  const patterns = [
    /###?\s*Logros[^\n]*\n([\s\S]*?)(?=###|---|\n\n##|$)/i,
    /###?\s*Puntos\s+Clave[^\n]*\n([\s\S]*?)(?=###|---|\n\n##|$)/i,
    /###?\s*Indicadores\s+Clave[^\n]*\n([\s\S]*?)(?=###|---|\n\n##|$)/i,
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      // Extraer items de lista
      const items = match[1].match(/[-*]\s+([^\n]+)/g);
      if (items) {
        for (const item of items.slice(0, 3)) {
          highlights.push(item.replace(/^[-*]\s+/, "").trim());
        }
      }
    }
  }

  return highlights.slice(0, 5);
}

// ============================================
// Report Title Suggestions
// ============================================

export function suggestReportTitle(
  type: string,
  period: string,
  businessName: string
): string[] {
  const now = new Date();
  const monthName = now.toLocaleDateString("es-MX", { month: "long" });
  const year = now.getFullYear();

  const suggestions: string[] = [];

  switch (type) {
    case "executive":
      suggestions.push(
        `Resumen Ejecutivo - ${monthName} ${year}`,
        `Estado del Negocio - ${businessName}`,
        `Síntesis Mensual - ${monthName}`
      );
      break;
    case "financial":
      suggestions.push(
        `Informe Financiero - ${monthName} ${year}`,
        `Situación Financiera - ${businessName}`,
        `Reporte para Entidad Financiera`
      );
      break;
    case "detailed":
      suggestions.push(
        `Análisis Completo - ${monthName} ${year}`,
        `Reporte Integral - ${businessName}`,
        `Informe Detallado del Período`
      );
      break;
    case "operational":
      suggestions.push(
        `Reporte Operativo - ${monthName} ${year}`,
        `Análisis de Operaciones - ${businessName}`,
        `Informe de Productividad`
      );
      break;
    default:
      suggestions.push(
        `Reporte - ${monthName} ${year}`,
        `Informe - ${businessName}`
      );
  }

  return suggestions;
}
