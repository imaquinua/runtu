"use client";

import { FolderOpen, Upload, SearchX } from "lucide-react";

interface EmptyStateProps {
  hasSearch: boolean;
}

export function EmptyState({ hasSearch }: EmptyStateProps) {
  if (hasSearch) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
          <SearchX className="w-8 h-8 text-white/30" />
        </div>
        <h3 className="text-white font-semibold mb-2">
          No se encontraron archivos
        </h3>
        <p className="text-white/50 text-sm max-w-sm mx-auto">
          Intenta con otro término de búsqueda o cambia los filtros aplicados.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
      <div className="mx-auto w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mb-4">
        <FolderOpen className="w-8 h-8 text-indigo-400" />
      </div>
      <h3 className="text-white font-semibold mb-2">
        Tu biblioteca está vacía
      </h3>
      <p className="text-white/50 text-sm max-w-sm mx-auto mb-6">
        Sube documentos, imágenes, audios o videos para que Runtu pueda ayudarte
        a analizarlos y responder tus preguntas.
      </p>
      <button className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 px-4 rounded-lg transition-colors">
        <Upload className="w-4 h-4" />
        Subir primer archivo
      </button>
    </div>
  );
}
