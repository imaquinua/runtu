"use client";

import { Sparkles } from "lucide-react";

interface FollowUpSuggestionsProps {
  suggestions: string[];
  onSelect: (question: string) => void;
  isLoading?: boolean;
}

export function FollowUpSuggestions({
  suggestions,
  onSelect,
  isLoading = false,
}: FollowUpSuggestionsProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 mt-3 ml-11">
        <Sparkles className="w-3.5 h-3.5 text-slate-500 animate-pulse" />
        <span className="text-xs text-slate-500">Pensando sugerencias...</span>
      </div>
    );
  }

  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 ml-11 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-1.5 mb-2">
        <Sparkles className="w-3 h-3 text-slate-500" />
        <span className="text-[11px] text-slate-500">También puedes preguntarme:</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={`${suggestion}-${index}`}
            onClick={() => onSelect(suggestion)}
            className="px-3 py-1.5 text-xs rounded-full bg-slate-800/70 hover:bg-slate-700 border border-slate-700/50 hover:border-indigo-500/50 text-slate-300 hover:text-white transition-all"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
