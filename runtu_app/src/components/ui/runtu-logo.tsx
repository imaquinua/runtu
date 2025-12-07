import Image from "next/image";

interface RuntuLogoProps {
  variant?: "hero" | "header" | "minimal" | "loading";
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "w-16 h-16 sm:w-20 sm:h-20",
  md: "w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32",
  lg: "w-28 h-28 sm:w-32 sm:h-32 md:w-40 md:h-40",
};

export function RuntuLogo({ variant = "hero", size = "md" }: RuntuLogoProps) {
  if (variant === "minimal") {
    return (
      <div className="animate-logo-reveal">
        <div className="relative inline-block">
          <Image
            src="/runtu_logo.png"
            alt="Runtu Logo"
            width={128}
            height={128}
            className={`${sizeClasses[size]} object-contain filter drop-shadow-[0_0_15px_rgba(251,191,36,0.2)]`}
            priority
          />
        </div>
      </div>
    );
  }

  const isLoading = variant === "loading";
  const isHeader = variant === "header";

  return (
    <div className={`animate-logo-reveal ${isHeader ? "logo-variant-header" : ""}`}>
      <div className="relative inline-block">
        {/* Rotating ring effect */}
        {!isHeader && (
          <div
            className="absolute inset-0 -m-6 animate-spin-slow"
            style={isLoading ? { animationDuration: "10s" } : undefined}
          >
            <div className={`absolute inset-0 rounded-full bg-gradient-to-r from-[#fbbf24]/20 via-transparent to-[#fbbf24]/20 blur-xl ${isLoading ? "from-[#fbbf24]/30 to-[#fbbf24]/30" : ""}`} />
          </div>
        )}

        {/* Pulsing glow */}
        <div
          className={`absolute inset-0 ${isHeader ? "-m-3" : "-m-4"} animate-pulse-glow`}
          style={isLoading ? { animationDuration: "2s" } : undefined}
        >
          <div className={`absolute inset-0 rounded-full ${isHeader ? "bg-[#fbbf24]/8 blur-xl" : isLoading ? "bg-[#fbbf24]/15 blur-2xl" : "bg-[#fbbf24]/10 blur-2xl"}`} />
        </div>

        {/* Logo container with floating animation */}
        <div
          className="relative animate-float"
          style={isLoading ? { animationDuration: "3s" } : undefined}
        >
          <div className="relative inline-block">
            {/* Logo glow shadow */}
            <div className={`absolute inset-0 rounded-full ${isHeader ? "blur-lg opacity-40 bg-[#fbbf24]/20" : isLoading ? "blur-2xl opacity-70 bg-[#fbbf24]/40" : "blur-xl opacity-60 bg-[#fbbf24]/30"}`} />

            {/* Actual logo */}
            <Image
              src="/runtu_logo.png"
              alt="Runtu Logo"
              width={160}
              height={160}
              className={`relative ${sizeClasses[size]} object-contain filter ${isLoading ? "drop-shadow-[0_0_40px_rgba(251,191,36,0.5)]" : isHeader ? "drop-shadow-[0_0_20px_rgba(251,191,36,0.3)]" : "drop-shadow-[0_0_30px_rgba(251,191,36,0.4)]"} mix-blend-lighten`}
              priority
            />
          </div>
        </div>

        {/* Orbiting particles - only for hero and loading variants */}
        {(variant === "hero" || variant === "loading") && (
          <>
            <div
              className="absolute inset-0 animate-orbit"
              style={isLoading ? { animationDuration: "5s" } : undefined}
            >
              <div className={`absolute top-0 left-1/2 ${isLoading ? "w-2.5 h-2.5 shadow-[0_0_10px_rgba(251,191,36,0.8)]" : "w-2 h-2"} bg-[#fbbf24] rounded-full -ml-1 blur-[1px]`} />
            </div>
            <div
              className="absolute inset-0 animate-orbit-reverse"
              style={isLoading ? { animationDuration: "4s" } : undefined}
            >
              <div className={`absolute bottom-0 left-1/2 ${isLoading ? "w-2 h-2 shadow-[0_0_10px_rgba(251,191,36,0.6)]" : "w-1.5 h-1.5"} bg-[#fbbf24]/60 rounded-full -ml-1 blur-[1px]`} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
