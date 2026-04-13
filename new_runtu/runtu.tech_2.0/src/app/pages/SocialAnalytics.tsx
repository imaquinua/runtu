import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from "recharts";
import { Users, Heart, Share2, Bookmark, Eye, CheckCircle, AlertCircle } from "lucide-react";

interface Platform { name: string; color: string; connected: boolean; followers: string; engagement: string; reach: string; posts: number; erTrend: "up" | "down"; erDelta: string; }

const platforms: Platform[] = [
  { name: "Instagram", color: "#E1306C", connected: true, followers: "24,521", engagement: "5.8%", reach: "142K", posts: 48, erTrend: "up", erDelta: "0.6%" },
  { name: "TikTok", color: "#6d28d9", connected: true, followers: "18,234", engagement: "8.2%", reach: "520K", posts: 32, erTrend: "up", erDelta: "1.2%" },
  { name: "Facebook", color: "#1877F2", connected: true, followers: "32,108", engagement: "2.1%", reach: "85K", posts: 24, erTrend: "down", erDelta: "0.3%" },
  { name: "LinkedIn", color: "#0A66C2", connected: true, followers: "8,741", engagement: "3.4%", reach: "28K", posts: 12, erTrend: "up", erDelta: "0.5%" },
  { name: "Google Ads", color: "#4285F4", connected: true, followers: "—", engagement: "4.2% CTR", reach: "310K", posts: 18, erTrend: "up", erDelta: "0.8%" },
];

const erTimeline = [
  { week: "W1", Instagram: 5.2, TikTok: 7.0, Facebook: 2.4, LinkedIn: 2.9, Google: 3.4 },
  { week: "W2", Instagram: 5.5, TikTok: 7.5, Facebook: 2.3, LinkedIn: 3.1, Google: 3.8 },
  { week: "W3", Instagram: 5.1, TikTok: 8.1, Facebook: 2.1, LinkedIn: 3.0, Google: 4.0 },
  { week: "W4", Instagram: 5.8, TikTok: 8.2, Facebook: 2.1, LinkedIn: 3.4, Google: 4.2 },
  { week: "W5", Instagram: 5.4, TikTok: 7.8, Facebook: 2.0, LinkedIn: 3.2, Google: 3.9 },
  { week: "W6", Instagram: 5.9, TikTok: 8.5, Facebook: 2.2, LinkedIn: 3.5, Google: 4.1 },
  { week: "W7", Instagram: 5.6, TikTok: 8.0, Facebook: 1.9, LinkedIn: 3.3, Google: 4.3 },
  { week: "W8", Instagram: 5.8, TikTok: 8.2, Facebook: 2.1, LinkedIn: 3.4, Google: 4.2 },
];

const contentPerformance = [
  { type: "Video", Instagram: 7.2, TikTok: 9.4, Facebook: 3.1, LinkedIn: 4.2 },
  { type: "Imagen", Instagram: 5.8, TikTok: 4.2, Facebook: 2.4, LinkedIn: 3.0 },
  { type: "Carrusel", Instagram: 6.5, TikTok: 3.8, Facebook: 1.8, LinkedIn: 3.8 },
  { type: "Story", Instagram: 4.1, TikTok: 6.2, Facebook: 1.5, LinkedIn: 1.2 },
  { type: "Texto", Instagram: 2.3, TikTok: 1.1, Facebook: 1.9, LinkedIn: 4.5 },
];

const topPosts = [
  { id: "1", platform: "TikTok", content: "Receta de skincare con ingredientes de mercado local", er: "12.4%", reach: "95K", likes: "8.2K", shares: "1.4K", saves: "3.1K" },
  { id: "2", platform: "Instagram", content: "Antes y despues: 30 dias usando nuestra rutina completa", er: "8.7%", reach: "45K", likes: "5.1K", shares: "890", saves: "2.8K" },
  { id: "3", platform: "TikTok", content: "POV: cuando descubres skincare mexicano de calidad", er: "7.9%", reach: "78K", likes: "6.3K", shares: "2.1K", saves: "1.9K" },
  { id: "4", platform: "Instagram", content: "Detras de camaras: como formulamos nuestro serum estrella", er: "6.5%", reach: "32K", likes: "3.8K", shares: "450", saves: "2.2K" },
  { id: "5", platform: "LinkedIn", content: "La industria cosmetica en LATAM: oportunidades para marcas indie", er: "5.8%", reach: "12K", likes: "890", shares: "234", saves: "567" },
];

const tt = { backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, color: "#111", fontSize: 12 };

