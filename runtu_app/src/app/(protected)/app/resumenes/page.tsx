"use client";

import { useState, useEffect, useCallback } from "react";
import { BarChart3, CalendarDays, CalendarRange } from "lucide-react";
import type { Summary, SummaryType } from "@/types/summaries";
import { SummaryCard, SummaryModal, EmptySummaries, GenerateDropdown } from "@/components/summaries";

type FilterType = "all" | "weekly" | "monthly";

export default function ResumenesPage() {
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedSummary, setSelectedSummary] = useState<Summary | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch summaries
  const fetchSummaries = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filter !== "all") {
        params.set("type", filter);
      }
      params.set("limit", "50");

      const response = await fetch(`/api/summaries?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al cargar resúmenes");
      }

      // Convert dates from strings
      const parsedSummaries = (data.summaries || []).map((s: Summary & {
        periodStart: string;
        periodEnd: string;
        generatedAt: string;
        readAt: string | null;
      }) => ({
        ...s,
        periodStart: new Date(s.periodStart),
        periodEnd: new Date(s.periodEnd),
        generatedAt: new Date(s.generatedAt),
        readAt: s.readAt ? new Date(s.readAt) : null,
      }));

      setSummaries(parsedSummaries);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchSummaries();
  }, [fetchSummaries]);

  // Generate summary
  const handleGenerate = async (type: SummaryType) => {
    try {
      setIsGenerating(true);
      setError(null);

      const response = await fetch("/api/summaries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al generar resumen");
      }

      // Refresh list and open the new summary
      await fetchSummaries();

      // Open the new summary
      if (data.summary) {
        const newSummary = {
          ...data.summary,
          periodStart: new Date(data.summary.periodStart),
          periodEnd: new Date(data.summary.periodEnd),
          generatedAt: new Date(data.summary.generatedAt),
          readAt: null,
        };
        setSelectedSummary(newSummary);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al generar");
    } finally {
      setIsGenerating(false);
    }
  };

  // Mark as read when opening
  const handleOpenSummary = async (summary: Summary) => {
    setSelectedSummary(summary);

    // Mark as read if unread
    if (!summary.readAt) {
      try {
        await fetch(`/api/summaries/${summary.id}`, {
          method: "PATCH",
        });

        // Update local state
        setSummaries((prev) =>
          prev.map((s) =>
            s.id === summary.id ? { ...s, readAt: new Date() } : s
          )
        );
      } catch {
        // Silent fail
      }
    }
  };

  // Filter tabs
  const filterTabs: { value: FilterType; label: string; icon: React.ElementType }[] = [
    { value: "all", label: "Todos", icon: BarChart3 },
    { value: "weekly", label: "Semanal", icon: CalendarDays },
    { value: "monthly", label: "Mensual", icon: CalendarRange },
  ];

  // Calculate unread count
  const unreadCount = summaries.filter((s) => !s.readAt).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Resúmenes de tu negocio
          </h1>
          <p className="text-white/50 mt-1">
            Lo que Runtu ha observado
            {unreadCount > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-indigo-500 text-white rounded-full">
                {unreadCount} sin leer
              </span>
            )}
          </p>
        </div>

        <GenerateDropdown onGenerate={handleGenerate} isGenerating={isGenerating} />
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg p-4 text-sm">
          {error}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mb-2">
        {filterTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = filter === tab.value;

          return (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                isActive
                  ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                  : "bg-white/5 text-white/60 hover:bg-white/10 border border-transparent"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {isLoading ? (
        <SummariesSkeleton />
      ) : summaries.length === 0 ? (
        <EmptySummaries
          onGenerate={() => handleGenerate("weekly")}
          isGenerating={isGenerating}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {summaries.map((summary) => (
            <SummaryCard
              key={summary.id}
              summary={summary}
              onClick={() => handleOpenSummary(summary)}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {selectedSummary && (
        <SummaryModal
          summary={selectedSummary}
          onClose={() => setSelectedSummary(null)}
        />
      )}
    </div>
  );
}

function SummariesSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="bg-white/5 rounded-xl border border-white/10 p-5 animate-pulse"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-white/10 rounded-lg" />
            <div className="space-y-2">
              <div className="h-3 w-16 bg-white/10 rounded" />
              <div className="h-4 w-32 bg-white/10 rounded" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 w-full bg-white/10 rounded" />
            <div className="h-3 w-4/5 bg-white/10 rounded" />
          </div>
          <div className="flex gap-2 mt-4">
            <div className="h-6 w-20 bg-white/10 rounded-full" />
            <div className="h-6 w-24 bg-white/10 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
