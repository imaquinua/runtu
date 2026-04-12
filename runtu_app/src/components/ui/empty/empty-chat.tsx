"use client";

import { MessageSquare, Sparkles, TrendingUp, FileText, HelpCircle } from "lucide-react";

interface EmptyChatProps {
  onSuggestionClick?: (suggestion: string) => void;
}

const suggestions = [
  {
    icon: TrendingUp,
    text: "¿Cuánto vendí esta semana?",
    color: "text-green-400",
    bg: "bg-green-500/10 hover:bg-green-500/20",
  },
  {
    icon: FileText,
    text: "¿Qué dice mi último reporte?",
    color: "text-blue-400",
    bg: "bg-blue-500/10 hover:bg-blue-500/20",
  },
  {
    icon: HelpCircle,
    text: "¿Qué archivos tengo subidos?",
    color: "text-purple-400",
    bg: "bg-purple-500/10 hover:bg-purple-500/20",
  },
  {
    icon: Sparkles,
    text: "Dame un resumen de mi negocio",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10 hover:bg-yellow-500/20",
  },
];

export function EmptyChat({ onSuggestionClick }: EmptyChatProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 max-w-lg mx-auto">
      {/* Avatar / Illustration */}
      <div className="relative mb-6">
        <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <MessageSquare className="w-10 h-10 text-white" />
        </div>
        {/* Animated sparkle */}
        <div className="absolute -top-2 -right-2 animate-pulse">
          <Sparkles className="w-6 h-6 text-yellow-400" />
        </div>
      </div>

      {/* Greeting */}
      <h2 className="text-2xl font-bold text-white mb-2">
        ¡Hola! Soy Runtu
      </h2>
      <p className="text-white/50 text-center mb-8">
        Pregúntame lo que quieras sobre tu negocio
      </p>

      {/* Suggestions */}
      <div className="w-full space-y-2">
        <p className="text-white/30 text-xs uppercase tracking-wider mb-3 text-center">
          Prueba preguntando
        </p>
        {suggestions.map((suggestion, index) => {
          const Icon = suggestion.icon;
          return (
            <button
              key={index}
              onClick={() => onSuggestionClick?.(suggestion.text)}
              className={`w-full flex items-center gap-3 px-4 py-3 ${suggestion.bg} rounded-xl text-left transition-colors border border-transparent hover:border-white/10`}
            >
              <Icon className={`w-5 h-5 ${suggestion.color} flex-shrink-0`} />
              <span className="text-white/80 text-sm">{suggestion.text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
