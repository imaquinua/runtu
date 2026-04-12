"use client";

import { Search, FileText, Table, Image, Mic, Video, Layers } from "lucide-react";
import type { FileType } from "../page";

interface FileFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeFilter: FileType | "all";
  onFilterChange: (filter: FileType | "all") => void;
  totalFiles: number;
}

const filters: { value: FileType | "all"; label: string; icon: React.ElementType }[] = [
  { value: "all", label: "Todos", icon: Layers },
  { value: "document", label: "PDF", icon: FileText },
  { value: "spreadsheet", label: "Excel", icon: Table },
  { value: "image", label: "Imagen", icon: Image },
  { value: "audio", label: "Audio", icon: Mic },
  { value: "video", label: "Video", icon: Video },
];

export function FileFilters({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  totalFiles,
}: FileFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
        <input
          type="text"
          placeholder="Buscar archivos..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-colors"
        />
      </div>

      {/* Filter Pills + Counter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => {
            const Icon = filter.icon;
            const isActive = activeFilter === filter.value;

            return (
              <button
                key={filter.value}
                onClick={() => onFilterChange(filter.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                    : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {filter.label}
              </button>
            );
          })}
        </div>

        <span className="text-sm text-white/50">
          {totalFiles} archivo{totalFiles !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}
