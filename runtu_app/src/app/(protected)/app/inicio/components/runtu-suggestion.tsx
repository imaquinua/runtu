"use client";

import Link from "next/link";
import { Sparkles, Upload } from "lucide-react";

export function RuntuSuggestion() {
  return (
    <div className="bg-gradient-to-r from-indigo-500/20 to-indigo-500/5 rounded-xl border border-indigo-500/30 p-5 md:p-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 p-2.5 bg-indigo-500/20 rounded-lg">
          <Sparkles className="w-5 h-5 text-indigo-400" />
        </div>
        <div className="flex-1">
          <p className="text-white font-medium mb-1">
            Tip de Runtu
          </p>
          <p className="text-white/60 text-sm mb-4">
            Sube un Excel de ventas y pregúntame cómo te fue. Te daré insights
            que no encontrarás solo mirando los números.
          </p>
          <Link
            href="/app/archivos"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
          >
            <Upload className="w-4 h-4" />
            Subir ahora
          </Link>
        </div>
      </div>
    </div>
  );
}
