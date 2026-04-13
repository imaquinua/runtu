import { MetricCard } from "../components/MetricCard";
import { useNavigate } from "react-router";
import { MessageSquare, ArrowRight, Radar, BarChart3, Target } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const trendData = [
  { day: "Lun", mentions: 340, engagement: 4.2 },
  { day: "Mar", mentions: 420, engagement: 3.8 },
  { day: "Mie", mentions: 510, engagement: 5.1 },
  { day: "Jue", mentions: 380, engagement: 4.6 },
  { day: "Vie", mentions: 620, engagement: 6.3 },
  { day: "Sab", mentions: 750, engagement: 7.1 },
  { day: "Dom", mentions: 690, engagement: 5.8 },
];

const sentimentPie = [
  { name: "Positivo", value: 62, color: "#10b981" },
  { name: "Neutral", value: 25, color: "#6366f1" },
  { name: "Negativo", value: 13, color: "#ef4444" },
];

const channelPerformance = [
  { name: "Instagram", followers: "24.5K", er: "5.8%", trend: "up" as const, color: "#E1306C" },
  { name: "TikTok", followers: "18.2K", er: "8.2%", trend: "up" as const, color: "#6d28d9" },
  { name: "Facebook", followers: "32.1K", er: "2.1%", trend: "down" as const, color: "#1877F2" },
  { name: "LinkedIn", followers: "8.7K", er: "3.4%", trend: "up" as const, color: "#0A66C2" },
  { name: "Google Ads", clicks: "12.3K", ctr: "4.2%", trend: "up" as const, color: "#4285F4" },
];

const recentAlerts = [
  { msg: "Mencion viral detectada en TikTok: +340% engagement", time: "Hace 2h", color: "#6d28d9" },
  { msg: "Sentimiento negativo en aumento en Instagram (-8%)", time: "Hace 4h", color: "#ef4444" },
  { msg: "Nueva keyword trending: 'receta natural' (x45 menciones)", time: "Hace 6h", color: "#f59e0b" },
  { msg: "Regresion actualizada: TikTok elasticidad subio a 4.8x", time: "Hace 8h", color: "#10b981" },
];

const tt = { backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, color: "#111", fontSize: 12 };

export function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-20 lg:pb-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl text-gray-900 tracking-tight" style={{ fontWeight: 900 }}>
            Marketing Command Center
          </h1>
          <p className="text-gray-400 text-sm mt-1">Semana 15, Abril 2026 · Ultima actualizacion: hace 12 min</p>
        </div>
        <button onClick={() => navigate("/app/chat")} className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl px-5 py-2.5 transition-all hover:shadow-lg" style={{ fontWeight: 600 }}>
          <MessageSquare className="w-4 h-4" /> Preguntale a Runtu
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard label="Menciones Totales" value="3,710" delta="23%" deltaType="up" />
        <MetricCard label="Sentiment Score" value="74%" delta="4%" deltaType="up" />
        <MetricCard label="Engagement Rate" value="5.3%" delta="0.8%" deltaType="up" />
        <MetricCard label="ROI Marketing" value="3.8x" delta="12%" deltaType="up" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white border border-gray-200/80 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 text-xs uppercase tracking-wider" style={{ fontWeight: 600 }}>Menciones y Engagement (7 dias)</h3>
            <div className="flex gap-3 text-[10px] text-gray-400">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-900" /> Menciones</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500" /> Engagement %</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="darkGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#111827" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#111827" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="indigoGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" stroke="#d1d5db" tick={{ fontSize: 11, fill: "#9ca3af" }} />
              <YAxis yAxisId="left" stroke="#d1d5db" tick={{ fontSize: 11, fill: "#9ca3af" }} />
              <YAxis yAxisId="right" orientation="right" stroke="#d1d5db" tick={{ fontSize: 11, fill: "#9ca3af" }} />
              <Tooltip contentStyle={tt} />
              <Area yAxisId="left" type="monotone" dataKey="mentions" stroke="#111827" fill="url(#darkGrad)" strokeWidth={2} />
              <Area yAxisId="right" type="monotone" dataKey="engagement" stroke="#6366f1" fill="url(#indigoGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-gray-200/80 rounded-2xl p-5">
          <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-2" style={{ fontWeight: 600 }}>Distribucion de Sentimiento</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={sentimentPie} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" stroke="none">
                {sentimentPie.map(s => <Cell key={s.name} fill={s.color} />)}
              </Pie>
              <Tooltip contentStyle={tt} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-1">
            {sentimentPie.map(s => (
              <div key={s.name} className="flex items-center gap-1.5 text-[11px]">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-gray-400">{s.name}</span>
                <span className="text-gray-700" style={{ fontWeight: 600 }}>{s.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200/80 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 text-xs uppercase tracking-wider" style={{ fontWeight: 600 }}>Rendimiento por Canal</h3>
            <button onClick={() => navigate("/app/analytics")} className="text-gray-900 text-xs hover:underline flex items-center gap-1" style={{ fontWeight: 600 }}>
              Ver todo <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2.5">
            {channelPerformance.map(ch => (
              <div key={ch.name} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: ch.color + "12" }}>
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ch.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-700 text-sm" style={{ fontWeight: 600 }}>{ch.name}</p>
                  <p className="text-gray-400 text-xs">{ch.followers || ch.clicks}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-900 text-sm font-mono" style={{ fontWeight: 600 }}>{ch.er || ch.ctr}</p>
                  <p className={`text-[10px] ${ch.trend === "up" ? "text-emerald-500" : "text-red-400"}`}>
                    {ch.trend === "up" ? "↑" : "↓"} ER
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200/80 rounded-2xl p-5">
          <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-4" style={{ fontWeight: 600 }}>Alertas en Tiempo Real</h3>
          <div className="space-y-2.5">
            {recentAlerts.map((a, i) => (
              <div key={i} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors" style={{ borderLeft: `3px solid ${a.color}`, paddingLeft: 12 }}>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-600 text-sm">{a.msg}</p>
                  <p className="text-gray-300 text-xs mt-1">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { icon: Radar, label: "Nuevo Scraping Social", desc: "Monitorea hashtags, cuentas o keywords", path: "/app/social-scraping" },
          { icon: BarChart3, label: "Analizar Marketing Mix", desc: "Regresion econometrica de tu inversion", path: "/app/mmm" },
          { icon: Target, label: "Planificar Contenido", desc: "Calendario conversacional con IA", path: "/app/calendar" },
        ].map(a => (
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
