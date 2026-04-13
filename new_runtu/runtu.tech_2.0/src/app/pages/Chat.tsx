import { useState, useRef, useEffect } from "react";
import { Send, Plus, Square, Sparkles, Radar, BarChart3, CalendarDays, Globe, Activity } from "lucide-react";
import { RuntuLogo } from "../components/RuntuLogo";

interface Message { role: "user" | "assistant"; content: string; }
interface Conv { id: string; title: string; messages: Message[]; }

const suggestions = [
  { text: "Que canal me da mejor ROI esta semana?", icon: BarChart3 },
  { text: "Analiza el sentimiento de mi campana", icon: Radar },
  { text: "Genera contenido para Instagram y TikTok", icon: CalendarDays },
  { text: "Que dice mi scraping de competidores?", icon: Globe },
  { text: "Cual es mi engagement rate por plataforma?", icon: Activity },
  { text: "Optimiza mi presupuesto de marketing", icon: BarChart3 },
];

const aiResponses: Record<string, string> = {
  roi: `Analizando tu modelo econometrico (R² = 0.94):\n\n**Ranking de ROI:**\n1. **TikTok** — 4.2x elasticidad\n2. **TV** — 3.2x (rendimientos decrecientes a $30K)\n3. **Digital** — 1.8x\n4. **OOH** — 1.4x\n5. **Radio** — 0.6x ⚠️ No significativo\n\n**Recomendacion:** Reasigna 12% de TV/Radio a TikTok → +18% ROI estimado.`,
  sentimiento: `Resultados "#skincaremexicano" (24h):\n\n📊 **2,847 menciones:**\n- ✅ Positivo: 58% — "natural", "receta", "increible"\n- ⚖️ Neutral: 28% — "precio", "donde comprar"\n- ❌ Negativo: 14% — "envio", "tardo"\n\n**Insight:** El negativo es logistica, no producto. Mejora comunicacion de envios.`,
  contenido: `**Instagram (09:00 y 18:00):**\n1. Carrusel: "5 ingredientes mexicanos" — 2.4x mas engagement\n2. Reel: Before/After rutina — 8.7% ER\n\n**TikTok (18:00-21:00):**\n1. "El ingrediente que las marcas coreanas copian" — hook viral\n2. Speed run skincare 30 seg — genera shares\n\n¿Los agrego al calendario?`,
  competidores: `**competidor.com.mx:** Lanzo serums vitamina C. Precio 15% menor.\n**beautylatam.com:** Tu producto en Top 5 humectantes del mes ✨\n**reddit:** Hilo viral marcas MX vs coreanas (850 upvotes)\n\n⚠️ COFEPRIS: nuevos requisitos para importados (ventaja para ti)`,
  engagement: `| Plataforma | ER | Tendencia | Benchmark |\n|---|---|---|---|\n| TikTok | 8.2% | ↑1.2% | 5.5% |\n| Instagram | 5.8% | ↑0.6% | 3.2% |\n| LinkedIn | 3.4% | ↑0.5% | 2.1% |\n| Facebook | 2.1% | ↓0.3% | 2.8% |\n\nTikTok esta 49% sobre benchmark. Facebook cayendo — reduce frecuencia.`,
  default: `Tu marketing va bien. ER promedio 5.3% sobre benchmark. Keywords trending: "natural", "vegano", "receta". TikTok es tu canal estrella (4.2x elasticidad). ¿En que profundizo?`,
};

function getAIResponse(msg: string): string {
  const l = msg.toLowerCase();
  if (l.includes("roi") || l.includes("presupuesto") || l.includes("optimiz")) return aiResponses.roi;
  if (l.includes("sentimiento") || l.includes("campana")) return aiResponses.sentimiento;
  if (l.includes("contenido") || l.includes("genera") || l.includes("instagram") || l.includes("tiktok")) return aiResponses.contenido;
  if (l.includes("competidor") || l.includes("scraping") || l.includes("web")) return aiResponses.competidores;
  if (l.includes("engagement") || l.includes("plataforma")) return aiResponses.engagement;
  return aiResponses.default;
}

