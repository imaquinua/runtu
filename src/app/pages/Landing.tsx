import { useNavigate } from "react-router";
import { RuntuLogo } from "../components/RuntuLogo";
import logoSrc from "../../imports/runtu_logo.png";
import h2Src from "../../imports/h2.png";
import { Radar, BarChart3, Brain, Activity, CalendarDays, Globe, Sparkles } from "lucide-react";

const features = [
  { icon: Radar, title: "Social Scraping", desc: "Monitorea hashtags, cuentas y keywords en Instagram, TikTok, Facebook, LinkedIn y Google en tiempo real." },
  { icon: Globe, title: "Web Scraping", desc: "Extrae data de competidores, reviews, noticias y foros con clasificacion automatica de sentimiento y keywords." },
  { icon: Activity, title: "Engagement Analytics", desc: "Calcula engagement rate por plataforma, tipo de contenido y horario con formulas nativas de cada red." },
  { icon: BarChart3, title: "MMM Engine", desc: "Regresiones lineales econometricas que miden la elasticidad real de cada canal de marketing en tus ventas." },
  { icon: CalendarDays, title: "Calendario IA", desc: "Planifica y genera contenido para todas tus redes con un asistente conversacional que conoce tu data." },
  { icon: Brain, title: "Chat Inteligente", desc: "Resuelve cualquier problema de marketing con un copiloto que tiene acceso a tu scraping, analytics y MMM." },
];

const integrations = [
  { name: "Instagram", color: "#E1306C" },
  { name: "TikTok", color: "#6d28d9" },
  { name: "Facebook", color: "#1877F2" },
  { name: "LinkedIn", color: "#0A66C2" },
  { name: "Google", color: "#4285F4" },
];

