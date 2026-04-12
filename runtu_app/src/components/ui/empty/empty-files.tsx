"use client";

import { Upload, FolderOpen } from "lucide-react";

interface EmptyFilesProps {
  onUpload?: () => void;
}

export function EmptyFiles({ onUpload }: EmptyFilesProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {/* Illustration */}
      <div className="relative mb-6">
        <div className="w-24 h-24 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center">
          <FolderOpen className="w-12 h-12 text-indigo-400" />
        </div>
        {/* Decorative dots */}
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400/30 rounded-full" />
        <div className="absolute -bottom-1 -left-3 w-3 h-3 bg-green-400/30 rounded-full" />
      </div>

      {/* Text */}
      <h3 className="text-xl font-semibold text-white mb-2">
        No hay archivos aún
      </h3>
      <p className="text-white/50 text-center max-w-sm mb-6">
        Sube tu primer archivo para que Runtu empiece a conocer tu negocio
      </p>

      {/* CTA Button */}
      {onUpload && (
        <button
          onClick={onUpload}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors shadow-lg shadow-indigo-500/25"
        >
          <Upload className="w-4 h-4" />
          Subir archivo
        </button>
      )}
    </div>
  );
}
