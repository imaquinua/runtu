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
  ChevronUp,
  Hash,
  Calendar,
  ExternalLink,
} from "lucide-react";
import type { ChunkType, KnowledgeChunkMetadata } from "@/types/database";

interface ChunkCardProps {
  chunk: {
    id: string;
    content: string;
    chunk_type: ChunkType;
    source_context: string | null;
    metadata: KnowledgeChunkMetadata;
    tokens_count: number;
    created_at: string;
  };
  showSource?: boolean;
  onViewFull?: () => void;
}

const typeConfig: Record<ChunkType, { icon: React.ElementType; label: string; bgColor: string; textColor: string }> = {
  document: { icon: FileText, label: "Documento", bgColor: "bg-blue-500/10", textColor: "text-blue-400" },
  spreadsheet: { icon: Table, label: "Hoja de cálculo", bgColor: "bg-green-500/10", textColor: "text-green-400" },
  image_analysis: { icon: Image, label: "Imagen", bgColor: "bg-purple-500/10", textColor: "text-purple-400" },
  audio_transcript: { icon: Mic, label: "Audio", bgColor: "bg-orange-500/10", textColor: "text-orange-400" },
  video_analysis: { icon: Video, label: "Video", bgColor: "bg-pink-500/10", textColor: "text-pink-400" },
  manual_note: { icon: StickyNote, label: "Nota", bgColor: "bg-yellow-500/10", textColor: "text-yellow-400" },
};

export function ChunkCard({ chunk, showSource = true, onViewFull }: ChunkCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const config = typeConfig[chunk.chunk_type] || typeConfig.document;
  const Icon = config.icon;

  // Truncate content for preview
  const previewLength = 200;
  const needsTruncation = chunk.content.length > previewLength;
  const displayContent = isExpanded || !needsTruncation
    ? chunk.content
    : chunk.content.slice(0, previewLength) + "...";

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Extract relevant metadata
  const getMetadataInfo = () => {
    const info: string[] = [];
    if (chunk.metadata.page) info.push(`Pág. ${chunk.metadata.page}`);
    if (chunk.metadata.sheet) info.push(`Hoja: ${chunk.metadata.sheet}`);
    if (chunk.metadata.section) info.push(chunk.metadata.section);
    return info;
  };

  const metadataInfo = getMetadataInfo();

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-colors">
      {/* Header */}
      <div className="flex items-start gap-3 p-4 border-b border-white/5">
        {/* Icon */}
        <div className={`p-2 rounded-lg ${config.bgColor} shrink-0`}>
          <Icon className={`w-4 h-4 ${config.textColor}`} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full ${config.bgColor} ${config.textColor}`}>
              {config.label}
            </span>
            {metadataInfo.map((info, i) => (
              <span key={i} className="text-xs text-white/40">
                {info}
              </span>
            ))}
          </div>

          {showSource && chunk.source_context && (
            <p className="text-sm text-white/60 mt-1 truncate">
              {chunk.source_context}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-white/40 shrink-0">
          <div className="flex items-center gap-1" title="Tokens">
            <Hash className="w-3 h-3" />
            {chunk.tokens_count}
          </div>
          <div className="hidden sm:flex items-center gap-1" title="Fecha">
            <Calendar className="w-3 h-3" />
            {formatDate(chunk.created_at)}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-sm text-white/80 whitespace-pre-wrap break-words leading-relaxed">
          {displayContent}
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-white/5 bg-white/[0.02]">
        {needsTruncation && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-xs text-white/50 hover:text-white/80 transition-colors"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-3 h-3" />
                Ver menos
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" />
                Ver más
              </>
            )}
          </button>
        )}

        {onViewFull && (
          <button
            onClick={onViewFull}
            className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors ml-auto"
          >
            <ExternalLink className="w-3 h-3" />
            Ver completo
          </button>
        )}
      </div>
    </div>
  );
}

// Compact version for lists
export function ChunkCardCompact({
  chunk,
  onClick,
}: {
  chunk: {
    id: string;
    content: string;
    chunk_type: ChunkType;
    source_context: string | null;
    tokens_count: number;
  };
  onClick?: () => void;
}) {
  const config = typeConfig[chunk.chunk_type] || typeConfig.document;
  const Icon = config.icon;

  // Truncate content
  const preview = chunk.content.length > 120
    ? chunk.content.slice(0, 120) + "..."
    : chunk.content;

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white/5 border border-white/10 rounded-lg p-3 hover:bg-white/10 hover:border-white/20 transition-colors group"
    >
      <div className="flex items-start gap-3">
        <div className={`p-1.5 rounded ${config.bgColor} shrink-0`}>
          <Icon className={`w-3.5 h-3.5 ${config.textColor}`} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm text-white/70 line-clamp-2">{preview}</p>
          <div className="flex items-center gap-2 mt-1.5 text-xs text-white/40">
            {chunk.source_context && (
              <span className="truncate max-w-[150px]">{chunk.source_context}</span>
            )}
            <span className="flex items-center gap-1">
              <Hash className="w-3 h-3" />
              {chunk.tokens_count}
            </span>
          </div>
        </div>

        <ChevronDown className="w-4 h-4 text-white/30 group-hover:text-white/50 shrink-0 rotate-[-90deg]" />
      </div>
    </button>
  );
}
