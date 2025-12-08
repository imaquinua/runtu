"use client";

import { Loader2 } from "lucide-react";

interface InlineLoaderProps {
  size?: "xs" | "sm" | "md" | "lg";
  color?: "white" | "indigo" | "gray";
  className?: string;
}

const sizeClasses = {
  xs: "w-3 h-3",
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
};

const colorClasses = {
  white: "text-white",
  indigo: "text-indigo-400",
  gray: "text-white/60",
};

export function InlineLoader({
  size = "sm",
  color = "white",
  className = "",
}: InlineLoaderProps) {
  return (
    <Loader2
      className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
    />
  );
}

// Convenience component for buttons
export function ButtonLoader({ className = "" }: { className?: string }) {
  return <InlineLoader size="sm" color="white" className={className} />;
}
