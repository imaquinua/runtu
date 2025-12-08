"use client";

import { useState } from "react";
import { Sparkles, User, Info } from "lucide-react";
import type { Message, Source } from "@/types/chat";
import { SourcesList } from "./SourcesList";
import { SourceModal } from "./SourceModal";

interface MessageBubbleProps {
  message: Message;
  isLast: boolean;
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "ahora";
  if (diffMins < 60) return `hace ${diffMins} min`;
  if (diffHours < 24) return `hace ${diffHours}h`;
  if (diffDays < 7) return `hace ${diffDays}d`;

  return date.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

export function MessageBubble({ message, isLast }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);

  const hasSources = message.sources && message.sources.length > 0;

  return (
    <>
      <div
        className={`flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 ${
          isUser ? "justify-end" : "justify-start"
        }`}
      >
        {/* Assistant Avatar */}
        {!isUser && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-indigo-500/20">
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
        )}

        {/* Message Content */}
        <div className={`max-w-[80%] ${isUser ? "items-end" : "items-start"}`}>
          <div
            className={`px-4 py-3 rounded-2xl ${
              isUser
                ? "bg-indigo-600 text-white rounded-br-md"
                : "bg-slate-800/80 text-slate-100 rounded-bl-md border border-slate-700/50"
            }`}
          >
            <p className="text-sm whitespace-pre-wrap leading-relaxed">
              {message.content}
            </p>
          </div>

          {/* Sources Section - only for assistant messages */}
          {!isUser && hasSources && (
            <SourcesList
              sources={message.sources!}
              onSourceClick={setSelectedSource}
            />
          )}

          {/* General response indicator (no sources) */}
          {!isUser && !hasSources && message.content && !message.content.includes("no tengo información") && (
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
              <Info className="w-3 h-3" />
              <span>Respuesta general</span>
            </div>
          )}

          {/* Timestamp - only show on last message */}
          {isLast && (
            <p
              className={`text-[10px] text-slate-500 mt-1 px-1 ${
                isUser ? "text-right" : "text-left"
              }`}
            >
              {formatTimeAgo(message.createdAt)}
            </p>
          )}
        </div>

        {/* User Avatar */}
        {isUser && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600/20 flex items-center justify-center border border-indigo-500/30">
            <User className="w-4 h-4 text-indigo-400" />
          </div>
        )}
      </div>

      {/* Source Modal */}
      {selectedSource && (
        <SourceModal
          source={selectedSource}
          onClose={() => setSelectedSource(null)}
        />
      )}
    </>
  );
}
