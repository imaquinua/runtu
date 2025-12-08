"use client";

import { WifiOff, X } from "lucide-react";
import { useState, useEffect } from "react";

export function OfflineNotice() {
  const [isOffline, setIsOffline] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check initial state
    setIsOffline(!navigator.onLine);

    const handleOnline = () => {
      setIsOffline(false);
      setDismissed(false); // Reset dismissed when back online
    };

    const handleOffline = () => {
      setIsOffline(true);
      setDismissed(false); // Show again when going offline
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline || dismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-yellow-500/10 border border-yellow-500/30 backdrop-blur-lg rounded-xl p-4 shadow-xl">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <WifiOff className="w-5 h-5 text-yellow-400" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className="text-yellow-400 font-medium mb-0.5">
              Sin conexión
            </h4>
            <p className="text-white/50 text-sm">
              Verifica tu conexión a internet
            </p>
          </div>

          {/* Dismiss */}
          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded-lg hover:bg-yellow-500/20 text-yellow-400/60 hover:text-yellow-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Animated indicator */}
        <div className="mt-3 flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
            <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: "150ms" }} />
            <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: "300ms" }} />
          </div>
          <span className="text-yellow-400/60 text-xs">Esperando conexión...</span>
        </div>
      </div>
    </div>
  );
}
