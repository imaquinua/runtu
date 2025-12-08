"use client";

import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { useRouter } from "next/navigation";

interface ErrorPageProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  showHomeButton?: boolean;
}

export function ErrorPage({
  title = "Algo salió mal",
  message = "No pudimos cargar esta página. Por favor, intenta de nuevo.",
  onRetry,
  showHomeButton = true,
}: ErrorPageProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] py-12 px-4">
      {/* Illustration */}
      <div className="relative mb-6">
        <div className="w-24 h-24 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-2xl flex items-center justify-center">
          <AlertTriangle className="w-12 h-12 text-red-400" />
        </div>
        {/* Decorative elements */}
        <div className="absolute -top-2 right-0 w-3 h-3 bg-red-400/30 rounded-full animate-pulse" />
        <div className="absolute bottom-0 -left-2 w-2 h-2 bg-orange-400/30 rounded-full animate-pulse" style={{ animationDelay: "500ms" }} />
      </div>

      {/* Text */}
      <h2 className="text-2xl font-bold text-white mb-2 text-center">{title}</h2>
      <p className="text-white/50 text-center max-w-md mb-8">{message}</p>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </button>
        )}

        {showHomeButton && (
          <button
            onClick={() => router.push("/app/inicio")}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white/80 font-medium rounded-lg border border-white/10 transition-colors"
          >
            <Home className="w-4 h-4" />
            Volver al inicio
          </button>
        )}
      </div>
    </div>
  );
}
