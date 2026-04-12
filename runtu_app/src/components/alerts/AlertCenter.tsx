// ============================================
// AlertCenter Component
// ============================================
// Dropdown de centro de notificaciones

"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, X, RefreshCw, BellOff } from "lucide-react";
import { useAlerts } from "@/hooks/useAlerts";
import { AlertItem, AlertItemSkeleton } from "./AlertItem";

interface AlertCenterProps {
  className?: string;
}

export function AlertCenter({ className = "" }: AlertCenterProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    alerts,
    unseenCount,
    isLoading,
    markSeen,
    markAllSeen,
    dismiss,
    refresh,
  } = useAlerts();

  // Cerrar al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Cerrar con Escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const hasHighPriority = alerts.some(
    (a) => a.priority === "high" && !a.seenAt
  );

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Botón de campana */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          relative p-2 rounded-lg transition-colors
          ${isOpen ? "bg-zinc-700" : "hover:bg-zinc-800"}
        `}
        aria-label="Notificaciones"
      >
        <Bell
          className={`w-5 h-5 ${
            hasHighPriority ? "text-red-400" : "text-zinc-400"
          }`}
        />

        {/* Badge de contador */}
        {unseenCount > 0 && (
          <span
            className={`
              absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1
              flex items-center justify-center text-[10px] font-bold
              rounded-full
              ${hasHighPriority
                ? "bg-red-500 text-white animate-pulse"
                : "bg-indigo-500 text-white"
              }
            `}
          >
            {unseenCount > 99 ? "99+" : unseenCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className={`
            absolute right-0 top-full mt-2 w-[360px] max-h-[480px]
            bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl
            overflow-hidden z-50
            animate-in fade-in slide-in-from-top-2 duration-200
          `}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
            <h3 className="font-semibold text-zinc-100">Notificaciones</h3>
            <div className="flex items-center gap-1">
              {/* Marcar todas como leídas */}
              {unseenCount > 0 && (
                <button
                  onClick={() => markAllSeen()}
                  className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
                  title="Marcar todas como leídas"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}

              {/* Refrescar */}
              <button
                onClick={() => refresh()}
                className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
                title="Refrescar"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                />
              </button>
            </div>
          </div>

          {/* Lista de alertas */}
          <div className="overflow-y-auto max-h-[340px] p-2 space-y-2">
            {isLoading && alerts.length === 0 ? (
              <>
                <AlertItemSkeleton />
                <AlertItemSkeleton />
                <AlertItemSkeleton />
              </>
            ) : alerts.length === 0 ? (
              <div className="py-12 text-center">
                <BellOff className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-400 text-sm">No tienes notificaciones</p>
                <p className="text-zinc-500 text-xs mt-1">
                  Te avisaremos cuando haya algo importante
                </p>
              </div>
            ) : (
              alerts.slice(0, 10).map((alert) => (
                <AlertItem
                  key={alert.id}
                  alert={alert}
                  compact
                  onSeen={() => markSeen(alert.id)}
                  onDismiss={() => dismiss(alert.id)}
                  onAction={() => setIsOpen(false)}
                />
              ))
            )}
          </div>

          {/* Footer */}
          {alerts.length > 0 && (
            <div className="border-t border-zinc-800 px-4 py-3">
              <button
                onClick={() => {
                  router.push("/app/alertas");
                  setIsOpen(false);
                }}
                className="w-full text-center text-sm text-indigo-400 hover:text-indigo-300 font-medium"
              >
                Ver todas las notificaciones
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
