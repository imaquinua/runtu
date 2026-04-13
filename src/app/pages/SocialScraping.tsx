import { useState } from "react";
import { Search, Plus, Play, Hash, AtSign, Eye, ThumbsUp, ThumbsDown, Minus } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

interface ScrapingJob {
  id: string; query: string; type: "hashtag" | "account" | "keyword";
  platforms: string[]; status: "active" | "paused" | "completed"; results: number;
  sentiment: { pos: number; neu: number; neg: number }; lastRun: string;
}

const mockJobs: ScrapingJob[] = [
  { id: "1", query: "#skincaremexicano", type: "hashtag", platforms: ["Instagram", "TikTok"], status: "active", results: 2847, sentiment: { pos: 58, neu: 28, neg: 14 }, lastRun: "Hace 5 min" },
  { id: "2", query: "@competidor_mx", type: "account", platforms: ["Instagram", "Facebook", "TikTok"], status: "active", results: 1253, sentiment: { pos: 42, neu: 35, neg: 23 }, lastRun: "Hace 15 min" },
  { id: "3", query: "cosmetica natural mexico", type: "keyword", platforms: ["TikTok", "LinkedIn", "Google"], status: "paused", results: 5621, sentiment: { pos: 65, neu: 22, neg: 13 }, lastRun: "Hace 2h" },
  { id: "4", query: "#bellezalatina", type: "hashtag", platforms: ["Instagram", "TikTok", "Facebook"], status: "completed", results: 8432, sentiment: { pos: 71, neu: 19, neg: 10 }, lastRun: "Hace 1 dia" },
];

const volumeData = [
  { hour: "00", mentions: 45 }, { hour: "04", mentions: 12 }, { hour: "08", mentions: 120 },
  { hour: "10", mentions: 230 }, { hour: "12", mentions: 310 }, { hour: "14", mentions: 280 },
  { hour: "16", mentions: 350 }, { hour: "18", mentions: 420 }, { hour: "20", mentions: 380 }, { hour: "22", mentions: 190 },
];

const platformBreakdown = [
  { name: "Instagram", value: 38, color: "#E1306C" },
  { name: "TikTok", value: 32, color: "#6d28d9" },
  { name: "Facebook", value: 18, color: "#1877F2" },
  { name: "LinkedIn", value: 8, color: "#0A66C2" },
  { name: "Google", value: 4, color: "#4285F4" },
];

const sentimentTimeline = [
  { day: "Lun", positivo: 62, neutral: 25, negativo: 13 },
  { day: "Mar", positivo: 58, neutral: 28, negativo: 14 },
  { day: "Mie", positivo: 65, neutral: 22, negativo: 13 },
  { day: "Jue", positivo: 55, neutral: 30, negativo: 15 },
  { day: "Vie", positivo: 70, neutral: 20, negativo: 10 },
  { day: "Sab", positivo: 72, neutral: 18, negativo: 10 },
  { day: "Dom", positivo: 68, neutral: 22, negativo: 10 },
];

const mockMentions = [
  { id: "m1", platform: "TikTok", user: "@beautylatam", text: "Probando esta marca de skincare mexicano y WOW los resultados son increibles!", sentiment: "positive" as const, engagement: "12.4K", time: "Hace 23 min" },
  { id: "m2", platform: "Instagram", user: "@skincare_review", text: "Llevo 2 semanas usando el serum y no veo mucho cambio. El precio es algo elevado.", sentiment: "negative" as const, engagement: "890", time: "Hace 1h" },
  { id: "m3", platform: "Facebook", user: "Maria G.", text: "Alguien ha probado la linea nueva? Quiero opiniones reales.", sentiment: "neutral" as const, engagement: "234", time: "Hace 2h" },
  { id: "m4", platform: "TikTok", user: "@glow.routine", text: "RUTINA DE NOCHE con productos mexicanos! El humectante es mi favorito absoluto", sentiment: "positive" as const, engagement: "45.2K", time: "Hace 3h" },
  { id: "m5", platform: "LinkedIn", user: "Carlos V.", text: "La industria cosmetica mexicana crece 23% YoY. Las marcas independientes lideran.", sentiment: "positive" as const, engagement: "1.2K", time: "Hace 5h" },
];

