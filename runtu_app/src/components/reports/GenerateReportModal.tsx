"use client";

// ============================================
// GenerateReportModal Component
// ============================================
// Modal para configurar y generar nuevos reportes

import { useState } from "react";
import { X, FileText, TrendingUp, Building, Settings, Loader2, Calendar } from "lucide-react";
import type { ReportType, ReportPeriod } from "@/types/reports";
import { REPORT_TYPE_LABELS, REPORT_PERIOD_LABELS, REPORT_TYPE_DESCRIPTIONS } from "@/types/reports";

interface GenerateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (config: ReportConfig) => Promise<void>;
}

interface ReportConfig {
  type: ReportType;
  period: ReportPeriod;
  includeCharts: boolean;
  customPeriodStart?: string;
  customPeriodEnd?: string;
  title?: string;
}

const REPORT_TYPE_ICONS: Record<ReportType, React.ReactNode> = {
  executive: <FileText className="w-5 h-5" />,
  detailed: <Settings className="w-5 h-5" />,
  financial: <Building className="w-5 h-5" />,
  operational: <TrendingUp className="w-5 h-5" />,
  custom: <Settings className="w-5 h-5" />,
};

export function GenerateReportModal({ isOpen, onClose, onGenerate }: GenerateReportModalProps) {
  const [type, setType] = useState<ReportType>("executive");
  const [period, setPeriod] = useState<ReportPeriod>("last_month");
  const [includeCharts, setIncludeCharts] = useState(false);
  const [customPeriodStart, setCustomPeriodStart] = useState("");
  const [customPeriodEnd, setCustomPeriodEnd] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setError(null);

    // Validar período personalizado
    if (period === "custom") {
      if (!customPeriodStart || !customPeriodEnd) {
        setError("Por favor selecciona las fechas de inicio y fin");
        return;
      }
      if (new Date(customPeriodStart) > new Date(customPeriodEnd)) {
        setError("La fecha de inicio debe ser anterior a la fecha de fin");
        return;
      }
    }

    setIsGenerating(true);

    try {
      await onGenerate({
        type,
        period,
        includeCharts,
        customPeriodStart: period === "custom" ? customPeriodStart : undefined,
        customPeriodEnd: period === "custom" ? customPeriodEnd : undefined,
        title: customTitle || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al generar reporte");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={!isGenerating ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Generar Reporte</h2>
            <p className="text-sm text-gray-500 mt-1">
              Configura y genera un nuevo reporte de tu negocio
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Tipo de Reporte */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tipo de Reporte
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(REPORT_TYPE_LABELS) as ReportType[])
                .filter((t) => t !== "custom")
                .map((reportType) => (
                  <button
                    key={reportType}
                    onClick={() => setType(reportType)}
                    disabled={isGenerating}
                    className={`
                      flex items-start p-4 rounded-xl border-2 transition-all text-left
                      ${type === reportType
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                      }
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                  >
                    <div className={`
                      p-2 rounded-lg mr-3
                      ${type === reportType ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-500"}
                    `}>
                      {REPORT_TYPE_ICONS[reportType]}
                    </div>
                    <div>
                      <p className={`font-medium ${type === reportType ? "text-emerald-700" : "text-gray-900"}`}>
                        {REPORT_TYPE_LABELS[reportType]}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                        {REPORT_TYPE_DESCRIPTIONS[reportType]}
                      </p>
                    </div>
                  </button>
                ))}
            </div>
          </div>

          {/* Período */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Período
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.keys(REPORT_PERIOD_LABELS) as ReportPeriod[]).map((reportPeriod) => (
                <button
                  key={reportPeriod}
                  onClick={() => setPeriod(reportPeriod)}
                  disabled={isGenerating}
                  className={`
                    px-4 py-2.5 rounded-lg border text-sm font-medium transition-all
                    ${period === reportPeriod
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-gray-200 hover:border-gray-300 text-gray-700"
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  {REPORT_PERIOD_LABELS[reportPeriod]}
                </button>
              ))}
            </div>

            {/* Fechas personalizadas */}
            {period === "custom" && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Desde</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      value={customPeriodStart}
                      onChange={(e) => setCustomPeriodStart(e.target.value)}
                      disabled={isGenerating}
                      className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Hasta</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      value={customPeriodEnd}
                      onChange={(e) => setCustomPeriodEnd(e.target.value)}
                      disabled={isGenerating}
                      className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Título personalizado (opcional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="Se generará automáticamente si lo dejas vacío"
              disabled={isGenerating}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50"
            />
          </div>

          {/* Opciones adicionales */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="includeCharts"
              checked={includeCharts}
              onChange={(e) => setIncludeCharts(e.target.checked)}
              disabled={isGenerating}
              className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 disabled:opacity-50"
            />
            <label htmlFor="includeCharts" className="ml-2 text-sm text-gray-700">
              Incluir gráficos y visualizaciones
            </label>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="
              flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white
              bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                Generar Reporte
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
