"use client";

import { useMemo } from "react";
import { FolderOpen } from "lucide-react";
import { cn, getDateGroup, DATE_GROUP_LABELS } from "@/lib/utils";
import { FileCard } from "./file-card";
import type { FileType } from "@/types/file";

export interface FileListProps {
  /** List of files to display */
  files: FileType[];
  /** Callback when delete is clicked */
  onDelete?: (file: FileType) => void;
  /** Callback when view is clicked */
  onView?: (file: FileType) => void;
  /** Callback when download is clicked */
  onDownload?: (file: FileType) => void;
  /** Custom empty state message */
  emptyMessage?: string;
  /** Group files by date */
  groupByDate?: boolean;
  /** Display variant for cards */
  variant?: "card" | "row";
  /** Additional CSS classes */
  className?: string;
}

interface GroupedFiles {
  today: FileType[];
  yesterday: FileType[];
  week: FileType[];
  older: FileType[];
}

/**
 * File list component with optional date grouping
 */
export function FileList({
  files,
  onDelete,
  onView,
  onDownload,
  emptyMessage = "No hay archivos",
  groupByDate = false,
  variant = "card",
  className,
}: FileListProps) {
  // Group files by date
  const groupedFiles = useMemo(() => {
    if (!groupByDate) return null;

    const groups: GroupedFiles = {
      today: [],
      yesterday: [],
      week: [],
      older: [],
    };

    files.forEach((file) => {
      const group = getDateGroup(file.uploadedAt);
      groups[group].push(file);
    });

    return groups;
  }, [files, groupByDate]);

  // Empty state
  if (files.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  // Ungrouped list
  if (!groupByDate || !groupedFiles) {
    return (
      <div
        className={cn(
          variant === "card"
            ? "grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            : "space-y-2",
          className
        )}
      >
        {files.map((file) => (
          <FileCard
            key={file.id}
            file={file}
            variant={variant}
            onDelete={onDelete}
            onView={onView}
            onDownload={onDownload}
          />
        ))}
      </div>
    );
  }

  // Grouped list
  const groupOrder: (keyof GroupedFiles)[] = ["today", "yesterday", "week", "older"];

  return (
    <div className={cn("space-y-6", className)}>
      {groupOrder.map((groupKey) => {
        const groupFiles = groupedFiles[groupKey];
        if (groupFiles.length === 0) return null;

        return (
          <div key={groupKey}>
            <h3 className="text-sm font-medium text-white/50 mb-3">
              {DATE_GROUP_LABELS[groupKey]}
            </h3>
            <div
              className={cn(
                variant === "card"
                  ? "grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                  : "space-y-2"
              )}
            >
              {groupFiles.map((file) => (
                <FileCard
                  key={file.id}
                  file={file}
                  variant={variant}
                  onDelete={onDelete}
                  onView={onView}
                  onDownload={onDownload}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Empty state component
interface EmptyStateProps {
  message: string;
}

function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
      <div className="mx-auto w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
        <FolderOpen className="w-8 h-8 text-white/30" />
      </div>
      <h3 className="text-white font-medium mb-1">{message}</h3>
      <p className="text-white/50 text-sm">
        Los archivos que subas aparecerán aquí
      </p>
    </div>
  );
}
