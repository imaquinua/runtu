"use client";

import { Sparkles, MessageCircle } from "lucide-react";
import { SuggestedQuestions } from "./SuggestedQuestions";

interface EmptyChatProps {
  onSuggestionClick: (suggestion: string) => void;
  hasRecentUploads?: boolean;
}

export function EmptyChat({ onSuggestionClick, hasRecentUploads }: EmptyChatProps) {
  // Determinar contexto para sugerencias inteligentes
  const now = new Date();
  const isMonday = now.getDay() === 1;
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const isEndOfMonth = dayOfMonth >= daysInMonth - 2;

  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-4">
      {/* Icon */}
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-6 border border-indigo-500/20 relative">
        <Sparkles className="w-10 h-10 text-indigo-400" />
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-900 border border-indigo-500/30 flex items-center justify-center">
          <MessageCircle className="w-3 h-3 text-indigo-400" />
        </div>
      </div>

      {/* Greeting */}
      <h2 className="text-2xl font-semibold text-white mb-2">
        ¡Hola! Soy Runtu
      </h2>
      <p className="text-slate-400 text-sm mb-8 max-w-sm">
        Pregúntame lo que quieras sobre tu negocio. Uso la información que me
        compartes para darte respuestas personalizadas.
      </p>

      {/* Smart Suggestions */}
      <SuggestedQuestions
        onSelect={onSuggestionClick}
        hasRecentUploads={hasRecentUploads}
        isMonday={isMonday}
        isEndOfMonth={isEndOfMonth}
      />
    </div>
  );
}
