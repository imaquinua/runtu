// ============================================
// Summary Types
// ============================================
// Tipos para el sistema de resúmenes automáticos

export type SummaryType = "daily" | "weekly" | "monthly";

export interface Summary {
  id: string;
  businessId: string;
  type: SummaryType;
  periodStart: Date;
  periodEnd: Date;
  content: string;
  highlights: SummaryHighlight[];
  metrics: SummaryMetrics;
  chunksAnalyzed: number;
  modelUsed?: string;
  tokensUsed?: number;
  generatedAt: Date;
  readAt: Date | null;
}

export interface SummaryHighlight {
  type: "positive" | "negative" | "neutral" | "action";
  icon: string; // emoji
  title: string;
  description: string;
}

export interface SummaryMetrics {
  chunksThisPeriod: number;
  chunksPreviousPeriod: number;
  uploadsThisPeriod: number;
  topChunkTypes: Record<string, number>;
  activityTrend: "up" | "down" | "stable";
  percentageChange?: number;
}

// ============================================
// Database Row Type (snake_case)
// ============================================

export interface SummaryRow {
  id: string;
  business_id: string;
  type: SummaryType;
  period_start: string;
  period_end: string;
  content: string;
  highlights: SummaryHighlight[];
  metrics: SummaryMetrics;
  chunks_analyzed: number;
  model_used: string | null;
  tokens_used: number | null;
  generated_at: string;
  read_at: string | null;
}

// ============================================
// API Types
// ============================================

export interface GenerateSummaryParams {
  businessId: string;
  type: SummaryType;
  periodStart: Date;
  periodEnd: Date;
  force?: boolean; // Regenerar aunque ya exista
}

export interface GetSummariesParams {
  businessId: string;
  type?: SummaryType;
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
}

export interface SummaryContext {
  businessName: string;
  businessType?: string;
  chunks: ChunkForSummary[];
  previousPeriodChunks?: ChunkForSummary[];
  uploadsInPeriod: UploadForSummary[];
}

export interface ChunkForSummary {
  content: string;
  source: string;
  type?: string;
  createdAt: Date;
}

export interface UploadForSummary {
  name: string;
  type: string;
  rowCount?: number;
  createdAt: Date;
}

// ============================================
// Converters
// ============================================

export function summaryFromRow(row: SummaryRow): Summary {
  return {
    id: row.id,
    businessId: row.business_id,
    type: row.type,
    periodStart: new Date(row.period_start),
    periodEnd: new Date(row.period_end),
    content: row.content,
    highlights: row.highlights || [],
    metrics: row.metrics || {
      chunksThisPeriod: 0,
      chunksPreviousPeriod: 0,
      uploadsThisPeriod: 0,
      topChunkTypes: {},
      activityTrend: "stable",
    },
    chunksAnalyzed: row.chunks_analyzed,
    modelUsed: row.model_used || undefined,
    tokensUsed: row.tokens_used || undefined,
    generatedAt: new Date(row.generated_at),
    readAt: row.read_at ? new Date(row.read_at) : null,
  };
}

export function summaryToRow(
  summary: Omit<Summary, "id" | "generatedAt">
): Omit<SummaryRow, "id" | "generated_at"> {
  return {
    business_id: summary.businessId,
    type: summary.type,
    period_start: summary.periodStart.toISOString().split("T")[0],
    period_end: summary.periodEnd.toISOString().split("T")[0],
    content: summary.content,
    highlights: summary.highlights,
    metrics: summary.metrics,
    chunks_analyzed: summary.chunksAnalyzed,
    model_used: summary.modelUsed || null,
    tokens_used: summary.tokensUsed || null,
    read_at: summary.readAt?.toISOString() || null,
  };
}

// ============================================
// Period Helpers
// ============================================

export function getPeriodDates(
  type: SummaryType,
  referenceDate: Date = new Date()
): { start: Date; end: Date } {
  const date = new Date(referenceDate);

  switch (type) {
    case "daily": {
      // Ayer
      const yesterday = new Date(date);
      yesterday.setDate(date.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const endOfYesterday = new Date(yesterday);
      endOfYesterday.setHours(23, 59, 59, 999);

      return { start: yesterday, end: endOfYesterday };
    }

    case "weekly": {
      // Semana pasada (lunes a domingo)
      const dayOfWeek = date.getDay();
      const daysToLastMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

      const lastMonday = new Date(date);
      lastMonday.setDate(date.getDate() - daysToLastMonday - 7);
      lastMonday.setHours(0, 0, 0, 0);

      const lastSunday = new Date(lastMonday);
      lastSunday.setDate(lastMonday.getDate() + 6);
      lastSunday.setHours(23, 59, 59, 999);

      return { start: lastMonday, end: lastSunday };
    }

    case "monthly": {
      // Mes pasado
      const firstOfLastMonth = new Date(date.getFullYear(), date.getMonth() - 1, 1);
      firstOfLastMonth.setHours(0, 0, 0, 0);

      const lastOfLastMonth = new Date(date.getFullYear(), date.getMonth(), 0);
      lastOfLastMonth.setHours(23, 59, 59, 999);

      return { start: firstOfLastMonth, end: lastOfLastMonth };
    }

    default:
      throw new Error(`Unknown summary type: ${type}`);
  }
}

export function formatPeriod(type: SummaryType, start: Date, end: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
  };

  const startStr = start.toLocaleDateString("es-MX", options);
  const endStr = end.toLocaleDateString("es-MX", options);

  switch (type) {
    case "daily":
      return startStr;
    case "weekly":
      return `${startStr} - ${endStr}`;
    case "monthly":
      return start.toLocaleDateString("es-MX", { month: "long", year: "numeric" });
    default:
      return `${startStr} - ${endStr}`;
  }
}

export function getSummaryTitle(type: SummaryType): string {
  switch (type) {
    case "daily":
      return "Resumen del día";
    case "weekly":
      return "Resumen semanal";
    case "monthly":
      return "Resumen mensual";
    default:
      return "Resumen";
  }
}
