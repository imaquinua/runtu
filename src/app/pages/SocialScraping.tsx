import { useEffect, useState } from "react";
import {
  Plus, Radar, Hash, User, Search as SearchIcon, Trash2, Pause, Play,
  TrendingUp, TrendingDown, AlertTriangle, Loader2, X, ExternalLink,
  MessageSquare, Sparkles, Radio, Globe,
} from "lucide-react";
import { useNavigate } from "react-router";
import { listJobs, createJob, getJob, deleteJob, updateJob, type JobDetail } from "../../lib/scraping/client";
import type { ScrapingJob, ScrapingJobType, ScrapingPlatform } from "../../lib/scraping/types";
import { SUPPORTED_PLATFORMS } from "../../lib/scraping/actors";

const PLATFORM_LABELS: Record<ScrapingPlatform, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  x: "X",
  reddit: "Reddit",
  "google-serp": "Google",
};

const PLATFORM_COLORS: Record<ScrapingPlatform, string> = {
  instagram: "#E1306C",
  tiktok: "#6d28d9",
  x: "#111827",
  reddit: "#FF4500",
  "google-serp": "#4285F4",
};

const TYPE_ICONS: Record<ScrapingJobType, typeof Hash> = {
  hashtag: Hash,
  account: User,
  keyword: SearchIcon,
};

