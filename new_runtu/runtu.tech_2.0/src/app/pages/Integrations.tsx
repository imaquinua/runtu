import { useState } from "react";
import { CheckCircle, AlertCircle, RefreshCw, Settings, Plug, Shield } from "lucide-react";

interface Integration {
  id: string; name: string; description: string; color: string; connected: boolean;
  lastSync?: string; scopes?: string[]; dataPoints?: string;
}

const integrations: Integration[] = [
  { id: "instagram", name: "Instagram Business API", description: "Metricas de posts, stories, reels. Engagement rate, alcance, datos demograficos.", color: "#E1306C", connected: true, lastSync: "Hace 5 min", scopes: ["instagram_basic", "instagram_content_publish", "instagram_manage_insights"], dataPoints: "24,521 followers · 48 posts" },
  { id: "tiktok", name: "TikTok Business API", description: "Views, likes, comments, shares por video. Analytics de cuenta.", color: "#6d28d9", connected: true, lastSync: "Hace 12 min", scopes: ["user.info.basic", "video.list", "video.insights"], dataPoints: "18,234 followers · 32 videos" },
  { id: "facebook", name: "Facebook Graph API", description: "Page insights, post performance, audience demographics.", color: "#1877F2", connected: true, lastSync: "Hace 30 min", scopes: ["pages_read_engagement", "pages_manage_posts", "read_insights"], dataPoints: "32,108 followers · 24 posts" },
  { id: "linkedin", name: "LinkedIn Marketing API", description: "Organization analytics, share statistics, follower demographics.", color: "#0A66C2", connected: true, lastSync: "Hace 1h", scopes: ["r_organization_social", "rw_organization_admin"], dataPoints: "8,741 followers · 12 posts" },
  { id: "google", name: "Google Ads & Analytics API", description: "Campaign performance, keyword analytics, conversion tracking.", color: "#4285F4", connected: true, lastSync: "Hace 2h", scopes: ["adwords", "analytics.readonly"], dataPoints: "18 campanas · 310K impresiones" },
  { id: "twitter", name: "X (Twitter) API v2", description: "Tweet analytics, engagement metrics, follower insights.", color: "#9ca3af", connected: false, scopes: ["tweet.read", "users.read"] },
];

export function Integrations() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-20 lg:pb-8 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl text-gray-900 tracking-tight" style={{ fontWeight: 900 }}>Integraciones API</h1>
        <p className="text-gray-400 text-sm mt-1">Conecta tus plataformas para alimentar scraping, analytics y MMM Engine</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="bg-white border border-gray-200/80 rounded-2xl p-4">
          <p className="text-gray-400 text-xs uppercase tracking-wider">Conectadas</p>
          <p className="text-3xl text-emerald-500 mt-1" style={{ fontWeight: 900 }}>{integrations.filter(i => i.connected).length}</p>
        </div>
        <div className="bg-white border border-gray-200/80 rounded-2xl p-4">
          <p className="text-gray-400 text-xs uppercase tracking-wider">Pendientes</p>
          <p className="text-3xl text-gray-300 mt-1" style={{ fontWeight: 900 }}>{integrations.filter(i => !i.connected).length}</p>
        </div>
        <div className="bg-white border border-gray-200/80 rounded-2xl p-4">
          <p className="text-gray-400 text-xs uppercase tracking-wider">Data Points</p>
          <p className="text-3xl text-gray-900 mt-1" style={{ fontWeight: 900 }}>83K+</p>
        </div>
      </div>

      <div className="space-y-3">
        {integrations.map(integ => {
          const expanded = expandedId === integ.id;
          return (
            <div key={integ.id} className={`bg-white border rounded-2xl transition-all ${integ.connected ? "border-gray-200/80" : "border-gray-100 opacity-70"}`}>
              <button onClick={() => setExpandedId(expanded ? null : integ.id)} className="w-full p-5 flex items-center gap-4 text-left">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: integ.color + "10" }}>
                  <div className="w-5 h-5 rounded-full" style={{ backgroundColor: integ.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-gray-700 text-sm" style={{ fontWeight: 600 }}>{integ.name}</p>
                    {integ.connected ? <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 text-gray-300 flex-shrink-0" />}
                  </div>
                  <p className="text-gray-400 text-xs mt-0.5 truncate">{integ.description}</p>
                </div>
                {integ.connected ? (
                  <span className="text-emerald-600 text-xs bg-emerald-50 px-2.5 py-1 rounded-full flex-shrink-0" style={{ fontWeight: 600 }}>Conectado</span>
                ) : (
                  <span className="text-gray-500 text-xs bg-gray-50 px-2.5 py-1 rounded-full border border-gray-200 flex-shrink-0 hover:border-gray-300" style={{ fontWeight: 600 }}>Conectar</span>
                )}
              </button>
              {expanded && (
                <div className="px-5 pb-5 border-t border-gray-100">
                  <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-2" style={{ fontWeight: 600 }}>Permisos (Scopes)</p>
                      <div className="flex flex-wrap gap-1.5">
                        {integ.scopes?.map(s => (
                          <span key={s} className="text-[10px] bg-gray-50 text-gray-500 px-2 py-1 rounded-md border border-gray-100 font-mono">{s}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      {integ.connected && (
                        <>
                          <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-2" style={{ fontWeight: 600 }}>Estado</p>
                          <p className="text-gray-500 text-xs flex items-center gap-1.5 mb-1"><RefreshCw className="w-3 h-3" /> Ultimo sync: {integ.lastSync}</p>
                          <p className="text-gray-500 text-xs flex items-center gap-1.5"><Shield className="w-3 h-3" /> {integ.dataPoints}</p>
                          <div className="flex gap-2 mt-3">
                            <button className="text-xs bg-gray-50 text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-1 border border-gray-200"><RefreshCw className="w-3 h-3" /> Sync</button>
                            <button className="text-xs bg-gray-50 text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-1 border border-gray-200"><Settings className="w-3 h-3" /> Config</button>
                          </div>
                        </>
                      )}
                      {!integ.connected && (
                        <button className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl px-5 py-2.5 text-sm transition-all mt-2" style={{ fontWeight: 600 }}>
                          <Plug className="w-4 h-4 inline mr-1.5" />Conectar {integ.name.split(" ")[0]}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
        <h3 className="text-gray-700 text-xs uppercase tracking-wider mb-3" style={{ fontWeight: 600 }}>Flujo de Datos</h3>
        <div className="flex flex-col md:flex-row items-center justify-center gap-3 text-center text-xs text-gray-500">
          <span className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm">APIs Sociales</span>
          <span className="text-gray-300">→</span>
          <span className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm">Scraping & ETL</span>
          <span className="text-gray-300">→</span>
          <span className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm">Clasificacion IA</span>
          <span className="text-gray-300">→</span>
          <span className="bg-gray-900 rounded-lg px-4 py-2 text-white shadow-sm" style={{ fontWeight: 600 }}>MMM Engine</span>
        </div>
      </div>
    </div>
  );
}
