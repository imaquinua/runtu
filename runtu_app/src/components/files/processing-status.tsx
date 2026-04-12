"use client";

import { Clock, Loader2, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProcessingStatusEnum } from "@/types/file";

export interface ProcessingStatusProps {
  /** Current processing status */
  status: ProcessingStatusEnum;
  /** Progress percentage (0-100) for progress bar */
  progress?: number;
  /** Show as compact badge or full width */
  variant?: "badge" | "full";
  /** Additional CSS classes */
  className?: string;
}

const STATUS_CONFIG: Record<
  ProcessingStatusEnum,
  {
    icon: typeof Clock;
    label: string;
    iconClass: string;
    textClass: string;
    bgClass: string;
    borderClass: string;
    progressClass: string;
  }
> = {
  pending: {
    icon: Clock,
    label: "En cola",
    iconClass: "text-white/50",
    textClass: "text-white/50",
    bgClass: "bg-white/5",
    borderClass: "border-white/10",
    progressClass: "bg-white/30",
  },
  processing: {
    icon: Loader2,
    label: "Procesando...",
    iconClass: "text-amber-400 animate-spin",
    textClass: "text-amber-400",
    bgClass: "bg-amber-500/10",
    borderClass: "border-amber-500/20",
    progressClass: "bg-amber-500",
  },
  completed: {
    icon: CheckCircle,
    label: "Listo",
    iconClass: "text-green-400",
    textClass: "text-green-400",
    bgClass: "bg-green-500/10",
    borderClass: "border-green-500/20",
    progressClass: "bg-green-500",
  },
  error: {
    icon: XCircle,
    label: "Error",
    iconClass: "text-red-400",
    textClass: "text-red-400",
    bgClass: "bg-red-500/10",
    borderClass: "border-red-500/20",
    progressClass: "bg-red-500",
  },
};

/**
 * Processing status indicator component
 * Shows current file processing status with optional progress bar
 */
export function ProcessingStatus({
  status,
  progress,
  variant = "badge",
  className,
}: ProcessingStatusProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  const showProgress = typeof progress === "number" && status === "processing";

  if (variant === "badge") {
    return (
      <div className={cn("space-y-1.5", className)}>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border",
            config.bgClass,
            config.borderClass,
            config.textClass
          )}
        >
          <Icon className={cn("w-3 h-3", config.iconClass)} />
          {config.label}
        </span>
        {showProgress && (
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-300",
                config.progressClass
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    );
  }

  // Full width variant
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={cn("w-4 h-4", config.iconClass)} />
          <span className={cn("text-sm font-medium", config.textClass)}>
            {config.label}
          </span>
        </div>
        {showProgress && (
          <span className={cn("text-xs", config.textClass)}>{progress}%</span>
        )}
      </div>
      {showProgress && (
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-300",
              config.progressClass,
              status === "processing" && "animate-pulse"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Compact status dot indicator
 */
export interface StatusDotProps {
  status: ProcessingStatusEnum;
  className?: string;
}

export function StatusDot({ status, className }: StatusDotProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={cn(
        "w-2 h-2 rounded-full",
        status === "processing" && "animate-pulse",
        status === "pending" && "bg-white/40",
        status === "processing" && "bg-amber-400",
        status === "completed" && "bg-green-400",
        status === "error" && "bg-red-400",
        className
      )}
      title={config.label}
    />
  );
}
