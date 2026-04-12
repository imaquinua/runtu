"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Download,
  Trash2,
  MoreVertical,
  RefreshCw,
  MessageSquare,
  Loader2
} from "lucide-react";
import { FilePreview } from "./components/file-preview";
import { FileMetadata } from "./components/file-metadata";
import { ExtractedContent } from "./components/extracted-content";
import { DeleteModal } from "../components/delete-modal";
import { getUploadById, deleteUpload, getDownloadUrl, type UploadRecord } from "@/app/actions/uploads";
import { getFileTypeFromMime } from "@/types/file";

type FileStatus = "processed" | "processing" | "error";
type FileType = "document" | "spreadsheet" | "image" | "audio" | "video";

interface FileDetail {
  id: string;
  name: string;
  type: FileType;
  mimeType: string;
  size: number;
  uploadedAt: Date;
  processedAt?: Date;
  status: FileStatus;
  previewUrl?: string;
  errorMessage?: string;
}

function mapUploadToFileDetail(upload: UploadRecord): FileDetail {
  const fileType = getFileTypeFromMime(upload.file_type);

  let type: FileType;
  switch (fileType) {
    case "pdf":
      type = "document";
      break;
    case "excel":
    case "csv":
      type = "spreadsheet";
      break;
    case "image":
      type = "image";
      break;
    case "audio":
      type = "audio";
      break;
    case "video":
      type = "video";
      break;
    default:
      type = "document";
  }

  let status: FileStatus;
  switch (upload.processing_status) {
    case "completed":
      status = "processed";
      break;
    case "failed":
      status = "error";
      break;
    default:
      status = "processing";
  }

  return {
    id: upload.id,
    name: upload.filename,
    type,
    mimeType: upload.file_type,
    size: upload.file_size || 0,
    uploadedAt: new Date(upload.created_at),
    processedAt: upload.processing_status === "completed" ? new Date(upload.updated_at) : undefined,
    status,
    errorMessage: upload.processing_status === "failed"
      ? (upload.metadata?.error as string) || "Error al procesar el archivo"
      : undefined,
  };
}

function getStatusBadge(status: FileStatus) {
  switch (status) {
    case "processed":
      return { label: "Procesado", className: "bg-green-500/20 text-green-400 border-green-500/30" };
    case "processing":
      return { label: "Procesando...", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" };
    case "error":
      return { label: "Error", className: "bg-red-500/20 text-red-400 border-red-500/30" };
  }
}

export default function FileDetailPage() {
  const router = useRouter();
  const params = useParams();
  const fileId = params.id as string;

  const [file, setFile] = useState<FileDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFile() {
      setIsLoading(true);
      setError(null);

      try {
        const result = await getUploadById(fileId);

        if (result.success && result.data) {
          const fileDetail = mapUploadToFileDetail(result.data);
          setFile(fileDetail);

          // Get preview URL for images, audio, video
          if (["image", "audio", "video"].includes(fileDetail.type)) {
            const urlResult = await getDownloadUrl(fileId);
            if (urlResult.success && urlResult.data) {
              setPreviewUrl(urlResult.data);
            }
          }
        } else {
          setError(result.error || "Archivo no encontrado");
        }
      } catch (err) {
        setError("Error de conexión");
      } finally {
        setIsLoading(false);
      }
    }

    if (fileId) {
      fetchFile();
    }
  }, [fileId]);

  const handleDownload = async () => {
    if (!file) return;

    try {
      const result = await getDownloadUrl(file.id);
      if (result.success && result.data) {
        window.open(result.data, "_blank");
      } else {
        alert(result.error || "Error al descargar");
      }
    } catch (err) {
      alert("Error de conexión");
    }
  };

  const handleDelete = async () => {
    if (!file) return;

    setIsDeleting(true);
    try {
      const result = await deleteUpload(file.id);
      if (result.success) {
        router.push("/app/archivos");
      } else {
        alert(result.error || "Error al eliminar");
      }
    } catch (err) {
      alert("Error de conexión");
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleAskRuntu = () => {
    // Navigate to chat with file context
    router.push(`/app/chat?file=${fileId}`);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-4" />
          <p className="text-white/60">Cargando archivo...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !file) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || "Archivo no encontrado"}</p>
          <button
            onClick={() => router.push("/app/archivos")}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
          >
            Volver a archivos
          </button>
        </div>
      </div>
    );
  }

  const statusBadge = getStatusBadge(file.status);

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col gap-4">
        {/* Back button and actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push("/app/archivos")}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Volver</span>
          </button>

          {/* Desktop actions */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 text-white/80 rounded-lg border border-white/10 transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              Descargar
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/20 transition-colors text-sm"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar
            </button>
          </div>

          {/* Mobile menu */}
          <div className="relative sm:hidden">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-44 bg-slate-800 border border-white/10 rounded-lg shadow-xl z-20 overflow-hidden">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      handleDownload();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-white/80 hover:bg-white/10 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Descargar
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setShowDeleteModal(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* File name and status */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white break-words">
            {file.name}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${statusBadge.className}`}>
              {statusBadge.label}
            </span>
          </div>
        </div>
      </div>

      {/* Main content - responsive grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-6">
          {/* Preview */}
          <div>
            <h2 className="text-white/50 text-sm font-medium mb-3">Vista previa</h2>
            <FilePreview
              type={file.type}
              name={file.name}
              previewUrl={previewUrl}
              mimeType={file.mimeType}
            />
          </div>

          {/* Metadata */}
          <FileMetadata
            type={file.type}
            mimeType={file.mimeType}
            size={file.size}
            uploadedAt={file.uploadedAt}
            processedAt={file.processedAt}
          />
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Extracted content */}
          <ExtractedContent
            type={file.type}
            status={file.status}
            errorMessage={file.errorMessage}
          />

          {/* Contextual actions */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-5">
            <h3 className="text-white font-medium mb-4">Acciones</h3>
            <div className="space-y-3">
              <button
                onClick={handleAskRuntu}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors"
              >
                <MessageSquare className="w-5 h-5" />
                Preguntarle a Runtu sobre este archivo
              </button>

              {file.status === "error" && (
                <button
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white/5 hover:bg-white/10 text-white/80 font-medium rounded-lg border border-white/10 transition-colors"
                >
                  <RefreshCw className="w-5 h-5" />
                  Reintentar procesamiento
                </button>
              )}

              <button
                onClick={handleDownload}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white/5 hover:bg-white/10 text-white/80 font-medium rounded-lg border border-white/10 transition-colors"
              >
                <Download className="w-5 h-5" />
                Descargar archivo original
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      <DeleteModal
        file={file}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
