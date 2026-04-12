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
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import { useState } from "react";
import type { Source } from "@/types/chat";

interface SourceModalProps {
  source: Source;
  onClose: () => void;
}

// Iconos por tipo de fuente
const sourceTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  document: FileText,
  spreadsheet: Table,
  image_analysis: Image,
  audio_transcript: Mic,
  video_analysis: Video,
  manual_note: StickyNote,
};

// Etiquetas por tipo
const sourceTypeLabels: Record<string, string> = {
  document: "Documento",
  spreadsheet: "Hoja de cálculo",
  image_analysis: "Análisis de imagen",
  audio_transcript: "Transcripción de audio",
  video_analysis: "Análisis de video",
  manual_note: "Nota manual",
};

// Confianza
function getConfidenceBadge(confidence?: number) {
  if (!confidence) return null;

  if (confidence >= 0.85) {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        Alta relevancia ({Math.round(confidence * 100)}%)
      </span>
    );
  }
  if (confidence >= 0.7) {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-amber-500/20 text-amber-400">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        Información relacionada ({Math.round(confidence * 100)}%)
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-slate-500/20 text-slate-400">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
      Posiblemente relevante ({Math.round(confidence * 100)}%)
    </span>
  );
}

export function SourceModal({ source, onClose }: SourceModalProps) {
  const [copied, setCopied] = useState(false);
  const Icon = sourceTypeIcons[source.type] || FileText;
  const typeLabel = sourceTypeLabels[source.type] || "Archivo";

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const handleCopy = async () => {
    const content = source.fullContent || source.preview;
    if (content) {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg max-h-[80vh] bg-slate-900 rounded-xl border border-slate-700/50 shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-slate-700/50">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
              <Icon className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-100">{source.name}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{typeLabel}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Confidence badge */}
        {source.confidence && (
          <div className="px-4 pt-3">
            {getConfidenceBadge(source.confidence)}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500">Contenido usado por Runtu:</span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-300 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
              {source.fullContent || source.preview}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-4 border-t border-slate-700/50">
          {source.uploadId ? (
            <Link
              href={`/app/archivos/${source.uploadId}`}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Ver archivo original
            </Link>
          ) : (
            <div />
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
