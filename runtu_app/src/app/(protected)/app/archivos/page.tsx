"use client";

import { useState, useEffect, useCallback } from "react";
import { Upload, RefreshCw, Loader2 } from "lucide-react";
import { FileFilters } from "./components/file-filters";
import { FileList } from "./components/file-list";
import { EmptyState } from "./components/empty-state";
import { DeleteModal } from "./components/delete-modal";
import { UploadModal } from "@/components/upload";
import { getUploads, deleteUpload, getDownloadUrl, type UploadRecord } from "@/app/actions/uploads";
import { getFileTypeFromMime, type FileTypeEnum } from "@/types/file";

export type FileStatus = "processed" | "processing" | "error";
export type FileType = "document" | "spreadsheet" | "image" | "audio" | "video";

export interface FileItem {
  id: string;
  name: string;
  type: FileType;
  mimeType: string;
  size: number;
  uploadedAt: Date;
  status: FileStatus;
}

// Map Supabase upload to FileItem
function mapUploadToFileItem(upload: UploadRecord): FileItem {
  const fileType = getFileTypeFromMime(upload.file_type);

  // Map FileTypeEnum to our FileType
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

  // Map processing_status to our status
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
    status,
  };
}

export default function ArchivosPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FileType | "all">("all");
  const [deleteFile, setDeleteFile] = useState<FileItem | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch uploads from Supabase
  const fetchUploads = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    setError(null);

    try {
      const result = await getUploads();

      if (result.success && result.data) {
        const mappedFiles = result.data.map(mapUploadToFileItem);
        setFiles(mappedFiles);
      } else {
        setError(result.error || "Error al cargar archivos");
      }
    } catch (err) {
      setError("Error de conexión");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchUploads();
  }, [fetchUploads]);

  // Filter files
  const filteredFiles = files.filter((file) => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === "all" || file.type === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const handleDelete = (file: FileItem) => {
    setDeleteFile(file);
  };

  const confirmDelete = async () => {
    if (!deleteFile) return;

    setIsDeleting(true);
    try {
      const result = await deleteUpload(deleteFile.id);

      if (result.success) {
        setFiles(files.filter((f) => f.id !== deleteFile.id));
        setDeleteFile(null);
      } else {
        alert(result.error || "Error al eliminar");
      }
    } catch (err) {
      alert("Error de conexión");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownload = async (file: FileItem) => {
    try {
      const result = await getDownloadUrl(file.id);

      if (result.success && result.data) {
        // Open download URL in new tab
        window.open(result.data, "_blank");
      } else {
        alert(result.error || "Error al obtener enlace de descarga");
      }
    } catch (err) {
      alert("Error de conexión");
    }
  };

  const handleUploadComplete = () => {
    setShowUploadModal(false);
    fetchUploads(true);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-4" />
          <p className="text-white/60">Cargando archivos...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && files.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => fetchUploads()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Mis Archivos</h1>
          <p className="text-white/60 mt-1">
            Todo lo que Runtu sabe de tu negocio
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchUploads(true)}
            disabled={isRefreshing}
            className="p-2.5 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-lg border border-white/10 transition-colors disabled:opacity-50"
            title="Actualizar"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 px-4 rounded-lg transition-colors shadow-lg shadow-indigo-500/25"
          >
            <Upload className="w-4 h-4" />
            Subir archivo
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && files.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Filters */}
      <FileFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        totalFiles={filteredFiles.length}
      />

      {/* File List or Empty State */}
      {filteredFiles.length === 0 ? (
        <EmptyState hasSearch={searchQuery.length > 0 || activeFilter !== "all"} />
      ) : (
        <FileList
          files={filteredFiles}
          onDelete={handleDelete}
          onDownload={handleDownload}
        />
      )}

      {/* Delete Modal */}
      <DeleteModal
        file={deleteFile}
        onClose={() => setDeleteFile(null)}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
      />

      {/* Upload Modal */}
      <UploadModal
        isOpen={showUploadModal}
        onClose={handleUploadComplete}
      />
    </div>
  );
}
