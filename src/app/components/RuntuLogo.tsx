import { useEffect, useRef } from "react";
import logoSrc from "../../imports/runtu_logo.png";

type Variant = "hero" | "header" | "minimal" | "loading";

interface RuntuLogoProps {
  variant?: Variant;
  className?: string;
}

export function RuntuLogo({ variant = "hero", className = "" }: RuntuLogoProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (variant !== "hero" && variant !== "loading") return;
    const interval = setInterval(() => {
      const el = containerRef.current?.querySelector(".logo-img") as HTMLElement;
      if (!el) return;
      el.style.transform = "scale(1.02)";
      setTimeout(() => { el.style.transform = ""; }, 80);
    }, 8000 + Math.random() * 4000);
    return () => clearInterval(interval);
  }, [variant]);

  if (variant === "minimal") {
    return <img src={logoSrc} alt="Runtu" className={`w-8 h-8 ${className}`} />;
  }

  if (variant === "header") {
    return (
      <div className={`relative w-10 h-10 ${className}`}>
        <div className="absolute inset-0 bg-indigo-500/10 rounded-full blur-xl animate-[pulse-glow_3s_ease-in-out_infinite]" />
        <img
          src={logoSrc}
          alt="Runtu"
          className="relative w-10 h-10 animate-[float_4s_ease-in-out_infinite] drop-shadow-[0_0_15px_rgba(99,102,241,0.2)]"
        />
      </div>
    );
  }

  // Hero and Loading — keep the dark/blue aura for the egg animation
  const isLoading = variant === "loading";
  const size = isLoading ? "w-32 h-32 md:w-40 md:h-40" : "w-28 h-28 md:w-40 md:h-40";
  const floatSpeed = isLoading ? "3s" : "4s";
  const spinSpeed = isLoading ? "10s" : "20s";
  const pulseSpeed = isLoading ? "2s" : "3s";
  const orbit1Speed = isLoading ? "5s" : "8s";
  const orbit2Speed = isLoading ? "4s" : "6s";

  return (
    <div ref={containerRef} className={`relative ${size} ${className}`}>
      {/* Halo exterior - blue/indigo glow */}
      <div
        className="absolute -inset-[60px] rounded-full opacity-20 blur-[48px]"
        style={{
          background: "radial-gradient(circle, rgba(99,102,241,0.08), transparent 70%)",
          animation: `spin 35s linear infinite reverse`,
        }}
      />
      {/* Anillo rotatorio */}
      <div
        className="absolute -inset-6 rounded-full blur-xl"
        style={{
          background: "linear-gradient(to right, rgba(99,102,241,0.15), transparent, rgba(147,51,234,0.15))",
          animation: `spin ${spinSpeed} linear infinite`,
        }}
      />
      {/* Glow pulsante */}
      <div
        className="absolute -inset-4 rounded-full blur-2xl"
        style={{
          background: "rgba(99,102,241,0.08)",
          animation: `pulse-glow ${pulseSpeed} ease-in-out infinite`,
        }}
      />
      {/* Logo */}
      <img
        src={logoSrc}
        alt="Runtu"
        className="logo-img relative w-full h-full drop-shadow-[0_0_20px_rgba(99,102,241,0.25)] transition-transform duration-75"
        style={{
          animation: `logo-reveal 1.2s cubic-bezier(0.34,1.56,0.64,1) both, float ${floatSpeed} ease-in-out 1.2s infinite`,
        }}
      />
      {/* Partícula 1 */}
      <div
        className="absolute top-1/2 left-1/2"
        style={{ animation: `orbit ${orbit1Speed} linear infinite`, animationDelay: "0.3s", opacity: 0, animationFillMode: "forwards" }}
      >
        <div
          className="w-2 h-2 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.6)]"
          style={{ transform: "translate(-50%, -50%) translateY(-70px)", filter: "blur(1px)" }}
        />
      </div>
      {/* Partícula 2 */}
      <div
        className="absolute top-1/2 left-1/2"
        style={{ animation: `orbit-reverse ${orbit2Speed} linear infinite`, animationDelay: "0.3s", opacity: 0, animationFillMode: "forwards" }}
      >
        <div
          className="w-1.5 h-1.5 bg-purple-500/60 rounded-full"
          style={{ transform: "translate(-50%, -50%) translateY(70px)", filter: "blur(1px)" }}
        />
      </div>
      {/* Partícula 3 */}
      <div
        className="absolute top-1/2 left-1/2"
        style={{ animation: `orbit 11s linear infinite`, transform: "rotate(45deg)", animationDelay: "0.3s", opacity: 0, animationFillMode: "forwards" }}
      >
        <div
          className="w-1 h-1 bg-indigo-400/40 rounded-full"
          style={{ transform: "translate(-50%, -50%) translateY(-80px)" }}
        />
      </div>
    </div>
  );
}
