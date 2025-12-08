"use client";

// ============================================
// Streaming Chat Hook - Opción B: Manual
// ============================================
// Hook para chat con streaming manual (más control)

import { useState, useCallback, useRef } from "react";
import type { Message, Source } from "@/types/chat";

interface UseStreamingChatOptions {
  /** URL del endpoint de streaming */
  endpoint?: string;
  /** Callback cuando se completa un mensaje */
  onComplete?: (message: Message) => void;
  /** Callback cuando hay error */
  onError?: (error: Error) => void;
}

interface UseStreamingChatReturn {
  /** Lista de mensajes */
  messages: Message[];
  /** Texto siendo generado actualmente */
  streamingText: string;
  /** Si está generando respuesta */
  isStreaming: boolean;
  /** Si está cargando (antes del stream) */
  isLoading: boolean;
  /** Error actual */
  error: string | null;
  /** Enviar mensaje */
  sendMessage: (text: string) => Promise<void>;
  /** Cancelar streaming actual */
  cancelStream: () => void;
  /** Limpiar mensajes */
  clearMessages: () => void;
  /** Reintentar último mensaje */
  retry: () => Promise<void>;
}

export function useStreamingChat(
  options: UseStreamingChatOptions = {}
): UseStreamingChatReturn {
  const { endpoint = "/api/chat/stream-manual", onComplete, onError } = options;

  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const lastMessageRef = useRef<string>("");

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreaming || isLoading) return;

      const trimmedText = text.trim();
      lastMessageRef.current = trimmedText;

      // Agregar mensaje del usuario
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: trimmedText,
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setError(null);
      setIsLoading(true);
      setStreamingText("");

      // Crear AbortController para cancelación
      abortControllerRef.current = new AbortController();

      try {
        // Preparar historial
        const history = messages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmedText, history }),
          signal: abortControllerRef.current.signal,
        });

        // Verificar si es respuesta JSON (sin conocimiento o error)
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          const data = await response.json();

          if (data.error) {
            throw new Error(data.error);
          }

          // Respuesta sin streaming (ej: sin conocimiento)
          const assistantMessage: Message = {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: data.content,
            sources: data.sources,
            createdAt: new Date(),
          };

          setMessages((prev) => [...prev, assistantMessage]);
          onComplete?.(assistantMessage);
          return;
        }

        // Procesar stream SSE
        setIsLoading(false);
        setIsStreaming(true);

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No se pudo leer la respuesta");

        const decoder = new TextDecoder();
        let fullText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);

              if (data === "[DONE]") {
                // Stream completado
                break;
              }

              try {
                const parsed = JSON.parse(data);
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

        // Agregar mensaje completo
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: fullText,
          createdAt: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
        onComplete?.(assistantMessage);

      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          // Cancelado por el usuario - guardar texto parcial si existe
          if (streamingText) {
            const partialMessage: Message = {
              id: `assistant-${Date.now()}`,
              role: "assistant",
              content: streamingText + "\n\n_(Respuesta cancelada)_",
              createdAt: new Date(),
            };
            setMessages((prev) => [...prev, partialMessage]);
          }
          return;
        }

        const errorMessage =
          err instanceof Error ? err.message : "Error desconocido";
        setError(errorMessage);
        onError?.(err instanceof Error ? err : new Error(errorMessage));

        // Agregar mensaje de error
        const errorAssistantMessage: Message = {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: `Lo siento, tuve un problema: ${errorMessage}\n\n¿Puedes intentar de nuevo?`,
          createdAt: new Date(),
        };
        setMessages((prev) => [...prev, errorAssistantMessage]);

      } finally {
        setIsLoading(false);
        setIsStreaming(false);
        setStreamingText("");
        abortControllerRef.current = null;
      }
    },
    [endpoint, messages, isStreaming, isLoading, streamingText, onComplete, onError]
  );

  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setStreamingText("");
    setError(null);
  }, []);

  const retry = useCallback(async () => {
    if (lastMessageRef.current) {
      // Eliminar el último mensaje de error si existe
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.id.startsWith("error-")) {
          return prev.slice(0, -1);
        }
        return prev;
      });

      // Eliminar el mensaje del usuario anterior
      setMessages((prev) => prev.slice(0, -1));

      // Reintentar
      await sendMessage(lastMessageRef.current);
    }
  }, [sendMessage]);

  return {
    messages,
    streamingText,
    isStreaming,
    isLoading,
    error,
    sendMessage,
    cancelStream,
    clearMessages,
    retry,
  };
}
