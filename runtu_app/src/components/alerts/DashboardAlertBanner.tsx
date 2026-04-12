// ============================================
// Dashboard Alert Banner Wrapper
// ============================================
// Client component wrapper for alert banners in dashboard

"use client";

import { useAlerts } from "@/hooks/useAlerts";
import { AlertBannerContainer } from "./AlertBanner";

export function DashboardAlertBanner() {
  const { alerts, highPriorityAlerts, markSeen, dismiss } = useAlerts();

  if (highPriorityAlerts.length === 0) {
    return null;
  }

  return (
    <AlertBannerContainer
      alerts={highPriorityAlerts}
      onDismiss={dismiss}
      onSeen={markSeen}
    />
  );
}
