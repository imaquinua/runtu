"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { X, Calendar, BarChart3, MessageCircle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { Summary } from "@/types/summaries";
import { formatPeriod, getSummaryTitle } from "@/types/summaries";
import { HighlightsList } from "./HighlightsList";

interface SummaryModalProps {
  summary: Summary;
  onClose: () => void;
}

export function SummaryModal({ summary, onClose }: SummaryModalProps) {
  const router = useRouter();

  // Close on escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  // Navigate to chat with context
  const handleAskRuntu = () => {
    const question = encodeURIComponent(
      `Cuéntame más sobre el resumen ${summary.type === "weekly" ? "semanal" : summary.type === "monthly" ? "mensual" : "del día"}`
    );
    router.push(`/app/chat?q=${question}`);
    onClose();
  };

  const Icon = summary.type === "monthly" ? Calendar : BarChart3;
  const periodText = formatPeriod(summary.type, summary.periodStart, summary.periodEnd);
  const title = getSummaryTitle(summary.type);

  // Format generated date
  const generatedDate = summary.generatedAt.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-slate-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              summary.type === "monthly"
                ? "bg-purple-500/20 text-purple-400"
                : "bg-indigo-500/20 text-indigo-400"
            }`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">{title}</h2>
              <p className="text-sm text-white/50">{periodText}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {/* Metrics Bar */}
          {summary.metrics && (
            <MetricsBar metrics={summary.metrics} />
          )}

          {/* Main Content */}
          <div className="prose prose-invert prose-sm max-w-none">
            <div className="text-white/80 whitespace-pre-wrap leading-relaxed">
              {renderMarkdown(summary.content)}
            </div>
          </div>

          {/* Highlights */}
          {summary.highlights && summary.highlights.length > 0 && (
            <HighlightsList highlights={summary.highlights} />
          )}

          {/* Generation info */}
          <div className="text-xs text-white/30 pt-4 border-t border-white/5">
            Generado {generatedDate} · {summary.chunksAnalyzed} fragmentos analizados
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 md:p-6 border-t border-white/10 bg-slate-900/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            Cerrar
          </button>
          <button
            onClick={handleAskRuntu}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Preguntarle a Runtu
          </button>
        </div>
      </div>
    </div>
  );
}

function MetricsBar({ metrics }: { metrics: Summary["metrics"] }) {
  const TrendIcon =
    metrics.activityTrend === "up"
      ? TrendingUp
      : metrics.activityTrend === "down"
      ? TrendingDown
      : Minus;

  const trendColor =
    metrics.activityTrend === "up"
      ? "text-green-400"
      : metrics.activityTrend === "down"
      ? "text-red-400"
      : "text-white/40";

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <MetricCard
        label="Actividad"
        value={metrics.chunksThisPeriod}
        subtitle="fragmentos"
      />
      <MetricCard
        label="vs. anterior"
        value={
          <div className={`flex items-center gap-1 ${trendColor}`}>
            <TrendIcon className="w-4 h-4" />
            {metrics.percentageChange !== undefined && (
              <span>{Math.abs(metrics.percentageChange)}%</span>
            )}
          </div>
        }
        subtitle={metrics.activityTrend === "stable" ? "igual" : ""}
      />
      <MetricCard
        label="Archivos"
        value={metrics.uploadsThisPeriod}
        subtitle="subidos"
      />
      <MetricCard
        label="Período ant."
        value={metrics.chunksPreviousPeriod}
        subtitle="fragmentos"
      />
    </div>
  );
}

function MetricCard({
  label,
  value,
  subtitle,
}: {
  label: string;
  value: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <div className="bg-white/5 rounded-lg p-3 text-center">
      <div className="text-xs text-white/40 mb-1">{label}</div>
      <div className="text-lg font-semibold text-white">{value}</div>
      {subtitle && <div className="text-xs text-white/30">{subtitle}</div>}
    </div>
  );
}

// Simple markdown renderer
function renderMarkdown(content: string): React.ReactNode {
  // Split into paragraphs
  const paragraphs = content.split(/\n\n+/);

  return paragraphs.map((p, i) => {
    // Handle headers
    if (p.startsWith("### ")) {
      return (
        <h3 key={i} className="text-lg font-semibold text-white mt-4 mb-2">
          {p.replace("### ", "")}
        </h3>
      );
    }
    if (p.startsWith("## ")) {
      return (
        <h2 key={i} className="text-xl font-semibold text-white mt-6 mb-3">
          {p.replace("## ", "")}
        </h2>
      );
    }

    // Handle bullet lists
    if (p.includes("\n- ") || p.startsWith("- ")) {
      const items = p.split("\n").filter((line) => line.startsWith("- "));
      return (
        <ul key={i} className="list-disc list-inside space-y-1 my-3 text-white/70">
          {items.map((item, j) => (
            <li key={j}>{item.replace(/^- /, "")}</li>
          ))}
        </ul>
      );
    }

    // Regular paragraph with bold handling
    const withBold = p.split(/\*\*(.*?)\*\*/g).map((part, j) =>
      j % 2 === 1 ? (
        <strong key={j} className="text-white font-medium">
          {part}
        </strong>
      ) : (
        part
      )
    );

    return (
      <p key={i} className="my-3 text-white/70 leading-relaxed">
        {withBold}
      </p>
    );
  });
}
