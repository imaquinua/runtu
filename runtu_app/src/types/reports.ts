// ============================================
// Report Types
// ============================================
// Tipos para el sistema de generación de reportes

// Tipos de reportes disponibles
export type ReportType =
  | "executive" // Resumen ejecutivo 1 página
  | "detailed" // Reporte detallado completo
  | "financial" // Enfoque financiero (para bancos)
  | "operational" // Enfoque operativo
  | "custom"; // Personalizado

// Períodos de reporte
export type ReportPeriod =
  | "last_week"
  | "last_month"
  | "last_quarter"
  | "last_year"
  | "custom";

// Formato de exportación
export type ExportFormat = "pdf" | "docx" | "md" | "html";

// Configuración para generar un reporte
export interface ReportConfig {
  type: ReportType;
  period: ReportPeriod;
  customPeriod?: {
    start: Date;
    end: Date;
  };
  sections?: string[]; // Para reportes custom
  includeCharts?: boolean;
  language?: "es" | "en";
  title?: string; // Título personalizado
}

// Reporte generado
export interface GeneratedReport {
  id: string;
  businessId: string;
  config: ReportConfig;
  title: string;
  content: string; // Markdown
  htmlContent?: string; // HTML renderizado
  metrics?: ReportMetrics;
  generatedAt: Date;
  expiresAt?: Date;
}

// Métricas extraídas para el reporte
export interface ReportMetrics {
  periodLabel: string;
  highlights?: string[];
  keyIndicators?: KeyIndicator[];
  chartData?: ChartData[];
}

// Indicador clave
export interface KeyIndicator {
  label: string;
  value: string;
  change?: string; // "+15%", "-5%", etc.
  trend?: "up" | "down" | "stable";
}

// Datos para gráficos
export interface ChartData {
  type: "bar" | "line" | "pie";
  title: string;
  labels: string[];
  datasets: {
    label: string;
    data: number[];
  }[];
}

// ============================================
// Database Row Types
// ============================================

export interface ReportRow {
  id: string;
  business_id: string;
  type: ReportType;
  period: ReportPeriod;
  custom_period_start: string | null;
  custom_period_end: string | null;
  title: string;
  content: string;
  html_content: string | null;
  metrics: Record<string, unknown> | null;
  config: Record<string, unknown>;
  generated_at: string;
  expires_at: string | null;
  created_at: string;
}

// ============================================
// API Types
// ============================================

export interface GenerateReportRequest {
  type: ReportType;
  period: ReportPeriod;
  customPeriodStart?: string;
  customPeriodEnd?: string;
  sections?: string[];
  includeCharts?: boolean;
  language?: "es" | "en";
  title?: string;
}

export interface ReportListItem {
  id: string;
  type: ReportType;
  period: ReportPeriod;
  title: string;
  generatedAt: Date;
  preview?: string; // Primeras líneas
}

// ============================================
// Converters
// ============================================

export function reportFromRow(row: ReportRow): GeneratedReport {
  const config: ReportConfig = {
    type: row.type,
    period: row.period,
    ...(row.custom_period_start && row.custom_period_end
      ? {
          customPeriod: {
            start: new Date(row.custom_period_start),
            end: new Date(row.custom_period_end),
          },
        }
      : {}),
    ...(row.config as Partial<ReportConfig>),
  };

  return {
    id: row.id,
    businessId: row.business_id,
    config,
    title: row.title,
    content: row.content,
    htmlContent: row.html_content || undefined,
    metrics: row.metrics as unknown as ReportMetrics | undefined,
    generatedAt: new Date(row.generated_at),
    expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
  };
}

export function reportToRow(
  report: GeneratedReport
): Omit<ReportRow, "id" | "created_at"> {
  return {
    business_id: report.businessId,
    type: report.config.type,
    period: report.config.period,
    custom_period_start: report.config.customPeriod?.start.toISOString() || null,
    custom_period_end: report.config.customPeriod?.end.toISOString() || null,
    title: report.title,
    content: report.content,
    html_content: report.htmlContent || null,
    metrics: (report.metrics || {}) as unknown as { [key: string]: unknown },
    config: report.config as unknown as { [key: string]: unknown },
    generated_at: report.generatedAt.toISOString(),
    expires_at: report.expiresAt?.toISOString() || null,
  };
}

// ============================================
// Constants
// ============================================

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  executive: "Resumen Ejecutivo",
  detailed: "Reporte Detallado",
  financial: "Reporte Financiero",
  operational: "Reporte Operativo",
  custom: "Reporte Personalizado",
};

export const REPORT_TYPE_DESCRIPTIONS: Record<ReportType, string> = {
  executive: "Resumen de una página con los puntos clave",
  detailed: "Análisis completo de todas las áreas del negocio",
  financial: "Enfocado en finanzas, ideal para presentar a bancos",
  operational: "Enfocado en operaciones y productividad",
  custom: "Selecciona las secciones que necesitas",
};

export const REPORT_PERIOD_LABELS: Record<ReportPeriod, string> = {
  last_week: "Última semana",
  last_month: "Último mes",
  last_quarter: "Último trimestre",
  last_year: "Último año",
  custom: "Personalizado",
};

export const EXPORT_FORMAT_LABELS: Record<ExportFormat, string> = {
  pdf: "PDF",
  docx: "Word",
  md: "Markdown",
  html: "HTML",
};

// ============================================
// Helpers
// ============================================

export function getPeriodDates(
  period: ReportPeriod,
  customPeriod?: { start: Date; end: Date }
): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  switch (period) {
    case "last_week":
      return {
        start: new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000),
        end,
      };
    case "last_month":
      return {
        start: new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000),
        end,
      };
    case "last_quarter":
      return {
        start: new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000),
        end,
      };
    case "last_year":
      return {
        start: new Date(end.getTime() - 365 * 24 * 60 * 60 * 1000),
        end,
      };
    case "custom":
      if (customPeriod) {
        return customPeriod;
      }
      // Default to last month if no custom period
      return {
        start: new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000),
        end,
      };
  }
}

export function formatPeriodLabel(
  period: ReportPeriod,
  customPeriod?: { start: Date; end: Date }
): string {
  if (period === "custom" && customPeriod) {
    const options: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "short",
      year: "numeric",
    };
    return `${customPeriod.start.toLocaleDateString("es-MX", options)} - ${customPeriod.end.toLocaleDateString("es-MX", options)}`;
  }
  return REPORT_PERIOD_LABELS[period];
}

export function getReportPreview(content: string, maxLength = 150): string {
  // Remove markdown formatting and get first paragraph
  const plainText = content
    .replace(/^#+\s+.*/gm, "") // Remove headers
    .replace(/\*\*/g, "") // Remove bold
    .replace(/\*/g, "") // Remove italic
    .replace(/\n{2,}/g, " ") // Replace multiple newlines
    .trim();

  if (plainText.length <= maxLength) {
    return plainText;
  }

  return plainText.substring(0, maxLength).trim() + "...";
}
