/**
 * Supported file types in Runtu
 */
export type FileTypeEnum = "pdf" | "excel" | "csv" | "image" | "audio" | "video" | "unknown";

/**
 * File processing status
 */
export type ProcessingStatusEnum = "pending" | "processing" | "completed" | "error";

/**
 * Upload status for active uploads
 */
export type UploadStatusEnum = "uploading" | "processing" | "done" | "error";

/**
 * File entity as stored in the system
 */
export interface FileType {
  id: string;
  name: string;
  type: FileTypeEnum;
  size: number;
  status: ProcessingStatusEnum;
  uploadedAt: Date;
  errorMessage?: string;
  /** Optional: processing progress (0-100) */
  progress?: number;
}

/**
 * File being uploaded (in progress)
 */
export interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  status: UploadStatusEnum;
  errorMessage?: string;
}

/**
 * Map MIME types to FileTypeEnum
 */
export function getFileTypeFromMime(mimeType: string): FileTypeEnum {
  if (mimeType === "application/pdf") return "pdf";
  if (
    mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mimeType === "application/vnd.ms-excel"
  ) {
    return "excel";
  }
  if (mimeType === "text/csv") return "csv";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType.startsWith("video/")) return "video";
  return "unknown";
}

/**
 * Get file type from filename extension
 */
export function getFileTypeFromName(filename: string): FileTypeEnum {
  const ext = filename.split(".").pop()?.toLowerCase();

  switch (ext) {
    case "pdf":
      return "pdf";
    case "xlsx":
    case "xls":
      return "excel";
    case "csv":
      return "csv";
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
    case "webp":
    case "svg":
      return "image";
    case "mp3":
    case "wav":
    case "ogg":
    case "m4a":
      return "audio";
    case "mp4":
    case "webm":
    case "mov":
    case "avi":
      return "video";
    default:
      return "unknown";
  }
}
