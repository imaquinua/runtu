"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { FileFilters } from "./components/file-filters";
import { FileList } from "./components/file-list";
import { EmptyState } from "./components/empty-state";
import { DeleteModal } from "./components/delete-modal";
import { UploadModal } from "@/components/upload";

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

// Mock data
const mockFiles: FileItem[] = [
  {
    id: "1",
    name: "ventas_noviembre_2024.xlsx",
    type: "spreadsheet",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    size: 2457600,
    uploadedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    status: "processed",
  },
  {
    id: "2",
    name: "reporte_gastos_q4.pdf",
    type: "document",
    mimeType: "application/pdf",
    size: 1843200,
    uploadedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    status: "processed",
  },
  {
    id: "3",
    name: "inventario_diciembre.csv",
    type: "spreadsheet",
    mimeType: "text/csv",
    size: 524288,
    uploadedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    status: "processing",
  },
  {
    id: "4",
    name: "logo_negocio.png",
    type: "image",
    mimeType: "image/png",
    size: 307200,
    uploadedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    status: "processed",
  },
  {
    id: "5",
    name: "grabacion_reunion_proveedores.mp3",
    type: "audio",
    mimeType: "audio/mpeg",
    size: 15728640,
    uploadedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    status: "error",
  },
  {
    id: "6",
    name: "tutorial_caja_registradora.mp4",
    type: "video",
    mimeType: "video/mp4",
    size: 52428800,
    uploadedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    status: "processed",
  },
  {
    id: "7",
    name: "contrato_local_2024.pdf",
    type: "document",
    mimeType: "application/pdf",
    size: 2097152,
    uploadedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    status: "processed",
  },
];

export default function ArchivosPage() {
  const [files, setFiles] = useState<FileItem[]>(mockFiles);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FileType | "all">("all");
  const [deleteFile, setDeleteFile] = useState<FileItem | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Filter files
  const filteredFiles = files.filter((file) => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === "all" || file.type === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const handleDelete = (file: FileItem) => {
    setDeleteFile(file);
  };

  const confirmDelete = () => {
    if (deleteFile) {
      setFiles(files.filter((f) => f.id !== deleteFile.id));
      setDeleteFile(null);
    }
  };

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
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 px-4 rounded-lg transition-colors shadow-lg shadow-indigo-500/25"
        >
          <Upload className="w-4 h-4" />
          Subir archivo
        </button>
      </div>

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
        <FileList files={filteredFiles} onDelete={handleDelete} />
      )}

      {/* Delete Modal */}
      <DeleteModal
        file={deleteFile}
        onClose={() => setDeleteFile(null)}
        onConfirm={confirmDelete}
      />

      {/* Upload Modal */}
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
      />
    </div>
  );
}
