"use client";

import {
  FileText,
  Table,
  Image,
  Mic,
  Video,
  StickyNote,
  Database,
  Hash,
  Clock,
} from "lucide-react";
import type { ChunkType } from "@/types/database";

interface KnowledgeStatsProps {
  totalChunks: number;
  totalTokens: number;
  chunksByType: Partial<Record<ChunkType, number>>;
  lastChunkAt: string | null;
}

const typeConfig: Record<ChunkType, { icon: React.ElementType; label: string; color: string }> = {
  document: { icon: FileText, label: "Documentos", color: "text-blue-400" },
  spreadsheet: { icon: Table, label: "Hojas de cálculo", color: "text-green-400" },
  image_analysis: { icon: Image, label: "Imágenes", color: "text-purple-400" },
  audio_transcript: { icon: Mic, label: "Audio", color: "text-orange-400" },
  video_analysis: { icon: Video, label: "Video", color: "text-pink-400" },
  manual_note: { icon: StickyNote, label: "Notas", color: "text-yellow-400" },
};

export function KnowledgeStats({
  totalChunks,
  totalTokens,
  chunksByType,
  lastChunkAt,
}: KnowledgeStatsProps) {
  // Calculate last update text
  const getLastUpdateText = () => {
    if (!lastChunkAt) return "Sin datos aún";

    const date = new Date(lastChunkAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays === 1) return "Ayer";
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString("es-MX", { month: "short", day: "numeric" });
  };

  // Format token count
  const formatTokens = (tokens: number) => {
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
    return tokens.toString();
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      {/* Total Chunks */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-indigo-500/20 rounded-lg">
            <Database className="w-4 h-4 text-indigo-400" />
          </div>
        </div>
        <p className="text-2xl font-bold text-white">{totalChunks}</p>
        <p className="text-sm text-white/50">Fragmentos</p>
      </div>

      {/* Total Tokens */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-green-500/20 rounded-lg">
            <Hash className="w-4 h-4 text-green-400" />
          </div>
        </div>
        <p className="text-2xl font-bold text-white">{formatTokens(totalTokens)}</p>
        <p className="text-sm text-white/50">Tokens</p>
      </div>

      {/* By Type - Compact */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <FileText className="w-4 h-4 text-purple-400" />
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(chunksByType).map(([type, count]) => {
            if (!count || count === 0) return null;
            const config = typeConfig[type as ChunkType];
            if (!config) return null;
            const Icon = config.icon;

            return (
              <div
                key={type}
                className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded-md"
                title={config.label}
              >
                <Icon className={`w-3 h-3 ${config.color}`} />
                <span className="text-xs text-white/70">{count}</span>
              </div>
            );
          })}
          {Object.keys(chunksByType).length === 0 && (
            <span className="text-sm text-white/40">Sin datos</span>
          )}
        </div>
        <p className="text-sm text-white/50 mt-1">Por tipo</p>
      </div>

      {/* Last Update */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-orange-500/20 rounded-lg">
            <Clock className="w-4 h-4 text-orange-400" />
          </div>
        </div>
        <p className="text-lg font-medium text-white">{getLastUpdateText()}</p>
        <p className="text-sm text-white/50">Última actualización</p>
      </div>
    </div>
  );
}

// Detailed stats for the expanded view
export function KnowledgeStatsDetailed({
  chunksByType,
  totalChunks,
}: {
  chunksByType: Partial<Record<ChunkType, number>>;
  totalChunks: number;
}) {
  const sortedTypes = Object.entries(chunksByType)
    .filter(([_, count]) => count && count > 0)
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));

  if (sortedTypes.length === 0) {
    return (
      <div className="text-center py-8">
        <Database className="w-12 h-12 text-white/20 mx-auto mb-3" />
        <p className="text-white/50">Sin conocimiento indexado aún</p>
        <p className="text-sm text-white/30 mt-1">
          Sube archivos para que Runtu aprenda de tu negocio
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sortedTypes.map(([type, count]) => {
        const config = typeConfig[type as ChunkType];
        if (!config || !count) return null;
        const Icon = config.icon;
        const percentage = Math.round((count / totalChunks) * 100);

        return (
          <div key={type} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${config.color}`} />
                <span className="text-sm text-white/80">{config.label}</span>
              </div>
              <span className="text-sm text-white/60">
                {count} ({percentage}%)
              </span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  type === "document" ? "bg-blue-500" :
                  type === "spreadsheet" ? "bg-green-500" :
                  type === "image_analysis" ? "bg-purple-500" :
                  type === "audio_transcript" ? "bg-orange-500" :
                  type === "video_analysis" ? "bg-pink-500" :
                  "bg-yellow-500"
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
