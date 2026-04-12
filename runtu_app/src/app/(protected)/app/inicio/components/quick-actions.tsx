"use client";

import Link from "next/link";
import { Upload, MessageCircle } from "lucide-react";

export function QuickActions() {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <Link
        href="/app/archivos"
        className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 px-5 rounded-xl transition-colors shadow-lg shadow-indigo-500/25"
      >
        <Upload className="w-5 h-5" />
        Subir archivo
      </Link>
      <Link
        href="/app/chat"
        className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white font-medium py-3 px-5 rounded-xl border border-indigo-500/50 hover:border-indigo-400 transition-colors"
      >
        <MessageCircle className="w-5 h-5" />
        Preguntarle a Runtu
      </Link>
    </div>
  );
}
