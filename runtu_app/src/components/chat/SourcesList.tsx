"use client";

import { useState } from "react";
import {
  FileText,
  Table,
  Image,
  Mic,
  Video,
  StickyNote,
  ChevronDown,
  Paperclip,
  ExternalLink,
} from "lucide-react";
import type { Source } from "@/types/chat";

interface SourcesListProps {
  sources: Source[];
  onSourceClick?: (source: Source) => void;
  defaultExpanded?: boolean;
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
  image_analysis: "Imagen",
  audio_transcript: "Audio",
  video_analysis: "Video",
  manual_note: "Nota",
};

// Colores para indicador de confianza
function getConfidenceInfo(confidence?: number): { label: string; color: string; bgColor: string } {
  if (!confidence) return { label: "", color: "", bgColor: "" };

  if (confidence >= 0.85) {
    return {
      label: "Alta relevancia",
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/20",
    };
  }
  if (confidence >= 0.7) {
    return {
      label: "Relacionado",
      color: "text-amber-400",
      bgColor: "bg-amber-500/20",
    };
  }
  return {
    label: "Posible",
    color: "text-slate-400",
    bgColor: "bg-slate-500/20",
  };
}

export function SourcesList({ sources, onSourceClick, defaultExpanded = false }: SourcesListProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-3">
      {/* Toggle button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-300 transition-colors group"
      >
        <Paperclip className="w-3.5 h-3.5" />
        <span>
          Basado en {sources.length} fuente{sources.length > 1 ? "s" : ""}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Sources list */}
      {isExpanded && (
        <div className="mt-2 space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
          {sources.map((source) => {
            const Icon = sourceTypeIcons[source.type] || FileText;
            const typeLabel = sourceTypeLabels[source.type] || "Archivo";
            const confidenceInfo = getConfidenceInfo(source.confidence);

            return (
              <button
                key={source.id}
                onClick={() => onSourceClick?.(source)}
                className="w-full flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600/50 transition-all text-left group"
              >
                {/* Icon */}
                <div className="flex-shrink-0 w-8 h-8 rounded-md bg-slate-700/50 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-200 truncate">
                      {source.name}
                    </span>
                    {confidenceInfo.label && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded ${confidenceInfo.bgColor} ${confidenceInfo.color}`}
                      >
                        {confidenceInfo.label}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{typeLabel}</p>
                  {source.preview && (
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 italic">
                      &ldquo;{source.preview}...&rdquo;
                    </p>
                  )}
                </div>

                {/* Arrow */}
                <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-400 flex-shrink-0 mt-1" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
