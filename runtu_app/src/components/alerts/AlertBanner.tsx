// ============================================
// AlertBanner Component
// ============================================
// Banner para alertas de alta prioridad en el dashboard

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  X,
  ChevronRight,
  Clock,
  Calendar,
  Lightbulb,
  Trophy,
  Info,
} from "lucide-react";
import type { Alert, AlertType } from "@/types/alerts";

interface AlertBannerProps {
  alert: Alert;
  onDismiss: () => void;
  onSeen?: () => void;
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

export function AlertBanner({ alert, onDismiss, onSeen }: AlertBannerProps) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);
  const Icon = TYPE_ICONS[alert.type];

  // Marcar como vista al mostrarse
  useEffect(() => {
    if (!alert.seenAt && onSeen) {
      onSeen();
    }
  }, [alert.seenAt, onSeen]);

  const handleAction = () => {
    if (alert.actionUrl) {
      router.push(alert.actionUrl);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      onDismiss();
    }, 300); // Esperar animación
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`
        relative overflow-hidden rounded-lg border
        bg-gradient-to-r from-red-500/10 to-amber-500/10
        border-red-500/30
        animate-in slide-in-from-top duration-300
        ${!isVisible ? "animate-out slide-out-to-top" : ""}
      `}
    >
      <div className="p-4 flex items-start gap-4">
        {/* Icono */}
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
          <Icon className="w-5 h-5 text-red-400" />
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            {alert.title}
            <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase bg-red-500/20 text-red-400 rounded">
              Urgente
            </span>
          </h4>
          <p className="text-sm text-zinc-400 mt-0.5 line-clamp-2">
            {alert.message}
          </p>

          {/* Acción */}
          {alert.actionUrl && alert.actionLabel && (
            <button
              onClick={handleAction}
              className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-red-400 hover:text-red-300 transition-colors"
            >
              {alert.actionLabel}
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Botón cerrar */}
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 rounded-lg transition-colors"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Barra de progreso decorativa */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 to-amber-500 opacity-50" />
    </div>
  );
}

// ============================================
// AlertBannerContainer
// ============================================
// Container que muestra banners de alertas de alta prioridad

interface AlertBannerContainerProps {
  alerts: Alert[];
  onDismiss: (id: string) => void;
  onSeen?: (id: string) => void;
}

export function AlertBannerContainer({
  alerts,
  onDismiss,
  onSeen,
}: AlertBannerContainerProps) {
  // Filtrar solo alertas de alta prioridad no descartadas
  const highPriorityAlerts = alerts.filter(
    (a) => a.priority === "high" && !a.dismissedAt
  );

  if (highPriorityAlerts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 mb-4">
      {highPriorityAlerts.slice(0, 2).map((alert) => (
        <AlertBanner
          key={alert.id}
          alert={alert}
          onDismiss={() => onDismiss(alert.id)}
          onSeen={() => onSeen?.(alert.id)}
        />
      ))}
    </div>
  );
}
