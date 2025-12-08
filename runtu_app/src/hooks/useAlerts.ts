// ============================================
// useAlerts Hook
// ============================================
// Hook para gestionar alertas del usuario

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Alert } from "@/types/alerts";

interface UseAlertsReturn {
  alerts: Alert[];
  unseenCount: number;
  highPriorityAlerts: Alert[];
  isLoading: boolean;
  error: string | null;
  markSeen: (id: string) => Promise<void>;
  markAllSeen: () => Promise<void>;
  dismiss: (id: string) => Promise<void>;
  dismissAll: () => Promise<void>;
  refresh: () => Promise<void>;
}

const POLL_INTERVAL = 5 * 60 * 1000; // 5 minutos

export function useAlerts(): UseAlertsReturn {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [unseenCount, setUnseenCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Cargar alertas
  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch("/api/alerts?includeSeen=false&limit=50");

      if (!res.ok) {
        throw new Error("Error al cargar alertas");
      }

      const data = await res.json();

      // Convertir fechas de string a Date
      const parsedAlerts: Alert[] = data.alerts.map((a: Record<string, unknown>) => ({
        ...a,
        createdAt: new Date(a.createdAt as string),
        seenAt: a.seenAt ? new Date(a.seenAt as string) : null,
        dismissedAt: a.dismissedAt ? new Date(a.dismissedAt as string) : null,
        expiresAt: a.expiresAt ? new Date(a.expiresAt as string) : null,
      }));

      setAlerts(parsedAlerts);
      setUnseenCount(data.unseenCount || 0);
      setError(null);
    } catch (err) {
      console.error("[useAlerts] Error:", err);
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Marcar como vista
  const markSeen = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/alerts/${id}`, {
        method: "PATCH",
      });

      if (!res.ok) throw new Error("Error al marcar como vista");

      setAlerts((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, seenAt: new Date() } : a
        )
      );
      setUnseenCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("[useAlerts] Error marking seen:", err);
    }
  }, []);

  // Marcar todas como vistas
  const markAllSeen = useCallback(async () => {
    try {
      const res = await fetch("/api/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markAllSeen" }),
      });

      if (!res.ok) throw new Error("Error al marcar todas como vistas");

      const now = new Date();
      setAlerts((prev) =>
        prev.map((a) => ({ ...a, seenAt: a.seenAt || now }))
      );
      setUnseenCount(0);
    } catch (err) {
      console.error("[useAlerts] Error marking all seen:", err);
    }
  }, []);

  // Descartar alerta
  const dismiss = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/alerts/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Error al descartar alerta");

      setAlerts((prev) => prev.filter((a) => a.id !== id));
      // Si no estaba vista, reducir contador
      const alert = alerts.find((a) => a.id === id);
      if (alert && !alert.seenAt) {
        setUnseenCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("[useAlerts] Error dismissing:", err);
    }
  }, [alerts]);

  // Descartar todas
  const dismissAll = useCallback(async () => {
    try {
      const res = await fetch("/api/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "dismissAll" }),
      });

      if (!res.ok) throw new Error("Error al descartar todas");

      setAlerts([]);
      setUnseenCount(0);
    } catch (err) {
      console.error("[useAlerts] Error dismissing all:", err);
    }
  }, []);

  // Refrescar
  const refresh = useCallback(async () => {
    setIsLoading(true);
    await fetchAlerts();
  }, [fetchAlerts]);

  // Cargar al montar
  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Polling cada 5 minutos
  useEffect(() => {
    pollRef.current = setInterval(fetchAlerts, POLL_INTERVAL);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, [fetchAlerts]);

  // Filtrar alertas de alta prioridad
  const highPriorityAlerts = alerts.filter(
    (a) => a.priority === "high" && !a.seenAt && !a.dismissedAt
  );

  return {
    alerts,
    unseenCount,
    highPriorityAlerts,
    isLoading,
    error,
    markSeen,
    markAllSeen,
    dismiss,
    dismissAll,
    refresh,
  };
}

// ============================================
// Hook simplificado solo para el badge
// ============================================

export function useAlertsBadge() {
  const [unseenCount, setUnseenCount] = useState(0);
  const [hasHighPriority, setHasHighPriority] = useState(false);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch("/api/alerts?includeSeen=false&limit=10");
        if (res.ok) {
          const data = await res.json();
          setUnseenCount(data.unseenCount || 0);
          setHasHighPriority(
            data.alerts?.some(
              (a: { priority: string; seenAt: unknown }) =>
                a.priority === "high" && !a.seenAt
            ) || false
          );
        }
      } catch (err) {
        console.error("[useAlertsBadge] Error:", err);
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  return { unseenCount, hasHighPriority };
}
