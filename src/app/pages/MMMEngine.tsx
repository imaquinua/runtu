import { useState } from "react";
import { Table, Download, MessageSquare, AlertTriangle, Info } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from "recharts";
import { useNavigate } from "react-router";

const regressionData = [
  { week: "W01", ventas: 150, predicted: 148, tv: 20, digital: 8, tiktok: 3, ooh: 5, radio: 2 },
  { week: "W02", ventas: 162, predicted: 159, tv: 20, digital: 10, tiktok: 5, ooh: 5, radio: 2 },
  { week: "W03", ventas: 155, predicted: 157, tv: 22, digital: 9, tiktok: 4, ooh: 6, radio: 3 },
  { week: "W04", ventas: 170, predicted: 168, tv: 18, digital: 12, tiktok: 7, ooh: 5, radio: 2 },
  { week: "W05", ventas: 180, predicted: 176, tv: 25, digital: 11, tiktok: 8, ooh: 4, radio: 3 },
  { week: "W06", ventas: 145, predicted: 149, tv: 20, digital: 8, tiktok: 6, ooh: 5, radio: 2 },
  { week: "W07", ventas: 168, predicted: 165, tv: 22, digital: 10, tiktok: 5, ooh: 6, radio: 3 },
  { week: "W08", ventas: 175, predicted: 172, tv: 21, digital: 11, tiktok: 9, ooh: 5, radio: 2 },
  { week: "W09", ventas: 185, predicted: 182, tv: 24, digital: 13, tiktok: 10, ooh: 5, radio: 3 },
  { week: "W10", ventas: 192, predicted: 189, tv: 23, digital: 14, tiktok: 12, ooh: 6, radio: 2 },
  { week: "W11", ventas: 178, predicted: 180, tv: 20, digital: 12, tiktok: 8, ooh: 5, radio: 3 },
  { week: "W12", ventas: 195, predicted: 191, tv: 25, digital: 15, tiktok: 11, ooh: 6, radio: 3 },
];

const coefficients = [
  { channel: "TV", beta: 3.21, pValue: 0.001, elasticity: 3.2, color: "#111827", contribution: 42 },
  { channel: "Digital", beta: 2.45, pValue: 0.003, elasticity: 1.8, color: "#6366f1", contribution: 28 },
  { channel: "TikTok", beta: 4.12, pValue: 0.0008, elasticity: 4.2, color: "#6d28d9", contribution: 18 },
  { channel: "OOH", beta: 1.89, pValue: 0.015, elasticity: 1.4, color: "#10b981", contribution: 8 },
  { channel: "Radio", beta: 0.67, pValue: 0.21, elasticity: 0.6, color: "#ef4444", contribution: 4 },
];

const residualData = regressionData.map(d => ({ week: d.week, residual: d.ventas - d.predicted }));

const diminishingReturns = [
  { spend: 0, tv: 0, digital: 0, tiktok: 0 }, { spend: 5, tv: 12, digital: 8, tiktok: 18 },
  { spend: 10, tv: 22, digital: 15, tiktok: 32 }, { spend: 15, tv: 30, digital: 21, tiktok: 42 },
  { spend: 20, tv: 36, digital: 26, tiktok: 48 }, { spend: 25, tv: 40, digital: 30, tiktok: 52 },
  { spend: 30, tv: 43, digital: 33, tiktok: 54 }, { spend: 35, tv: 45, digital: 35, tiktok: 55 },
  { spend: 40, tv: 46, digital: 36, tiktok: 55.5 },
];

const diagnosticQuestions = [
  { id: "1", q: "TikTok muestra la elasticidad mas alta (4.2x) pero solo recibe 18% del presupuesto. Estas subasignando?", severity: "high" },
  { id: "2", q: "Radio tiene un p-value de 0.21 (no significativo al 95%). Su contribucion puede ser ruido estadistico.", severity: "medium" },
  { id: "3", q: "R² de 0.94. Autocorrelacion de residuos sugiere efectos carry-over no modelados.", severity: "low" },
  { id: "4", q: "TV se aplana a $30K. Cada dolar adicional despues de eso rinde solo $0.43.", severity: "high" },
];

const tt = { backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, color: "#111", fontSize: 12 };

