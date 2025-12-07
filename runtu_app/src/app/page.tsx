import { RuntuLogo } from "@/components/ui/runtu-logo";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(251,191,36,0.08),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(251,191,36,0.05),transparent_50%)]" />

        {/* Animated grain */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' /%3E%3C/svg%3E")`
          }}
        />
      </div>

      {/* Main Content */}
      <main className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-8">
        <div className="max-w-4xl mx-auto text-center w-full">

          {/* Logo */}
          <div className="mb-12 sm:mb-16">
            <RuntuLogo variant="hero" size="lg" />
          </div>

          {/* Main Headline */}
          <div className="space-y-6 mb-10 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-tight tracking-tight px-2">
              <span className="block mb-2 text-white/90 animate-fade-in" style={{ animationDelay: "0.1s", animationFillMode: "backwards" }}>
                Tu copiloto
              </span>
              <span className="block gradient-text glow animate-fade-in" style={{ animationDelay: "0.3s", animationFillMode: "backwards" }}>
                de negocio
              </span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl font-light text-white/60 max-w-2xl mx-auto leading-relaxed px-4 animate-fade-in" style={{ animationDelay: "0.5s", animationFillMode: "backwards" }}>
              El socio que siempre quisiste tener. Ese que recuerda todo, entiende tu caos, y te dice la verdad con cariño.
            </p>
          </div>

          {/* Tagline */}
          <div className="mb-10 animate-fade-in" style={{ animationDelay: "0.7s", animationFillMode: "backwards" }}>
            <p className="text-sm sm:text-base text-white/40 font-medium max-w-xl mx-auto px-4 italic">
              &ldquo;Runtu es el huevo. Tu negocio es lo que nace de él.&rdquo;
            </p>
          </div>

          {/* Features Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 max-w-2xl mx-auto px-4 animate-fade-in" style={{ animationDelay: "0.9s", animationFillMode: "backwards" }}>
            <span className="px-3 sm:px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full text-xs font-semibold text-white/70 tracking-wide">
              Diseñado para Latinoamérica
            </span>
            <span className="px-3 sm:px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full text-xs font-semibold text-white/70 tracking-wide">
              IA que entiende tu realidad
            </span>
            <span className="px-3 sm:px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full text-xs font-semibold text-white/70 tracking-wide">
              Sin MBA ni consultores
            </span>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 p-4 sm:p-6 text-center">
        <p className="text-xs text-white/30 font-medium">
          Runtu &middot; El origen de tu negocio
        </p>
      </footer>
    </div>
  );
}
