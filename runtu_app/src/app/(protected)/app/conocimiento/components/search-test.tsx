"use client";

import { useState } from "react";
import {
  Search,
  Loader2,
  Sparkles,
  FileText,
  Table,
  Image,
  Mic,
  Video,
  StickyNote,
  Zap,
  Clock,
} from "lucide-react";
import type { ChunkType } from "@/types/database";

interface SearchResult {
  id: string;
  content: string;
  snippet: string;
  score: number;
  similarity: number;
  chunkType: ChunkType;
  source: {
    type: ChunkType;
    context: string | null;
    filename?: string;
  };
  matchedKeywords: string[];
}

interface SearchResponse {
  success: boolean;
  results: SearchResult[];
  metrics: {
    searchTimeMs: number;
    totalMatches: number;
    fromCache: boolean;
  };
  queryAnalysis?: {
    intent: string;
    category: string;
    keywords: string[];
  };
}

const typeIcons: Record<ChunkType, React.ElementType> = {
  document: FileText,
  spreadsheet: Table,
  image_analysis: Image,
  audio_transcript: Mic,
  video_analysis: Video,
  manual_note: StickyNote,
};

const typeColors: Record<ChunkType, string> = {
  document: "text-blue-400",
  spreadsheet: "text-green-400",
  image_analysis: "text-purple-400",
  audio_transcript: "text-orange-400",
  video_analysis: "text-pink-400",
  manual_note: "text-yellow-400",
};

export function SearchTest({ onResultClick }: { onResultClick?: (result: SearchResult) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<SearchResponse["metrics"] | null>(null);
  const [queryAnalysis, setQueryAnalysis] = useState<SearchResponse["queryAnalysis"] | null>(null);

  const handleSearch = async () => {
    if (!query.trim() || query.trim().length < 2) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          limit: 10,
          hybridSearch: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error en la búsqueda");
      }

      const data: SearchResponse = await response.json();
      setResults(data.results);
      setMetrics(data.metrics);
      setQueryAnalysis(data.queryAnalysis ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Format similarity as percentage
  const formatSimilarity = (score: number) => {
    return Math.round(score * 100);
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-medium text-white">Prueba de Búsqueda</h3>
        </div>
        <p className="text-xs text-white/50">
          Pregunta algo para ver cómo Runtu busca en tu conocimiento
        </p>
      </div>

      {/* Search Input */}
      <div className="p-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="¿Cuánto vendí el mes pasado?"
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 text-sm"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={isLoading || query.trim().length < 2}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            Buscar
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="border-t border-white/10">
          {/* Metrics */}
          {metrics && (
            <div className="px-4 py-2 bg-white/[0.02] flex items-center gap-4 text-xs text-white/50 border-b border-white/5">
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                {metrics.totalMatches} resultados
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {metrics.searchTimeMs}ms
              </div>
              {metrics.fromCache && (
                <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded text-[10px]">
                  Cache
                </span>
              )}
              {queryAnalysis && (
                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-white/30">Intent:</span>
                  <span className="text-white/60">{queryAnalysis.intent}</span>
                  <span className="text-white/30">•</span>
                  <span className="text-white/60">{queryAnalysis.category}</span>
                </div>
              )}
            </div>
          )}

          {/* Result Items */}
          <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
            {results.map((result) => {
              const Icon = typeIcons[result.chunkType] || FileText;
              const colorClass = typeColors[result.chunkType] || "text-white/60";
              const similarityPct = formatSimilarity(result.score);

              return (
                <button
                  key={result.id}
                  onClick={() => onResultClick?.(result)}
                  className="w-full text-left p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    {/* Icon & Score */}
                    <div className="shrink-0 flex flex-col items-center gap-1">
                      <div className="p-1.5 bg-white/5 rounded">
                        <Icon className={`w-4 h-4 ${colorClass}`} />
                      </div>
                      <div
                        className="text-[10px] font-medium"
                        style={{
                          color: similarityPct >= 80 ? "#22c55e" :
                                 similarityPct >= 60 ? "#eab308" :
                                 similarityPct >= 40 ? "#f97316" : "#ef4444"
                        }}
                      >
                        {similarityPct}%
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white/80 line-clamp-2">
                        {result.snippet}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-white/40">
                        {result.source.context && (
                          <span className="truncate max-w-[200px]">
                            {result.source.context}
                          </span>
                        )}
                        {result.matchedKeywords.length > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-indigo-400/80">
                              {result.matchedKeywords.slice(0, 3).join(", ")}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Score bar */}
                    <div className="shrink-0 w-16 hidden sm:block">
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${similarityPct}%`,
                            backgroundColor: similarityPct >= 80 ? "#22c55e" :
                                           similarityPct >= 60 ? "#eab308" :
                                           similarityPct >= 40 ? "#f97316" : "#ef4444"
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* No Results */}
      {!isLoading && results.length === 0 && query.length > 0 && !error && metrics && (
        <div className="p-8 text-center border-t border-white/10">
          <Search className="w-8 h-8 text-white/20 mx-auto mb-2" />
          <p className="text-sm text-white/50">No se encontraron resultados</p>
          <p className="text-xs text-white/30 mt-1">
            Intenta con otras palabras o sube más archivos
          </p>
        </div>
      )}
    </div>
  );
}
