"use client";

import Link from "next/link";
import { BarChart3, ArrowRight, X } from "lucide-react";
import { useState } from "react";

interface SummaryNotificationBannerProps {
  unreadCount: number;
  latestType?: "daily" | "weekly" | "monthly";
}

export function SummaryNotificationBanner({
  unreadCount,
  latestType = "weekly",
}: SummaryNotificationBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed || unreadCount === 0) {
    return null;
  }

  const typeLabel = {
    daily: "diario",
    weekly: "semanal",
    monthly: "mensual",
  }[latestType];

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 rounded-xl p-4">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/5 to-purple-600/5" />

      <div className="relative flex items-center gap-4">
        {/* Icon */}
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
          <BarChart3 className="w-6 h-6 text-indigo-400" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-white">
            {unreadCount === 1
              ? `Tienes un nuevo resumen ${typeLabel}`
              : `Tienes ${unreadCount} resúmenes nuevos`}
          </h3>
          <p className="text-sm text-white/60 truncate">
            Runtu preparó un análisis de tu última semana
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link
            href="/app/resumenes"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Ver ahora
            <ArrowRight className="w-4 h-4" />
          </Link>

          <button
            onClick={() => setIsDismissed(true)}
            className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
