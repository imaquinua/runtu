import Link from "next/link";
import { RuntuLogo } from "@/components/ui/runtu-logo";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#020617] text-white overflow-x-hidden">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(251,191,36,0.08),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(251,191,36,0.05),transparent_50%)]" />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' /%3E%3C/svg%3E")`
          }}
        />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/50 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <RuntuLogo variant="minimal" size="sm" />
            <span className="font-bold text-lg hidden sm:block">Runtu</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-white/70 hover:text-white transition-colors px-3 py-2"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="text-sm bg-[#fbbf24] hover:bg-[#f59e0b] text-gray-900 font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Empezar gratis
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center px-4 pt-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo animado */}
          <div className="mb-8 animate-fade-in" style={{ animationDelay: "0.1s", animationFillMode: "backwards" }}>
            <RuntuLogo variant="hero" size="lg" />
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight mb-6">
            <span className="block text-white/90 animate-fade-in" style={{ animationDelay: "0.2s", animationFillMode: "backwards" }}>
              Tu negocio merece
            </span>
            <span className="block gradient-text glow animate-fade-in" style={{ animationDelay: "0.4s", animationFillMode: "backwards" }}>
              un copiloto
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in" style={{ animationDelay: "0.6s", animationFillMode: "backwards" }}>
            Deja de tomar decisiones a ciegas. Runtu es el socio que recuerda todo,
            entiende tu caos y te dice la verdad con cariño.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-fade-in" style={{ animationDelay: "0.8s", animationFillMode: "backwards" }}>
            <Link
              href="/register"
              className="w-full sm:w-auto bg-[#fbbf24] hover:bg-[#f59e0b] text-gray-900 font-bold text-lg px-8 py-4 rounded-xl transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(251,191,36,0.3)] flex items-center justify-center gap-2"
            >
              Empezar gratis
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <span className="text-white/40 text-sm">Sin tarjeta de crédito</span>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 animate-fade-in" style={{ animationDelay: "1s", animationFillMode: "backwards" }}>
            <span className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-medium text-white/60">
              Diseñado para Latinoamérica
            </span>
            <span className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-medium text-white/60">
              IA que entiende tu realidad
            </span>
            <span className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-medium text-white/60">
              Sin MBA ni consultores
            </span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              ¿Cómo te ayuda <span className="gradient-text">Runtu</span>?
            </h2>
            <p className="text-white/60 max-w-xl mx-auto">
              No somos un software más. Somos el socio que siempre quisiste tener.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-[#fbbf24]/30 transition-colors group">
              <div className="w-14 h-14 bg-[#fbbf24]/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#fbbf24]/20 transition-colors">
                <svg className="w-7 h-7 text-[#fbbf24]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Entiende tus números</h3>
              <p className="text-white/60 leading-relaxed">
                Sube tus ventas del día, tus gastos, lo que sea. Runtu lo organiza y te muestra qué está pasando realmente.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-[#fbbf24]/30 transition-colors group">
              <div className="w-14 h-14 bg-[#fbbf24]/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#fbbf24]/20 transition-colors">
                <svg className="w-7 h-7 text-[#fbbf24]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Habla con tu negocio</h3>
              <p className="text-white/60 leading-relaxed">
                Pregúntale lo que quieras: "¿Cómo me fue este mes?", "¿Qué producto me deja más?". Runtu te responde claro.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-[#fbbf24]/30 transition-colors group">
              <div className="w-14 h-14 bg-[#fbbf24]/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#fbbf24]/20 transition-colors">
                <svg className="w-7 h-7 text-[#fbbf24]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Toma mejores decisiones</h3>
              <p className="text-white/60 leading-relaxed">
                Tu intuición por fin tiene un espejo que la valida, la cuestiona, la amplifica. Deja de adivinar.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* For Who Section */}
      <section className="py-24 px-4 bg-gradient-to-b from-transparent via-[#fbbf24]/5 to-transparent">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Para el emprendedor que <span className="gradient-text">trabaja de verdad</span>
          </h2>
          <p className="text-lg text-white/60 mb-12 max-w-2xl mx-auto leading-relaxed">
            Si tienes una receta de la abuela, una habilidad aprendida a golpes, un local
            prestado y un WhatsApp lleno de pedidos... Runtu es para ti.
          </p>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 sm:p-12 text-left">
            <blockquote className="text-xl sm:text-2xl font-medium text-white/80 italic mb-6">
              "Cada noche me pregunto lo mismo: ¿Cómo me fue hoy? ¿Voy bien? ¿Qué debería hacer diferente?"
            </blockquote>
            <p className="text-white/60">
              Si te identificas con esto, no estás solo. Y ahora tienes a alguien que te ayuda a responder.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="mb-8">
            <RuntuLogo variant="header" size="md" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            El huevo ya está listo
          </h2>
          <p className="text-lg text-white/60 mb-8 italic">
            "Runtu es el huevo. Tu negocio es lo que nace de él."
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-[#fbbf24] hover:bg-[#f59e0b] text-gray-900 font-bold text-lg px-10 py-4 rounded-xl transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(251,191,36,0.4)]"
          >
            Crear mi cuenta gratis
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <p className="text-white/40 text-sm mt-4">
            Empieza en 30 segundos. Sin tarjeta de crédito.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <RuntuLogo variant="minimal" size="sm" />
            <span className="text-white/40 text-sm">Runtu © 2025</span>
          </div>
          <p className="text-white/30 text-sm">
            El copiloto de negocio para Latinoamérica
          </p>
        </div>
      </footer>
    </div>
  );
}
