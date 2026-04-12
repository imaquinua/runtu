"use client";

import { Calendar, BarChart3, TrendingUp } from "lucide-react";
import type { Summary } from "@/types/summaries";
import { formatPeriod } from "@/types/summaries";

interface SummaryCardProps {
  summary: Summary;
  onClick: () => void;
}

export function SummaryCard({ summary, onClick }: SummaryCardProps) {
  const isUnread = !summary.readAt;

  // Get icon based on type
  const Icon = summary.type === "monthly" ? Calendar : BarChart3;

  // Get type label in Spanish
  const typeLabel = {
    daily: "Hoy",
    weekly: "Semanal",
    monthly: "Mensual",
  }[summary.type];

  // Format period for display
  const periodText = formatPeriod(summary.type, summary.periodStart, summary.periodEnd);

  // Get preview text (first 120 chars)
  const preview = summary.content
    .replace(/[#*_`]/g, "") // Remove markdown
    .substring(0, 120)
    .trim();

  // Format generation date
  const generatedText = formatRelativeTime(summary.generatedAt);

  // Get trend indicator from metrics
  const trend = summary.metrics?.activityTrend;
  const percentageChange = summary.metrics?.percentageChange;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left bg-white/5 backdrop-blur-sm rounded-xl border transition-all duration-200 hover:bg-white/10 hover:border-white/20 hover:translate-y-[-2px] group ${
        isUnread
          ? "border-l-4 border-l-indigo-500 border-t-white/10 border-r-white/10 border-b-white/10"
          : "border-white/10"
      }`}
    >
      <div className="p-4 md:p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${
              summary.type === "monthly"
                ? "bg-purple-500/20 text-purple-400"
                : "bg-indigo-500/20 text-indigo-400"
            }`}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-medium text-white/40 uppercase tracking-wide">
                {typeLabel}
              </span>
              <h3 className="text-sm font-semibold text-white">
                {periodText}
              </h3>
            </div>
          </div>

          {isUnread && (
            <span className="px-2 py-0.5 text-xs font-bold bg-indigo-500 text-white rounded-full animate-pulse">
              NUEVO
            </span>
          )}
        </div>

        {/* Preview */}
        <p className="text-sm text-white/60 line-clamp-2 mb-3">
          {preview}...
        </p>

        {/* Highlights pills */}
        {summary.highlights && summary.highlights.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {summary.highlights.slice(0, 2).map((highlight, idx) => (
              <span
                key={idx}
                className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${
                  highlight.type === "positive"
                    ? "bg-green-500/20 text-green-400"
                    : highlight.type === "negative"
                    ? "bg-red-500/20 text-red-400"
                    : highlight.type === "action"
                    ? "bg-indigo-500/20 text-indigo-400"
                    : "bg-white/10 text-white/60"
                }`}
              >
                <span>{highlight.icon}</span>
                <span className="truncate max-w-[120px]">{highlight.title}</span>
              </span>
            ))}
            {summary.highlights.length > 2 && (
              <span className="text-xs text-white/40">
                +{summary.highlights.length - 2} más
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          <span className="text-xs text-white/40">
            {generatedText}
          </span>

          {trend && trend !== "stable" && (
            <div className={`flex items-center gap-1 text-xs ${
              trend === "up" ? "text-green-400" : "text-red-400"
            }`}>
              <TrendingUp className={`w-3 h-3 ${trend === "down" ? "rotate-180" : ""}`} />
              {percentageChange !== undefined && (
                <span>{Math.abs(percentageChange)}%</span>
              )}
            </div>
          )}

          <span className="text-xs text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
            Ver resumen completo →
          </span>
        </div>
      </div>
    </button>
  );
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) {
    return "Hace unos minutos";
  } else if (diffHours < 24) {
    return `Hace ${diffHours} hora${diffHours === 1 ? "" : "s"}`;
  } else if (diffDays === 1) {
    return "Ayer";
  } else if (diffDays < 7) {
    return `Hace ${diffDays} días`;
  } else {
    return date.toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
    });
  }
}
