"use client";

// ============================================
// ReportCard Component
// ============================================
// Tarjeta para mostrar un reporte en la lista

import { FileText, Calendar, Trash2, Download, Eye } from "lucide-react";
import type { ReportType, ReportPeriod } from "@/types/reports";
import { REPORT_TYPE_LABELS, REPORT_PERIOD_LABELS } from "@/types/reports";

interface ReportCardProps {
  report: {
    id: string;
    title: string;
    type: ReportType;
    period: ReportPeriod;
    generatedAt: string;
    preview?: string;
  };
  onView: (id: string) => void;
  onDownload: (id: string) => void;
  onDelete: (id: string) => void;
}

const TYPE_COLORS: Record<ReportType, { bg: string; text: string }> = {
  executive: { bg: "bg-blue-100", text: "text-blue-700" },
  detailed: { bg: "bg-purple-100", text: "text-purple-700" },
  financial: { bg: "bg-emerald-100", text: "text-emerald-700" },
  operational: { bg: "bg-orange-100", text: "text-orange-700" },
  custom: { bg: "bg-gray-100", text: "text-gray-700" },
};

export function ReportCard({ report, onView, onDownload, onDelete }: ReportCardProps) {
  const colors = TYPE_COLORS[report.type] || TYPE_COLORS.custom;
  const date = new Date(report.generatedAt);

  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-lg">
            <FileText className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${colors.bg} ${colors.text}`}>
              {REPORT_TYPE_LABELS[report.type]}
            </span>
            <p className="text-xs text-gray-500 mt-0.5">
              {REPORT_PERIOD_LABELS[report.period]}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onView(report.id)}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Ver reporte"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDownload(report.id)}
            className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
            title="Descargar"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(report.id)}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Title */}
      <h3
        className="font-medium text-gray-900 mb-2 cursor-pointer hover:text-emerald-600 transition-colors"
        onClick={() => onView(report.id)}
      >
        {report.title}
      </h3>

      {/* Preview */}
      {report.preview && (
        <p className="text-sm text-gray-500 line-clamp-2 mb-3">{report.preview}</p>
      )}

      {/* Footer */}
      <div className="flex items-center text-xs text-gray-400">
        <Calendar className="w-3.5 h-3.5 mr-1" />
        {date.toLocaleDateString("es-MX", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </div>
    </div>
  );
}
