"use client";

import { TrendingUp, Wallet, BarChart3, Lightbulb, Calendar, FileText, ShoppingCart, Target } from "lucide-react";

interface SuggestedQuestionsProps {
  onSelect: (question: string) => void;
  hasRecentUploads?: boolean;
  isMonday?: boolean;
  isEndOfMonth?: boolean;
}

interface Suggestion {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
  description?: string;
}

// Sugerencias base
const BASE_SUGGESTIONS: Suggestion[] = [
  {
    icon: TrendingUp,
    text: "¿Cómo me fue esta semana?",
    description: "Resumen de rendimiento",
  },
  {
    icon: Wallet,
    text: "¿Cuáles son mis principales gastos?",
    description: "Análisis de gastos",
  },
  {
    icon: BarChart3,
    text: "Resume mis últimas ventas",
    description: "Historial de ventas",
  },
  {
    icon: Lightbulb,
    text: "¿Qué tendencias ves en mi negocio?",
    description: "Insights y patrones",
  },
];

// Sugerencias contextuales
const CONTEXTUAL_SUGGESTIONS: Record<string, Suggestion> = {
  recentUploads: {
    icon: FileText,
    text: "¿Qué aprendiste de mis últimos archivos?",
    description: "Analizar nuevos datos",
  },
  monday: {
    icon: Calendar,
    text: "¿Cómo me fue la semana pasada?",
    description: "Resumen semanal",
  },
  endOfMonth: {
    icon: Target,
    text: "Resume cómo me fue este mes",
    description: "Cierre mensual",
  },
  sales: {
    icon: ShoppingCart,
    text: "¿Cuál es mi producto más vendido?",
    description: "Top ventas",
  },
};

function getSmartSuggestions(props: SuggestedQuestionsProps): Suggestion[] {
  const suggestions: Suggestion[] = [];

  // Agregar contextuales primero
  if (props.hasRecentUploads) {
    suggestions.push(CONTEXTUAL_SUGGESTIONS.recentUploads);
  }

  if (props.isMonday) {
    suggestions.push(CONTEXTUAL_SUGGESTIONS.monday);
  }

  if (props.isEndOfMonth) {
    suggestions.push(CONTEXTUAL_SUGGESTIONS.endOfMonth);
  }

  // Llenar con base hasta tener 4
  for (const base of BASE_SUGGESTIONS) {
    if (suggestions.length >= 4) break;
    if (!suggestions.some((s) => s.text === base.text)) {
      suggestions.push(base);
    }
  }

  return suggestions.slice(0, 4);
}

export function SuggestedQuestions(props: SuggestedQuestionsProps) {
  const { onSelect } = props;
  const suggestions = getSmartSuggestions(props);

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      <p className="text-sm text-slate-400 text-center mb-4">
        ¿Qué quieres saber de tu negocio?
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {suggestions.map((suggestion) => {
          const Icon = suggestion.icon;
          return (
            <button
              key={suggestion.text}
              onClick={() => onSelect(suggestion.text)}
              className="group flex items-start gap-3 p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-indigo-500/50 transition-all text-left"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-indigo-500/20 group-hover:bg-indigo-500/30 flex items-center justify-center transition-colors">
                <Icon className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">
                  {suggestion.text}
                </p>
                {suggestion.description && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    {suggestion.description}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
