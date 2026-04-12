// ============================================
// Chat Intent Detection
// ============================================
// Detecta intenciones especiales en los mensajes del chat
// como solicitudes de reportes

import type { ReportType, ReportPeriod } from "@/types/reports";

// ============================================
// Types
// ============================================

export interface ReportIntent {
  type: "report";
  reportType: ReportType;
  period: ReportPeriod;
  customPeriod?: {
    start: Date;
    end: Date;
  };
}

export interface Intent {
  type: "report" | "none";
  report?: ReportIntent;
}

// ============================================
// Report Intent Patterns
// ============================================

const REPORT_TYPE_PATTERNS: Record<ReportType, RegExp[]> = {
  executive: [
    /reporte?\s+ejecutiv[oa]/i,
    /resumen\s+ejecutiv[oa]/i,
    /informe\s+ejecutiv[oa]/i,
    /reporte?\s+(corto|breve|rápido)/i,
    /resumen\s+(corto|breve|general)/i,
    /dame\s+un\s+resumen/i,
  ],
  detailed: [
    /reporte?\s+detallad[oa]/i,
    /informe\s+detallad[oa]/i,
    /reporte?\s+complet[oa]/i,
    /análisis\s+complet[oa]/i,
    /reporte?\s+exhaustiv[oa]/i,
    /todo\s+sobre\s+mi\s+negocio/i,
  ],
  financial: [
    /reporte?\s+financier[oa]/i,
    /informe\s+financier[oa]/i,
    /reporte?\s+(para\s+el\s+)?banco/i,
    /informe\s+(para\s+el\s+)?banco/i,
    /reporte?\s+(para\s+)?inversi[oó]n/i,
    /estado\s+financiero/i,
    /análisis\s+financiero/i,
    /reporte?\s+(para\s+)?crédito/i,
    /reporte?\s+(para\s+)?préstamo/i,
  ],
  operational: [
    /reporte?\s+operativ[oa]/i,
    /informe\s+operativ[oa]/i,
    /reporte?\s+de\s+operaciones/i,
    /análisis\s+operativ[oa]/i,
    /reporte?\s+de\s+productividad/i,
    /cómo\s+están\s+las\s+operaciones/i,
  ],
  custom: [
    /reporte?\s+personalizad[oa]/i,
    /informe\s+personalizad[oa]/i,
  ],
};

const PERIOD_PATTERNS: Record<ReportPeriod, RegExp[]> = {
  last_week: [
    /(\bde\s+)?la\s+semana(\s+pasada)?/i,
    /últ?ima\s+semana/i,
    /esta\s+semana/i,
    /los\s+(últ?imos\s+)?7\s+días/i,
    /semanal/i,
  ],
  last_month: [
    /(\bde\s+)?el?\s+mes(\s+pasado)?/i,
    /últ?imo\s+mes/i,
    /este\s+mes/i,
    /los\s+(últ?imos\s+)?30\s+días/i,
    /mensual/i,
  ],
  last_quarter: [
    /(\bde\s+)?el?\s+trimestre(\s+pasado)?/i,
    /últ?imo\s+trimestre/i,
    /este\s+trimestre/i,
    /los\s+(últ?imos\s+)?3\s+meses/i,
    /trimestral/i,
  ],
  last_year: [
    /(\bde\s+)?el?\s+año(\s+pasado)?/i,
    /últ?imo\s+año/i,
    /este\s+año/i,
    /los\s+(últ?imos\s+)?12\s+meses/i,
    /anual/i,
  ],
  custom: [],
};

// Patrones generales para detectar solicitud de reporte
const GENERAL_REPORT_PATTERNS = [
  /gener(a|ar?|e)\s+(un\s+)?reporte?/i,
  /crear?\s+(un\s+)?reporte?/i,
  /hacer?\s+(un\s+)?reporte?/i,
  /necesito\s+(un\s+)?reporte?/i,
  /quiero\s+(un\s+)?reporte?/i,
  /dame\s+(un\s+)?reporte?/i,
  /prepara(r|me)?\s+(un\s+)?reporte?/i,
  /genera(r|me)?\s+(un\s+)?informe/i,
  /crear?\s+(un\s+)?informe/i,
];

// ============================================
// Intent Detection
// ============================================

/**
 * Detecta si el mensaje contiene una solicitud de reporte
 */
export function detectIntent(message: string): Intent {
  const normalizedMessage = message.toLowerCase().trim();

  // Verificar si es una solicitud de reporte
  const isReportRequest = GENERAL_REPORT_PATTERNS.some((pattern) =>
    pattern.test(normalizedMessage)
  );

  if (!isReportRequest) {
    return { type: "none" };
  }

  // Detectar tipo de reporte
  let reportType: ReportType = "executive"; // Default
  for (const [type, patterns] of Object.entries(REPORT_TYPE_PATTERNS)) {
    if (patterns.some((pattern) => pattern.test(normalizedMessage))) {
      reportType = type as ReportType;
      break;
    }
  }

  // Detectar período
  let period: ReportPeriod = "last_month"; // Default
  for (const [p, patterns] of Object.entries(PERIOD_PATTERNS)) {
    if (patterns.some((pattern) => pattern.test(normalizedMessage))) {
      period = p as ReportPeriod;
      break;
    }
  }

  return {
    type: "report",
    report: {
      type: "report",
      reportType,
      period,
    },
  };
}

/**
 * Genera un mensaje de confirmación para la generación del reporte
 */
export function getReportConfirmationMessage(intent: ReportIntent): string {
  const typeLabels: Record<ReportType, string> = {
    executive: "ejecutivo",
    detailed: "detallado",
    financial: "financiero (para banco)",
    operational: "operativo",
    custom: "personalizado",
  };

  const periodLabels: Record<ReportPeriod, string> = {
    last_week: "la última semana",
    last_month: "el último mes",
    last_quarter: "el último trimestre",
    last_year: "el último año",
    custom: "período personalizado",
  };

  return (
    `Entendido, voy a generar un **reporte ${typeLabels[intent.reportType]}** ` +
    `de ${periodLabels[intent.period]}. Esto puede tomar unos segundos...`
  );
}

/**
 * Genera un mensaje de éxito con el enlace al reporte
 */
export function getReportSuccessMessage(reportId: string, title: string): string {
  return (
    `¡Listo! He generado tu reporte: **${title}**\n\n` +
    `Puedes verlo y descargarlo aquí: [Ver Reporte](/app/reportes/${reportId})\n\n` +
    `También puedes encontrarlo en la sección de [Reportes](/app/reportes).`
  );
}
