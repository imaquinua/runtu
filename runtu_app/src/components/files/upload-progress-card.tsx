"use client";

import { X, Loader2, CheckCircle, AlertCircle, RotateCcw } from "lucide-react";
import { cn, formatFileSize } from "@/lib/utils";
import { FileIconBadge } from "./file-icon";
import { getFileTypeFromName, type UploadStatusEnum } from "@/types/file";

export interface UploadProgressCardProps {
  /** The File object being uploaded */
  file: File;
  /** Upload progress (0-100) */
  progress: number;
  /** Current upload status */
  status: UploadStatusEnum;
  /** Error message if status is 'error' */
  errorMessage?: string;
  /** Callback to cancel/remove the upload */
  onCancel?: () => void;
  /** Callback to retry failed upload */
  onRetry?: () => void;
  /** Additional CSS classes */
  className?: string;
}

const STATUS_CONFIG: Record<
  UploadStatusEnum,
  {
    label: string;
    progressClass: string;
    textClass: string;
  }
> = {
  uploading: {
    label: "Subiendo...",
    progressClass: "bg-indigo-500",
    textClass: "text-indigo-400",
  },
  processing: {
    label: "Procesando...",
    progressClass: "bg-amber-500 animate-pulse",
    textClass: "text-amber-400",
  },
  done: {
    label: "Completado",
    progressClass: "bg-green-500",
    textClass: "text-green-400",
  },
  error: {
    label: "Error",
    progressClass: "bg-red-500",
    textClass: "text-red-400",
  },
};

/**
 * Upload progress card component
 * Shows real-time upload progress during file uploads
 */
export function UploadProgressCard({
  file,
  progress,
  status,
  errorMessage,
  onCancel,
  onRetry,
  className,
}: UploadProgressCardProps) {
  const fileType = getFileTypeFromName(file.name);
  const config = STATUS_CONFIG[status];
  const isActive = status === "uploading" || status === "processing";
  const hasError = status === "error";
  const isDone = status === "done";

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-lg transition-colors",
        hasError && "border-red-500/30 bg-red-500/5",
        isDone && "border-green-500/30 bg-green-500/5",
        className
      )}
    >
      {/* File Icon */}
      <FileIconBadge type={fileType} size="sm" />

      {/* File Info & Progress */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <p className="text-sm text-white font-medium truncate">{file.name}</p>
          <span className="text-xs text-white/40 whitespace-nowrap">
            {formatFileSize(file.size)}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-1">
          <div
            className={cn(
              "h-full transition-all duration-300",
              config.progressClass
            )}
            style={{ width: `${isDone ? 100 : progress}%` }}
          />
        </div>

        {/* Status Text */}
        <div className="flex items-center justify-between">
          <span className={cn("text-xs flex items-center gap-1", config.textClass)}>
            {status === "uploading" && <Loader2 className="w-3 h-3 animate-spin" />}
            {status === "processing" && <Loader2 className="w-3 h-3 animate-spin" />}
            {status === "done" && <CheckCircle className="w-3 h-3" />}
            {status === "error" && <AlertCircle className="w-3 h-3" />}
            {hasError && errorMessage ? errorMessage : config.label}
          </span>
          {isActive && (
            <span className="text-xs text-white/40">{progress}%</span>
          )}
        </div>
      </div>

      {/* Action Button */}
      {status === "uploading" && onCancel && (
        <button
          onClick={onCancel}
          className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
          title="Cancelar"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {status === "error" && onRetry && (
        <button
          onClick={onRetry}
          className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
          title="Reintentar"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      )}

      {status === "done" && (
        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
      )}
    </div>
  );
}

/**
 * Container for multiple upload progress cards
 */
export interface UploadProgressListProps {
  uploads: Array<{
    id: string;
    file: File;
    progress: number;
    status: UploadStatusEnum;
    errorMessage?: string;
  }>;
  onCancel?: (id: string) => void;
  onRetry?: (id: string) => void;
  className?: string;
}

export function UploadProgressList({
  uploads,
  onCancel,
  onRetry,
  className,
}: UploadProgressListProps) {
  if (uploads.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)}>
      <h4 className="text-sm font-medium text-white/70">
        Subiendo {uploads.length} archivo{uploads.length > 1 ? "s" : ""}
      </h4>
      {uploads.map((upload) => (
        <UploadProgressCard
          key={upload.id}
          file={upload.file}
          progress={upload.progress}
          status={upload.status}
          errorMessage={upload.errorMessage}
          onCancel={onCancel ? () => onCancel(upload.id) : undefined}
          onRetry={onRetry ? () => onRetry(upload.id) : undefined}
        />
      ))}
    </div>
  );
}
