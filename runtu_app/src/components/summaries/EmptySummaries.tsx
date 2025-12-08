"use client";

import { BarChart3, Sparkles } from "lucide-react";

interface EmptySummariesProps {
  onGenerate: () => void;
  isGenerating?: boolean;
}

export function EmptySummaries({ onGenerate, isGenerating }: EmptySummariesProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {/* Icon */}
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
          <BarChart3 className="w-10 h-10 text-indigo-400" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
      </div>

      {/* Text */}
      <h3 className="text-xl font-semibold text-white mb-2">
        Aún no hay resúmenes
      </h3>
      <p className="text-white/50 max-w-md mb-6">
        Runtu preparará tu primer resumen el próximo lunes,
        analizando toda la información que has subido.
      </p>

      {/* Explanation */}
      <div className="bg-white/5 rounded-xl p-4 max-w-sm mb-6 text-left">
        <p className="text-sm text-white/60">
          <span className="text-indigo-400 font-medium">Los resúmenes automáticos</span>{" "}
          te ayudan a entender qué está pasando en tu negocio sin tener que revisar
          cada archivo. Se generan automáticamente cada semana y cada mes.
        </p>
      </div>

      {/* CTA */}
      <button
        onClick={onGenerate}
        disabled={isGenerating}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-medium rounded-lg transition-colors"
      >
        {isGenerating ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Generando...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Generar mi primer resumen
          </>
        )}
      </button>

      <p className="text-xs text-white/30 mt-3">
        Esto puede tomar unos segundos
      </p>
    </div>
  );
}
