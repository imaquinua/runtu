"use client";

import { Search, X } from "lucide-react";

interface EmptySearchProps {
  query: string;
  onClear?: () => void;
}

export function EmptySearch({ query, onClear }: EmptySearchProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      {/* Illustration */}
      <div className="relative mb-5">
        <div className="w-16 h-16 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl flex items-center justify-center">
          <Search className="w-8 h-8 text-orange-400/70" />
        </div>
        {/* X decoration */}
        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center">
          <X className="w-3 h-3 text-red-400" />
        </div>
      </div>

      {/* Text */}
      <h3 className="text-lg font-medium text-white/80 mb-1">
        No encontramos resultados
      </h3>
      <p className="text-white/40 text-sm text-center max-w-xs mb-4">
        No hay archivos que coincidan con{" "}
        <span className="text-white/60 font-medium">"{query}"</span>
      </p>
      <p className="text-white/30 text-xs mb-4">
        Intenta con otros términos de búsqueda
      </p>

      {/* Clear button */}
      {onClear && (
        <button
          onClick={onClear}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white/70 text-sm font-medium rounded-lg border border-white/10 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          Limpiar búsqueda
        </button>
      )}
    </div>
  );
}
