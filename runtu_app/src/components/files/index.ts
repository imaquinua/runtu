// File icon components
export { FileIcon, FileIconBadge } from "./file-icon";
export type { FileIconProps, FileIconBadgeProps } from "./file-icon";

// Processing status components
export { ProcessingStatus, StatusDot } from "./processing-status";
export type { ProcessingStatusProps, StatusDotProps } from "./processing-status";

// File card component
export { FileCard } from "./file-card";
export type { FileCardProps } from "./file-card";

// File list component
export { FileList } from "./file-list";
export type { FileListProps } from "./file-list";

// Upload progress components
export { UploadProgressCard, UploadProgressList } from "./upload-progress-card";
export type { UploadProgressCardProps, UploadProgressListProps } from "./upload-progress-card";

// Re-export types
export type {
  FileType,
  FileTypeEnum,
  ProcessingStatusEnum,
  UploadStatusEnum,
  UploadingFile,
} from "@/types/file";
