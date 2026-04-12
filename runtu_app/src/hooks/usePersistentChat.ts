"use client";

// ============================================
// Persistent Chat Hook
// ============================================
// Hook para chat con streaming y persistencia en BD

import { useState, useCallback, useRef, useEffect } from "react";
import type { Message } from "@/types/chat";
import type { Conversation } from "@/lib/db/conversations";

interface UsePersistentChatOptions {
  conversationId?: string;
  onConversationCreated?: (conversation: Conversation) => void;
  onTitleGenerated?: (title: string) => void;
}

interface UsePersistentChatReturn {
  conversation: Conversation | null;
  messages: Message[];
  streamingText: string;
  isStreaming: boolean;
  isLoading: boolean;
  error: string | null;
  sendMessage: (text: string) => Promise<void>;
  cancelStream: () => void;
  loadConversation: (id: string) => Promise<void>;
  clearChat: () => void;
}

export function usePersistentChat(
  options: UsePersistentChatOptions = {}
): UsePersistentChatReturn {
  const { conversationId, onConversationCreated, onTitleGenerated } = options;

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const isFirstExchangeRef = useRef(true);

  // Cargar conversación existente
  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId);
    }
  }, [conversationId]);

  const loadConversation = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/conversations/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error cargando conversación");
      }

      setConversation(data.conversation);
      setMessages(
        data.conversation.messages.map((m: { id: string; role: "user" | "assistant"; content: string; created_at: string }) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          createdAt: new Date(m.created_at),
        }))
      );
      isFirstExchangeRef.current = data.conversation.messages.length === 0;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createConversation = useCallback(async (): Promise<Conversation> => {
    const response = await fetch("/api/conversations", { method: "POST" });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Error creando conversación");
    }

    setConversation(data.conversation);
    onConversationCreated?.(data.conversation);
    return data.conversation;
  }, [onConversationCreated]);

  const saveMessage = useCallback(
    async (
      convId: string,
      role: "user" | "assistant",
      content: string
    ): Promise<Message> => {
      const response = await fetch(`/api/conversations/${convId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, content }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error guardando mensaje");
      }

      return {
        ...data.message,
        createdAt: new Date(data.message.created_at),
      };
    },
    []
  );

  const generateTitle = useCallback(
    async (convId: string, userMessage: string, assistantResponse: string) => {
      try {
        const response = await fetch(`/api/conversations/${convId}/title`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userMessage, assistantResponse }),
        });

        const data = await response.json();

        if (response.ok && data.title) {
          setConversation((prev) =>
            prev ? { ...prev, title: data.title } : prev
          );
          onTitleGenerated?.(data.title);
        }
      } catch (err) {
        console.error("[Chat] Error generating title:", err);
      }
    },
    [onTitleGenerated]
  );

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreaming || isLoading) return;

      const trimmedText = text.trim();
      setError(null);
      setIsLoading(true);
      setStreamingText("");

      let convId = conversation?.id;
      const wasFirstExchange = isFirstExchangeRef.current;

      try {
        // Crear conversación si no existe
        if (!convId) {
          const newConv = await createConversation();
          convId = newConv.id;
        }

        // Guardar mensaje del usuario en BD
        const userMessage = await saveMessage(convId, "user", trimmedText);
        setMessages((prev) => [...prev, userMessage]);

        // Crear AbortController
        abortControllerRef.current = new AbortController();

        // Preparar historial para la API
        const history = messages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        // Llamar API de streaming
        const response = await fetch("/api/chat/stream-manual", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmedText, history }),
          signal: abortControllerRef.current.signal,
        });

        // Verificar si es JSON (sin conocimiento o error)
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          const data = await response.json();

          if (data.error) {
            throw new Error(data.error);
          }

          // Guardar respuesta en BD
          const assistantMessage = await saveMessage(
            convId,
            "assistant",
            data.content
          );
          setMessages((prev) => [...prev, assistantMessage]);

          // Generar título si es primer intercambio
          if (wasFirstExchange) {
            isFirstExchangeRef.current = false;
            generateTitle(convId, trimmedText, data.content);
          }

          return;
        }

        // Procesar stream SSE
        setIsLoading(false);
        setIsStreaming(true);

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No se pudo leer la respuesta");

        const decoder = new TextDecoder();
        let fullText = "";
        let streamSources: { id: string; name: string; type: string; preview: string }[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);

              if (data === "[DONE]") {
                break;
              }

              try {
                const parsed = JSON.parse(data);
                // Capturar fuentes enviadas al inicio
                if (parsed.sources) {
                  streamSources = parsed.sources;
                }
                if (parsed.text) {
                  fullText += parsed.text;
                  setStreamingText(fullText);
                }
                if (parsed.error) {
                  throw new Error(parsed.error);
                }
              } catch {
                // Ignorar líneas que no son JSON válido
              }
            }
          }
        }

        // Guardar respuesta completa en BD (sin sources por ahora, se parsean del contenido)
        const assistantMessage = await saveMessage(convId, "assistant", fullText);
        // Agregar mensaje con fuentes al state local
        setMessages((prev) => [...prev, { ...assistantMessage, sources: streamSources }]);

        // Generar título si es primer intercambio
        if (wasFirstExchange) {
          isFirstExchangeRef.current = false;
          generateTitle(convId, trimmedText, fullText);
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          // Cancelado por el usuario
          if (streamingText && convId) {
            const partialContent = streamingText + "\n\n_(Respuesta cancelada)_";
            const partialMessage = await saveMessage(
              convId,
              "assistant",
              partialContent
            );
            setMessages((prev) => [...prev, partialMessage]);
          }
          return;
        }

        const errorMessage =
          err instanceof Error ? err.message : "Error desconocido";
        setError(errorMessage);

        // Agregar mensaje de error (no guardado en BD)
        const errorMsg: Message = {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: `Lo siento, tuve un problema: ${errorMessage}\n\n¿Puedes intentar de nuevo?`,
          createdAt: new Date(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
        setIsStreaming(false);
        setStreamingText("");
        abortControllerRef.current = null;
      }
    },
    [
      conversation,
      messages,
      isStreaming,
      isLoading,
      streamingText,
      createConversation,
      saveMessage,
      generateTitle,
    ]
  );

  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const clearChat = useCallback(() => {
    setConversation(null);
    setMessages([]);
    setStreamingText("");
    setError(null);
    isFirstExchangeRef.current = true;
  }, []);

  return {
    conversation,
    messages,
    streamingText,
    isStreaming,
    isLoading,
    error,
    sendMessage,
    cancelStream,
    loadConversation,
    clearChat,
  };
}
