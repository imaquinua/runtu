// ============================================
// AlertItem Component
// ============================================
// Componente individual para mostrar una alerta

"use client";

import { useRouter } from "next/navigation";
import {
  Clock,
  AlertTriangle,
  Calendar,
  Lightbulb,
  Trophy,
  Info,
  X,
  ChevronRight,
} from "lucide-react";
import type { Alert, AlertType, AlertPriority } from "@/types/alerts";
import { formatAlertAge } from "@/types/alerts";

interface AlertItemProps {
  alert: Alert;
  onSeen?: () => void;
  onDismiss?: () => void;
  onAction?: () => void;
  compact?: boolean;
}

// Iconos por tipo
const TYPE_ICONS: Record<AlertType, React.ComponentType<{ className?: string }>> = {
  inactivity: Clock,
  anomaly: AlertTriangle,
  reminder: Calendar,
  insight: Lightbulb,
  milestone: Trophy,
  tip: Info,
};

// Estilos por tipo
const TYPE_STYLES: Record<AlertType, { icon: string; label: string }> = {
  inactivity: { icon: "text-amber-400", label: "Inactividad" },
  anomaly: { icon: "text-red-400", label: "Anomalía" },
  reminder: { icon: "text-blue-400", label: "Recordatorio" },
  insight: { icon: "text-yellow-400", label: "Insight" },
  milestone: { icon: "text-green-400", label: "Logro" },
  tip: { icon: "text-indigo-400", label: "Sugerencia" },
};

// Estilos por prioridad
const PRIORITY_STYLES: Record<AlertPriority, { border: string; bg: string }> = {
  high: { border: "border-red-500/50", bg: "bg-red-500/5" },
  medium: { border: "border-amber-500/50", bg: "bg-amber-500/5" },
  low: { border: "border-zinc-700", bg: "bg-zinc-800/50" },
};

export function AlertItem({
  alert,
  onSeen,
  onDismiss,
  onAction,
  compact = false,
}: AlertItemProps) {
  const router = useRouter();
  const Icon = TYPE_ICONS[alert.type];
  const typeStyle = TYPE_STYLES[alert.type];
  const priorityStyle = PRIORITY_STYLES[alert.priority];

  const isUnseen = !alert.seenAt;

  const handleClick = () => {
    // Marcar como vista al hacer click
    if (isUnseen && onSeen) {
      onSeen();
    }

    // Si hay acción, ejecutarla
    if (alert.actionUrl) {
      if (onAction) onAction();
      router.push(alert.actionUrl);
    }
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDismiss) onDismiss();
  };

  return (
    <div
      onClick={handleClick}
      className={`
        relative group p-3 rounded-lg border transition-all
        ${priorityStyle.border} ${priorityStyle.bg}
        ${alert.actionUrl ? "cursor-pointer hover:bg-zinc-800/80" : ""}
        ${isUnseen ? "ring-1 ring-indigo-500/30" : "opacity-80"}
      `}
    >
      {/* Indicador de no vista */}
      {isUnseen && (
        <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-indigo-500" />
      )}

      <div className="flex gap-3">
        {/* Icono */}
        <div
          className={`
            flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
            ${alert.priority === "high" ? "bg-red-500/20" : "bg-zinc-700/50"}
          `}
        >
          <Icon className={`w-4 h-4 ${typeStyle.icon}`} />
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          {/* Tipo y tiempo */}
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-xs font-medium ${typeStyle.icon}`}>
              {typeStyle.label}
            </span>
            <span className="text-xs text-zinc-500">
              {formatAlertAge(alert.createdAt)}
            </span>
          </div>

          {/* Título */}
          <h4 className="text-sm font-medium text-zinc-100 mb-0.5">
            {alert.title}
          </h4>

          {/* Mensaje */}
          {!compact && (
            <p className="text-xs text-zinc-400 line-clamp-2">{alert.message}</p>
          )}
          {compact && (
            <p className="text-xs text-zinc-400 truncate">{alert.message}</p>
          )}

          {/* Acciones */}
          {!compact && (
            <div className="flex items-center gap-2 mt-2">
              {alert.actionUrl && alert.actionLabel && (
                <button
                  onClick={handleClick}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
                >
                  {alert.actionLabel}
                  <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Botón descartar */}
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 text-zinc-500 hover:text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Descartar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Indicador de acción en compact */}
      {compact && alert.actionUrl && (
        <ChevronRight className="absolute right-8 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </div>
  );
}

// ============================================
// AlertItemSkeleton
// ============================================

export function AlertItemSkeleton() {
  return (
    <div className="p-3 rounded-lg border border-zinc-700 bg-zinc-800/50 animate-pulse">
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-full bg-zinc-700" />
        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <div className="h-3 w-16 bg-zinc-700 rounded" />
            <div className="h-3 w-12 bg-zinc-700 rounded" />
          </div>
          <div className="h-4 w-3/4 bg-zinc-700 rounded" />
          <div className="h-3 w-full bg-zinc-700 rounded" />
        </div>
      </div>
    </div>
  );
}
