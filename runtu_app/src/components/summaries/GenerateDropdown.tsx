"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Calendar, CalendarDays, CalendarRange, Loader2 } from "lucide-react";
import type { SummaryType } from "@/types/summaries";

interface GenerateDropdownProps {
  onGenerate: (type: SummaryType) => Promise<void>;
  isGenerating?: boolean;
}

export function GenerateDropdown({ onGenerate, isGenerating }: GenerateDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [generatingType, setGeneratingType] = useState<SummaryType | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleGenerate = async (type: SummaryType) => {
    setGeneratingType(type);
    setIsOpen(false);
    try {
      await onGenerate(type);
    } finally {
      setGeneratingType(null);
    }
  };

  const options = [
    {
      type: "daily" as SummaryType,
      label: "Resumen de hoy",
      description: "Lo que pasó en las últimas 24 horas",
      icon: Calendar,
    },
    {
      type: "weekly" as SummaryType,
      label: "Resumen de esta semana",
      description: "Análisis de los últimos 7 días",
      icon: CalendarDays,
    },
    {
      type: "monthly" as SummaryType,
      label: "Resumen de este mes",
      description: "Visión general del mes",
      icon: CalendarRange,
    },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isGenerating}
        className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
      >
        {isGenerating || generatingType ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generando...
          </>
        ) : (
          <>
            Generar ahora
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </>
        )}
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-slate-800 border border-white/10 rounded-xl shadow-xl overflow-hidden z-50">
          <div className="p-2">
            {options.map((option) => {
              const Icon = option.icon;
              const isLoading = generatingType === option.type;

              return (
                <button
                  key={option.type}
                  onClick={() => handleGenerate(option.type)}
                  disabled={isLoading}
                  className="w-full flex items-start gap-3 p-3 text-left hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50"
                >
                  <div className="flex-shrink-0 p-2 bg-indigo-500/20 rounded-lg">
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                    ) : (
                      <Icon className="w-4 h-4 text-indigo-400" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">
                      {option.label}
                    </div>
                    <div className="text-xs text-white/50">
                      {option.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="px-4 py-3 bg-white/5 border-t border-white/10">
            <p className="text-xs text-white/40">
              Los resúmenes usan IA para analizar tus datos y darte insights
              personalizados.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
