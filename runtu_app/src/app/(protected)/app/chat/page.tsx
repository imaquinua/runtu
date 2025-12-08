"use client";

import { useState, useCallback } from "react";
import type { Message, Source } from "@/types/chat";
import { ChatContainer, ChatInput } from "@/components/chat";

interface ChatHistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      // Preparar historial para la API (últimos 10 mensajes)
      const history: ChatHistoryMessage[] = messages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage.content,
          history,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al procesar el mensaje");
      }

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.content,
        sources: data.sources as Source[],
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";

      setError(errorMessage);

      // Agregar mensaje de error como respuesta del asistente
      const errorAssistantMessage: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: `Lo siento, tuve un problema: ${errorMessage}\n\n¿Puedes intentar de nuevo?`,
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, errorAssistantMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages]);

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
          onSuggestionClick={handleSuggestionClick}
        />
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="flex-shrink-0 border-t border-slate-800/50 bg-slate-900/50 backdrop-blur-sm px-4 md:px-6 lg:px-8 py-4">
        <div className="max-w-3xl mx-auto">
          <ChatInput
            value={input}
            onChange={setInput}
            onSend={handleSend}
            disabled={isLoading}
          />
          <p className="text-xs text-slate-500 mt-2 text-center">
            {error ? (
              <span className="text-red-400">{error}</span>
            ) : (
              "Runtu usa tu información para darte respuestas personalizadas"
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
