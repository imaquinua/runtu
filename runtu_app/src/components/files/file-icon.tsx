"use client";

import { FileText, Table, Image, Mic, Video, File } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FileTypeEnum } from "@/types/file";

export interface FileIconProps {
  /** File type to display icon for */
  type: FileTypeEnum;
  /** Icon size */
  size?: "sm" | "md" | "lg";
  /** Additional CSS classes */
  className?: string;
}

const ICON_CONFIG: Record<
  FileTypeEnum,
  { icon: typeof FileText; colorClass: string }
> = {
  pdf: { icon: FileText, colorClass: "text-red-400" },
  excel: { icon: Table, colorClass: "text-green-400" },
  csv: { icon: Table, colorClass: "text-emerald-400" },
  image: { icon: Image, colorClass: "text-purple-400" },
  audio: { icon: Mic, colorClass: "text-orange-400" },
  video: { icon: Video, colorClass: "text-blue-400" },
  unknown: { icon: File, colorClass: "text-white/60" },
};

const SIZE_CONFIG: Record<NonNullable<FileIconProps["size"]>, string> = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
};

/**
 * File icon component that displays the appropriate icon based on file type
 * with corresponding color coding.
 */
export function FileIcon({ type, size = "md", className }: FileIconProps) {
  const config = ICON_CONFIG[type] || ICON_CONFIG.unknown;
  const Icon = config.icon;

  return (
    <Icon
      className={cn(SIZE_CONFIG[size], config.colorClass, className)}
      aria-label={`Archivo ${type}`}
    />
  );
}

/**
 * File icon with background container
 */
export interface FileIconBadgeProps extends FileIconProps {
  /** Show background container */
  withBackground?: boolean;
}

const BG_CONFIG: Record<FileTypeEnum, string> = {
  pdf: "bg-red-500/20",
  excel: "bg-green-500/20",
  csv: "bg-emerald-500/20",
  image: "bg-purple-500/20",
  audio: "bg-orange-500/20",
  video: "bg-blue-500/20",
  unknown: "bg-white/10",
};

const BADGE_SIZE_CONFIG: Record<NonNullable<FileIconProps["size"]>, string> = {
  sm: "p-1.5",
  md: "p-2",
  lg: "p-2.5",
};

export function FileIconBadge({
  type,
  size = "md",
  className,
}: FileIconBadgeProps) {
  return (
    <div
      className={cn(
        "rounded-lg flex items-center justify-center",
        BG_CONFIG[type] || BG_CONFIG.unknown,
        BADGE_SIZE_CONFIG[size],
        className
      )}
    >
      <FileIcon type={type} size={size} />
    </div>
  );
}
