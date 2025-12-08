"use client";

import { Sparkles } from "lucide-react";

export function TypingIndicator() {
  return (
    <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-indigo-500/20">
        <Sparkles className="w-4 h-4 text-indigo-400" />
      </div>
      <div className="bg-slate-800/80 border border-slate-700/50 rounded-2xl rounded-bl-md px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <span
              className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
              style={{ animationDelay: "0ms", animationDuration: "600ms" }}
            />
            <span
              className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
              style={{ animationDelay: "150ms", animationDuration: "600ms" }}
            />
            <span
              className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
              style={{ animationDelay: "300ms", animationDuration: "600ms" }}
            />
          </div>
          <span className="text-xs text-slate-400 ml-1">Runtu está pensando...</span>
        </div>
      </div>
    </div>
  );
}
