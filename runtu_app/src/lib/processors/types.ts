// ============================================
// Processors - Common Types
// ============================================

import type { ChunkType } from "@/types/database";

// ============================================
// Processing Results
// ============================================

export interface ProcessingResult {
  success: boolean;
  uploadId: string;
  chunksCreated: number;
  totalTokens: number;
  processingTimeMs: number;
  error?: string;
  details?: ProcessingDetails;
}

export interface ProcessingDetails {
  /** Número de páginas (PDF) */
  pageCount?: number;
  /** Número de hojas (Excel) */
  sheetCount?: number;
  /** Duración en segundos (audio/video) */
  durationSeconds?: number;
  /** Dimensiones de imagen */
  imageDimensions?: { width: number; height: number };
  /** Resumen del contenido */
  contentSummary?: string;
}

// ============================================
// Processor Parameters
// ============================================

export interface ProcessorParams {
  uploadId: string;
  businessId: string;
  filePath: string;
}

export interface SpreadsheetProcessorParams extends ProcessorParams {
  fileType: "xlsx" | "xls" | "csv";
}

export interface VideoProcessorParams extends ProcessorParams {
  extractFrames?: boolean;
  frameCount?: number;
}

// ============================================
// Chunk Creation Data
// ============================================

export interface ChunkData {
  content: string;
  embedding: number[];
  chunkType: ChunkType;
  sourceContext: string;
  metadata?: Record<string, unknown>;
  tokensCount: number;
}

// ============================================
// Processing Status
// ============================================

export type ProcessingStatus =
  | "pending"
  | "downloading"
  | "extracting"
  | "chunking"
  | "embedding"
  | "saving"
  | "completed"
  | "failed";

export interface ProcessingProgress {
  uploadId: string;
  status: ProcessingStatus;
  progress: number; // 0-100
  currentStep: string;
  error?: string;
}

// ============================================
// File Type Detection
// ============================================

export type SupportedFileType =
  | "pdf"
  | "xlsx"
  | "xls"
  | "csv"
  | "image"
  | "audio"
  | "video"
  | "text";

export const MIME_TYPE_MAP: Record<string, SupportedFileType> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-excel": "xls",
  "text/csv": "csv",
  "image/jpeg": "image",
  "image/png": "image",
  "image/webp": "image",
  "image/gif": "image",
  "audio/mpeg": "audio",
  "audio/mp3": "audio",
  "audio/wav": "audio",
  "audio/ogg": "audio",
  "audio/m4a": "audio",
  "video/mp4": "video",
  "video/webm": "video",
  "video/quicktime": "video",
  "text/plain": "text",
};

export function detectFileType(mimeType: string, filename: string): SupportedFileType | null {
  // Check by MIME type first
  if (MIME_TYPE_MAP[mimeType]) {
    return MIME_TYPE_MAP[mimeType];
  }

  // Fallback to extension
  const ext = filename.split(".").pop()?.toLowerCase();

  switch (ext) {
    case "pdf":
      return "pdf";
    case "xlsx":
      return "xlsx";
    case "xls":
      return "xls";
    case "csv":
      return "csv";
    case "jpg":
    case "jpeg":
    case "png":
    case "webp":
    case "gif":
      return "image";
    case "mp3":
    case "wav":
    case "ogg":
    case "m4a":
      return "audio";
    case "mp4":
    case "webm":
    case "mov":
      return "video";
    case "txt":
    case "md":
      return "text";
    default:
      return null;
  }
}

// ============================================
// Error Types
// ============================================

export class ProcessingError extends Error {
  constructor(
    message: string,
    public code: string,
    public uploadId: string,
    public recoverable: boolean = false,
    public details?: unknown
  ) {
    super(message);
    this.name = "ProcessingError";
  }
}

export const ProcessingErrorCodes = {
  FILE_NOT_FOUND: "FILE_NOT_FOUND",
  DOWNLOAD_FAILED: "DOWNLOAD_FAILED",
  EXTRACTION_FAILED: "EXTRACTION_FAILED",
  EMBEDDING_FAILED: "EMBEDDING_FAILED",
  SAVE_FAILED: "SAVE_FAILED",
  UNSUPPORTED_TYPE: "UNSUPPORTED_TYPE",
  FILE_TOO_LARGE: "FILE_TOO_LARGE",
  TIMEOUT: "TIMEOUT",
  INVALID_CONTENT: "INVALID_CONTENT",
} as const;

// ============================================
// Logging Helpers
// ============================================

export function logProcessor(
  processor: string,
  uploadId: string,
  message: string,
  data?: unknown
): void {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${processor}] [${uploadId}] ${message}`, data ?? "");
}

export function logProcessorError(
  processor: string,
  uploadId: string,
  error: unknown
): void {
  const timestamp = new Date().toISOString();
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(`[${timestamp}] [${processor}] [${uploadId}] ERROR: ${errorMessage}`, error);
}
