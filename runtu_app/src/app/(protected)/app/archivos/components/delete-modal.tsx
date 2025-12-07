"use client";

import { AlertTriangle, X } from "lucide-react";
import type { FileItem } from "../page";

interface DeleteModalProps {
  file: FileItem | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteModal({ file, onClose, onConfirm }: DeleteModalProps) {
  if (!file) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-slate-900 border border-white/10 rounded-xl w-full max-w-md p-6 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="mx-auto w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6 text-red-400" />
        </div>

        {/* Content */}
        <h2 className="text-xl font-semibold text-white text-center mb-2">
          Eliminar archivo
        </h2>
        <p className="text-white/60 text-center mb-2">
          ¿Estás seguro de que deseas eliminar este archivo?
        </p>
        <p className="text-white font-medium text-center mb-6 truncate px-4">
          {file.name}
        </p>

        {/* Warning */}
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-6">
          <p className="text-red-400 text-sm text-center">
            Esta acción no se puede deshacer. El archivo y sus datos procesados
            serán eliminados permanentemente.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 bg-white/5 hover:bg-white/10 text-white font-medium rounded-lg border border-white/10 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg transition-colors"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
