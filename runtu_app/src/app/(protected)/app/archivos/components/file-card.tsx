"use client";

import { FileText, Table, Image, Mic, Video, MoreVertical, Trash2, Download, Eye } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import type { FileItem, FileType, FileStatus } from "../page";

interface FileCardProps {
  file: FileItem;
  onDelete: (file: FileItem) => void;
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
    });
  }
}

export function FileCard({ file, onDelete }: FileCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { icon: Icon, color, bg } = getFileIcon(file.type);
  const status = getStatusBadge(file.status);

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
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/[0.07] transition-colors">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className={`p-2.5 rounded-lg ${bg}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-slate-800 border border-white/10 rounded-lg shadow-xl z-10 overflow-hidden">
              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:bg-white/10 transition-colors">
                <Eye className="w-4 h-4" />
                Ver detalles
              </button>
              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:bg-white/10 transition-colors">
                <Download className="w-4 h-4" />
                Descargar
              </button>
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
      </div>

      <h3 className="text-white font-medium truncate mb-1" title={file.name}>
        {file.name}
      </h3>

      <div className="flex items-center gap-2 text-xs text-white/40 mb-3">
        <span>{formatFileSize(file.size)}</span>
        <span>•</span>
        <span>{formatDate(file.uploadedAt)}</span>
      </div>

      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${status.className}`}>
        {status.label}
      </span>
    </div>
  );
}
