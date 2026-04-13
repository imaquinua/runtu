import { useState } from "react";
import { Globe, Plus, Play, ExternalLink, Download, ThumbsUp, ThumbsDown, Minus, Clock, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface ScrapeTarget {
  id: string; url: string; name: string; type: "competitor" | "news" | "review" | "forum";
  frequency: string; lastScrape: string; status: "active" | "error" | "paused";
  pages: number; sentimentScore: number;
}

const mockTargets: ScrapeTarget[] = [
  { id: "1", url: "competidor.com.mx", name: "Competidor Principal", type: "competitor", frequency: "Diario", lastScrape: "Hace 30 min", status: "active", pages: 234, sentimentScore: 68 },
  { id: "2", url: "beautylatam.com/reviews", name: "Reviews del Sector", type: "review", frequency: "Cada 6h", lastScrape: "Hace 2h", status: "active", pages: 567, sentimentScore: 75 },
  { id: "3", url: "reddit.com/r/skincarelatam", name: "Foro Skincare LATAM", type: "forum", frequency: "Cada 12h", lastScrape: "Hace 5h", status: "active", pages: 1203, sentimentScore: 62 },
  { id: "4", url: "elfinanciero.com/negocios", name: "Noticias Industria", type: "news", frequency: "Diario", lastScrape: "Hace 8h", status: "error", pages: 89, sentimentScore: 55 },
];

const typeLabels = { competitor: "Competidor", news: "Noticias", review: "Reviews", forum: "Foro" };
const typeColors = { competitor: "#ef4444", news: "#6366f1", review: "#f59e0b", forum: "#10b981" };

const keywordTrend = [
  { day: "L", organico: 12, vegano: 8, natural: 15, precio: 6 },
  { day: "M", organico: 15, vegano: 10, natural: 18, precio: 9 },
  { day: "X", organico: 20, vegano: 14, natural: 22, precio: 7 },
  { day: "J", organico: 18, vegano: 12, natural: 19, precio: 11 },
  { day: "V", organico: 25, vegano: 16, natural: 28, precio: 8 },
  { day: "S", organico: 30, vegano: 20, natural: 35, precio: 5 },
  { day: "D", organico: 22, vegano: 15, natural: 25, precio: 7 },
];

const recentFindings = [
  { id: "f1", source: "competidor.com.mx", title: "Competidor lanzo nueva linea de serums con vitamina C", sentiment: "neutral" as const, time: "Hace 1h", impact: "alto" },
  { id: "f2", source: "beautylatam.com", title: "Review positiva de tu producto en top 5 humectantes del mes", sentiment: "positive" as const, time: "Hace 3h", impact: "alto" },
  { id: "f3", source: "reddit.com", title: "Hilo viral comparando marcas mexicanas vs coreanas (850 upvotes)", sentiment: "neutral" as const, time: "Hace 5h", impact: "medio" },
  { id: "f4", source: "elfinanciero.com", title: "Regulacion COFEPRIS: nuevos requisitos para cosmeticos importados", sentiment: "negative" as const, time: "Hace 8h", impact: "alto" },
  { id: "f5", source: "beautylatam.com", title: "Tendencia 2026: consumidores priorizan empaques sustentables", sentiment: "positive" as const, time: "Hace 12h", impact: "medio" },
];

const sentimentIcon = { positive: ThumbsUp, negative: ThumbsDown, neutral: Minus };
const sentimentColor = { positive: "text-emerald-500", negative: "text-red-400", neutral: "text-gray-400" };
const tt = { backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, color: "#111", fontSize: 12 };

export function WebScraping() {
  const [selectedTarget, setSelectedTarget] = useState<string>("1");
  const [showNew, setShowNew] = useState(false);

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-20 lg:pb-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl text-gray-900 tracking-tight" style={{ fontWeight: 900 }}>Web Scraping</h1>
          <p className="text-gray-400 text-sm mt-1">Monitorea competidores, reviews, noticias y foros con analisis de sentimiento</p>
        </div>
        <button onClick={() => setShowNew(!showNew)} className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl px-5 py-2.5 transition-all" style={{ fontWeight: 600 }}>
          <Plus className="w-4 h-4" /> Nuevo Target
        </button>
      </div>

      {showNew && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3 shadow-sm">
          <h3 className="text-gray-700 text-sm" style={{ fontWeight: 700 }}>Agregar Sitio Web</h3>
          <div className="flex flex-col md:flex-row gap-3">
            <input placeholder="https://ejemplo.com" className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 text-sm focus:border-gray-400 outline-none" />
            <select className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-700 text-sm outline-none">
              <option>Competidor</option><option>Noticias</option><option>Reviews</option><option>Foro</option>
            </select>
            <select className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-700 text-sm outline-none">
              <option>Cada hora</option><option>Cada 6h</option><option>Diario</option>
            </select>
            <button onClick={() => setShowNew(false)} className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl px-5 py-2.5 text-sm" style={{ fontWeight: 600 }}>Iniciar</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {mockTargets.map(t => {
          const active = t.id === selectedTarget;
          return (
            <button key={t.id} onClick={() => setSelectedTarget(t.id)}
              className={`text-left bg-white border rounded-2xl p-4 transition-all ${active ? "border-gray-900 shadow-sm" : "border-gray-200/80 hover:border-gray-300"}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] px-2 py-0.5 rounded-full border" style={{ color: typeColors[t.type], backgroundColor: typeColors[t.type] + "10", borderColor: typeColors[t.type] + "30" }}>{typeLabels[t.type]}</span>
                {t.status === "error" ? <AlertTriangle className="w-3.5 h-3.5 text-red-400" /> : t.status === "active" ? <div className="w-2 h-2 rounded-full bg-emerald-400" /> : <div className="w-2 h-2 rounded-full bg-amber-400" />}
              </div>
              <p className="text-gray-700 text-sm truncate" style={{ fontWeight: 600 }}>{t.name}</p>
              <p className="text-gray-400 text-xs mt-0.5 truncate flex items-center gap-1"><Globe className="w-3 h-3" />{t.url}</p>
              <div className="flex items-center justify-between mt-3 text-[10px]">
                <span className="text-gray-400"><Clock className="w-3 h-3 inline mr-1" />{t.frequency}</span>
                <span className="text-gray-700 font-mono" style={{ fontWeight: 600 }}>{t.pages} pags</span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-400" style={{ width: `${t.sentimentScore}%` }} />
                </div>
                <span className="text-[10px] text-gray-400 font-mono">{t.sentimentScore}%</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="bg-white border border-gray-200/80 rounded-2xl p-5">
        <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-4" style={{ fontWeight: 600 }}>Tendencia de Keywords (7 dias)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={keywordTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="day" stroke="#d1d5db" tick={{ fontSize: 11, fill: "#9ca3af" }} />
            <YAxis stroke="#d1d5db" tick={{ fontSize: 11, fill: "#9ca3af" }} />
            <Tooltip contentStyle={tt} />
            <Bar dataKey="organico" fill="#10b981" radius={[2, 2, 0, 0]} stackId="a" />
            <Bar dataKey="vegano" fill="#6366f1" radius={[2, 2, 0, 0]} stackId="a" />
            <Bar dataKey="natural" fill="#111827" radius={[2, 2, 0, 0]} stackId="a" />
            <Bar dataKey="precio" fill="#ef4444" radius={[4, 4, 0, 0]} stackId="a" />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 justify-center mt-3">
          {[{ k: "organico", c: "#10b981" }, { k: "vegano", c: "#6366f1" }, { k: "natural", c: "#111827" }, { k: "precio", c: "#ef4444" }].map(l => (
            <span key={l.k} className="flex items-center gap-1.5 text-[10px] text-gray-400">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: l.c }} />{l.k}
            </span>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200/80 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-gray-400 text-xs uppercase tracking-wider" style={{ fontWeight: 600 }}>Hallazgos Recientes</h3>
          <button className="text-gray-900 text-xs hover:underline flex items-center gap-1" style={{ fontWeight: 600 }}><Download className="w-3 h-3" /> Exportar</button>
        </div>
        <div className="space-y-2.5">
          {recentFindings.map(f => {
            const SIcon = sentimentIcon[f.sentiment];
            return (
              <div key={f.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                <SIcon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${sentimentColor[f.sentiment]}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-gray-600 text-sm">{f.title}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-gray-400 text-[10px] flex items-center gap-1"><Globe className="w-3 h-3" />{f.source}</span>
                    <span className="text-gray-300 text-[10px]">{f.time}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${f.impact === "alto" ? "bg-amber-50 text-amber-600" : "bg-gray-50 text-gray-400"}`} style={{ fontWeight: 600 }}>Impacto {f.impact}</span>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-gray-200 group-hover:text-gray-400 transition-colors flex-shrink-0 mt-1" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