export function Chat() {
  const [convs, setConvs] = useState<Conv[]>([]);
  const [activeConv, setActiveConv] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const conv = convs.find(c => c.id === activeConv);
  const messages = conv?.messages ?? [];

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length, streaming]);

  const createConv = () => { const id = Date.now().toString(); setConvs(p => [{ id, title: "Nueva conversacion", messages: [] }, ...p]); setActiveConv(id); };

  const sendMessage = (text?: string) => {
    const msg = text || input.trim();
    if (!msg) return;
    let cid = activeConv;
    if (!cid) { const id = Date.now().toString(); setConvs(p => [{ id, title: msg.slice(0, 35), messages: [] }, ...p]); cid = id; setActiveConv(id); }
    setConvs(p => p.map(c => c.id === cid ? { ...c, messages: [...c.messages, { role: "user" as const, content: msg }], title: c.messages.length === 0 ? msg.slice(0, 35) : c.title } : c));
    setInput(""); setStreaming(true);
    setTimeout(() => { setConvs(p => p.map(c => c.id === cid ? { ...c, messages: [...c.messages, { role: "assistant" as const, content: getAIResponse(msg) }] } : c)); setStreaming(false); }, 1800);
  };

  return (
    <div className="h-full flex">
      <div className="w-64 bg-white border-r border-gray-100 flex-col hidden md:flex">
        <div className="p-3">
          <button onClick={createConv} className="w-full flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 text-sm transition-colors">
            <Plus className="w-4 h-4" /> Nueva conversacion
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-3 space-y-1">
          {convs.map(c => (
            <button key={c.id} onClick={() => setActiveConv(c.id)}
              className={`w-full text-left px-3 py-2 rounded-xl text-sm truncate transition-colors ${c.id === activeConv ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-50"}`}>
              {c.title}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-[#FAFAFA]">
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center">
              <RuntuLogo variant="header" className="!w-12 !h-12" />
              <h2 className="text-xl text-gray-900 mt-5" style={{ fontWeight: 700 }}>Tu copiloto de marketing</h2>
              <p className="text-gray-400 mt-2 text-center max-w-lg text-sm">
                Preguntame sobre scraping, sentimiento, engagement, presupuestos o cualquier problema de marketing.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-6 max-w-lg w-full">
                {suggestions.map(s => (
                  <button key={s.text} onClick={() => sendMessage(s.text)}
                    className="flex items-center gap-2.5 text-left text-sm border border-gray-200 text-gray-500 rounded-xl px-4 py-3 hover:bg-white hover:border-gray-300 hover:text-gray-700 transition-all bg-white">
                    <s.icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span>{s.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                    m.role === "user" ? "bg-gray-900 text-white rounded-br-sm" : "bg-white border border-gray-200 text-gray-700 shadow-sm"
                  }`} style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
                </div>
              ))}
              {streaming && <div className="flex justify-start"><div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm"><span className="animate-pulse text-gray-400">|</span></div></div>}
              {!streaming && messages.length > 0 && messages[messages.length - 1].role === "assistant" && (
                <div className="flex gap-2 flex-wrap">
                  {["Profundiza en esto", "Muestra en grafica", "Lleva al calendario"].map(s => (
                    <button key={s} onClick={() => sendMessage(s)}
                      className="text-[10px] border border-gray-200 text-gray-500 rounded-full px-3 py-1.5 hover:bg-white hover:border-gray-300 transition-colors flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />{s}
                    </button>
                  ))}
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 bg-white">
          <div className="max-w-3xl mx-auto flex gap-2">
            <textarea value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Pregunta sobre tu marketing..." rows={1}
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 text-sm focus:border-gray-400 focus:ring-2 focus:ring-gray-200 outline-none resize-none transition-all" />
            {streaming ? (
              <button onClick={() => setStreaming(false)} className="w-12 h-12 rounded-xl bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-100 transition-colors"><Square className="w-4 h-4" /></button>
            ) : (
              <button onClick={() => sendMessage()} className="w-12 h-12 rounded-xl bg-gray-900 text-white flex items-center justify-center hover:bg-gray-800 transition-all"><Send className="w-4 h-4" /></button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
