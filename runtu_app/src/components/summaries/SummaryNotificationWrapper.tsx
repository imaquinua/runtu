"use client";

import { useEffect, useState } from "react";
import { SummaryNotificationBanner } from "./SummaryNotificationBanner";

export function SummaryNotificationWrapper() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/summaries?unreadOnly=true&limit=1")
      .then((res) => res.json())
      .then((data) => {
        if (data.total !== undefined) {
          setUnreadCount(data.total);
        }
      })
      .catch(() => {
        // Silent fail
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  if (isLoading || unreadCount === 0) {
    return null;
  }

  return <SummaryNotificationBanner unreadCount={unreadCount} />;
}
