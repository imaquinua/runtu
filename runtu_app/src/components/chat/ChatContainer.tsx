"use client";

import { useRef, useEffect } from "react";
import type { Message } from "@/types/chat";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { StreamingMessage } from "./StreamingMessage";
import { EmptyChat } from "./EmptyChat";
import { FollowUpSuggestions } from "./FollowUpSuggestions";

interface ChatContainerProps {
  messages: Message[];
  isLoading: boolean;
  isStreaming?: boolean;
  streamingText?: string;
  onSuggestionClick: (suggestion: string) => void;
  followUpSuggestions?: string[];
  isLoadingFollowUps?: boolean;
}

export function ChatContainer({
  messages,
  isLoading,
  isStreaming = false,
  streamingText = "",
  onSuggestionClick,
  followUpSuggestions = [],
  isLoadingFollowUps = false,
}: ChatContainerProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive or streaming updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, isStreaming, streamingText, followUpSuggestions]);

  // Empty state
  if (messages.length === 0 && !isLoading && !isStreaming) {
    return <EmptyChat onSuggestionClick={onSuggestionClick} />;
  }

  // Check if last message is from assistant
  const lastMessage = messages[messages.length - 1];
  const showFollowUps =
    !isLoading &&
    !isStreaming &&
    lastMessage?.role === "assistant" &&
    (followUpSuggestions.length > 0 || isLoadingFollowUps);

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
            isLast={index === messages.length - 1 && !isLoading && !isStreaming}
          />
        ))}

        {/* Follow-up suggestions after assistant response */}
        {showFollowUps && (
          <FollowUpSuggestions
            suggestions={followUpSuggestions}
            onSelect={onSuggestionClick}
            isLoading={isLoadingFollowUps}
          />
        )}

        {/* Streaming message */}
        {isStreaming && streamingText && (
          <StreamingMessage content={streamingText} isStreaming={true} />
        )}

        {/* Loading indicator (before streaming starts) */}
        {isLoading && !isStreaming && <TypingIndicator />}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
