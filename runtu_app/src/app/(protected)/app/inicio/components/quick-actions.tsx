"use client";

import Link from "next/link";
import { Upload, MessageCircle } from "lucide-react";

export function QuickActions() {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <Link
        href="/app/archivos"
        className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-5 rounded-xl transition-colors shadow-sm"
      >
        <Upload className="w-5 h-5" />
        Subir archivo
      </Link>
      <Link
        href="/app/chat"
        className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-indigo-600 font-medium py-3 px-5 rounded-xl border-2 border-indigo-600 transition-colors"
      >
        <MessageCircle className="w-5 h-5" />
        Preguntarle a Runtu
      </Link>
    </div>
  );
}
