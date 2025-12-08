"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Brain,
  Loader2,
  RefreshCw,
  FileText,
  Table,
  Image,
  Mic,
  Video,
  StickyNote,
  ChevronDown,
  Filter,
} from "lucide-react";
import { KnowledgeStats, KnowledgeStatsDetailed } from "./components/knowledge-stats";
import { ChunkCard } from "./components/chunk-card";
import { ChunkModal } from "./components/chunk-modal";
import { SearchTest } from "./components/search-test";
import type { ChunkType, KnowledgeChunkMetadata } from "@/types/database";

interface ChunkData {
  id: string;
  content: string;
  chunk_type: ChunkType;
  source_context: string | null;
  metadata: KnowledgeChunkMetadata;
  tokens_count: number;
  created_at: string;
  upload_id: string | null;
}

interface StatsData {
  total_chunks: number;
  total_tokens: number;
  chunks_by_type: Partial<Record<ChunkType, number>>;
  last_chunk_at: string | null;
}

interface UploadWithChunks {
  id: string;
  filename: string;
  file_type: string;
  chunks: ChunkData[];
}

const typeFilters: { value: ChunkType | "all"; label: string; icon: React.ElementType }[] = [
  { value: "all", label: "Todos", icon: Filter },
  { value: "document", label: "Documentos", icon: FileText },
  { value: "spreadsheet", label: "Hojas", icon: Table },
  { value: "image_analysis", label: "Imágenes", icon: Image },
  { value: "audio_transcript", label: "Audio", icon: Mic },
  { value: "video_analysis", label: "Video", icon: Video },
  { value: "manual_note", label: "Notas", icon: StickyNote },
];

export default function ConocimientoPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [chunks, setChunks] = useState<ChunkData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedChunk, setSelectedChunk] = useState<ChunkData | null>(null);
  const [activeFilter, setActiveFilter] = useState<ChunkType | "all">("all");
  const [expandedSection, setExpandedSection] = useState<"stats" | "search" | "chunks" | null>("search");

  // Fetch data
  const fetchData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    setError(null);

    try {
      // Fetch stats and chunks from API
      const [statsRes, chunksRes] = await Promise.all([
        fetch("/api/knowledge/stats"),
        fetch("/api/knowledge/chunks?limit=50"),
      ]);

      if (!statsRes.ok || !chunksRes.ok) {
        throw new Error("Error al cargar datos");
      }

      const statsData = await statsRes.json();
      const chunksData = await chunksRes.json();

      if (statsData.success) {
        setStats(statsData.data);
      }

      if (chunksData.success) {
        setChunks(chunksData.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter chunks
  const filteredChunks = activeFilter === "all"
    ? chunks
    : chunks.filter((c) => c.chunk_type === activeFilter);

  // Handle search result click
  const handleSearchResultClick = (result: { id: string }) => {
    const chunk = chunks.find((c) => c.id === result.id);
    if (chunk) {
      setSelectedChunk(chunk);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-4" />
          <p className="text-white/60">Cargando conocimiento...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Brain className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => fetchData()}
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
          <div className="flex items-center gap-3 mb-1">
            <Brain className="w-6 h-6 text-indigo-400" />
            <h1 className="text-2xl font-bold text-white">Base de Conocimiento</h1>
          </div>
          <p className="text-white/60">
            Todo lo que Runtu ha aprendido de tus archivos
          </p>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Actualizar
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <KnowledgeStats
          totalChunks={stats.total_chunks}
          totalTokens={stats.total_tokens}
          chunksByType={stats.chunks_by_type}
          lastChunkAt={stats.last_chunk_at}
        />
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Search & Stats */}
        <div className="lg:col-span-1 space-y-6">
          {/* Search Test */}
          <SearchTest onResultClick={handleSearchResultClick} />

          {/* Detailed Stats */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
            <button
              onClick={() => setExpandedSection(expandedSection === "stats" ? null : "stats")}
              className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
            >
              <h3 className="text-sm font-medium text-white">Distribución por Tipo</h3>
              <ChevronDown
                className={`w-4 h-4 text-white/50 transition-transform ${
                  expandedSection === "stats" ? "rotate-180" : ""
                }`}
              />
            </button>
            {expandedSection === "stats" && stats && (
              <div className="px-4 pb-4">
                <KnowledgeStatsDetailed
                  chunksByType={stats.chunks_by_type}
                  totalChunks={stats.total_chunks}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Chunks List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {typeFilters.map((filter) => {
              const Icon = filter.icon;
              const isActive = activeFilter === filter.value;
              const count = filter.value === "all"
                ? chunks.length
                : chunks.filter((c) => c.chunk_type === filter.value).length;

              if (filter.value !== "all" && count === 0) return null;

              return (
                <button
                  key={filter.value}
                  onClick={() => setActiveFilter(filter.value)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                    isActive
                      ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                      : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/10"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {filter.label}
                  <span className={`text-xs ${isActive ? "text-indigo-300" : "text-white/40"}`}>
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Chunks */}
          {filteredChunks.length === 0 ? (
            <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
              <Brain className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <p className="text-white/50">
                {activeFilter === "all"
                  ? "Sin conocimiento indexado aún"
                  : "No hay fragmentos de este tipo"}
              </p>
              <p className="text-sm text-white/30 mt-1">
                Sube archivos para que Runtu aprenda de tu negocio
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredChunks.map((chunk) => (
                <ChunkCard
                  key={chunk.id}
                  chunk={chunk}
                  showSource={true}
                  onViewFull={() => setSelectedChunk(chunk)}
                />
              ))}
            </div>
          )}

          {/* Load more indicator */}
          {filteredChunks.length >= 50 && (
            <p className="text-center text-sm text-white/40 py-4">
              Mostrando los primeros 50 fragmentos
            </p>
          )}
        </div>
      </div>

      {/* Chunk Modal */}
      <ChunkModal
        isOpen={!!selectedChunk}
        onClose={() => setSelectedChunk(null)}
        chunk={selectedChunk}
      />
    </div>
  );
}
