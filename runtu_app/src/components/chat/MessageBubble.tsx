"use client";

import { useState } from "react";
import { Sparkles, User, FileText, Table, Image, Mic, Video, StickyNote, X } from "lucide-react";
import type { Message, Source } from "@/types/chat";

interface MessageBubbleProps {
  message: Message;
  isLast: boolean;
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "ahora";
  if (diffMins < 60) return `hace ${diffMins} min`;
  if (diffHours < 24) return `hace ${diffHours}h`;
  if (diffDays < 7) return `hace ${diffDays}d`;

  return date.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
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

interface CitationBadgeProps {
  number: number;
  source?: Source;
  onClick: () => void;
}

function CitationBadge({ number, source, onClick }: CitationBadgeProps) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-medium rounded-full bg-indigo-500/30 text-indigo-300 hover:bg-indigo-500/50 transition-colors mx-0.5 align-top"
      title={source?.name || `Fuente ${number}`}
    >
      {number}
    </button>
  );
}

interface SourcePanelProps {
  source: Source;
  index: number;
  onClose: () => void;
}

function SourcePanel({ source, index, onClose }: SourcePanelProps) {
  const Icon = sourceTypeIcons[source.type] || FileText;
  const label = sourceTypeLabels[source.type] || "Fuente";

  return (
    <div className="mt-2 p-3 rounded-lg bg-slate-700/50 border border-slate-600/50 animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex-shrink-0 w-6 h-6 rounded-md bg-indigo-500/20 flex items-center justify-center">
            <Icon className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-medium text-indigo-400 bg-indigo-500/20 px-1.5 py-0.5 rounded">
                [{index + 1}]
              </span>
              <span className="text-xs text-slate-400">{label}</span>
            </div>
            <p className="text-xs font-medium text-slate-200 truncate mt-0.5">{source.name}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 p-1 rounded hover:bg-slate-600/50 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      {source.preview && (
        <p className="mt-2 text-[11px] text-slate-400 line-clamp-2 italic">
          &ldquo;{source.preview}...&rdquo;
        </p>
      )}
    </div>
  );
}

// Renderiza contenido con citas inline
function renderContentWithCitations(
  content: string,
  sources: Source[],
  onCitationClick: (index: number) => void
): React.ReactNode[] {
  // Regex para encontrar [[1]], [[2]], etc.
  const citationRegex = /\[\[(\d+)\]\]/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = citationRegex.exec(content)) !== null) {
    // Agregar texto antes de la cita
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }

    const citationNumber = parseInt(match[1], 10);
    const source = sources[citationNumber - 1];

    parts.push(
      <CitationBadge
        key={`citation-${match.index}`}
        number={citationNumber}
        source={source}
        onClick={() => onCitationClick(citationNumber - 1)}
      />
    );

    lastIndex = match.index + match[0].length;
  }

  // Agregar texto restante
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return parts;
}

export function MessageBubble({ message, isLast }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const [activeSourceIndex, setActiveSourceIndex] = useState<number | null>(null);

  const handleCitationClick = (index: number) => {
    setActiveSourceIndex(activeSourceIndex === index ? null : index);
  };

  const activeSource = activeSourceIndex !== null ? message.sources?.[activeSourceIndex] : null;

  return (
    <div
      className={`flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      {/* Assistant Avatar */}
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-indigo-500/20">
          <Sparkles className="w-4 h-4 text-indigo-400" />
        </div>
      )}

      {/* Message Content */}
      <div className={`max-w-[80%] ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`px-4 py-3 rounded-2xl ${
            isUser
              ? "bg-indigo-600 text-white rounded-br-md"
              : "bg-slate-800/80 text-slate-100 rounded-bl-md border border-slate-700/50"
          }`}
        >
          <p className="text-sm whitespace-pre-wrap leading-relaxed">
            {!isUser && message.sources && message.sources.length > 0
              ? renderContentWithCitations(message.content, message.sources, handleCitationClick)
              : message.content}
          </p>
        </div>

        {/* Active Source Panel */}
        {activeSource && activeSourceIndex !== null && (
          <SourcePanel
            source={activeSource}
            index={activeSourceIndex}
            onClose={() => setActiveSourceIndex(null)}
          />
        )}

        {/* Timestamp - only show on last message or hover */}
        {isLast && (
          <p
            className={`text-[10px] text-slate-500 mt-1 px-1 ${
              isUser ? "text-right" : "text-left"
            }`}
          >
            {formatTimeAgo(message.createdAt)}
          </p>
        )}

        {/* Sources summary - show at bottom if there are sources */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1 px-1">
            <span className="text-[10px] text-slate-500">Fuentes:</span>
            {message.sources.map((source, idx) => {
              const Icon = sourceTypeIcons[source.type] || FileText;
              return (
                <button
                  key={source.id}
                  onClick={() => handleCitationClick(idx)}
                  className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full transition-colors ${
                    activeSourceIndex === idx
                      ? "bg-indigo-500/30 text-indigo-300 border border-indigo-500/50"
                      : "bg-slate-700/50 text-slate-400 border border-slate-600/50 hover:bg-slate-700"
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span className="max-w-[100px] truncate">{source.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600/20 flex items-center justify-center border border-indigo-500/30">
          <User className="w-4 h-4 text-indigo-400" />
        </div>
      )}
    </div>
  );
}
