"use client";

import Link from "next/link";
import { FileUp, FolderOpen } from "lucide-react";

export function NoKnowledge() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-4">
      {/* Icon */}
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mb-6 border border-amber-500/20">
        <FolderOpen className="w-10 h-10 text-amber-400" />
      </div>

      {/* Message */}
      <h2 className="text-xl font-semibold text-white mb-2">
        Aún no me has contado sobre tu negocio
      </h2>
      <p className="text-slate-400 text-sm mb-8 max-w-sm">
        Sube algunos archivos para que pueda conocer mejor tu negocio y darte
        respuestas más útiles.
      </p>

      {/* CTA */}
      <Link
        href="/app/subir"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
      >
        <FileUp className="w-5 h-5" />
        Subir archivos
      </Link>

      {/* Secondary link */}
      <Link
        href="/app/archivos"
        className="mt-4 text-sm text-slate-400 hover:text-indigo-400 transition-colors"
      >
        Ver mis archivos
      </Link>
    </div>
  );
}