export function SocialAnalytics() {
  const [activePlatform, setActivePlatform] = useState<string>("all");

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-20 lg:pb-8 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl text-gray-900 tracking-tight" style={{ fontWeight: 900 }}>Social Analytics</h1>
        <p className="text-gray-400 text-sm mt-1">Engagement rate, alcance y rendimiento por plataforma</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {platforms.map(p => (
          <button key={p.name} onClick={() => setActivePlatform(p.name)}
            className={`text-left bg-white border rounded-2xl p-4 transition-all ${activePlatform === p.name ? "border-gray-900 shadow-sm" : "border-gray-200/80 hover:border-gray-300"}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                <span className="text-gray-700 text-xs" style={{ fontWeight: 600 }}>{p.name}</span>
              </div>
              {p.connected ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <AlertCircle className="w-3.5 h-3.5 text-gray-300" />}
            </div>
            <p className="text-gray-900 text-lg font-mono" style={{ fontWeight: 700 }}>{p.engagement}</p>
            <p className="text-gray-400 text-[10px] uppercase tracking-wider mt-0.5">Engagement Rate</p>
            <div className="flex items-center justify-between mt-3 text-[10px]">
              <span className="text-gray-400"><Users className="w-3 h-3 inline mr-1" />{p.followers}</span>
              <span className={p.erTrend === "up" ? "text-emerald-500" : "text-red-400"}>{p.erTrend === "up" ? "↑" : "↓"} {p.erDelta}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-200/80 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-gray-400 text-xs uppercase tracking-wider" style={{ fontWeight: 600 }}>Evolucion del Engagement Rate (8 semanas)</h3>
          <button onClick={() => setActivePlatform("all")} className={`text-[10px] px-2 py-1 rounded-md ${activePlatform === "all" ? "bg-gray-900 text-white" : "text-gray-400"}`} style={{ fontWeight: 600 }}>Todas</button>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={erTimeline}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="week" stroke="#d1d5db" tick={{ fontSize: 11, fill: "#9ca3af" }} />
            <YAxis stroke="#d1d5db" tick={{ fontSize: 11, fill: "#9ca3af" }} unit="%" />
            <Tooltip contentStyle={tt} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {(activePlatform === "all" || activePlatform === "Instagram") && <Line type="monotone" dataKey="Instagram" stroke="#E1306C" strokeWidth={2} dot={false} />}
            {(activePlatform === "all" || activePlatform === "TikTok") && <Line type="monotone" dataKey="TikTok" stroke="#6d28d9" strokeWidth={2} dot={false} />}
            {(activePlatform === "all" || activePlatform === "Facebook") && <Line type="monotone" dataKey="Facebook" stroke="#1877F2" strokeWidth={2} dot={false} />}
            {(activePlatform === "all" || activePlatform === "LinkedIn") && <Line type="monotone" dataKey="LinkedIn" stroke="#0A66C2" strokeWidth={2} dot={false} />}
            {(activePlatform === "all" || activePlatform === "Google Ads") && <Line type="monotone" dataKey="Google" stroke="#4285F4" strokeWidth={2} dot={false} />}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200/80 rounded-2xl p-5">
          <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-4" style={{ fontWeight: 600 }}>ER por Tipo de Contenido</h3>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={contentPerformance}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="type" stroke="#9ca3af" tick={{ fontSize: 11 }} />
              <PolarRadiusAxis stroke="#e5e7eb" tick={{ fontSize: 9, fill: "#9ca3af" }} />
              <Radar name="Instagram" dataKey="Instagram" stroke="#E1306C" fill="#E1306C" fillOpacity={0.08} />
              <Radar name="TikTok" dataKey="TikTok" stroke="#6d28d9" fill="#6d28d9" fillOpacity={0.08} />
              <Radar name="Facebook" dataKey="Facebook" stroke="#1877F2" fill="#1877F2" fillOpacity={0.04} />
              <Radar name="LinkedIn" dataKey="LinkedIn" stroke="#0A66C2" fill="#0A66C2" fillOpacity={0.04} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-gray-200/80 rounded-2xl p-5">
          <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-4" style={{ fontWeight: 600 }}>Top Posts por Engagement</h3>
          <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
            {topPosts.map((post, i) => {
              const plat = platforms.find(p => p.name === post.platform);
              return (
                <div key={post.id} className="p-3 rounded-xl bg-gray-50/50 border border-gray-100 hover:border-gray-200 transition-colors">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-gray-300 text-[10px]" style={{ fontWeight: 700 }}>#{i + 1}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: plat!.color + "12", color: plat!.color, fontWeight: 600 }}>{post.platform}</span>
                    <span className="ml-auto text-gray-900 text-sm font-mono" style={{ fontWeight: 700 }}>{post.er}</span>
                  </div>
                  <p className="text-gray-600 text-sm">{post.content}</p>
                  <div className="flex items-center gap-4 mt-2 text-[10px] text-gray-400">
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{post.reach}</span>
                    <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{post.likes}</span>
                    <span className="flex items-center gap-1"><Share2 className="w-3 h-3" />{post.shares}</span>
                    <span className="flex items-center gap-1"><Bookmark className="w-3 h-3" />{post.saves}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
        <h3 className="text-gray-700 text-xs uppercase tracking-wider mb-3" style={{ fontWeight: 600 }}>Como Calculamos el Engagement Rate</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><p className="text-gray-600 text-sm" style={{ fontWeight: 600 }}>Instagram / Facebook</p><p className="text-gray-400 text-xs mt-1 font-mono">(likes + comments + shares + saves) / followers × 100</p></div>
          <div><p className="text-gray-600 text-sm" style={{ fontWeight: 600 }}>TikTok</p><p className="text-gray-400 text-xs mt-1 font-mono">(likes + comments + shares) / views × 100</p></div>
          <div><p className="text-gray-600 text-sm" style={{ fontWeight: 600 }}>LinkedIn</p><p className="text-gray-400 text-xs mt-1 font-mono">(reactions + comments + shares) / impressions × 100</p></div>
        </div>
      </div>
    </div>
  );
}
