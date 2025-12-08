"use client";

import { Clock, Sparkles } from "lucide-react";

export function EmptyActivity() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      {/* Illustration */}
      <div className="relative mb-5">
        <div className="w-16 h-16 bg-gradient-to-br from-slate-500/20 to-slate-600/20 rounded-xl flex items-center justify-center">
          <Clock className="w-8 h-8 text-white/40" />
        </div>
        {/* Sparkle decoration */}
        <div className="absolute -top-1 -right-1">
          <Sparkles className="w-4 h-4 text-yellow-400/50" />
        </div>
      </div>

      {/* Text */}
      <h3 className="text-lg font-medium text-white/80 mb-1">
        Sin actividad reciente
      </h3>
      <p className="text-white/40 text-sm text-center max-w-xs">
        Cuando subas archivos o hagas preguntas, aparecerán aquí
      </p>
    </div>
  );
}
