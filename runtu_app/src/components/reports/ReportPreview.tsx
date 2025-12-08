"use client";

// ============================================
// ReportPreview Component
// ============================================
// Preview y acciones para un reporte generado

import { useState } from "react";
import {
  FileText,
  Download,
  Printer,
  Share2,
  Copy,
  Check,
  ExternalLink,
  X,
  ChevronDown,
} from "lucide-react";
import type { ExportFormat } from "@/types/reports";
import { REPORT_TYPE_LABELS, REPORT_PERIOD_LABELS } from "@/types/reports";

interface ReportData {
  id: string;
  title: string;
  content: string;
  type: string;
  period: string;
  generatedAt: string;
  metrics?: {
    highlights?: string[];
  };
}

interface ReportPreviewProps {
  report: ReportData;
  isModal?: boolean;
  onClose?: () => void;
  onDownload?: (format: ExportFormat) => Promise<void>;
}

export function ReportPreview({ report, isModal = false, onClose, onDownload }: ReportPreviewProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<ExportFormat | null>(null);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleDownload = async (format: ExportFormat) => {
    if (!onDownload) return;

    setIsDownloading(true);
    setDownloadFormat(format);
    setShowDownloadMenu(false);

    try {
      await onDownload(format);
    } finally {
      setIsDownloading(false);
      setDownloadFormat(null);
    }
  };

  const handlePrint = () => {
    // Abrir ventana de impresión con el contenido
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
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <h1>${report.title}</h1>
          <p class="meta">
            ${REPORT_TYPE_LABELS[report.type as keyof typeof REPORT_TYPE_LABELS] || report.type} ·
            ${REPORT_PERIOD_LABELS[report.period as keyof typeof REPORT_PERIOD_LABELS] || report.period} ·
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

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/app/reportes/${report.id}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const content = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between p-6 border-b border-gray-100">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700 rounded">
              {REPORT_TYPE_LABELS[report.type as keyof typeof REPORT_TYPE_LABELS] || report.type}
            </span>
            <span className="text-xs text-gray-500">
              {REPORT_PERIOD_LABELS[report.period as keyof typeof REPORT_PERIOD_LABELS] || report.period}
            </span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 truncate">{report.title}</h2>
          <p className="text-sm text-gray-500 mt-1">
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

        {/* Actions */}
        <div className="flex items-center gap-2 ml-4">
          {/* Download dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDownloadMenu(!showDownloadMenu)}
              disabled={isDownloading}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Descargar
              <ChevronDown className="w-3 h-3" />
            </button>

            {showDownloadMenu && (
              <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                <button
                  onClick={() => handleDownload("pdf")}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  PDF
                </button>
                <button
                  onClick={() => handleDownload("docx")}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Word (DOCX)
                </button>
                <button
                  onClick={() => handleDownload("md")}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Markdown
                </button>
                <button
                  onClick={() => handleDownload("html")}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  HTML
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handlePrint}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Imprimir"
          >
            <Printer className="w-5 h-5" />
          </button>

          <button
            onClick={handleCopyLink}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Copiar enlace"
          >
            {copied ? <Check className="w-5 h-5 text-emerald-600" /> : <Share2 className="w-5 h-5" />}
          </button>

          {isModal && onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Highlights */}
      {report.metrics?.highlights && report.metrics.highlights.length > 0 && (
        <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-100">
          <h3 className="text-sm font-medium text-emerald-800 mb-2">Puntos Destacados</h3>
          <ul className="space-y-1">
            {report.metrics.highlights.map((highlight, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-emerald-700">
                <span className="text-emerald-500 mt-0.5">•</span>
                {highlight}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div
          className="prose prose-gray max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700"
          dangerouslySetInnerHTML={{ __html: formatMarkdown(report.content) }}
        />
      </div>
    </div>
  );

  // Modal wrapper
  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-4xl h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
          {content}
        </div>
      </div>
    );
  }

  return <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">{content}</div>;
}

// Simple markdown formatter
function formatMarkdown(content: string): string {
  return content
    // Headers
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-6 mb-3">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-8 mb-4 pb-2 border-b border-gray-200">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>')
    // Bold and italic
    .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Lists
    .replace(/^\s*[-*]\s+(.*$)/gim, '<li>$1</li>')
    .replace(/(<li>[\s\S]*<\/li>)/gim, '<ul class="list-disc list-inside space-y-1 my-4">$1</ul>')
    .replace(/<\/ul>\s*<ul[^>]*>/g, '')
    // Numbered lists
    .replace(/^\s*\d+\.\s+(.*$)/gim, '<li>$1</li>')
    // Paragraphs
    .replace(/\n\n/g, '</p><p class="my-4">')
    // Line breaks
    .replace(/\n/g, '<br/>');
}
