"use client";

import { useState, useCallback } from "react";
import { Square } from "lucide-react";
import { ChatContainer, ChatInput } from "@/components/chat";
import { useStreamingChat } from "@/hooks/useStreamingChat";

export default function ChatPage() {
  const [input, setInput] = useState("");

  const {
    messages,
    streamingText,
    isStreaming,
    isLoading,
    error,
    sendMessage,
    cancelStream,
  } = useStreamingChat({
    endpoint: "/api/chat/stream-manual",
  });

  const handleSend = useCallback(async () => {
    if (!input.trim() || isStreaming || isLoading) return;
    const text = input;
    setInput("");
    await sendMessage(text);
  }, [input, isStreaming, isLoading, sendMessage]);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setInput(suggestion);
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-5rem)] -m-4 md:-m-6 lg:-m-8">
      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <ChatContainer
          messages={messages}
          isLoading={isLoading}
          isStreaming={isStreaming}
          streamingText={streamingText}
          onSuggestionClick={handleSuggestionClick}
        />
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="flex-shrink-0 border-t border-slate-800/50 bg-slate-900/50 backdrop-blur-sm px-4 md:px-6 lg:px-8 py-4">
        <div className="max-w-3xl mx-auto">
          {/* Cancel button during streaming */}
          {isStreaming && (
            <div className="flex justify-center mb-3">
              <button
                onClick={cancelStream}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition-colors"
              >
                <Square className="w-4 h-4" />
                Detener
              </button>
            </div>
          )}

          <ChatInput
            value={input}
            onChange={setInput}
            onSend={handleSend}
            disabled={isStreaming || isLoading}
          />

          <p className="text-xs text-slate-500 mt-2 text-center">
            {error ? (
              <span className="text-red-400">{error}</span>
            ) : isStreaming ? (
              <span className="text-indigo-400">Generando respuesta...</span>
            ) : (
              "Runtu usa tu información para darte respuestas personalizadas"
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
