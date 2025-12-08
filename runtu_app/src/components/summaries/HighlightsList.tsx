"use client";

import type { SummaryHighlight } from "@/types/summaries";

interface HighlightsListProps {
  highlights: SummaryHighlight[];
}

export function HighlightsList({ highlights }: HighlightsListProps) {
  if (!highlights || highlights.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-white/60 uppercase tracking-wide">
        Puntos clave
      </h4>
      <div className="grid gap-3 sm:grid-cols-2">
        {highlights.map((highlight, idx) => (
          <HighlightCard key={idx} highlight={highlight} />
        ))}
      </div>
    </div>
  );
}

function HighlightCard({ highlight }: { highlight: SummaryHighlight }) {
  const colorClasses = {
    positive: "bg-green-500/10 border-green-500/20 text-green-400",
    negative: "bg-red-500/10 border-red-500/20 text-red-400",
    neutral: "bg-white/5 border-white/10 text-white/60",
    action: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400",
  };

  const iconBgClasses = {
    positive: "bg-green-500/20",
    negative: "bg-red-500/20",
    neutral: "bg-white/10",
    action: "bg-indigo-500/20",
  };

  const colors = colorClasses[highlight.type] || colorClasses.neutral;
  const iconBg = iconBgClasses[highlight.type] || iconBgClasses.neutral;

  return (
    <div className={`p-3 rounded-lg border ${colors}`}>
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 p-2 rounded-lg text-lg ${iconBg}`}>
          {highlight.icon}
        </div>
        <div className="min-w-0">
          <h5 className="font-medium text-white text-sm">
            {highlight.title}
          </h5>
          <p className="text-sm text-white/50 mt-0.5 line-clamp-2">
            {highlight.description}
          </p>
        </div>
      </div>
    </div>
  );
}
