"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  Upload,
  FileText,
  Table,
  Image,
  Mic,
  Video,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  RotateCcw,
  FolderOpen,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

// Accepted file types
const ACCEPTED_TYPES = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "application/vnd.ms-excel": [".xls"],
  "text/csv": [".csv"],
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/webp": [".webp"],
  "audio/mpeg": [".mp3"],
  "audio/wav": [".wav"],
  "audio/ogg": [".ogg"],
  "video/mp4": [".mp4"],
  "video/webm": [".webm"],
};

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

const FILE_TYPE_BADGES = [
  { label: "PDF", icon: FileText, color: "bg-red-500/20 text-red-400 border-red-500/30" },
  { label: "Excel", icon: Table, color: "bg-green-500/20 text-green-400 border-green-500/30" },
  { label: "CSV", icon: Table, color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  { label: "Imágenes", icon: Image, color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  { label: "Audio", icon: Mic, color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  { label: "Video", icon: Video, color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
];

type UploadStatus = "pending" | "uploading" | "processing" | "done" | "error";

interface QueuedFile {
  id: string;
  file: File;
  status: UploadStatus;
  progress: number;
  error?: string;
  isValid: boolean;
  invalidReason?: string;
}

function getFileIcon(file: File) {
  const type = file.type;
  if (type === "application/pdf") return { icon: FileText, color: "text-red-400" };
  if (type.includes("spreadsheet") || type.includes("excel") || type === "text/csv")
    return { icon: Table, color: "text-green-400" };
  if (type.startsWith("image/")) return { icon: Image, color: "text-purple-400" };
  if (type.startsWith("audio/")) return { icon: Mic, color: "text-yellow-400" };
  if (type.startsWith("video/")) return { icon: Video, color: "text-blue-400" };
  return { icon: FileText, color: "text-white/60" };
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isValidFileType(file: File): boolean {
  const acceptedMimes = Object.keys(ACCEPTED_TYPES);
  return acceptedMimes.some((mime) => file.type === mime || file.type.startsWith(mime.split("/")[0] + "/"));
}

interface UploadZoneProps {
  onComplete?: () => void;
  onCancel?: () => void;
  showCancelButton?: boolean;
}

export function UploadZone({ onComplete, onCancel, showCancelButton = true }: UploadZoneProps) {
  const [queuedFiles, setQueuedFiles] = useState<QueuedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: QueuedFile[] = acceptedFiles.map((file) => {
      const isValid = isValidFileType(file) && file.size <= MAX_FILE_SIZE;
      let invalidReason: string | undefined;

      if (!isValidFileType(file)) {
        invalidReason = "Tipo de archivo no soportado";
      } else if (file.size > MAX_FILE_SIZE) {
        invalidReason = "Archivo muy grande (máx. 25MB)";
      }

      return {
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        file,
        status: "pending",
        progress: 0,
        isValid,
        invalidReason,
      };
    });

    setQueuedFiles((prev) => [...prev, ...newFiles]);
    setUploadComplete(false);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_FILE_SIZE,
    noClick: isUploading,
    noDrag: isUploading,
  });

  const removeFile = (id: string) => {
    setQueuedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const simulateUpload = async (fileId: string) => {
    // Simulate upload progress
    for (let progress = 0; progress <= 100; progress += 10) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      setQueuedFiles((prev) =>
        prev.map((f) =>
          f.id === fileId ? { ...f, status: "uploading", progress } : f
        )
      );
    }

    // Simulate processing
    setQueuedFiles((prev) =>
      prev.map((f) =>
        f.id === fileId ? { ...f, status: "processing", progress: 100 } : f
      )
    );

    await new Promise((resolve) => setTimeout(resolve, 800));

    // Random success/error (90% success rate for demo)
    const success = Math.random() > 0.1;
    setQueuedFiles((prev) =>
      prev.map((f) =>
        f.id === fileId
          ? {
              ...f,
              status: success ? "done" : "error",
              error: success ? undefined : "Error al procesar el archivo",
            }
          : f
      )
    );
  };

  const retryUpload = async (fileId: string) => {
    setQueuedFiles((prev) =>
      prev.map((f) =>
        f.id === fileId ? { ...f, status: "pending", progress: 0, error: undefined } : f
      )
    );
    await simulateUpload(fileId);
  };

  const startUpload = async () => {
    const validFiles = queuedFiles.filter((f) => f.isValid && f.status === "pending");
    if (validFiles.length === 0) return;

    setIsUploading(true);

    // Upload files sequentially for demo (could be parallel)
    for (const qf of validFiles) {
      await simulateUpload(qf.id);
    }

    setIsUploading(false);
    setUploadComplete(true);
  };

  const resetUpload = () => {
    setQueuedFiles([]);
    setUploadComplete(false);
  };

  const validFilesCount = queuedFiles.filter((f) => f.isValid && f.status === "pending").length;
  const hasFiles = queuedFiles.length > 0;
  const allDone = queuedFiles.length > 0 && queuedFiles.every((f) => f.status === "done" || !f.isValid);

  // Success state
  if (uploadComplete && allDone) {
    return (
      <div className="text-center py-8">
        <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
          <Sparkles className="w-8 h-8 text-green-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">
          ¡Listo! Runtu está aprendiendo de tus archivos
        </h3>
        <p className="text-white/60 mb-6">
          En unos momentos podrás hacerle preguntas sobre tu información.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={resetUpload}
            className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white font-medium rounded-lg border border-white/10 transition-colors"
          >
            Subir más archivos
          </button>
          <Link
            href="/app/archivos"
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors inline-flex items-center justify-center gap-2"
          >
            <FolderOpen className="w-4 h-4" />
            Ir a mis archivos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
          isDragActive
            ? "border-indigo-500 bg-indigo-500/10"
            : "border-white/20 hover:border-white/40 hover:bg-white/5"
        } ${isUploading ? "pointer-events-none opacity-50" : ""}`}
      >
        <input {...getInputProps()} />
        <div
          className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${
            isDragActive ? "bg-indigo-500/20" : "bg-white/5"
          }`}
        >
          <Upload
            className={`w-8 h-8 transition-colors ${
              isDragActive ? "text-indigo-400" : "text-white/40"
            }`}
          />
        </div>
        <p className="text-white font-medium mb-1">
          {isDragActive ? "Suelta los archivos aquí" : "Arrastra archivos aquí"}
        </p>
        <p className="text-white/50 text-sm">o haz clic para seleccionar</p>
      </div>

      {/* Accepted Types */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2 justify-center">
          {FILE_TYPE_BADGES.map((badge) => {
            const Icon = badge.icon;
            return (
              <span
                key={badge.label}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${badge.color}`}
              >
                <Icon className="w-3 h-3" />
                {badge.label}
              </span>
            );
          })}
        </div>
        <p className="text-center text-white/40 text-xs">Máximo 25MB por archivo</p>
      </div>

      {/* File Queue */}
      {hasFiles && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-white/70">
            Archivos seleccionados ({queuedFiles.length})
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {queuedFiles.map((qf) => {
              const { icon: FileIcon, color } = getFileIcon(qf.file);
              return (
                <div
                  key={qf.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    qf.isValid
                      ? "bg-white/5 border-white/10"
                      : "bg-red-500/10 border-red-500/30"
                  }`}
                >
                  <FileIcon className={`w-5 h-5 flex-shrink-0 ${qf.isValid ? color : "text-red-400"}`} />
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium truncate ${
                        qf.isValid ? "text-white" : "text-red-400"
                      }`}
                    >
                      {qf.file.name}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/40">
                        {formatFileSize(qf.file.size)}
                      </span>
                      {!qf.isValid && (
                        <span className="text-xs text-red-400">{qf.invalidReason}</span>
                      )}
                      {qf.status === "uploading" && (
                        <span className="text-xs text-indigo-400">Subiendo... {qf.progress}%</span>
                      )}
                      {qf.status === "processing" && (
                        <span className="text-xs text-yellow-400 flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Procesando...
                        </span>
                      )}
                      {qf.status === "done" && (
                        <span className="text-xs text-green-400 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Listo
                        </span>
                      )}
                      {qf.status === "error" && (
                        <span className="text-xs text-red-400 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {qf.error}
                        </span>
                      )}
                    </div>
                    {/* Progress bar */}
                    {(qf.status === "uploading" || qf.status === "processing") && (
                      <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            qf.status === "processing"
                              ? "bg-yellow-500 animate-pulse"
                              : "bg-indigo-500"
                          }`}
                          style={{ width: `${qf.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                  {/* Actions */}
                  {qf.status === "pending" && qf.isValid && (
                    <button
                      onClick={() => removeFile(qf.id)}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  {qf.status === "error" && (
                    <button
                      onClick={() => retryUpload(qf.id)}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                      title="Reintentar"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                  {!qf.isValid && (
                    <button
                      onClick={() => removeFile(qf.id)}
                      className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  {qf.status === "done" && (
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        {showCancelButton && (
          <button
            onClick={onCancel}
            disabled={isUploading}
            className="flex-1 py-2.5 px-4 bg-white/5 hover:bg-white/10 text-white font-medium rounded-lg border border-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
        )}
        <button
          onClick={startUpload}
          disabled={validFilesCount === 0 || isUploading}
          className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Subiendo...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Subir {validFilesCount > 0 ? `${validFilesCount} archivo${validFilesCount > 1 ? "s" : ""}` : "archivos"}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
