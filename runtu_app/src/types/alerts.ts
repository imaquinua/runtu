// ============================================
// Alert Types
// ============================================
// Tipos para el sistema de alertas proactivas

import type { Json } from "./database";

export type AlertType =
  | "inactivity" // No ha subido archivos en X días
  | "anomaly" // Cambio significativo detectado
  | "reminder" // Vencimiento próximo
  | "insight" // Oportunidad detectada
  | "milestone" // Logro alcanzado
  | "tip"; // Sugerencia de uso

export type AlertPriority = "low" | "medium" | "high";

export interface Alert {
  id: string;
  businessId: string;
  type: AlertType;
  priority: AlertPriority;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, unknown>;
  seenAt: Date | null;
  dismissedAt: Date | null;
  createdAt: Date;
  expiresAt: Date | null;
}

// ============================================
// Database Row Type (snake_case)
// ============================================

export interface AlertRow {
  id: string;
  business_id: string;
  type: AlertType;
  priority: AlertPriority;
  title: string;
  message: string;
  action_url: string | null;
  action_label: string | null;
  metadata: Record<string, unknown> | null;
  seen_at: string | null;
  dismissed_at: string | null;
  created_at: string;
  expires_at: string | null;
}

// ============================================
// Alert Configuration
// ============================================

export interface AlertConfig {
  type: AlertType;
  icon: string;
  color: string; // Tailwind color class
  bgColor: string; // Tailwind bg color class
}

export const ALERT_CONFIGS: Record<AlertType, AlertConfig> = {
  inactivity: {
    type: "inactivity",
    icon: "Clock",
    color: "text-amber-400",
    bgColor: "bg-amber-500/20",
  },
  anomaly: {
    type: "anomaly",
    icon: "AlertTriangle",
    color: "text-red-400",
    bgColor: "bg-red-500/20",
  },
  reminder: {
    type: "reminder",
    icon: "Calendar",
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
  },
  insight: {
    type: "insight",
    icon: "Lightbulb",
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/20",
  },
  milestone: {
    type: "milestone",
    icon: "Trophy",
    color: "text-green-400",
    bgColor: "bg-green-500/20",
  },
  tip: {
    type: "tip",
    icon: "Info",
    color: "text-indigo-400",
    bgColor: "bg-indigo-500/20",
  },
};

// ============================================
// API Types
// ============================================

export interface CreateAlertData {
  businessId: string;
  type: AlertType;
  priority: AlertPriority;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, unknown>;
  expiresAt?: Date;
}

export interface GetAlertsParams {
  businessId: string;
  includesSeen?: boolean;
  limit?: number;
}

// ============================================
// Converters
// ============================================

export function alertFromRow(row: AlertRow): Alert {
  return {
    id: row.id,
    businessId: row.business_id,
    type: row.type,
    priority: row.priority,
    title: row.title,
    message: row.message,
    actionUrl: row.action_url || undefined,
    actionLabel: row.action_label || undefined,
    metadata: row.metadata || undefined,
    seenAt: row.seen_at ? new Date(row.seen_at) : null,
    dismissedAt: row.dismissed_at ? new Date(row.dismissed_at) : null,
    createdAt: new Date(row.created_at),
    expiresAt: row.expires_at ? new Date(row.expires_at) : null,
  };
}

export function alertToRow(alert: CreateAlertData): {
  business_id: string;
  type: AlertType;
  priority: AlertPriority;
  title: string;
  message: string;
  action_url: string | null;
  action_label: string | null;
  metadata: Json;
  expires_at: string | null;
} {
  return {
    business_id: alert.businessId,
    type: alert.type,
    priority: alert.priority,
    title: alert.title,
    message: alert.message,
    action_url: alert.actionUrl || null,
    action_label: alert.actionLabel || null,
    metadata: (alert.metadata as Json) || null,
    expires_at: alert.expiresAt?.toISOString() || null,
  };
}

// ============================================
// Helpers
// ============================================

export function getPriorityWeight(priority: AlertPriority): number {
  switch (priority) {
    case "high":
      return 3;
    case "medium":
      return 2;
    case "low":
      return 1;
  }
}

export function sortAlertsByPriority(alerts: Alert[]): Alert[] {
  return [...alerts].sort((a, b) => {
    const priorityDiff = getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
    if (priorityDiff !== 0) return priorityDiff;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
}

export function formatAlertAge(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) {
    return "Hace unos minutos";
  } else if (diffHours < 24) {
    return `Hace ${diffHours}h`;
  } else if (diffDays === 1) {
    return "Ayer";
  } else if (diffDays < 7) {
    return `Hace ${diffDays} días`;
  } else {
    return date.toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
    });
  }
}