export function MMMEngine() {
  const [uploaded, setUploaded] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [activeTab, setActiveTab] = useState<"regression" | "attribution" | "optimization">("regression");
  const navigate = useNavigate();

  if (!uploaded) {
    return (
      <div className="p-4 md:p-6 lg:p-8 pb-20 lg:pb-8">
        <h1 className="text-2xl md:text-3xl text-gray-900 tracking-tight" style={{ fontWeight: 900 }}>MMM Engine</h1>
        <p className="text-gray-500 mt-2 max-w-xl">Marketing Mix Modeling con regresiones lineales econometricas.</p>

        <div className="mt-6 bg-gray-50 border border-gray-200 rounded-2xl p-5">
          <h3 className="text-gray-700 text-sm flex items-center gap-2 mb-3" style={{ fontWeight: 700 }}><Info className="w-4 h-4 text-gray-400" /> Metodologia</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-500">
            <div>
              <p className="text-gray-600 mb-1" style={{ fontWeight: 600 }}>Regresion Lineal Multiple</p>
              <p className="font-mono text-[10px] bg-white p-2 rounded-lg border border-gray-100">Y = β₀ + β₁X₁ + β₂X₂ + ... + βₙXₙ + ε</p>
            </div>
            <div>
              <p className="text-gray-600 mb-1" style={{ fontWeight: 600 }}>Adstock / Carry-over</p>
              <p>Decay exponencial para capturar el impacto a largo plazo.</p>
            </div>
            <div>
              <p className="text-gray-600 mb-1" style={{ fontWeight: 600 }}>Rendimientos Decrecientes</p>
              <p>Transformacion Hill para modelar saturacion.</p>
            </div>
          </div>
        </div>

        <div
          className={`mt-6 border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center transition-colors cursor-pointer ${dragOver ? "border-gray-900 bg-gray-50" : "border-gray-300 hover:border-gray-400"}`}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); setUploaded(true); }}
          onClick={() => setUploaded(true)}
        >
          <Table className={`w-12 h-12 mb-4 ${dragOver ? "text-gray-900" : "text-gray-300"}`} />
          <p className="text-gray-600" style={{ fontWeight: 600 }}>Arrastra tu CSV aqui</p>
          <p className="text-gray-400 text-sm mt-1">o haz clic para cargar datos demo</p>
          <div className="mt-6 text-gray-400 text-xs text-center">
            <p style={{ fontWeight: 600 }}>Columnas esperadas:</p>
            <p className="font-mono">semana, ventas, inv_tv, inv_digital, inv_tiktok, inv_ooh, inv_radio</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-20 lg:pb-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl text-gray-900 tracking-tight" style={{ fontWeight: 900 }}>MMM Engine</h1>
          <p className="text-gray-400 text-sm mt-1">Regresion econometrica · 12 semanas · R² = 0.94 · 5 canales</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl px-4 py-2.5 text-sm transition-colors">
            <Download className="w-4 h-4" /> Exportar
          </button>
          <button onClick={() => navigate("/app/chat")} className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl px-4 py-2.5 text-sm transition-all" style={{ fontWeight: 600 }}>
            <MessageSquare className="w-4 h-4" /> Analizar con IA
          </button>
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {([{ key: "regression", label: "Regresion" }, { key: "attribution", label: "Atribucion" }, { key: "optimization", label: "Optimizacion" }] as const).map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`flex-1 py-2 rounded-lg text-sm transition-colors ${activeTab === t.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
            style={{ fontWeight: activeTab === t.key ? 600 : 400 }}>{t.label}</button>
        ))}
      </div>

      {activeTab === "regression" && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "R-Squared", value: "0.94", sub: "Ajuste excelente" },
              { label: "F-Statistic", value: "48.2", sub: "p < 0.0001" },
              { label: "Durbin-Watson", value: "1.87", sub: "Sin autocorrelacion" },
              { label: "MAPE", value: "2.3%", sub: "Error promedio" },
            ].map(s => (
              <div key={s.label} className="bg-white border border-gray-200/80 rounded-2xl p-4">
                <p className="text-gray-400 text-[10px] uppercase tracking-wider">{s.label}</p>
                <p className="text-2xl text-gray-900 mt-0.5 font-mono" style={{ fontWeight: 900 }}>{s.value}</p>
                <p className="text-gray-400 text-[10px] mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>

          <div className="bg-white border border-gray-200/80 rounded-2xl p-5">
            <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-4" style={{ fontWeight: 600 }}>Ventas Reales vs Modelo Predicho</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={regressionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="week" stroke="#d1d5db" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                <YAxis stroke="#d1d5db" tick={{ fontSize: 11, fill: "#9ca3af" }} unit="K" />
                <Tooltip contentStyle={tt} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="ventas" stroke="#111827" strokeWidth={2.5} name="Ventas Reales ($K)" dot={{ fill: "#111827", r: 3 }} />
                <Line type="monotone" dataKey="predicted" stroke="#6366f1" strokeWidth={2} strokeDasharray="5 5" name="Modelo ($K)" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white border border-gray-200/80 rounded-2xl overflow-hidden">
            <div className="p-4"><h3 className="text-gray-400 text-xs uppercase tracking-wider" style={{ fontWeight: 600 }}>Coeficientes de Regresion (β)</h3></div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 text-gray-400 text-xs uppercase tracking-wider">
                    <th className="text-left px-4 py-3">Canal</th>
                    <th className="text-right px-4 py-3">β</th>
                    <th className="text-right px-4 py-3">p-value</th>
                    <th className="text-right px-4 py-3">Elasticidad</th>
                    <th className="text-right px-4 py-3">Significancia</th>
                  </tr>
                </thead>
                <tbody>
                  {coefficients.map(c => (
                    <tr key={c.channel} className="border-t border-gray-100 hover:bg-gray-50/50">
                      <td className="px-4 py-3 flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                        <span className="text-gray-700 text-sm" style={{ fontWeight: 600 }}>{c.channel}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-700 text-sm text-right font-mono" style={{ fontWeight: 600 }}>{c.beta.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-mono text-sm">
                        <span className={c.pValue < 0.05 ? "text-emerald-500" : "text-red-400"}>{c.pValue < 0.001 ? "<0.001" : c.pValue.toFixed(3)}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-900 text-sm text-right font-mono" style={{ fontWeight: 600 }}>{c.elasticity}x</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-[10px] px-2 py-1 rounded-full ${
                          c.pValue < 0.01 ? "bg-emerald-50 text-emerald-600" : c.pValue < 0.05 ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-500"
                        }`} style={{ fontWeight: 600 }}>
                          {c.pValue < 0.01 ? "★★★" : c.pValue < 0.05 ? "★★" : "No sig."}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white border border-gray-200/80 rounded-2xl p-5">
            <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-4" style={{ fontWeight: 600 }}>Analisis de Residuos</h3>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={residualData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="week" stroke="#d1d5db" tick={{ fontSize: 10, fill: "#9ca3af" }} />
                <YAxis stroke="#d1d5db" tick={{ fontSize: 10, fill: "#9ca3af" }} />
                <Tooltip contentStyle={tt} />
                <Bar dataKey="residual" fill="#6366f1" radius={[3, 3, 0, 0]} name="Residuo ($K)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {activeTab === "attribution" && (
        <>
          <div className="bg-white border border-gray-200/80 rounded-2xl p-5">
            <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-4" style={{ fontWeight: 600 }}>Contribucion por Canal</h3>
            <div className="space-y-4">
              {coefficients.map(c => (
                <div key={c.channel}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                      <span className="text-gray-700" style={{ fontWeight: 600 }}>{c.channel}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400 text-xs">Elasticidad: <span className="text-gray-900 font-mono" style={{ fontWeight: 600 }}>{c.elasticity}x</span></span>
                      <span className="text-gray-700 font-mono" style={{ fontWeight: 600 }}>{c.contribution}%</span>
                    </div>
                  </div>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${c.contribution}%`, backgroundColor: c.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200/80 rounded-2xl p-5">
            <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-4" style={{ fontWeight: 600 }}>Inversion por Canal (Stacked)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={regressionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="week" stroke="#d1d5db" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                <YAxis stroke="#d1d5db" tick={{ fontSize: 11, fill: "#9ca3af" }} unit="K" />
                <Tooltip contentStyle={tt} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="tv" stackId="1" stroke="#111827" fill="#111827" fillOpacity={0.15} name="TV" />
                <Area type="monotone" dataKey="digital" stackId="1" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} name="Digital" />
                <Area type="monotone" dataKey="tiktok" stackId="1" stroke="#6d28d9" fill="#6d28d9" fillOpacity={0.15} name="TikTok" />
                <Area type="monotone" dataKey="ooh" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.15} name="OOH" />
                <Area type="monotone" dataKey="radio" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.15} name="Radio" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {activeTab === "optimization" && (
        <>
          <div className="bg-white border border-gray-200/80 rounded-2xl p-5">
            <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-1" style={{ fontWeight: 600 }}>Curvas de Rendimiento Decreciente</h3>
            <p className="text-gray-400 text-[10px] mb-4">Ventas marginales ($K) por cada $K adicional</p>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={diminishingReturns}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="spend" stroke="#d1d5db" tick={{ fontSize: 11, fill: "#9ca3af" }} unit="K" />
                <YAxis stroke="#d1d5db" tick={{ fontSize: 11, fill: "#9ca3af" }} unit="K" />
                <Tooltip contentStyle={tt} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="tv" stroke="#111827" strokeWidth={2} name="TV" dot={false} />
                <Line type="monotone" dataKey="digital" stroke="#6366f1" strokeWidth={2} name="Digital" dot={false} />
                <Line type="monotone" dataKey="tiktok" stroke="#6d28d9" strokeWidth={2} name="TikTok" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white border border-gray-200/80 rounded-2xl p-5">
            <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-4" style={{ fontWeight: 600 }}>Asignacion Optima vs Actual</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-gray-500 text-xs mb-3" style={{ fontWeight: 600 }}>Actual</p>
                {[{ ch: "TV", pct: 42, color: "#111827" }, { ch: "Digital", pct: 28, color: "#6366f1" }, { ch: "TikTok", pct: 18, color: "#6d28d9" }, { ch: "OOH", pct: 8, color: "#10b981" }, { ch: "Radio", pct: 4, color: "#ef4444" }].map(c => (
                  <div key={c.ch} className="flex items-center gap-2 mb-2">
                    <span className="text-gray-400 text-xs w-14">{c.ch}</span>
                    <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${c.pct}%`, backgroundColor: c.color }} /></div>
                    <span className="text-gray-400 text-xs font-mono w-8 text-right">{c.pct}%</span>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-emerald-600 text-xs mb-3" style={{ fontWeight: 600 }}>Recomendacion IA ✦</p>
                {[{ ch: "TV", pct: 30, color: "#111827" }, { ch: "Digital", pct: 22, color: "#6366f1" }, { ch: "TikTok", pct: 35, color: "#6d28d9" }, { ch: "OOH", pct: 10, color: "#10b981" }, { ch: "Radio", pct: 3, color: "#ef4444" }].map(c => (
                  <div key={c.ch} className="flex items-center gap-2 mb-2">
                    <span className="text-gray-400 text-xs w-14">{c.ch}</span>
                    <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${c.pct}%`, backgroundColor: c.color }} /></div>
                    <span className="text-gray-400 text-xs font-mono w-8 text-right">{c.pct}%</span>
                  </div>
                ))}
                <p className="text-emerald-600 text-[10px] mt-2">Estimacion: +18% ROI reasignando a canales de mayor elasticidad</p>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="space-y-3">
        <h3 className="text-gray-400 text-xs uppercase tracking-wider" style={{ fontWeight: 600 }}>Diagnosticos del Modelo</h3>
        {diagnosticQuestions.map(q => (
          <div key={q.id} className={`border rounded-xl p-4 flex items-start gap-3 ${
            q.severity === "high" ? "bg-amber-50/50 border-amber-200" : q.severity === "medium" ? "bg-indigo-50/50 border-indigo-200" : "bg-gray-50 border-gray-200"
          }`}>
            {q.severity === "high" ? <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" /> : <Info className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />}
            <div className="flex-1">
              <p className="text-gray-600 text-sm">{q.q}</p>
              <button onClick={() => navigate("/app/chat")} className="text-gray-900 text-xs mt-2 hover:underline flex items-center gap-1" style={{ fontWeight: 600 }}>
                <MessageSquare className="w-3 h-3" /> Explorar en chat
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
