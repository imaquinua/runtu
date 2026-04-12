"use client";

import { Sparkles } from "lucide-react";

interface StreamingMessageProps {
  content: string;
  isStreaming?: boolean;
}

export function StreamingMessage({ content, isStreaming = true }: StreamingMessageProps) {
  return (
    <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-indigo-500/20">
        <Sparkles className="w-4 h-4 text-indigo-400" />
      </div>

      {/* Message Content */}
      <div className="max-w-[80%]">
        <div className="bg-slate-800/80 text-slate-100 rounded-2xl rounded-bl-md border border-slate-700/50 px-4 py-3">
          <div className="text-sm whitespace-pre-wrap leading-relaxed">
            {content}
            {/* Cursor parpadeante */}
            {isStreaming && (
              <span className="inline-block w-2 h-4 ml-1 bg-indigo-400 animate-pulse rounded-sm" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
