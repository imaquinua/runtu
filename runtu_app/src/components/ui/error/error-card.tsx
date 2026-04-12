"use client";

import { AlertCircle, RefreshCw, X } from "lucide-react";

interface ErrorCardProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function ErrorCard({
  title = "Algo salió mal",
  message,
  onRetry,
  onDismiss,
}: ErrorCardProps) {
  return (
    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 relative">
      {/* Dismiss button */}
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 p-1 rounded-lg hover:bg-red-500/20 text-red-400/60 hover:text-red-400 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
          <AlertCircle className="w-5 h-5 text-red-400" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-6">
          <h4 className="text-red-400 font-medium mb-1">{title}</h4>
          <p className="text-white/60 text-sm">{message}</p>

          {/* Retry button */}
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 flex items-center gap-2 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-medium rounded-lg transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reintentar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
