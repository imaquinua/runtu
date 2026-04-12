"use client";

import { toast as sonnerToast } from "sonner";
import { MessageSquare, Sparkles } from "lucide-react";

// Custom Runtu notification component
function RuntuNotification({
  title,
  message,
  onAction,
  actionLabel = "Ver más",
}: {
  title: string;
  message: string;
  onAction?: () => void;
  actionLabel?: string;
}) {
  return (
    <div className="flex items-start gap-3 w-full">
      {/* Runtu avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <MessageSquare className="w-5 h-5 text-white" />
        </div>
        <div className="absolute -top-1 -right-1">
          <Sparkles className="w-3 h-3 text-yellow-400" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium text-sm">{title}</p>
        <p className="text-white/60 text-sm mt-0.5 line-clamp-2">{message}</p>

        {onAction && (
          <button
            onClick={onAction}
            className="mt-2 text-indigo-400 hover:text-indigo-300 text-xs font-medium transition-colors"
          >
            {actionLabel} →
          </button>
        )}
      </div>
    </div>
  );
}

// Extended toast functions with Runtu-specific helpers
export const toast = {
  // Standard toasts
  success: (message: string) => sonnerToast.success(message),
  error: (message: string) => sonnerToast.error(message),
  warning: (message: string) => sonnerToast.warning(message),
  info: (message: string) => sonnerToast.info(message),
  loading: (message: string) => sonnerToast.loading(message),

  // Dismiss
  dismiss: (id?: string | number) => sonnerToast.dismiss(id),

  // Promise helper
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => sonnerToast.promise(promise, messages),

  // Runtu custom notifications
  runtu: (title: string, message: string, onAction?: () => void, actionLabel?: string) => {
    sonnerToast.custom(
      () => (
        <RuntuNotification
          title={title}
          message={message}
          onAction={onAction}
          actionLabel={actionLabel}
        />
      ),
      {
        duration: 6000,
        className: "!bg-slate-800/95 !backdrop-blur-lg !border-indigo-500/30",
      }
    );
  },

  // File upload specific
  fileUploaded: (filename: string) => {
    sonnerToast.success(`"${filename}" subido correctamente`, {
      description: "Runtu está procesando tu archivo",
    });
  },

  fileError: (filename: string, reason?: string) => {
    sonnerToast.error(`No se pudo subir "${filename}"`, {
      description: reason || "Intenta de nuevo más tarde",
    });
  },

  fileProcessed: (filename: string) => {
    toast.runtu(
      "Archivo procesado",
      `Ya analicé "${filename}". ¿Quieres que te cuente lo que encontré?`,
      () => console.log("Navigate to file"),
      "Ver análisis"
    );
  },
};
