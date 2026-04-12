"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Square } from "lucide-react";
import {
  ChatContainer,
  ChatInput,
  ConversationSidebar,
} from "@/components/chat";
import { usePersistentChat } from "@/hooks/usePersistentChat";
import type { Conversation } from "@/lib/db/conversations";

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationId = searchParams.get("id") || undefined;

  const [input, setInput] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [followUpSuggestions, setFollowUpSuggestions] = useState<string[]>([]);
  const [isLoadingFollowUps, setIsLoadingFollowUps] = useState(false);
  const lastMessageIdRef = useRef<string | null>(null);

  const {
    conversation,
    messages,
    streamingText,
    isStreaming,
    isLoading,
    error,
    sendMessage,
    cancelStream,
    clearChat,
  } = usePersistentChat({
    conversationId,
    onConversationCreated: (newConv) => {
      // Agregar nueva conversación a la lista
      setConversations((prev) => [newConv, ...prev]);
      // Actualizar URL
      router.push(`/app/chat?id=${newConv.id}`, { scroll: false });
    },
    onTitleGenerated: (title) => {
      // Actualizar título en la lista
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversation?.id ? { ...c, title } : c
        )
      );
    },
  });

  // Cargar lista de conversaciones
  useEffect(() => {
    async function fetchConversations() {
      try {
        const response = await fetch("/api/conversations");
        const data = await response.json();
        if (response.ok) {
          setConversations(data.conversations || []);
        }
      } catch (err) {
        console.error("Error loading conversations:", err);
      } finally {
        setLoadingConversations(false);
      }
    }

    fetchConversations();
  }, []);

  // Generar follow-ups cuando hay nueva respuesta del asistente
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    const secondLastMessage = messages[messages.length - 2];

    // Solo generar si:
    // 1. Hay al menos 2 mensajes
    // 2. El último es del asistente
    // 3. Es un mensaje nuevo (diferente ID del anterior)
    // 4. No estamos en streaming o loading
    if (
      messages.length >= 2 &&
      lastMessage?.role === "assistant" &&
      secondLastMessage?.role === "user" &&
      lastMessage.id !== lastMessageIdRef.current &&
      !isStreaming &&
      !isLoading
    ) {
      lastMessageIdRef.current = lastMessage.id;
      generateFollowUps(secondLastMessage.content, lastMessage.content);
    }
  }, [messages, isStreaming, isLoading]);

  // Limpiar follow-ups cuando cambia de conversación
  useEffect(() => {
    setFollowUpSuggestions([]);
    lastMessageIdRef.current = null;
  }, [conversationId]);

  async function generateFollowUps(userMessage: string, assistantResponse: string) {
    setIsLoadingFollowUps(true);
    try {
      const response = await fetch("/api/chat/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lastUserMessage: userMessage,
          lastAssistantResponse: assistantResponse,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setFollowUpSuggestions(data.suggestions || []);
      }
    } catch (err) {
      console.error("Error generating follow-ups:", err);
    } finally {
      setIsLoadingFollowUps(false);
    }
  }

  const handleSend = useCallback(async () => {
    if (!input.trim() || isStreaming || isLoading) return;
    const text = input;
    setInput("");
    setFollowUpSuggestions([]); // Limpiar sugerencias al enviar
    await sendMessage(text);
  }, [input, isStreaming, isLoading, sendMessage]);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setInput(suggestion);
  }, []);

  const handleSelectConversation = useCallback(
    (id: string) => {
      router.push(`/app/chat?id=${id}`, { scroll: false });
    },
    [router]
  );

  const handleNewConversation = useCallback(() => {
    clearChat();
    router.push("/app/chat", { scroll: false });
  }, [clearChat, router]);

  const handleDeleteConversation = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`/api/conversations/${id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          setConversations((prev) => prev.filter((c) => c.id !== id));

          // Si es la conversación actual, limpiar
          if (id === conversation?.id) {
            clearChat();
            router.push("/app/chat", { scroll: false });
          }
        }
      } catch (err) {
        console.error("Error deleting conversation:", err);
      }
    },
    [conversation?.id, clearChat, router]
  );

  return (
    <div className="flex h-[calc(100vh-8rem)] md:h-[calc(100vh-5rem)] -m-4 md:-m-6 lg:-m-8">
      {/* Sidebar */}
      <ConversationSidebar
        conversations={conversations}
        currentId={conversation?.id}
        onSelect={handleSelectConversation}
        onNew={handleNewConversation}
        onDelete={handleDeleteConversation}
        isLoading={loadingConversations}
      />

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Messages Area */}
        <div className="flex-1 overflow-hidden">
          <ChatContainer
            messages={messages}
            isLoading={isLoading}
            isStreaming={isStreaming}
            streamingText={streamingText}
            onSuggestionClick={handleSuggestionClick}
            followUpSuggestions={followUpSuggestions}
            isLoadingFollowUps={isLoadingFollowUps}
          />
        </div>

        {/* Input Area */}
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
    </div>
  );
}
