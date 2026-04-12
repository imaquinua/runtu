// ============================================
// Report Export
// ============================================
// Exporta reportes a diferentes formatos

import { marked } from "marked";
import type { GeneratedReport, ExportFormat } from "@/types/reports";

// ============================================
// Markdown to HTML
// ============================================

export function markdownToHtml(markdown: string): string {
  // Configurar marked para producir HTML limpio
  marked.setOptions({
    gfm: true, // GitHub Flavored Markdown
    breaks: true,
  });

  return marked(markdown) as string;
}

// ============================================
// HTML Template for PDF
// ============================================

function getHtmlTemplate(report: GeneratedReport, htmlContent: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(report.title)}</title>
  <style>
    /* Reset y base */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #1a1a1a;
      background: white;
      padding: 40px 60px;
      max-width: 800px;
      margin: 0 auto;
    }

    /* Headers */
    h1 {
      font-size: 24pt;
      font-weight: 700;
      color: #111;
      margin-bottom: 8px;
      padding-bottom: 12px;
      border-bottom: 3px solid #4f46e5;
    }

    h2 {
      font-size: 16pt;
      font-weight: 600;
      color: #1a1a1a;
      margin-top: 24px;
      margin-bottom: 12px;
      padding-bottom: 6px;
      border-bottom: 1px solid #e5e7eb;
    }

    h3 {
      font-size: 13pt;
      font-weight: 600;
      color: #374151;
      margin-top: 18px;
      margin-bottom: 8px;
    }

    h4 {
      font-size: 11pt;
      font-weight: 600;
      color: #4b5563;
      margin-top: 14px;
      margin-bottom: 6px;
    }

    /* Paragraphs */
    p {
      margin-bottom: 12px;
      text-align: justify;
    }

    /* Lists */
    ul, ol {
      margin-bottom: 12px;
      padding-left: 24px;
    }

    li {
      margin-bottom: 6px;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-size: 10pt;
    }

    th {
      background: #f3f4f6;
      font-weight: 600;
      text-align: left;
      padding: 10px 12px;
      border: 1px solid #d1d5db;
    }

    td {
      padding: 8px 12px;
      border: 1px solid #e5e7eb;
    }

    tr:nth-child(even) {
      background: #f9fafb;
    }

    /* Horizontal rules */
    hr {
      border: none;
      border-top: 1px solid #e5e7eb;
      margin: 20px 0;
    }

    /* Strong and emphasis */
    strong {
      font-weight: 600;
      color: #111;
    }

    em {
      font-style: italic;
      color: #6b7280;
    }

    /* Blockquotes */
    blockquote {
      border-left: 4px solid #4f46e5;
      padding-left: 16px;
      margin: 16px 0;
      color: #4b5563;
      font-style: italic;
    }

    /* Code blocks */
    code {
      font-family: 'Courier New', monospace;
      font-size: 10pt;
      background: #f3f4f6;
      padding: 2px 6px;
      border-radius: 3px;
    }

    pre {
      background: #1f2937;
      color: #f9fafb;
      padding: 16px;
      border-radius: 6px;
      overflow-x: auto;
      margin: 16px 0;
    }

    pre code {
      background: none;
      padding: 0;
      color: inherit;
    }

    /* Footer */
    .report-footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 9pt;
      color: #6b7280;
      text-align: center;
    }

    /* Page break hints */
    .page-break {
      page-break-before: always;
    }

    /* Print styles */
    @media print {
      body {
        padding: 20px 40px;
      }

      h2 {
        page-break-after: avoid;
      }

      table, pre {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <main>
    ${htmlContent}
  </main>

  <footer class="report-footer">
    <p>Reporte generado automáticamente por Runtu</p>
    <p>${new Date().toLocaleDateString("es-MX", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })}</p>
  </footer>
</body>
</html>`;
}

// ============================================
// Export Functions
// ============================================

export async function exportToHtml(report: GeneratedReport): Promise<string> {
  const htmlContent = markdownToHtml(report.content);
  return getHtmlTemplate(report, htmlContent);
}

export async function exportToMarkdown(report: GeneratedReport): Promise<string> {
  // Agregar metadatos al inicio
  const metadata = `---
title: ${report.title}
generated: ${report.generatedAt.toISOString()}
type: ${report.config.type}
period: ${report.config.period}
---

`;
  return metadata + report.content;
}

export async function exportToPdf(report: GeneratedReport): Promise<Buffer> {
  // Para PDF usamos una aproximación con HTML
  // En producción se podría usar puppeteer o un servicio externo

  const html = await exportToHtml(report);

  // Convertir HTML a Buffer (el frontend manejará la conversión a PDF)
  return Buffer.from(html, "utf-8");
}

// Función para obtener el contenido en el formato solicitado
export async function exportReport(
  report: GeneratedReport,
  format: ExportFormat
): Promise<{ content: string; mimeType: string; filename: string }> {
  const baseFilename = sanitizeFilename(report.title);

  switch (format) {
    case "html": {
      const html = await exportToHtml(report);
      return {
        content: html,
        mimeType: "text/html",
        filename: `${baseFilename}.html`,
      };
    }

    case "md": {
      const markdown = await exportToMarkdown(report);
      return {
        content: markdown,
        mimeType: "text/markdown",
        filename: `${baseFilename}.md`,
      };
    }

    case "pdf": {
      // Retornamos HTML que el cliente convertirá a PDF
      const html = await exportToHtml(report);
      return {
        content: html,
        mimeType: "text/html", // El cliente lo convertirá
        filename: `${baseFilename}.pdf`,
      };
    }

    case "docx": {
      // Para DOCX retornamos HTML que puede abrirse en Word
      const html = await exportToHtml(report);
      return {
        content: html,
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename: `${baseFilename}.docx`,
      };
    }

    default:
      throw new Error(`Formato no soportado: ${format}`);
  }
}

// ============================================
// Helpers
// ============================================

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9áéíóúñü\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 100);
}

// ============================================
// Print-Ready HTML for Client-Side PDF
// ============================================

export function getPrintReadyHtml(report: GeneratedReport): string {
  const htmlContent = markdownToHtml(report.content);

  // Template optimizado para impresión/PDF
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(report.title)}</title>
  <style>
    @page {
      size: letter;
      margin: 2cm;
    }

    body {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 12pt;
      line-height: 1.5;
      color: #000;
      background: #fff;
    }

    h1 {
      font-size: 20pt;
      border-bottom: 2px solid #333;
      padding-bottom: 8px;
      margin-bottom: 16px;
    }

    h2 {
      font-size: 14pt;
      margin-top: 20px;
      margin-bottom: 10px;
      color: #333;
    }

    h3 {
      font-size: 12pt;
      margin-top: 16px;
      margin-bottom: 8px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
    }

    th, td {
      border: 1px solid #333;
      padding: 6px 8px;
      text-align: left;
    }

    th {
      background: #f0f0f0;
      font-weight: bold;
    }

    hr {
      border: none;
      border-top: 1px solid #ccc;
      margin: 16px 0;
    }

    ul, ol {
      margin-left: 20px;
    }

    .footer {
      margin-top: 30px;
      padding-top: 10px;
      border-top: 1px solid #ccc;
      font-size: 9pt;
      color: #666;
      text-align: center;
    }
  </style>
</head>
<body>
  ${htmlContent}
  <div class="footer">
    Generado por Runtu | ${new Date().toLocaleDateString("es-MX")}
  </div>
</body>
</html>`;
}