function formatRelative(iso: string | null): string {
  if (!iso) return "—";
  const diffMin = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMin < 1) return "ahora";
  if (diffMin < 60) return `${diffMin}m`;
  const h = Math.floor(diffMin / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function SentimentDot({ sentiment }: { sentiment: string | null }) {
  const color =
    sentiment === "positive" ? "#10b981" : sentiment === "negative" ? "#ef4444" : sentiment === "neutral" ? "#6b7280" : "#d1d5db";
  return <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />;
}

// ==========================================================================
// Modal: crear nuevo job
// ==========================================================================
function CreateJobModal({ onClose, onCreated }: { onClose: () => void; onCreated: (j: ScrapingJob) => void }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<ScrapingJobType>("hashtag");
  const [platforms, setPlatforms] = useState<ScrapingPlatform[]>(["instagram", "tiktok"]);
  const [schedule, setSchedule] = useState<"manual" | "hourly" | "daily">("manual");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const togglePlatform = (p: ScrapingPlatform) => {
    setPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  };

  const handleSubmit = async () => {
    setError(null);
    if (!query.trim()) return setError("Escribe el query");
    if (!platforms.length) return setError("Selecciona al menos una plataforma");
    setLoading(true);
    try {
      const job = await createJob({ query: query.trim(), type, platforms, schedule });
      onCreated(job);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error creando job");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg text-gray-900" style={{ fontWeight: 700 }}>Nuevo Social Scraping</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-gray-500 text-xs mb-1.5 block" style={{ fontWeight: 600 }}>Tipo</label>
            <div className="grid grid-cols-3 gap-2">
              {(["hashtag", "account", "keyword"] as ScrapingJobType[]).map((t) => {
                const Icon = TYPE_ICONS[t];
                return (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs transition-colors ${
                      type === t ? "bg-gray-900 text-white border-gray-900" : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                    style={{ fontWeight: 600 }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {t === "hashtag" ? "Hashtag" : t === "account" ? "Cuenta" : "Keyword"}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-gray-500 text-xs mb-1.5 block" style={{ fontWeight: 600 }}>Query</label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={type === "hashtag" ? "#skincaremexicano" : type === "account" ? "@competidor_mx" : "receta natural"}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-gray-400 focus:ring-2 focus:ring-gray-200 outline-none"
            />
          </div>

          <div>
            <label className="text-gray-500 text-xs mb-1.5 block" style={{ fontWeight: 600 }}>Plataformas</label>
            <div className="flex flex-wrap gap-2">
              {SUPPORTED_PLATFORMS.map((p) => {
                const active = platforms.includes(p);
                return (
                  <button
                    key={p}
                    onClick={() => togglePlatform(p)}
                    className={`px-3 py-1.5 rounded-full border text-xs transition-colors ${
                      active
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                    style={{ fontWeight: 600 }}
                  >
                    {PLATFORM_LABELS[p]}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-gray-500 text-xs mb-1.5 block" style={{ fontWeight: 600 }}>Frecuencia</label>
            <select
              value={schedule}
              onChange={(e) => setSchedule(e.target.value as typeof schedule)}
              className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm"
            >
              <option value="manual">Manual (una vez)</option>
              <option value="hourly">Cada hora</option>
              <option value="daily">Diario</option>
            </select>
          </div>

          {error && <p className="text-red-500 text-xs">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button
              onClick={onClose}
              className="flex-1 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl py-2.5 text-sm"
              style={{ fontWeight: 600 }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white rounded-xl py-2.5 text-sm flex items-center justify-center gap-2"
              style={{ fontWeight: 600 }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {loading ? "Creando..." : "Crear y ejecutar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================================================
// Vista detalle de un job
// ==========================================================================
function JobDetailView({ jobId, onBack, onDeleted }: { jobId: string; onBack: () => void; onDeleted: () => void }) {
  const navigate = useNavigate();
  const [detail, setDetail] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "positive" | "neutral" | "negative">("all");

  useEffect(() => {
    getJob(jobId).then((d) => { setDetail(d); setLoading(false); }).catch(() => setLoading(false));
    const int = setInterval(() => getJob(jobId).then(setDetail).catch(() => {}), 15000);
    return () => clearInterval(int);
  }, [jobId]);

  const handleDelete = async () => {
    if (!confirm("¿Eliminar este job y todas sus menciones?")) return;
    await deleteJob(jobId);
    onDeleted();
  };

  const handleToggleStatus = async () => {
    if (!detail) return;
    const newStatus = detail.job.status === "active" ? "paused" : "active";
    const updated = await updateJob(jobId, { status: newStatus });
    setDetail({ ...detail, job: updated });
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 text-gray-400 animate-spin" /></div>;
  if (!detail) return <div className="p-8 text-gray-400">No se pudo cargar</div>;

  const { job, mentions, narratives, runs } = detail;
  const filteredMentions = filter === "all" ? mentions : mentions.filter((m) => m.sentiment === filter);

  const sentimentBreakdown = {
    positive: mentions.filter((m) => m.sentiment === "positive").length,
    neutral: mentions.filter((m) => m.sentiment === "neutral").length,
    negative: mentions.filter((m) => m.sentiment === "negative").length,
  };

  const Icon = TYPE_ICONS[job.type];
  const pendingEnrich = mentions.filter((m) => !m.sentiment).length;

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-20 lg:pb-8 space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <button onClick={onBack} className="text-gray-500 hover:text-gray-900 text-sm flex items-center gap-1 mb-2">
            ← Volver
          </button>
          <h1 className="text-2xl md:text-3xl text-gray-900 tracking-tight flex items-center gap-2" style={{ fontWeight: 900 }}>
            <Icon className="w-6 h-6 text-gray-500" /> {job.query}
          </h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={`text-[10px] px-2 py-1 rounded-full ${
              job.status === "active" ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"
            }`} style={{ fontWeight: 600 }}>
              {job.status === "active" ? "● Activo" : "⏸ Pausado"}
            </span>
            {job.platforms.map((p) => (
              <span key={p} className="text-[10px] text-gray-500 bg-gray-100 px-2 py-1 rounded-full" style={{ fontWeight: 500 }}>
                {PLATFORM_LABELS[p]}
              </span>
            ))}
            <span className="text-[10px] text-gray-400">Última corrida: {formatRelative(job.last_run_at)}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleToggleStatus} className="w-9 h-9 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-50">
            {job.status === "active" ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button onClick={handleDelete} className="w-9 h-9 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-red-400 hover:bg-red-50">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200/80 rounded-2xl p-4">
          <p className="text-gray-400 text-[10px] uppercase tracking-wider">Menciones</p>
          <p className="text-2xl text-gray-900 mt-0.5 font-mono" style={{ fontWeight: 900 }}>{mentions.length}</p>
          <p className="text-gray-400 text-[10px] mt-0.5">{pendingEnrich > 0 ? `${pendingEnrich} procesando` : "Todas analizadas"}</p>
        </div>
        <div className="bg-white border border-gray-200/80 rounded-2xl p-4">
          <p className="text-gray-400 text-[10px] uppercase tracking-wider">Positivas</p>
          <p className="text-2xl text-emerald-600 mt-0.5 font-mono" style={{ fontWeight: 900 }}>{sentimentBreakdown.positive}</p>
          <p className="text-gray-400 text-[10px] mt-0.5">{mentions.length > 0 ? Math.round(sentimentBreakdown.positive / mentions.length * 100) : 0}%</p>
        </div>
        <div className="bg-white border border-gray-200/80 rounded-2xl p-4">
          <p className="text-gray-400 text-[10px] uppercase tracking-wider">Negativas</p>
          <p className="text-2xl text-red-500 mt-0.5 font-mono" style={{ fontWeight: 900 }}>{sentimentBreakdown.negative}</p>
          <p className="text-gray-400 text-[10px] mt-0.5">{mentions.length > 0 ? Math.round(sentimentBreakdown.negative / mentions.length * 100) : 0}%</p>
        </div>
        <div className="bg-white border border-gray-200/80 rounded-2xl p-4">
          <p className="text-gray-400 text-[10px] uppercase tracking-wider">Narrativas</p>
          <p className="text-2xl text-gray-900 mt-0.5 font-mono" style={{ fontWeight: 900 }}>{narratives.length}</p>
          <p className="text-gray-400 text-[10px] mt-0.5">Clusters activos</p>
        </div>
      </div>

      {/* Narrativas (el diferenciador) */}
      {narratives.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h3 className="text-gray-900 text-sm" style={{ fontWeight: 700 }}>Narrativas Emergentes</h3>
            <span className="text-gray-400 text-xs">· Clusters con sentimiento y tasa de crecimiento</span>
          </div>
          <div className="space-y-3">
            {narratives.map((n) => {
              const isSpike = n.growth_rate > 2;
              const isNeg = n.sentiment_score < -0.2;
              return (
                <div
                  key={n.id}
                  className={`rounded-2xl p-4 border ${
                    isNeg && isSpike ? "bg-red-50/50 border-red-200"
                    : isSpike ? "bg-amber-50/50 border-amber-200"
                    : "bg-white border-gray-200/80"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {isNeg ? <AlertTriangle className="w-4 h-4 text-red-500" /> : isSpike ? <TrendingUp className="w-4 h-4 text-amber-500" /> : <Radar className="w-4 h-4 text-gray-400" />}
                        <h4 className="text-gray-900 text-sm" style={{ fontWeight: 700 }}>{n.title}</h4>
                      </div>
                      <p className="text-gray-600 text-sm">{n.summary}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-gray-900 font-mono text-sm" style={{ fontWeight: 700 }}>{n.mention_count}</p>
                      <p className="text-[10px] text-gray-400">menciones</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-[11px]">
                    <span className={`flex items-center gap-1 ${n.growth_rate > 1 ? "text-emerald-600" : "text-gray-500"}`}>
                      {n.growth_rate > 1 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      <span className="font-mono">{n.growth_rate.toFixed(1)}x</span> 6h
                    </span>
                    <span className="flex items-center gap-1 text-gray-500">
                      <SentimentDot sentiment={n.sentiment_score > 0.2 ? "positive" : n.sentiment_score < -0.2 ? "negative" : "neutral"} />
                      <span className="font-mono">{n.sentiment_score.toFixed(2)}</span>
                    </span>
                    <button onClick={() => navigate("/app/chat")} className="ml-auto text-gray-700 hover:text-gray-900 flex items-center gap-1" style={{ fontWeight: 600 }}>
                      <MessageSquare className="w-3 h-3" /> Explorar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filtros + menciones */}
      <div>
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <h3 className="text-gray-900 text-sm mr-2" style={{ fontWeight: 700 }}>Menciones en vivo</h3>
          {(["all", "positive", "neutral", "negative"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1 rounded-full transition-colors ${
                filter === f ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
              style={{ fontWeight: 600 }}
            >
              {f === "all" ? "Todas" : f === "positive" ? "Positivas" : f === "negative" ? "Negativas" : "Neutrales"}
            </button>
          ))}
        </div>

        {filteredMentions.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-10 text-center">
            <Radar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Aún no hay menciones procesadas.</p>
            <p className="text-gray-400 text-xs mt-1">
              {runs.filter((r) => r.status === "running").length > 0
                ? "Scrapers corriendo en Apify..."
                : "Espera unos minutos o revisa tu APIFY_TOKEN."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredMentions.slice(0, 50).map((m) => (
              <a
                key={m.id}
                href={m.url ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-white border border-gray-200/80 rounded-xl p-3 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <SentimentDot sentiment={m.sentiment} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-[11px] mb-1">
                      <span className="rounded-full px-1.5 py-0.5 text-[10px]" style={{ backgroundColor: PLATFORM_COLORS[m.platform as ScrapingPlatform] + "15", color: PLATFORM_COLORS[m.platform as ScrapingPlatform] }}>
                        {PLATFORM_LABELS[m.platform as ScrapingPlatform] ?? m.platform}
                      </span>
                      {m.author && <span className="text-gray-600" style={{ fontWeight: 600 }}>@{m.author}</span>}
                      <span className="text-gray-400">· {formatRelative(m.posted_at)}</span>
                      {m.url && <ExternalLink className="w-3 h-3 text-gray-300 ml-auto" />}
                    </div>
                    <p className="text-gray-700 text-sm line-clamp-2">{m.text}</p>
                    {m.topics && m.topics.length > 0 && (
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        {m.topics.slice(0, 4).map((t) => (
                          <span key={t} className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================================================
// Lista principal de jobs
// ==========================================================================
export function SocialScraping() {
  const [jobs, setJobs] = useState<ScrapingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = async () => {
    try {
      const data = await listJobs();
      setJobs(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, []);

  if (selectedId) {
    return (
      <JobDetailView
        jobId={selectedId}
        onBack={() => { setSelectedId(null); reload(); }}
        onDeleted={() => { setSelectedId(null); reload(); }}
      />
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-20 lg:pb-8 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-col md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl md:text-3xl text-gray-900 tracking-tight" style={{ fontWeight: 900 }}>Social Scraping</h1>
          <p className="text-gray-400 text-sm mt-1">Monitorea hashtags, cuentas y keywords en redes sociales con análisis de narrativas vía IA.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl px-5 py-2.5 text-sm transition-all hover:shadow-lg"
          style={{ fontWeight: 600 }}
        >
          <Plus className="w-4 h-4" /> Nuevo scraping
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-gray-400 animate-spin" /></div>
      ) : jobs.length === 0 ? (
        <div className="bg-gradient-to-br from-amber-50 to-white border border-amber-200 rounded-2xl p-8 md:p-10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Radar className="w-6 h-6 text-amber-700" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl text-gray-900" style={{ fontWeight: 700 }}>Empieza a escuchar la conversación</h2>
              <p className="text-gray-600 text-sm mt-2 max-w-lg">
                Crea tu primer scraping para monitorear qué están diciendo sobre tu marca, competidores o categoría.
                Runtu clasifica cada mención y detecta narrativas emergentes.
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="mt-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl px-5 py-2.5 text-sm flex items-center gap-2"
                style={{ fontWeight: 600 }}
              >
                <Plus className="w-4 h-4" /> Crear el primero
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {jobs.map((j) => {
            const Icon = TYPE_ICONS[j.type];
            return (
              <button
                key={j.id}
                onClick={() => setSelectedId(j.id)}
                className="text-left bg-white border border-gray-200/80 rounded-2xl p-4 hover:border-gray-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 text-sm truncate" style={{ fontWeight: 600 }}>{j.query}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${j.status === "active" ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"}`} style={{ fontWeight: 600 }}>
                        {j.status === "active" ? "Activo" : "Pausado"}
                      </span>
                      <span className="text-[10px] text-gray-400">{j.platforms.length} plataforma{j.platforms.length > 1 ? "s" : ""}</span>
                      <span className="text-[10px] text-gray-400">· {formatRelative(j.last_run_at)}</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {showModal && (
        <CreateJobModal
          onClose={() => setShowModal(false)}
          onCreated={(j) => { setJobs((p) => [j, ...p]); setSelectedId(j.id); }}
        />
      )}

      <div className="mt-8 bg-gray-50 border border-gray-200 rounded-2xl p-4 text-xs text-gray-500 flex items-start gap-3">
        <Radio className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-gray-700" style={{ fontWeight: 600 }}>¿Cómo funciona?</p>
          <p className="mt-1">Runtu usa <span className="font-mono">Apify</span> para recolectar menciones de redes sociales, las clasifica con <span className="font-mono">Gemini</span> (sentimiento + temas) y agrupa menciones similares en <span className="font-mono">narrativas emergentes</span>. Cuando una narrativa crece rápido y es emocionalmente significativa, genera una alerta.</p>
        </div>
      </div>
    </div>
  );
}