export function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white text-gray-900 font-[Montserrat]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-6 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="flex items-center gap-2">
          <img src={logoSrc} alt="Runtu" className="w-7 h-7" />
          <span className="text-gray-900 text-sm" style={{ fontWeight: 700 }}>Runtu<span className="text-amber-600">.tech</span></span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/incubadora")} className="hidden sm:block text-gray-500 hover:text-gray-900 px-3 py-2 text-sm transition-colors">
            Incubadora de agentes
          </button>
          <button onClick={() => navigate("/login")} className="text-gray-500 hover:text-gray-900 px-4 py-2 text-sm transition-colors">
            Iniciar sesion
          </button>
          <button onClick={() => navigate("/register")} className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl px-5 py-2 text-sm transition-all hover:shadow-lg" style={{ fontWeight: 600 }}>
            Solicitar acceso
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-14 px-4">
        {/* Subtle gradient background for hero only */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse at 50% 40%, rgba(99,102,241,0.04), transparent 60%)"
        }} />

        <div className="animate-[fade-in_1s_ease-out_both]">
          <RuntuLogo variant="hero" />
        </div>
        <h1 className="mt-10 text-4xl md:text-6xl lg:text-7xl text-center tracking-tight text-gray-900 animate-[fade-in_0.8s_ease-out_1.2s_both]" style={{ fontWeight: 900, lineHeight: 1.1 }}>
          El sistema operativo<br />
          <span className="text-gray-900">de tu marketing</span>
        </h1>
        <p className="mt-6 text-gray-500 text-center max-w-2xl text-lg animate-[fade-in_0.8s_ease-out_1.4s_both]">
          Scraping social y web, analisis de sentimiento, engagement rate, regresiones econometricas MMM, calendario con IA y un chat que resuelve todo.
        </p>
        <button
          onClick={() => navigate("/register")}
          className="mt-8 bg-gray-900 hover:bg-gray-800 text-white rounded-xl px-8 py-4 transition-all hover:shadow-xl animate-[fade-in_0.8s_ease-out_1.6s_both]"
          style={{ fontWeight: 700 }}
        >
          Quiero mi Marketing OS
        </button>
        <div className="flex flex-wrap gap-2 mt-8 justify-center animate-[fade-in_0.8s_ease-out_1.8s_both]">
          {["Scraping Social", "Web Intelligence", "MMM Econometrico", "IA Conversacional"].map(t => (
            <span key={t} className="text-gray-400 text-sm border border-gray-200 rounded-full px-4 py-1.5">{t}</span>
          ))}
        </div>

        {/* Integration pills */}
        <div className="flex gap-2 mt-5 animate-[fade-in_0.8s_ease-out_2s_both]">
          {integrations.map(i => (
            <div key={i.name} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-100 bg-gray-50">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: i.color }} />
              <span className="text-gray-400 text-xs">{i.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative py-24 px-4">
        <h2 className="text-3xl md:text-4xl text-center tracking-tight mb-4 text-gray-900" style={{ fontWeight: 900 }}>
          Todo lo que tu marketing necesita
        </h2>
        <p className="text-gray-400 text-center max-w-2xl mx-auto mb-16">
          Desde el scraping de datos hasta la decision final. Cada modulo alimenta al siguiente.
        </p>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(f => (
            <div key={f.title} className="bg-white border border-gray-100 rounded-2xl p-6 hover:border-gray-200 hover:shadow-sm transition-all group">
              <f.icon className="w-7 h-7 text-gray-900 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg text-gray-900 mb-2" style={{ fontWeight: 700 }}>{f.title}</h3>
              <p className="text-gray-500 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Data flow */}
      <section className="relative py-24 px-4 bg-gray-50">
        <h2 className="text-3xl md:text-4xl text-center tracking-tight mb-4 text-gray-900" style={{ fontWeight: 900 }}>
          Flujo de datos inteligente
        </h2>
        <p className="text-gray-400 text-center max-w-2xl mx-auto mb-12">Cada modulo alimenta automaticamente al siguiente</p>
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-center gap-4 text-center">
          {[
            { label: "APIs y Scraping", sub: "Datos crudos", icon: Radar },
            { label: "Clasificacion IA", sub: "Sentimiento + Keywords", icon: Sparkles },
            { label: "Analytics", sub: "Engagement Rate", icon: Activity },
            { label: "MMM Engine", sub: "Regresiones", icon: BarChart3 },
            { label: "Decisiones", sub: "Calendario + Chat", icon: Brain },
          ].map((s, i) => (
            <div key={s.label} className="flex items-center gap-4">
              <div className="bg-white border border-gray-200 rounded-2xl p-5 w-36 shadow-sm">
                <s.icon className="w-6 h-6 text-gray-900 mx-auto mb-2" />
                <p className="text-gray-700 text-xs" style={{ fontWeight: 600 }}>{s.label}</p>
                <p className="text-gray-400 text-[10px] mt-0.5">{s.sub}</p>
              </div>
              {i < 4 && <span className="text-gray-300 text-xl hidden md:block">→</span>}
            </div>
          ))}
        </div>
      </section>

      {/* Testimonial */}
      <section className="relative py-24 px-4">
        <div className="max-w-3xl mx-auto bg-gray-50 border border-gray-100 rounded-2xl p-8">
          <p className="text-gray-600 italic text-lg text-center">
            "Antes invertia a ciegas. Runtu me mostro que mi TikTok tiene 4.2x de elasticidad vs 1.8x de mis ads digitales. Reasigne presupuesto y las ventas subieron 18% en un mes."
          </p>
          <p className="text-gray-900 text-center mt-4" style={{ fontWeight: 600 }}>— Director de Marketing, E-commerce CDMX</p>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 px-4 flex flex-col items-center bg-gray-50">
        <img src={h2Src} alt="Runtu" className="w-14 h-14 mb-4" />
        <h2 className="text-3xl md:text-4xl text-center tracking-tight text-gray-900" style={{ fontWeight: 900 }}>
          Tu marketing merece un sistema operativo
        </h2>
        <p className="text-gray-500 mt-4 text-center max-w-xl">Tu competencia ya esta usando datos. Es hora de que tu tambien.</p>
        <button
          onClick={() => navigate("/register")}
          className="mt-8 bg-gray-900 hover:bg-gray-800 text-white rounded-xl px-8 py-4 transition-all hover:shadow-xl"
          style={{ fontWeight: 700 }}
        >
          Empezar gratis
        </button>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-6 flex flex-col md:flex-row items-center justify-between text-gray-400 text-sm gap-4">
        <div className="flex items-center gap-2">
          <img src={logoSrc} alt="" className="w-5 h-5" />
          <span>Runtu.tech &copy; 2026</span>
        </div>
        <span>Marketing Operating System para Latinoamerica</span>
      </footer>
    </div>
  );
}
