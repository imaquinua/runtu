import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  MessageSquare, ArrowRight, Radar, BarChart3, Target, Loader2,
  TrendingUp, Upload, Sparkles, Clock, FileText, CheckCircle2,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from "recharts";
import { MetricCard } from "../components/MetricCard";
import { useAuth } from "../../lib/auth-context";
import { getLatestMMMAnalysis, listMMMAnalyses } from "../../lib/mmm/storage";
import { listConversations } from "../../lib/chat/storage";
import type { MMMResult } from "../../lib/mmm/types";

const tt = { backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, color: "#111", fontSize: 12 };

interface DashboardStats {
  mmm: MMMResult | null;
  mmmCount: number;
  conversationCount: number;
  recentConversations: { id: string; title: string; created_at: string }[];
  analysesHistory: { id: string; filename: string; created_at: string; channels: string[] }[];
}

function greetingForHour(): string {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const diffMin = Math.floor((Date.now() - then) / 60000);
  if (diffMin < 1) return "Hace un momento";
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Hace ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `Hace ${diffD}d`;
  return new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

function EmptyStateCard({ onNavigate }: { onNavigate: (path: string) => void }) {
  return (
    <div className="bg-gradient-to-br from-amber-50 to-white border border-amber-200 rounded-2xl p-8 md:p-10">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-6 h-6 text-amber-700" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl text-gray-900" style={{ fontWeight: 700 }}>
            Empecemos con tu primer análisis
          </h2>
          <p className="text-gray-600 text-sm mt-2 max-w-lg">
            Sube tu CSV de inversión publicitaria y ventas, y corre una regresión econométrica real.
            En minutos tendrás claridad sobre qué canal realmente mueve tu negocio.
          </p>
          <div className="flex gap-2 mt-5 flex-wrap">
            <button
              onClick={() => onNavigate("/app/mmm")}
              className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl px-5 py-2.5 text-sm transition-all hover:shadow-lg"
              style={{ fontWeight: 600 }}
            >
              <Upload className="w-4 h-4" /> Subir datos al MMM Engine
            </button>
            <button
              onClick={() => onNavigate("/app/chat")}
              className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl px-5 py-2.5 text-sm transition-colors"
              style={{ fontWeight: 600 }}
            >
              <MessageSquare className="w-4 h-4" /> Hablar con el copiloto
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const navigate = useNavigate();
  const { business, user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!business?.id) { setLoading(false); return; }
    Promise.all([
      getLatestMMMAnalysis(business.id),
      listMMMAnalyses(business.id),
      listConversations(business.id),
    ]).then(([latest, allAnalyses, convs]) => {
      setStats({
        mmm: latest.result,
        mmmCount: allAnalyses.data?.length ?? 0,
        conversationCount: convs.data.length,
        recentConversations: convs.data.slice(0, 3).map((c) => ({
          id: c.id,
          title: c.title,
          created_at: c.created_at,
        })),
        analysesHistory: (allAnalyses.data ?? []).slice(0, 5) as {
          id: string; filename: string; created_at: string; channels: string[];
        }[],
      });
      setLoading(false);
    });
  }, [business?.id]);

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  const mmm = stats?.mmm;
  const userName = (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0] ?? business?.name ?? "";

  // KPIs derivados del MMM
  const topChannel = mmm ? [...mmm.channels].sort((a, b) => b.elasticity - a.elasticity)[0] : null;
  const totalSpend = mmm ? mmm.channels.reduce((s, c) => s + c.totalSpend, 0) : 0;
  const roi = mmm && totalSpend > 0 ? mmm.totalVentas / totalSpend : 0;
  const significantChannels = mmm ? mmm.channels.filter((c) => c.pValue < 0.05).length : 0;

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-20 lg:pb-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl text-gray-900 tracking-tight" style={{ fontWeight: 900 }}>
            {greetingForHour()}{userName ? `, ${userName}` : ""}
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {business?.name ? `${business.name} · ` : ""}
            {new Date().toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
        <button
          onClick={() => navigate("/app/chat")}
          className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl px-5 py-2.5 transition-all hover:shadow-lg"
          style={{ fontWeight: 600 }}
        >
          <MessageSquare className="w-4 h-4" /> Preguntale a Runtu
        </button>
      </div>

      {/* Empty state si no hay MMM */}
      {!mmm && <EmptyStateCard onNavigate={navigate} />}

      {/* KPIs reales si hay MMM */}
      {mmm && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <MetricCard
              label="R² Modelo MMM"
              value={mmm.rSquared.toFixed(2)}
              delta={mmm.rSquared > 0.8 ? "Ajuste excelente" : mmm.rSquared > 0.6 ? "Moderado" : "Débil"}
              deltaType={mmm.rSquared > 0.6 ? "up" : "down"}
            />
            <MetricCard
              label="Canal Estrella"
              value={topChannel?.name ?? "—"}
              delta={topChannel ? `${topChannel.elasticity.toFixed(2)}x elasticidad` : ""}
              deltaType="up"
            />
            <MetricCard
              label="ROI Marketing"
              value={`${roi.toFixed(1)}x`}
              delta={`$${totalSpend.toLocaleString("es-MX")} invertidos`}
              deltaType="up"
            />
            <MetricCard
              label="Canales Significativos"
              value={`${significantChannels}/${mmm.k}`}
              delta={`p-value < 0.05`}
              deltaType={significantChannels >= mmm.k / 2 ? "up" : "down"}
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white border border-gray-200/80 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-gray-400 text-xs uppercase tracking-wider" style={{ fontWeight: 600 }}>
                    Ventas Reales vs Modelo
                  </h3>
                  <p className="text-gray-400 text-[10px] mt-0.5">{mmm.n} semanas · {mmm.filename}</p>
                </div>
                <button
                  onClick={() => navigate("/app/mmm")}
                  className="text-gray-900 text-xs hover:underline flex items-center gap-1"
                  style={{ fontWeight: 600 }}
                >
                  Ver análisis <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={mmm.weeks}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="week" stroke="#d1d5db" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                  <YAxis stroke="#d1d5db" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                  <Tooltip contentStyle={tt} />
                  <Line type="monotone" dataKey="ventas" stroke="#111827" strokeWidth={2.5} dot={{ fill: "#111827", r: 2 }} name="Reales" />
                  <Line type="monotone" dataKey="predicted" stroke="#6366f1" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Modelo" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white border border-gray-200/80 rounded-2xl p-5">
              <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-2" style={{ fontWeight: 600 }}>
                Contribución por Canal
              </h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={mmm.channels} layout="vertical" margin={{ left: 0, right: 10 }}>
                  <XAxis type="number" stroke="#d1d5db" tick={{ fontSize: 10, fill: "#9ca3af" }} unit="%" />
                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke="#d1d5db"
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    width={60}
                  />
                  <Tooltip contentStyle={tt} />
                  <Bar dataKey="contribution" radius={[0, 4, 4, 0]}>
                    {mmm.channels.map((c) => (
                      <Cell key={c.name} fill={c.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Diagnósticos del MMM */}
          {mmm.diagnostics.length > 0 && (
            <div className="bg-white border border-gray-200/80 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-gray-400 text-xs uppercase tracking-wider" style={{ fontWeight: 600 }}>
                  Diagnósticos del Modelo
                </h3>
                <span className="text-[10px] text-gray-400">
                  {mmm.diagnostics.length} insight{mmm.diagnostics.length > 1 ? "s" : ""}
                </span>
              </div>
              <div className="space-y-2">
                {mmm.diagnostics.slice(0, 3).map((d) => (
                  <div
                    key={d.id}
                    className={`rounded-xl p-3 flex items-start gap-3 text-sm ${
                      d.severity === "high"
                        ? "bg-amber-50/50 border border-amber-200"
                        : d.severity === "medium"
                        ? "bg-indigo-50/50 border border-indigo-200"
                        : "bg-gray-50 border border-gray-200"
                    }`}
                  >
                    <TrendingUp
                      className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                        d.severity === "high" ? "text-amber-500" : d.severity === "medium" ? "text-indigo-400" : "text-gray-400"
                      }`}
                    />
                    <p className="text-gray-600 text-xs leading-relaxed">{d.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Actividad reciente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Conversaciones */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 text-xs uppercase tracking-wider" style={{ fontWeight: 600 }}>
              Conversaciones con el Copiloto
            </h3>
            <button
              onClick={() => navigate("/app/chat")}
              className="text-gray-900 text-xs hover:underline flex items-center gap-1"
              style={{ fontWeight: 600 }}
            >
              Ver todas <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {stats && stats.recentConversations.length === 0 ? (
            <div className="text-center py-6">
              <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Aún no tienes conversaciones</p>
              <button
                onClick={() => navigate("/app/chat")}
                className="mt-3 text-gray-900 text-sm hover:underline"
                style={{ fontWeight: 600 }}
              >
                Empezar la primera →
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {stats?.recentConversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => navigate("/app/chat")}
                  className="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-700 text-sm truncate" style={{ fontWeight: 600 }}>{c.title}</p>
                    <p className="text-gray-400 text-xs mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatRelative(c.created_at)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
          {(stats?.conversationCount ?? 0) > 3 && (
            <p className="text-center text-gray-400 text-[10px] mt-3">
              Y {(stats?.conversationCount ?? 0) - 3} más
            </p>
          )}
        </div>

        {/* Historial de análisis MMM */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 text-xs uppercase tracking-wider" style={{ fontWeight: 600 }}>
              Análisis MMM Recientes
            </h3>
            <button
              onClick={() => navigate("/app/mmm")}
              className="text-gray-900 text-xs hover:underline flex items-center gap-1"
              style={{ fontWeight: 600 }}
            >
              Nuevo <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {stats && stats.analysesHistory.length === 0 ? (
            <div className="text-center py-6">
              <BarChart3 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Aún no has corrido análisis</p>
              <button
                onClick={() => navigate("/app/mmm")}
                className="mt-3 text-gray-900 text-sm hover:underline"
                style={{ fontWeight: 600 }}
              >
                Correr el primero →
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {stats?.analysesHistory.map((a) => (
                <div
                  key={a.id}
                  className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-700 text-sm truncate" style={{ fontWeight: 600 }}>
                      {a.filename}
                    </p>
                    <p className="text-gray-400 text-xs mt-0.5 flex items-center gap-1">
                      <FileText className="w-3 h-3" /> {a.channels.length} canales · {formatRelative(a.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { icon: BarChart3, label: "MMM Engine", desc: "Regresión econométrica de tu inversión", path: "/app/mmm" },
          { icon: MessageSquare, label: "Chat con Runtu", desc: "Pregunta cualquier cosa de tu marketing", path: "/app/chat" },
          { icon: Target, label: "Planificar Contenido", desc: "Calendario editorial (próximamente)", path: "/app/calendar" },
        ].map((a) => (
          <button
            key={a.label}
            onClick={() => navigate(a.path)}
            className="bg-white border border-gray-200/80 rounded-2xl p-5 text-left hover:shadow-sm hover:border-gray-300 transition-all group"
          >
            <a.icon className="w-6 h-6 mb-3 text-gray-900" />
            <p className="text-gray-700 text-sm" style={{ fontWeight: 600 }}>{a.label}</p>
            <p className="text-gray-400 text-xs mt-1">{a.desc}</p>
            <ArrowRight className="w-4 h-4 text-gray-300 mt-3 group-hover:text-gray-500 group-hover:translate-x-1 transition-all" />
          </button>
        ))}
      </div>
    </div>
  );
}
