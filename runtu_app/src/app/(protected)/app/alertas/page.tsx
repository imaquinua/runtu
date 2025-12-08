// ============================================
// Alertas Page
// ============================================
// Página completa de todas las alertas

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bell,
  BellOff,
  Filter,
  Check,
  Trash2,
  RefreshCw,
  Clock,
  AlertTriangle,
  Calendar,
  Lightbulb,
  Trophy,
  Info,
} from "lucide-react";
import { AlertItem, AlertItemSkeleton } from "@/components/alerts/AlertItem";
import type { Alert, AlertType } from "@/types/alerts";

type TabType = "active" | "dismissed" | "all";

const TYPE_FILTERS: { value: AlertType | "all"; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: "all", label: "Todas", icon: Bell },
  { value: "insight", label: "Insights", icon: Lightbulb },
  { value: "milestone", label: "Logros", icon: Trophy },
  { value: "tip", label: "Sugerencias", icon: Info },
  { value: "reminder", label: "Recordatorios", icon: Calendar },
  { value: "inactivity", label: "Inactividad", icon: Clock },
  { value: "anomaly", label: "Anomalías", icon: AlertTriangle },
];

export default function AlertasPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("active");
  const [typeFilter, setTypeFilter] = useState<AlertType | "all">("all");
  const [showFilters, setShowFilters] = useState(false);

  // Cargar alertas
  const fetchAlerts = useCallback(async () => {
    setIsLoading(true);
    try {
      // Para la tab "dismissed", necesitamos cargar todas y filtrar
      // En producción sería mejor un endpoint específico
      const params = new URLSearchParams({
        includeSeen: "true",
        limit: "100",
      });

      const res = await fetch(`/api/alerts?${params}`);
      if (!res.ok) throw new Error("Error al cargar alertas");

      const data = await res.json();
      const parsedAlerts: Alert[] = data.alerts.map((a: Record<string, unknown>) => ({
        ...a,
        createdAt: new Date(a.createdAt as string),
        seenAt: a.seenAt ? new Date(a.seenAt as string) : null,
        dismissedAt: a.dismissedAt ? new Date(a.dismissedAt as string) : null,
        expiresAt: a.expiresAt ? new Date(a.expiresAt as string) : null,
      }));

      setAlerts(parsedAlerts);
    } catch (err) {
      console.error("[AlertasPage] Error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Marcar como vista
  const markSeen = async (id: string) => {
    try {
      await fetch(`/api/alerts/${id}`, { method: "PATCH" });
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, seenAt: new Date() } : a))
      );
    } catch (err) {
      console.error("[AlertasPage] Error marking seen:", err);
    }
  };

  // Marcar todas como vistas
  const markAllSeen = async () => {
    try {
      await fetch("/api/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markAllSeen" }),
      });
      const now = new Date();
      setAlerts((prev) => prev.map((a) => ({ ...a, seenAt: a.seenAt || now })));
    } catch (err) {
      console.error("[AlertasPage] Error marking all seen:", err);
    }
  };

  // Descartar
  const dismiss = async (id: string) => {
    try {
      await fetch(`/api/alerts/${id}`, { method: "DELETE" });
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, dismissedAt: new Date() } : a
        )
      );
    } catch (err) {
      console.error("[AlertasPage] Error dismissing:", err);
    }
  };

  // Filtrar alertas
  const filteredAlerts = alerts.filter((alert) => {
    // Filtro por tab
    if (activeTab === "active" && alert.dismissedAt) return false;
    if (activeTab === "dismissed" && !alert.dismissedAt) return false;

    // Filtro por tipo
    if (typeFilter !== "all" && alert.type !== typeFilter) return false;

    return true;
  });

  // Contar por tab
  const activeCounts = {
    active: alerts.filter((a) => !a.dismissedAt).length,
    dismissed: alerts.filter((a) => a.dismissedAt).length,
    all: alerts.length,
  };

  const unseenCount = alerts.filter((a) => !a.seenAt && !a.dismissedAt).length;

  return (
    <div className="min-h-screen bg-zinc-950 pb-20">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                <Bell className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-zinc-100">
                  Notificaciones
                </h1>
                <p className="text-sm text-zinc-500">
                  {unseenCount > 0
                    ? `${unseenCount} sin leer`
                    : "Todo al día"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Marcar todas como leídas */}
              {unseenCount > 0 && (
                <button
                  onClick={markAllSeen}
                  className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
                  title="Marcar todas como leídas"
                >
                  <Check className="w-5 h-5" />
                </button>
              )}

              {/* Filtros */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg transition-colors ${
                  showFilters
                    ? "text-indigo-400 bg-indigo-500/20"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                }`}
                title="Filtros"
              >
                <Filter className="w-5 h-5" />
              </button>

              {/* Refrescar */}
              <button
                onClick={fetchAlerts}
                className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
                title="Refrescar"
              >
                <RefreshCw
                  className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`}
                />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4 -mx-1">
            {(["active", "dismissed", "all"] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab
                    ? "bg-zinc-700 text-zinc-100"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                }`}
              >
                {tab === "active" && "Activas"}
                {tab === "dismissed" && "Descartadas"}
                {tab === "all" && "Todas"}
                <span className="ml-1.5 text-xs text-zinc-500">
                  ({activeCounts[tab]})
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Panel de filtros */}
        {showFilters && (
          <div className="border-t border-zinc-800 px-4 py-3 bg-zinc-900/80">
            <div className="max-w-4xl mx-auto">
              <p className="text-xs font-medium text-zinc-500 mb-2">
                Filtrar por tipo
              </p>
              <div className="flex flex-wrap gap-2">
                {TYPE_FILTERS.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setTypeFilter(value)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      typeFilter === value
                        ? "bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500/30"
                        : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lista de alertas */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="space-y-3">
          {isLoading ? (
            <>
              <AlertItemSkeleton />
              <AlertItemSkeleton />
              <AlertItemSkeleton />
              <AlertItemSkeleton />
            </>
          ) : filteredAlerts.length === 0 ? (
            <div className="py-16 text-center">
              <BellOff className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-zinc-300 mb-1">
                {activeTab === "dismissed"
                  ? "No hay alertas descartadas"
                  : "No hay notificaciones"}
              </h3>
              <p className="text-sm text-zinc-500">
                {activeTab === "active"
                  ? "Te avisaremos cuando haya algo importante"
                  : "Las notificaciones que descartes aparecerán aquí"}
              </p>
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <AlertItem
                key={alert.id}
                alert={alert}
                onSeen={() => markSeen(alert.id)}
                onDismiss={() => dismiss(alert.id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
