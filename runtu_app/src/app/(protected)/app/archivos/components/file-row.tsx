"use client";

import { FileText, Table, Image, Mic, Video, MoreVertical, Trash2, Download, Eye, RefreshCw } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { FileItem, FileType, FileStatus } from "../page";

interface FileRowProps {
  file: FileItem;
  onDelete: (file: FileItem) => void;
  onDownload?: (file: FileItem) => void;
  onReprocess?: (file: FileItem) => void;
}

function getFileIcon(type: FileType) {
  switch (type) {
    case "document":
      return { icon: FileText, color: "text-red-400", bg: "bg-red-500/20" };
    case "spreadsheet":
      return { icon: Table, color: "text-green-400", bg: "bg-green-500/20" };
    case "image":
      return { icon: Image, color: "text-purple-400", bg: "bg-purple-500/20" };
    case "audio":
      return { icon: Mic, color: "text-yellow-400", bg: "bg-yellow-500/20" };
    case "video":
      return { icon: Video, color: "text-blue-400", bg: "bg-blue-500/20" };
    default:
      return { icon: FileText, color: "text-white/60", bg: "bg-white/10" };
  }
}

function getStatusBadge(status: FileStatus) {
  switch (status) {
    case "processed":
      return { label: "Procesado", className: "bg-green-500/20 text-green-400 border-green-500/30" };
    case "processing":
      return { label: "Procesando...", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" };
    case "pending":
      return { label: "Pendiente", className: "bg-gray-500/20 text-gray-400 border-gray-500/30" };
    case "error":
      return { label: "Error", className: "bg-red-500/20 text-red-400 border-red-500/30" };
    default:
      return { label: "Desconocido", className: "bg-white/10 text-white/60 border-white/20" };
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function formatDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) {
    return "Hace un momento";
  } else if (diffHours < 24) {
    return `Hace ${diffHours}h`;
  } else if (diffDays === 1) {
    return "Ayer";
  } else if (diffDays < 7) {
    return `Hace ${diffDays} días`;
  } else {
    return date.toLocaleDateString("es-PE", {
      day: "numeric",
      month: "short",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  }
}

export function FileRow({ file, onDelete, onDownload, onReprocess }: FileRowProps) {
  const canReprocess = file.status === "error" || file.status === "pending";
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { icon: Icon, color, bg } = getFileIcon(file.type);
  const status = getStatusBadge(file.status);

  const handleRowClick = () => {
    router.push(`/app/archivos/${file.id}`);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <tr className="group hover:bg-white/5 transition-colors cursor-pointer" onClick={handleRowClick}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${bg}`}>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
          <div className="min-w-0">
            <p className="text-white font-medium truncate max-w-[200px] lg:max-w-[300px] group-hover:text-indigo-400 transition-colors">
              {file.name}
            </p>
            <p className="text-white/40 text-xs">{file.mimeType}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-white/60 text-sm">
        {formatFileSize(file.size)}
      </td>
      <td className="px-4 py-3 text-white/60 text-sm">
        {formatDate(file.uploadedAt)}
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${status.className}`}>
          {status.label}
        </span>
      </td>
      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-slate-800 border border-white/10 rounded-lg shadow-xl z-10 overflow-hidden">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  router.push(`/app/archivos/${file.id}`);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:bg-white/10 transition-colors"
              >
                <Eye className="w-4 h-4" />
                Ver detalles
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDownload?.(file);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:bg-white/10 transition-colors"
              >
                <Download className="w-4 h-4" />
                Descargar
              </button>
              {canReprocess && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onReprocess?.(file);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reprocesar
                </button>
              )}
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(file);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}
