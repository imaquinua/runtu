"use client";

import { useRef, useEffect } from "react";
import type { Message } from "@/types/chat";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { EmptyChat } from "./EmptyChat";

interface ChatContainerProps {
  messages: Message[];
  isLoading: boolean;
  onSuggestionClick: (suggestion: string) => void;
}

export function ChatContainer({
  messages,
  isLoading,
  onSuggestionClick,
}: ChatContainerProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Empty state
  if (messages.length === 0 && !isLoading) {
    return <EmptyChat onSuggestionClick={onSuggestionClick} />;
  }

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto px-4 md:px-6 lg:px-8 py-4"
    >
      <div className="max-w-3xl mx-auto space-y-4">
        {messages.map((message, index) => (
          <MessageBubble
            key={message.id}
            message={message}
            isLast={index === messages.length - 1 && !isLoading}
          />
        ))}

        {/* Loading indicator */}
        {isLoading && <TypingIndicator />}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
