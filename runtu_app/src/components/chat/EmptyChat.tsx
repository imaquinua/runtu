"use client";

import { Sparkles, MessageCircle } from "lucide-react";

interface EmptyChatProps {
  onSuggestionClick: (suggestion: string) => void;
}

const suggestions = [
  "¿Cómo me fue esta semana?",
  "¿Cuáles son mis principales gastos?",
  "Resume mis últimas ventas",
  "¿Qué debería mejorar?",
];

export function EmptyChat({ onSuggestionClick }: EmptyChatProps) {
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

      {/* Suggestions */}
      <div className="w-full max-w-md">
        <p className="text-xs text-slate-500 mb-3 uppercase tracking-wide">
          Prueba preguntando
        </p>
        <div className="flex flex-col gap-2">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => onSuggestionClick(suggestion)}
              className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-sm text-slate-300 hover:bg-slate-700/50 hover:border-indigo-500/30 hover:text-white transition-all text-left group"
            >
              <span className="opacity-70 group-hover:opacity-100 transition-opacity">
                {suggestion}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
