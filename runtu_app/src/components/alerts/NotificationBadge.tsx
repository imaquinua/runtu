// ============================================
// NotificationBadge Component
// ============================================
// Badge simple para mostrar en el header

"use client";

import { Bell } from "lucide-react";
import { useAlertsBadge } from "@/hooks/useAlerts";

interface NotificationBadgeProps {
  onClick?: () => void;
  className?: string;
}

export function NotificationBadge({
  onClick,
  className = "",
}: NotificationBadgeProps) {
  const { unseenCount, hasHighPriority } = useAlertsBadge();

  return (
    <button
      onClick={onClick}
      className={`
        relative p-2 rounded-lg transition-colors hover:bg-zinc-800
        ${className}
      `}
      aria-label={`Notificaciones ${unseenCount > 0 ? `(${unseenCount} sin leer)` : ""}`}
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

      {/* Anillo de animación para alta prioridad */}
      {hasHighPriority && (
        <span className="absolute inset-0 rounded-lg ring-2 ring-red-500/30 animate-ping" />
      )}
    </button>
  );
}
