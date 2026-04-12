"use client";

import { FolderOpen, Clock, MessageCircle, CheckCircle, Loader2 } from "lucide-react";

interface SummaryCardsProps {
  filesUploaded: number;
  lastActivity: Date;
  questionsAnswered: number;
  processingFiles: number;
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) {
    return `Hace ${diffMins} minutos`;
  } else if (diffHours < 24) {
    return `Hace ${diffHours} hora${diffHours > 1 ? "s" : ""}`;
  } else if (diffDays === 1) {
    return "Ayer";
  } else if (diffDays < 7) {
    return `Hace ${diffDays} días`;
  } else {
    return date.toLocaleDateString("es-PE", {
      day: "numeric",
      month: "short",
    });
  }
}

export function SummaryCards({
  filesUploaded,
  lastActivity,
  questionsAnswered,
  processingFiles,
}: SummaryCardsProps) {
  const cards = [
    {
      icon: FolderOpen,
      value: filesUploaded,
      label: "archivos en tu cerebro",
      color: "text-blue-400",
      bgColor: "bg-blue-500/20",
    },
    {
      icon: Clock,
      value: formatRelativeTime(lastActivity),
      label: "última actividad",
      color: "text-amber-400",
      bgColor: "bg-amber-500/20",
      isText: true,
    },
    {
      icon: MessageCircle,
      value: questionsAnswered,
      label: "preguntas este mes",
      color: "text-green-400",
      bgColor: "bg-green-500/20",
    },
    {
      icon: processingFiles > 0 ? Loader2 : CheckCircle,
      value: processingFiles > 0 ? processingFiles : "Todo",
      label: processingFiles > 0 ? "archivos procesando" : "al día",
      color: processingFiles > 0 ? "text-orange-400" : "text-emerald-400",
      bgColor: processingFiles > 0 ? "bg-orange-500/20" : "bg-emerald-500/20",
      animate: processingFiles > 0,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:gap-4">
      {cards.map((card, index) => (
        <div
          key={index}
          className="bg-white/5 rounded-xl border border-white/10 p-4 md:p-5 hover:bg-white/10 hover:border-white/20 transition-all cursor-default"
        >
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${card.bgColor}`}>
              <card.icon
                className={`w-5 h-5 ${card.color} ${
                  card.animate ? "animate-spin" : ""
                }`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={`text-xl md:text-2xl font-bold text-white ${
                  card.isText ? "text-base md:text-lg" : ""
                }`}
              >
                {card.value}
              </p>
              <p className="text-xs md:text-sm text-white/50 truncate">
                {card.label}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
