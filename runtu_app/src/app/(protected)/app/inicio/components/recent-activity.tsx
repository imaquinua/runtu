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
      return { icon: FileUp, color: "text-blue-600", bg: "bg-blue-100" };
    case "question":
      return { icon: MessageCircle, color: "text-green-600", bg: "bg-green-100" };
    case "report":
      return { icon: FileText, color: "text-purple-600", bg: "bg-purple-100" };
    default:
      return { icon: FolderOpen, color: "text-gray-600", bg: "bg-gray-100" };
  }
}

function EmptyState() {
  return (
    <div className="text-center py-8">
      <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <FolderOpen className="w-8 h-8 text-gray-400" />
      </div>
      <h4 className="text-gray-900 font-medium mb-1">Sin actividad aún</h4>
      <p className="text-gray-500 text-sm">
        Sube tu primer archivo para empezar
      </p>
    </div>
  );
}

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">Últimos movimientos</h3>
      </div>

      {activities.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="divide-y divide-gray-100">
          {activities.map((activity) => {
            const { icon: Icon, color, bg } = getActivityIcon(activity.type);

            return (
              <li
                key={activity.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className={`p-2 rounded-lg ${bg}`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">
                    {activity.description}
                  </p>
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap">
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
