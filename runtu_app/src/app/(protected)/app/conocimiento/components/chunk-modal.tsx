"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  X,
  FileText,
  Table,
  Image,
  Mic,
  Video,
  StickyNote,
  Hash,
  Calendar,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import { useState } from "react";
import type { ChunkType, KnowledgeChunkMetadata } from "@/types/database";

interface ChunkModalProps {
  isOpen: boolean;
  onClose: () => void;
  chunk: {
    id: string;
    content: string;
    chunk_type: ChunkType;
    source_context: string | null;
    metadata: KnowledgeChunkMetadata;
    tokens_count: number;
    created_at: string;
    upload_id?: string | null;
  } | null;
}

const typeConfig: Record<ChunkType, { icon: React.ElementType; label: string; bgColor: string; textColor: string }> = {
  document: { icon: FileText, label: "Documento", bgColor: "bg-blue-500/10", textColor: "text-blue-400" },
  spreadsheet: { icon: Table, label: "Hoja de cálculo", bgColor: "bg-green-500/10", textColor: "text-green-400" },
  image_analysis: { icon: Image, label: "Imagen", bgColor: "bg-purple-500/10", textColor: "text-purple-400" },
  audio_transcript: { icon: Mic, label: "Audio", bgColor: "bg-orange-500/10", textColor: "text-orange-400" },
  video_analysis: { icon: Video, label: "Video", bgColor: "bg-pink-500/10", textColor: "text-pink-400" },
  manual_note: { icon: StickyNote, label: "Nota", bgColor: "bg-yellow-500/10", textColor: "text-yellow-400" },
};

export function ChunkModal({ isOpen, onClose, chunk }: ChunkModalProps) {
  const [copied, setCopied] = useState(false);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !chunk) return null;

  const config = typeConfig[chunk.chunk_type] || typeConfig.document;
  const Icon = config.icon;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(chunk.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Get metadata entries
  const metadataEntries = Object.entries(chunk.metadata).filter(
    ([key, value]) => value !== undefined && value !== null && !["filename"].includes(key)
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl md:max-h-[80vh] z-50 flex flex-col bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${config.bgColor}`}>
              <Icon className={`w-5 h-5 ${config.textColor}`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{config.label}</h3>
              {chunk.source_context && (
                <p className="text-sm text-white/50 truncate max-w-[300px]">
                  {chunk.source_context}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-white/50">
            <div className="flex items-center gap-1.5">
              <Hash className="w-4 h-4" />
              <span>{chunk.tokens_count} tokens</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(chunk.created_at)}</span>
            </div>
          </div>

          {/* Main content */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-white/40 uppercase tracking-wide">Contenido</span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-green-400">Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copiar
                  </>
                )}
              </button>
            </div>
            <p className="text-sm text-white/80 whitespace-pre-wrap break-words leading-relaxed">
              {chunk.content}
            </p>
          </div>

          {/* Metadata */}
          {metadataEntries.length > 0 && (
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <span className="text-xs text-white/40 uppercase tracking-wide block mb-3">
                Metadata
              </span>
              <div className="grid grid-cols-2 gap-2">
                {metadataEntries.map(([key, value]) => (
                  <div key={key} className="text-sm">
                    <span className="text-white/40 capitalize">{key.replace(/_/g, " ")}: </span>
                    <span className="text-white/70">
                      {typeof value === "object" ? JSON.stringify(value) : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-white/10 bg-white/[0.02] shrink-0">
          <span className="text-xs text-white/30 font-mono">ID: {chunk.id.slice(0, 8)}...</span>

          <div className="flex items-center gap-2">
            {chunk.upload_id && (
              <Link
                href={`/app/archivos/${chunk.upload_id}`}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Ver archivo
              </Link>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
