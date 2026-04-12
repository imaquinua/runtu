"use client";

import { useState, useRef, useEffect } from "react";
import { MoreVertical, Eye, Trash2, Download, AlertCircle } from "lucide-react";
import { cn, formatFileSize, formatRelativeDate } from "@/lib/utils";
import { FileIconBadge } from "./file-icon";
import { ProcessingStatus } from "./processing-status";
import type { FileType } from "@/types/file";

export interface FileCardProps {
  /** File data to display */
  file: FileType;
  /** Callback when delete is clicked */
  onDelete?: (file: FileType) => void;
  /** Callback when view is clicked */
  onView?: (file: FileType) => void;
  /** Callback when download is clicked */
  onDownload?: (file: FileType) => void;
  /** Display variant */
  variant?: "card" | "row";
  /** Additional CSS classes */
  className?: string;
}

/**
 * File card component displaying file information with actions
 */
export function FileCard({
  file,
  onDelete,
  onView,
  onDownload,
  variant = "card",
  className,
}: FileCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasError = file.status === "error";

  if (variant === "row") {
    return (
      <div
        className={cn(
          "flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/[0.07] transition-colors",
          hasError && "border-red-500/30 bg-red-500/5",
          className
        )}
      >
        {/* Icon */}
        <FileIconBadge type={file.type} size="md" />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-white font-medium truncate">{file.name}</p>
          <div className="flex items-center gap-2 text-xs text-white/40">
            <span>{formatFileSize(file.size)}</span>
            <span>•</span>
            <span>{formatRelativeDate(file.uploadedAt)}</span>
            {hasError && file.errorMessage && (
              <>
                <span>•</span>
                <span className="text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {file.errorMessage}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Status */}
        <ProcessingStatus status={file.status} progress={file.progress} />

        {/* Actions Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <DropdownMenu
              file={file}
              onView={onView}
              onDownload={onDownload}
              onDelete={onDelete}
              onClose={() => setMenuOpen(false)}
            />
          )}
        </div>
      </div>
    );
  }

  // Card variant
  return (
    <div
      className={cn(
        "bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/[0.07] transition-colors",
        hasError && "border-red-500/30 bg-red-500/5",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <FileIconBadge type={file.type} size="md" />
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <DropdownMenu
              file={file}
              onView={onView}
              onDownload={onDownload}
              onDelete={onDelete}
              onClose={() => setMenuOpen(false)}
            />
          )}
        </div>
      </div>

      {/* Name */}
      <h3 className="text-white font-medium truncate mb-1" title={file.name}>
        {file.name}
      </h3>

      {/* Meta */}
      <div className="flex items-center gap-2 text-xs text-white/40 mb-3">
        <span>{formatFileSize(file.size)}</span>
        <span>•</span>
        <span>{formatRelativeDate(file.uploadedAt)}</span>
      </div>

      {/* Error message */}
      {hasError && file.errorMessage && (
        <p className="text-xs text-red-400 flex items-center gap-1 mb-3">
          <AlertCircle className="w-3 h-3" />
          {file.errorMessage}
        </p>
      )}

      {/* Status */}
      <ProcessingStatus status={file.status} progress={file.progress} />
    </div>
  );
}

// Dropdown menu component
interface DropdownMenuProps {
  file: FileType;
  onView?: (file: FileType) => void;
  onDownload?: (file: FileType) => void;
  onDelete?: (file: FileType) => void;
  onClose: () => void;
}

function DropdownMenu({
  file,
  onView,
  onDownload,
  onDelete,
  onClose,
}: DropdownMenuProps) {
  return (
    <div className="absolute right-0 top-full mt-1 w-40 bg-slate-800 border border-white/10 rounded-lg shadow-xl z-10 overflow-hidden">
      {onView && (
        <button
          onClick={() => {
            onClose();
            onView(file);
          }}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:bg-white/10 transition-colors"
        >
          <Eye className="w-4 h-4" />
          Ver detalles
        </button>
      )}
      {onDownload && (
        <button
          onClick={() => {
            onClose();
            onDownload(file);
          }}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:bg-white/10 transition-colors"
        >
          <Download className="w-4 h-4" />
          Descargar
        </button>
      )}
      {onDelete && (
        <button
          onClick={() => {
            onClose();
            onDelete(file);
          }}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Eliminar
        </button>
      )}
    </div>
  );
}
