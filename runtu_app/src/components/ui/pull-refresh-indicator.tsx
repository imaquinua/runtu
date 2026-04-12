"use client";

import { Loader2, ArrowDown } from "lucide-react";

interface PullRefreshIndicatorProps {
  isPulling: boolean;
  isRefreshing: boolean;
  pullProgress: number; // 0-1
}

export function PullRefreshIndicator({
  isPulling,
  isRefreshing,
  pullProgress,
}: PullRefreshIndicatorProps) {
  if (!isPulling && !isRefreshing) return null;

  const rotation = pullProgress * 180;
  const scale = 0.5 + pullProgress * 0.5;
  const isReady = pullProgress >= 1;

  return (
    <div
      className="fixed top-4 left-1/2 z-50 transition-all duration-200"
      style={{
        transform: `translateX(-50%) translateY(${isPulling || isRefreshing ? "0" : "-100%"}) scale(${scale})`,
        opacity: isPulling || isRefreshing ? 1 : 0,
      }}
    >
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
          isReady || isRefreshing
            ? "bg-indigo-500 shadow-lg shadow-indigo-500/30"
            : "bg-white/10 border border-white/20"
        }`}
      >
        {isRefreshing ? (
          <Loader2 className="w-5 h-5 text-white animate-spin" />
        ) : (
          <ArrowDown
            className={`w-5 h-5 transition-colors ${
              isReady ? "text-white" : "text-white/60"
            }`}
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: "transform 0.1s ease",
            }}
          />
        )}
      </div>
    </div>
  );
}
