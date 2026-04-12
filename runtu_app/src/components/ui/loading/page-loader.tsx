"use client";

import { Loader2 } from "lucide-react";

interface PageLoaderProps {
  message?: string;
}

export function PageLoader({ message = "Cargando..." }: PageLoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] py-12">
      <div className="relative">
        {/* Outer glow */}
        <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-xl animate-pulse" />

        {/* Spinner container */}
        <div className="relative w-16 h-16 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        </div>
      </div>

      <p className="mt-6 text-white/60 text-sm animate-pulse">{message}</p>
    </div>
  );
}
