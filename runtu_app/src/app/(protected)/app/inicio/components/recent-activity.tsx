"use client";

import { FileUp, MessageCircle, FileText, FolderOpen } from "lucide-react";

type ActivityType = "file" | "question" | "report";

interface Activity {
  id: string;
  type: ActivityType;
  description: string;
  timestamp: Date;
}

interface RecentActivityProps {
  activities: Activity[];
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) {
    return `hace ${diffMins} min`;
  } else if (diffHours < 24) {
    return `hace ${diffHours}h`;
  } else if (diffDays === 1) {
    return "ayer";
  } else if (diffDays < 7) {
    return `hace ${diffDays}d`;
  } else {
    return date.toLocaleDateString("es-PE", {
      day: "numeric",
      month: "short",
    });
  }
}

function getActivityIcon(type: ActivityType) {
  switch (type) {
    case "file":
      return { icon: FileUp, color: "text-blue-400", bg: "bg-blue-500/20" };
    case "question":
      return { icon: MessageCircle, color: "text-green-400", bg: "bg-green-500/20" };
    case "report":
      return { icon: FileText, color: "text-purple-400", bg: "bg-purple-500/20" };
    default:
      return { icon: FolderOpen, color: "text-white/60", bg: "bg-white/10" };
  }
}

function EmptyState() {
  return (
    <div className="text-center py-8">
      <div className="mx-auto w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
        <FolderOpen className="w-8 h-8 text-white/30" />
      </div>
      <h4 className="text-white font-medium mb-1">Sin actividad aún</h4>
      <p className="text-white/50 text-sm">
        Sube tu primer archivo para empezar
      </p>
    </div>
  );
}

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10">
        <h3 className="font-semibold text-white">Últimos movimientos</h3>
      </div>

      {activities.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="divide-y divide-white/5">
          {activities.map((activity) => {
            const { icon: Icon, color, bg } = getActivityIcon(activity.type);

            return (
              <li
                key={activity.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
              >
                <div className={`p-2 rounded-lg ${bg}`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">
                    {activity.description}
                  </p>
                </div>
                <span className="text-xs text-white/40 whitespace-nowrap">
                  {formatRelativeTime(activity.timestamp)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
