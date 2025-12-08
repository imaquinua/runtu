"use client";

// ============================================
// useReports Hook
// ============================================
// Hook para gestionar reportes

import { useState, useCallback } from "react";
import type { ReportType, ReportPeriod, ExportFormat } from "@/types/reports";

interface ReportListItem {
  id: string;
  title: string;
  type: ReportType;
  period: ReportPeriod;
  generatedAt: string;
  preview?: string;
}

interface GeneratedReport {
  id: string;
  businessId: string;
  config: {
    type: ReportType;
    period: ReportPeriod;
  };
  title: string;
  content: string;
  metrics?: {
    highlights?: string[];
  };
  generatedAt: string;
}

interface GenerateConfig {
  type: ReportType;
  period: ReportPeriod;
  includeCharts: boolean;
  customPeriodStart?: string;
  customPeriodEnd?: string;
  title?: string;
}

interface UseReportsReturn {
  reports: ReportListItem[];
  total: number;
  isLoading: boolean;
  error: string | null;
  fetchReports: (options?: { limit?: number; offset?: number }) => Promise<void>;
  generateReport: (config: GenerateConfig) => Promise<GeneratedReport>;
  getReport: (id: string) => Promise<GeneratedReport | null>;
  deleteReport: (id: string) => Promise<void>;
  downloadReport: (id: string, format: ExportFormat) => Promise<void>;
}

export function useReports(): UseReportsReturn {
  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch reports list
  const fetchReports = useCallback(async (options?: { limit?: number; offset?: number }) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (options?.limit) params.set("limit", options.limit.toString());
      if (options?.offset) params.set("offset", options.offset.toString());

      const response = await fetch(`/api/reports?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al obtener reportes");
      }

      setReports(data.reports);
      setTotal(data.total);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      setError(message);
      console.error("[useReports] Fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Generate new report
  const generateReport = useCallback(async (config: GenerateConfig): Promise<GeneratedReport> => {
    const response = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Error al generar reporte");
    }

    // Refresh list after generating
    await fetchReports();

    return data.report;
  }, [fetchReports]);

  // Get single report
  const getReport = useCallback(async (id: string): Promise<GeneratedReport | null> => {
    const response = await fetch(`/api/reports/${id}`);
    const data = await response.json();

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(data.error || "Error al obtener reporte");
    }

    return data.report;
  }, []);

  // Delete report
  const deleteReport = useCallback(async (id: string): Promise<void> => {
    const response = await fetch(`/api/reports/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Error al eliminar reporte");
    }

    // Update local state
    setReports((prev) => prev.filter((r) => r.id !== id));
    setTotal((prev) => prev - 1);
  }, []);

  // Download report in specific format
  const downloadReport = useCallback(async (id: string, format: ExportFormat): Promise<void> => {
    // For PDF, we fetch HTML and print
    if (format === "pdf") {
      const response = await fetch(`/api/reports/${id}?format=pdf`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al descargar");
      }

      const html = await response.text();

      // Open print window
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();
      }
      return;
    }

    // For other formats, download directly
    const response = await fetch(`/api/reports/${id}?format=${format}`);

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Error al descargar");
    }

    // Get filename from Content-Disposition header
    const contentDisposition = response.headers.get("Content-Disposition");
    let filename = `report.${format}`;
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="(.+)"/);
      if (match) filename = decodeURIComponent(match[1]);
    }

    // Download file
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  return {
    reports,
    total,
    isLoading,
    error,
    fetchReports,
    generateReport,
    getReport,
    deleteReport,
    downloadReport,
  };
}
