// ============================================
// AlertToast Component
// ============================================
// Toast para notificaciones de alertas nuevas

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  ChevronRight,
  Clock,
  AlertTriangle,
  Calendar,
  Lightbulb,
  Trophy,
  Info,
} from "lucide-react";
import type { Alert, AlertType } from "@/types/alerts";

interface AlertToastProps {
  alert: Alert;
  onClose: () => void;
  autoCloseMs?: number;
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
const TYPE_STYLES: Record<AlertType, { icon: string; border: string }> = {
  inactivity: { icon: "text-amber-400", border: "border-amber-500/30" },
  anomaly: { icon: "text-red-400", border: "border-red-500/30" },
  reminder: { icon: "text-blue-400", border: "border-blue-500/30" },
  insight: { icon: "text-yellow-400", border: "border-yellow-500/30" },
  milestone: { icon: "text-green-400", border: "border-green-500/30" },
  tip: { icon: "text-indigo-400", border: "border-indigo-500/30" },
};

export function AlertToast({
  alert,
  onClose,
  autoCloseMs = 10000,
}: AlertToastProps) {
  const router = useRouter();
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);

  const Icon = TYPE_ICONS[alert.type];
  const style = TYPE_STYLES[alert.type];

  // Auto-cerrar con animación de progreso
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev - 100 / (autoCloseMs / 100);
        if (newProgress <= 0) {
          onClose();
          return 0;
        }
        return newProgress;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPaused, autoCloseMs, onClose]);

  const handleClick = () => {
    if (alert.actionUrl) {
      router.push(alert.actionUrl);
      onClose();
    }
  };

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onClick={handleClick}
      className={`
        relative w-[340px] bg-zinc-900 border ${style.border} rounded-lg shadow-2xl
        overflow-hidden cursor-pointer
        animate-in slide-in-from-right duration-300
      `}
    >
      <div className="p-4 flex gap-3">
        {/* Icono */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
          <Icon className={`w-4 h-4 ${style.icon}`} />
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-zinc-100 truncate">
            {alert.title}
          </h4>
          <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2">
            {alert.message}
          </p>

          {alert.actionUrl && (
            <span className="inline-flex items-center gap-1 mt-1.5 text-xs text-indigo-400">
              Ver más
              <ChevronRight className="w-3 h-3" />
            </span>
          )}
        </div>

        {/* Botón cerrar */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="flex-shrink-0 p-1 text-zinc-500 hover:text-zinc-300 rounded transition-colors"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Barra de progreso */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-800">
        <div
          className={`h-full ${style.icon.replace("text-", "bg-")} transition-all duration-100`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

// ============================================
// AlertToastContainer
// ============================================
// Container para múltiples toasts

interface AlertToastContainerProps {
  alerts: Alert[];
  onClose: (id: string) => void;
}

export function AlertToastContainer({
  alerts,
  onClose,
}: AlertToastContainerProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {alerts.slice(0, 3).map((alert) => (
        <AlertToast
          key={alert.id}
          alert={alert}
          onClose={() => onClose(alert.id)}
        />
      ))}
    </div>
  );
}
