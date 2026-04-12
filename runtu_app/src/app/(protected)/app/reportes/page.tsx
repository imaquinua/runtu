// ============================================
// Reportes Page
// ============================================
// Página para generar y gestionar reportes

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Plus,
  Filter,
  RefreshCw,
  Search,
  FileX,
  Building,
  TrendingUp,
  Settings,
  Loader2,
} from "lucide-react";
import { useReports } from "@/hooks/useReports";
import { GenerateReportModal, ReportCard, ReportPreview } from "@/components/reports";
import type { ReportType, ExportFormat } from "@/types/reports";
import { REPORT_TYPE_LABELS } from "@/types/reports";

type FilterType = ReportType | "all";

const TYPE_FILTERS: { value: FilterType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: "all", label: "Todos", icon: FileText },
  { value: "executive", label: "Ejecutivo", icon: FileText },
  { value: "detailed", label: "Detallado", icon: Settings },
  { value: "financial", label: "Financiero", icon: Building },
  { value: "operational", label: "Operacional", icon: TrendingUp },
];

export default function ReportesPage() {
  const {
    reports,
    total,
    isLoading,
    error,
    fetchReports,
    generateReport,
    getReport,
    deleteReport,
    downloadReport,
  } = useReports();

  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<Record<string, unknown> | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [typeFilter, setTypeFilter] = useState<FilterType>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Cargar reportes al montar
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Cargar reporte específico al seleccionar
  useEffect(() => {
    if (!selectedReportId) {
      setSelectedReport(null);
      return;
    }

    async function loadReport() {
      setIsLoadingReport(true);
      try {
        const report = await getReport(selectedReportId!);
        setSelectedReport(report as unknown as Record<string, unknown>);
      } catch (err) {
        console.error("[ReportesPage] Error loading report:", err);
      } finally {
        setIsLoadingReport(false);
      }
    }

    loadReport();
  }, [selectedReportId, getReport]);

  // Generar reporte
  const handleGenerate = async (config: Parameters<typeof generateReport>[0]) => {
    const report = await generateReport(config);
    // Abrir el reporte generado
    setSelectedReportId(report.id);
  };

  // Eliminar reporte
  const handleDelete = async (id: string) => {
    if (deleteConfirmId !== id) {
      setDeleteConfirmId(id);
      return;
    }

    await deleteReport(id);
    setDeleteConfirmId(null);
    if (selectedReportId === id) {
      setSelectedReportId(null);
    }
  };

  // Descargar reporte
  const handleDownload = useCallback(
    async (id: string, format?: ExportFormat) => {
      await downloadReport(id, format || "pdf");
    },
    [downloadReport]
  );

  // Filtrar reportes
  const filteredReports = reports.filter((report) => {
    // Filtro por tipo
    if (typeFilter !== "all" && report.type !== typeFilter) return false;

    // Filtro por búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        report.title.toLowerCase().includes(query) ||
        (report.preview?.toLowerCase().includes(query) ?? false)
      );
    }

    return true;
  });

  // Contar por tipo
  const typeCounts = reports.reduce((acc, r) => {
    acc[r.type] = (acc[r.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-zinc-950 pb-20">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-zinc-100">Reportes</h1>
                <p className="text-sm text-zinc-500">
                  {total} {total === 1 ? "reporte generado" : "reportes generados"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Nuevo reporte */}
              <button
                onClick={() => setShowGenerateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nuevo Reporte
              </button>

              {/* Filtros */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg transition-colors ${
                  showFilters
                    ? "text-emerald-400 bg-emerald-500/20"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                }`}
                title="Filtros"
              >
                <Filter className="w-5 h-5" />
              </button>

              {/* Refrescar */}
              <button
                onClick={() => fetchReports()}
                className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
                title="Refrescar"
              >
                <RefreshCw className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Barra de búsqueda */}
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar reportes..."
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Panel de filtros */}
        {showFilters && (
          <div className="border-t border-zinc-800 px-4 py-3 bg-zinc-900/80">
            <div className="max-w-6xl mx-auto">
              <p className="text-xs font-medium text-zinc-500 mb-2">Filtrar por tipo</p>
              <div className="flex flex-wrap gap-2">
                {TYPE_FILTERS.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setTypeFilter(value)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      typeFilter === value
                        ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30"
                        : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                    {value !== "all" && typeCounts[value] && (
                      <span className="text-zinc-500">({typeCounts[value]})</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Grid de reportes */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-zinc-900 rounded-xl border border-zinc-800 p-5 animate-pulse"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 bg-zinc-800 rounded-lg" />
                  <div className="flex-1">
                    <div className="h-4 bg-zinc-800 rounded w-16 mb-1" />
                    <div className="h-3 bg-zinc-800 rounded w-12" />
                  </div>
                </div>
                <div className="h-5 bg-zinc-800 rounded w-3/4 mb-2" />
                <div className="h-4 bg-zinc-800 rounded w-full mb-1" />
                <div className="h-4 bg-zinc-800 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="py-16 text-center">
            <FileX className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-zinc-300 mb-1">
              {searchQuery || typeFilter !== "all"
                ? "No se encontraron reportes"
                : "No hay reportes aún"}
            </h3>
            <p className="text-sm text-zinc-500 mb-6">
              {searchQuery || typeFilter !== "all"
                ? "Intenta con otros filtros de búsqueda"
                : "Genera tu primer reporte para ver el estado de tu negocio"}
            </p>
            {!searchQuery && typeFilter === "all" && (
              <button
                onClick={() => setShowGenerateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Generar Primer Reporte
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredReports.map((report) => (
              <div key={report.id} className="relative group">
                <ReportCard
                  report={report}
                  onView={(id) => setSelectedReportId(id)}
                  onDownload={(id) => handleDownload(id)}
                  onDelete={(id) => handleDelete(id)}
                />

                {/* Confirmación de eliminación */}
                {deleteConfirmId === report.id && (
                  <div className="absolute inset-0 bg-zinc-900/95 rounded-xl flex flex-col items-center justify-center p-4 z-10">
                    <p className="text-sm text-zinc-300 mb-4 text-center">
                      ¿Eliminar este reporte?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-200"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleDelete(report.id)}
                        className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de generación */}
      <GenerateReportModal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        onGenerate={handleGenerate}
      />

      {/* Modal de preview */}
      {selectedReportId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedReportId(null)}
          />
          <div className="relative w-full max-w-4xl h-[90vh] bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            {isLoadingReport ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
              </div>
            ) : selectedReport ? (
              <ReportPreview
                report={{
                  id: selectedReport.id as string,
                  title: selectedReport.title as string,
                  content: selectedReport.content as string,
                  type: (selectedReport.config as { type: string })?.type || "executive",
                  period: (selectedReport.config as { period: string })?.period || "last_month",
                  generatedAt: selectedReport.generatedAt as string,
                  metrics: selectedReport.metrics as { highlights?: string[] },
                }}
                isModal={false}
                onClose={() => setSelectedReportId(null)}
                onDownload={(format) => handleDownload(selectedReportId, format)}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-zinc-500">
                No se pudo cargar el reporte
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
