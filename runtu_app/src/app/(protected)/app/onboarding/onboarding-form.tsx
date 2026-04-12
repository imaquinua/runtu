"use client";

import { useState } from "react";
import { completeOnboarding } from "@/app/actions/business";
import { INDUSTRIES } from "@/lib/constants";

export function OnboardingForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const result = await completeOnboarding(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {/* Error message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-400 text-sm text-center">{error}</p>
        </div>
      )}

      {/* Business name */}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-white/80 mb-2"
        >
          Nombre de tu negocio
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          minLength={2}
          maxLength={100}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#fbbf24]/50 focus:border-[#fbbf24]/50 transition-colors"
          placeholder="Ej: Café La Esquina"
        />
      </div>

      {/* Industry select */}
      <div>
        <label
          htmlFor="industry"
          className="block text-sm font-medium text-white/80 mb-2"
        >
          Industria
        </label>
        <select
          id="industry"
          name="industry"
          required
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#fbbf24]/50 focus:border-[#fbbf24]/50 transition-colors appearance-none cursor-pointer"
          defaultValue=""
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='rgba(255,255,255,0.4)'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 1rem center",
            backgroundSize: "1.5rem",
          }}
        >
          <option value="" disabled className="bg-slate-900 text-white/40">
            Selecciona una industria
          </option>
          {INDUSTRIES.map((industry) => (
            <option
              key={industry.value}
              value={industry.value}
              className="bg-slate-900 text-white"
            >
              {industry.label}
            </option>
          ))}
        </select>
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#fbbf24] hover:bg-[#f59e0b] text-gray-900 font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Guardando...
          </>
        ) : (
          "Empezar"
        )}
      </button>
    </form>
  );
}