const typeIcon = { hashtag: Hash, account: AtSign, keyword: Search };
const statusConfig = {
  active: { label: "Activo", cls: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  paused: { label: "Pausado", cls: "text-amber-600 bg-amber-50 border-amber-200" },
  completed: { label: "Completo", cls: "text-gray-500 bg-gray-50 border-gray-200" },
};
const sentimentIcon = { positive: ThumbsUp, negative: ThumbsDown, neutral: Minus };
const sentimentColor = { positive: "text-emerald-500", negative: "text-red-400", neutral: "text-gray-400" };

const tt = { backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, color: "#111", fontSize: 12 };

export function SocialScraping() {
  const [selectedJob, setSelectedJob] = useState<string | null>("1");
  const [showNewModal, setShowNewModal] = useState(false);
  const [newQuery, setNewQuery] = useState("");
  const [newType, setNewType] = useState<"hashtag" | "account" | "keyword">("hashtag");
  const [filterSentiment, setFilterSentiment] = useState<"all" | "positive" | "negative" | "neutral">("all");

  const activeJob = mockJobs.find(j => j.id === selectedJob);
  const filteredMentions = filterSentiment === "all" ? mockMentions : mockMentions.filter(m => m.sentiment === filterSentiment);

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-20 lg:pb-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl text-gray-900 tracking-tight" style={{ fontWeight: 900 }}>Social Scraping</h1>
          <p className="text-gray-400 text-sm mt-1">Monitoreo en tiempo real con clasificacion de sentimiento y keywords</p>
        </div>
        <button onClick={() => setShowNewModal(!showNewModal)} className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl px-5 py-2.5 transition-all" style={{ fontWeight: 600 }}>
          <Plus className="w-4 h-4" /> Nuevo Scraping
        </button>
      </div>

      {showNewModal && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 shadow-sm">
          <h3 className="text-gray-700 text-sm" style={{ fontWeight: 700 }}>Configurar Nuevo Scraping</h3>
          <div className="flex gap-2">
            {(["hashtag", "account", "keyword"] as const).map(t => {
              const Icon = typeIcon[t];
              return (
                <button key={t} onClick={() => setNewType(t)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors border ${
                    newType === t ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-500 border-gray-200"
                  }`} style={{ fontWeight: 600 }}>
                  <Icon className="w-3 h-3" />{t === "hashtag" ? "Hashtag" : t === "account" ? "Cuenta" : "Keyword"}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2">
            <input value={newQuery} onChange={e => setNewQuery(e.target.value)}
              placeholder={newType === "hashtag" ? "#tuhashtag" : newType === "account" ? "@cuenta" : "palabra clave"}
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 text-sm focus:border-gray-400 focus:ring-2 focus:ring-gray-200 outline-none" />
            <button onClick={() => setShowNewModal(false)} className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl px-5 py-2.5 text-sm transition-all" style={{ fontWeight: 600 }}>
              <Play className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {mockJobs.map(job => {
          const Icon = typeIcon[job.type];
          const sc = statusConfig[job.status];
          const active = job.id === selectedJob;
          return (
            <button key={job.id} onClick={() => setSelectedJob(job.id)}
              className={`text-left bg-white border rounded-2xl p-4 transition-all ${
                active ? "border-gray-900 shadow-sm" : "border-gray-200/80 hover:border-gray-300"
              }`}>
              <div className="flex items-center justify-between mb-2">
                <Icon className="w-4 h-4 text-gray-900" />
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${sc.cls}`} style={{ fontWeight: 600 }}>{sc.label}</span>
              </div>
              <p className="text-gray-700 text-sm truncate" style={{ fontWeight: 600 }}>{job.query}</p>
              <p className="text-gray-400 text-xs mt-1">{job.platforms.join(" · ")}</p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-gray-900 text-sm font-mono" style={{ fontWeight: 700 }}>{job.results.toLocaleString()}</span>
                <span className="text-gray-400 text-[10px]">{job.lastRun}</span>
              </div>
              <div className="flex h-1.5 rounded-full overflow-hidden mt-2 gap-0.5">
                <div className="bg-emerald-400 rounded-full" style={{ width: `${job.sentiment.pos}%` }} />
                <div className="bg-indigo-400 rounded-full" style={{ width: `${job.sentiment.neu}%` }} />
                <div className="bg-red-400 rounded-full" style={{ width: `${job.sentiment.neg}%` }} />
              </div>
            </button>
          );
        })}
      </div>

      {activeJob && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white border border-gray-200/80 rounded-2xl p-5">
              <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-4" style={{ fontWeight: 600 }}>Volumen de Menciones (24h) — {activeJob.query}</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={volumeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="hour" stroke="#d1d5db" tick={{ fontSize: 10, fill: "#9ca3af" }} />
                  <YAxis stroke="#d1d5db" tick={{ fontSize: 10, fill: "#9ca3af" }} />
                  <Tooltip contentStyle={tt} />
                  <Bar dataKey="mentions" fill="#111827" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white border border-gray-200/80 rounded-2xl p-5">
              <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-2" style={{ fontWeight: 600 }}>Por Plataforma</h3>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={platformBreakdown} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value" stroke="none">
                    {platformBreakdown.map(p => <Cell key={p.name} fill={p.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tt} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-1">
                {platformBreakdown.map(p => (
                  <div key={p.name} className="flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                      <span className="text-gray-500">{p.name}</span>
                    </span>
                    <span className="text-gray-700 font-mono" style={{ fontWeight: 600 }}>{p.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200/80 rounded-2xl p-5">
            <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-4" style={{ fontWeight: 600 }}>Evolucion de Sentimiento (7 dias)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={sentimentTimeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" stroke="#d1d5db" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                <YAxis stroke="#d1d5db" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                <Tooltip contentStyle={tt} />
                <Line type="monotone" dataKey="positivo" stroke="#10b981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="neutral" stroke="#6366f1" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="negativo" stroke="#ef4444" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200/80 rounded-2xl p-5">
              <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-4" style={{ fontWeight: 600 }}>Top Keywords</h3>
              <div className="space-y-2">
                {[
                  { kw: "natural", count: 842, sentiment: "positive" as const },
                  { kw: "receta", count: 621, sentiment: "positive" as const },
                  { kw: "precio", count: 534, sentiment: "neutral" as const },
                  { kw: "piel", count: 498, sentiment: "positive" as const },
                  { kw: "envio", count: 312, sentiment: "negative" as const },
                  { kw: "organico", count: 287, sentiment: "positive" as const },
                  { kw: "queja", count: 156, sentiment: "negative" as const },
                  { kw: "humectante", count: 143, sentiment: "positive" as const },
                  { kw: "recomendacion", count: 132, sentiment: "positive" as const },
                  { kw: "devolucion", count: 89, sentiment: "negative" as const },
                ].map((k, i) => {
                  const SIcon = sentimentIcon[k.sentiment];
                  return (
                    <div key={k.kw} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                      <span className="text-gray-300 text-[10px] w-4 text-right">{i + 1}</span>
                      <span className="text-gray-700 text-sm flex-1" style={{ fontWeight: 500 }}>{k.kw}</span>
                      <SIcon className={`w-3 h-3 ${sentimentColor[k.sentiment]}`} />
                      <span className="text-gray-400 text-xs font-mono">{k.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-2 bg-white border border-gray-200/80 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-400 text-xs uppercase tracking-wider" style={{ fontWeight: 600 }}>Menciones en Vivo</h3>
                <div className="flex gap-1">
                  {(["all", "positive", "negative", "neutral"] as const).map(f => (
                    <button key={f} onClick={() => setFilterSentiment(f)}
                      className={`text-[10px] px-2 py-1 rounded-md transition-colors ${filterSentiment === f ? "bg-gray-900 text-white" : "text-gray-400 hover:text-gray-600"}`}
                      style={{ fontWeight: 600 }}>
                      {f === "all" ? "Todos" : f === "positive" ? "Pos" : f === "negative" ? "Neg" : "Neu"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-2">
                {filteredMentions.map(m => {
                  const SIcon = sentimentIcon[m.sentiment];
                  return (
                    <div key={m.id} className="p-3 rounded-xl bg-gray-50/50 border border-gray-100 hover:border-gray-200 transition-colors">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500" style={{ fontWeight: 600 }}>{m.platform}</span>
                        <span className="text-gray-600 text-xs" style={{ fontWeight: 600 }}>{m.user}</span>
                        <span className="text-gray-300 text-[10px] ml-auto">{m.time}</span>
                      </div>
                      <p className="text-gray-600 text-sm">{m.text}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className={`flex items-center gap-1 text-[10px] ${sentimentColor[m.sentiment]}`}>
                          <SIcon className="w-3 h-3" /> {m.sentiment === "positive" ? "Positivo" : m.sentiment === "negative" ? "Negativo" : "Neutral"}
                        </span>
                        <span className="flex items-center gap-1 text-gray-400 text-[10px]">
                          <Eye className="w-3 h-3" /> {m.engagement}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
