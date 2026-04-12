// ============================================
// Report Detail Page
// ============================================
// Página para ver un reporte específico

"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  Printer,
  Share2,
  Copy,
  Check,
  Trash2,
  ChevronDown,
  Loader2,
  FileText,
} from "lucide-react";
import type { ExportFormat } from "@/types/reports";
import { REPORT_TYPE_LABELS, REPORT_PERIOD_LABELS } from "@/types/reports";

interface ReportData {
  id: string;
  title: string;
  content: string;
  config: {
    type: string;
    period: string;
  };
  metrics?: {
    highlights?: string[];
  };
  generatedAt: string;
}

export default function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [report, setReport] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Cargar reporte
  useEffect(() => {
    async function loadReport() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/reports/${id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Error al cargar reporte");
        }

        setReport(data.report);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setIsLoading(false);
      }
    }

    loadReport();
  }, [id]);

  // Descargar
  const handleDownload = useCallback(
    async (format: ExportFormat) => {
      setShowDownloadMenu(false);

      if (format === "pdf") {
        const response = await fetch(`/api/reports/${id}?format=pdf`);
        const html = await response.text();

        const printWindow = window.open("", "_blank");
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          printWindow.print();
        }
        return;
      }

      const response = await fetch(`/api/reports/${id}?format=${format}`);
      if (!response.ok) return;

      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `report.${format}`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) filename = decodeURIComponent(match[1]);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    [id]
  );

  // Imprimir
  const handlePrint = () => {
    if (!report) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${report.title}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              max-width: 800px;
              margin: 0 auto;
              padding: 40px 20px;
              color: #1a1a1a;
            }
            h1 { font-size: 24px; margin-bottom: 8px; }
            h2 { font-size: 20px; margin-top: 32px; border-bottom: 1px solid #e5e5e5; padding-bottom: 8px; }
            h3 { font-size: 16px; margin-top: 24px; }
            p { margin: 16px 0; }
            ul, ol { margin: 16px 0; padding-left: 24px; }
            li { margin: 8px 0; }
            .meta { color: #666; font-size: 14px; margin-bottom: 32px; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <h1>${report.title}</h1>
          <p class="meta">
            ${REPORT_TYPE_LABELS[report.config.type as keyof typeof REPORT_TYPE_LABELS] || report.config.type} ·
            ${REPORT_PERIOD_LABELS[report.config.period as keyof typeof REPORT_PERIOD_LABELS] || report.config.period} ·
            ${new Date(report.generatedAt).toLocaleDateString("es-MX", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          <div>${formatMarkdown(report.content)}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Copiar enlace
  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Eliminar
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/reports/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al eliminar");
      }
      router.push("/app/reportes");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar");
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
        <FileText className="w-12 h-12 text-zinc-700 mb-4" />
        <h2 className="text-lg font-medium text-zinc-300 mb-2">
          {error || "Reporte no encontrado"}
        </h2>
        <button
          onClick={() => router.push("/app/reportes")}
          className="text-sm text-emerald-400 hover:text-emerald-300"
        >
          Volver a reportes
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 pb-20">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push("/app/reportes")}
              className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Reportes</span>
            </button>

            <div className="flex items-center gap-2">
              {/* Download dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Descargar
                  <ChevronDown className="w-3 h-3" />
                </button>

                {showDownloadMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowDownloadMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-40 bg-zinc-800 rounded-lg shadow-lg border border-zinc-700 py-1 z-20">
                      {(["pdf", "docx", "md", "html"] as ExportFormat[]).map((format) => (
                        <button
                          key={format}
                          onClick={() => handleDownload(format)}
                          className="w-full px-4 py-2 text-left text-sm text-zinc-200 hover:bg-zinc-700 flex items-center gap-2"
                        >
                          <FileText className="w-4 h-4 text-zinc-400" />
                          {format.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={handlePrint}
                className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
                title="Imprimir"
              >
                <Printer className="w-5 h-5" />
              </button>

              <button
                onClick={handleCopyLink}
                className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
                title="Copiar enlace"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Share2 className="w-5 h-5" />
                )}
              </button>

              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                title="Eliminar"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Meta */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 text-xs font-medium bg-emerald-500/20 text-emerald-400 rounded">
              {REPORT_TYPE_LABELS[report.config.type as keyof typeof REPORT_TYPE_LABELS] ||
                report.config.type}
            </span>
            <span className="text-xs text-zinc-500">
              {REPORT_PERIOD_LABELS[report.config.period as keyof typeof REPORT_PERIOD_LABELS] ||
                report.config.period}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-100 mb-2">{report.title}</h1>
          <p className="text-sm text-zinc-500">
            Generado el{" "}
            {new Date(report.generatedAt).toLocaleDateString("es-MX", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        {/* Highlights */}
        {report.metrics?.highlights && report.metrics.highlights.length > 0 && (
          <div className="mb-8 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <h3 className="text-sm font-medium text-emerald-400 mb-3">Puntos Destacados</h3>
            <ul className="space-y-2">
              {report.metrics.highlights.map((highlight, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                  <span className="text-emerald-500 mt-0.5">•</span>
                  {highlight}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Content */}
        <div
          className="prose prose-invert prose-zinc max-w-none prose-headings:text-zinc-100 prose-p:text-zinc-300 prose-li:text-zinc-300 prose-strong:text-zinc-200"
          dangerouslySetInnerHTML={{ __html: formatMarkdown(report.content) }}
        />
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="relative bg-zinc-900 rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-medium text-zinc-100 mb-2">¿Eliminar reporte?</h3>
            <p className="text-sm text-zinc-400 mb-6">
              Esta acción no se puede deshacer. El reporte será eliminado permanentemente.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50"
              >
                {isDeleting ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Simple markdown formatter
function formatMarkdown(content: string): string {
  return content
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-6 mb-3">$1</h3>')
    .replace(
      /^## (.*$)/gim,
      '<h2 class="text-xl font-semibold mt-8 mb-4 pb-2 border-b border-zinc-800">$1</h2>'
    )
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>')
    .replace(/\*\*\*(.*?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/^\s*[-*]\s+(.*$)/gim, "<li>$1</li>")
    .replace(/(<li>[\s\S]*<\/li>)/gim, '<ul class="list-disc list-inside space-y-1 my-4">$1</ul>')
    .replace(/<\/ul>\s*<ul[^>]*>/g, "")
    .replace(/^\s*\d+\.\s+(.*$)/gim, "<li>$1</li>")
    .replace(/\n\n/g, '</p><p class="my-4">')
    .replace(/\n/g, "<br/>");
}
