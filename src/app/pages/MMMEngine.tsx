import { useState, useEffect } from "react";
import { Table, Download, MessageSquare, AlertTriangle, Info, Upload, FileText, Loader2 } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, AreaChart, Area,
} from "recharts";
import { useNavigate } from "react-router";
import { parseCSV, parseCSVString } from "../../lib/mmm/csv";
import { runMMM } from "../../lib/mmm/regression";
import { saveMMMAnalysis, getLatestMMMAnalysis } from "../../lib/mmm/storage";
import { useAuth } from "../../lib/auth-context";
import type { MMMResult } from "../../lib/mmm/types";

const tt = { backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, color: "#111", fontSize: 12 };

export function MMMEngine() {
  const navigate = useNavigate();
  const { business } = useAuth();
  const [result, setResult] = useState<MMMResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [activeTab, setActiveTab] = useState<"regression" | "attribution" | "optimization">("regression");

  useEffect(() => {
    if (!business?.id) { setLoadingExisting(false); return; }
    getLatestMMMAnalysis(business.id).then(({ result }) => {
      if (result) setResult(result);
      setLoadingExisting(false);
    });
  }, [business?.id]);

  const handleFile = async (file: File) => {
    if (!business?.id) { setError("Necesitas completar el onboarding primero"); return; }
    setError(null);
    setLoading(true);
    try {
      const rows = await parseCSV(file);
      const res = runMMM(rows, file.name);
      setResult(res);
      await saveMMMAnalysis(business.id, res, rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error procesando el CSV");
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    if (!business?.id) { setError("Necesitas completar el onboarding primero"); return; }
    setError(null);
    setLoading(true);
    try {
      const csvText = await fetch("/sample-mmm.csv").then((r) => r.text());
      const rows = parseCSVString(csvText);
      const res = runMMM(rows, "sample-mmm.csv");
      setResult(res);
      await saveMMMAnalysis(business.id, res, rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error procesando datos demo");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => { setResult(null); setError(null); };

  const handleExport = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mmm-${result.filename.replace(/\.[^.]+$/, "")}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loadingExisting) {
    return (
      <div className="p-4 md:p-6 lg:p-8 pb-20 lg:pb-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="p-4 md:p-6 lg:p-8 pb-20 lg:pb-8">
        <h1 className="text-2xl md:text-3xl text-gray-900 tracking-tight" style={{ fontWeight: 900 }}>MMM Engine</h1>
        <p className="text-gray-500 mt-2 max-w-xl">Marketing Mix Modeling con regresión lineal econométrica real.</p>

        <div className="mt-6 bg-gray-50 border border-gray-200 rounded-2xl p-5">
          <h3 className="text-gray-700 text-sm flex items-center gap-2 mb-3" style={{ fontWeight: 700 }}>
            <Info className="w-4 h-4 text-gray-400" /> Metodología
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-500">
            <div>
              <p className="text-gray-600 mb-1" style={{ fontWeight: 600 }}>Regresión Lineal Múltiple</p>
              <p className="font-mono text-[10px] bg-white p-2 rounded-lg border border-gray-100">Y = β₀ + β₁X₁ + β₂X₂ + ... + βₙXₙ + ε</p>
            </div>
            <div>
              <p className="text-gray-600 mb-1" style={{ fontWeight: 600 }}>Mínimos Cuadrados Ordinarios</p>
              <p>Estimación de coeficientes, R², F-Statistic, p-values y errores estándar.</p>
            </div>
            <div>
              <p className="text-gray-600 mb-1" style={{ fontWeight: 600 }}>Rendimientos Decrecientes</p>
              <p>Transformación Hill para modelar saturación por canal.</p>
            </div>
          </div>
        </div>

        <label
          className={`mt-6 border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center transition-colors cursor-pointer ${
            dragOver ? "border-gray-900 bg-gray-50" : "border-gray-300 hover:border-gray-400"
          } ${loading ? "opacity-50 pointer-events-none" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handleFile(file);
          }}
        >
          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            disabled={loading}
          />
          {loading ? (
            <>
              <Loader2 className="w-12 h-12 mb-4 text-gray-900 animate-spin" />
              <p className="text-gray-700 text-sm" style={{ fontWeight: 600 }}>Calculando regresión...</p>
            </>
          ) : (
            <>
              <Table className={`w-12 h-12 mb-4 ${dragOver ? "text-gray-900" : "text-gray-300"}`} />
              <p className="text-gray-600" style={{ fontWeight: 600 }}>Arrastra tu CSV aquí</p>
              <p className="text-gray-400 text-sm mt-1">o haz clic para seleccionar un archivo</p>
              <div className="mt-6 text-gray-400 text-xs text-center">
                <p style={{ fontWeight: 600 }}>Columnas esperadas:</p>
                <p className="font-mono">semana, ventas, inv_tv, inv_digital, inv_tiktok, inv_ooh, inv_radio</p>
              </div>
            </>
          )}
        </label>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="mt-4 flex gap-2 flex-wrap">
          <button
            onClick={handleDemo}
            disabled={loading}
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl px-4 py-2.5 text-sm transition-colors disabled:opacity-50"
          >
            <FileText className="w-4 h-4" /> Cargar datos demo
          </button>
          <a
            href="/sample-mmm.csv"
            download
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl px-4 py-2.5 text-sm transition-colors"
          >
            <Download className="w-4 h-4" /> Descargar plantilla CSV
          </a>
        </div>
      </div>
    );
  }

  const coefficients = result.channels;
  const residualData = result.weeks.map((w) => ({ week: w.week, residual: w.residual }));

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-20 lg:pb-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl text-gray-900 tracking-tight" style={{ fontWeight: 900 }}>MMM Engine</h1>
          <p className="text-gray-400 text-sm mt-1">
            {result.filename} · {result.n} semanas · R² = {result.rSquared.toFixed(2)} · {result.k} canales
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={handleReset} className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl px-4 py-2.5 text-sm transition-colors">
            <Upload className="w-4 h-4" /> Nuevo análisis
          </button>
          <button onClick={handleExport} className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl px-4 py-2.5 text-sm transition-colors">
            <Download className="w-4 h-4" /> Exportar JSON
          </button>
          <button onClick={() => navigate("/app/chat")} className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl px-4 py-2.5 text-sm transition-all" style={{ fontWeight: 600 }}>
            <MessageSquare className="w-4 h-4" /> Analizar con IA
          </button>
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {([
          { key: "regression", label: "Regresión" },
          { key: "attribution", label: "Atribución" },
          { key: "optimization", label: "Optimización" },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex-1 py-2 rounded-lg text-sm transition-colors ${
              activeTab === t.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
            }`}
            style={{ fontWeight: activeTab === t.key ? 600 : 400 }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "regression" && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "R-Squared", value: result.rSquared.toFixed(2), sub: result.rSquared > 0.8 ? "Ajuste excelente" : result.rSquared > 0.6 ? "Ajuste moderado" : "Ajuste débil" },
              { label: "F-Statistic", value: result.fStatistic.toFixed(1), sub: `p = ${result.fPValue < 0.001 ? "<0.001" : result.fPValue.toFixed(3)}` },
              { label: "Durbin-Watson", value: result.durbinWatson.toFixed(2), sub: result.durbinWatson > 1.5 && result.durbinWatson < 2.5 ? "Sin autocorrelación" : "Autocorrelación" },
              { label: "MAPE", value: `${result.mape.toFixed(1)}%`, sub: "Error promedio" },
            ].map((s) => (
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
              <LineChart data={result.weeks}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="week" stroke="#d1d5db" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                <YAxis stroke="#d1d5db" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                <Tooltip contentStyle={tt} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="ventas" stroke="#111827" strokeWidth={2.5} name="Ventas Reales" dot={{ fill: "#111827", r: 3 }} />
                <Line type="monotone" dataKey="predicted" stroke="#6366f1" strokeWidth={2} strokeDasharray="5 5" name="Modelo" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white border border-gray-200/80 rounded-2xl overflow-hidden">
            <div className="p-4">
              <h3 className="text-gray-400 text-xs uppercase tracking-wider" style={{ fontWeight: 600 }}>Coeficientes de Regresión (β)</h3>
              <p className="text-gray-400 text-[10px] mt-1">Intercepto: <span className="font-mono text-gray-600">{result.intercept.toFixed(2)}</span></p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 text-gray-400 text-xs uppercase tracking-wider">
                    <th className="text-left px-4 py-3">Canal</th>
                    <th className="text-right px-4 py-3">β</th>
                    <th className="text-right px-4 py-3">Std Error</th>
                    <th className="text-right px-4 py-3">p-value</th>
                    <th className="text-right px-4 py-3">Elasticidad</th>
                    <th className="text-right px-4 py-3">Sig.</th>
                  </tr>
                </thead>
                <tbody>
                  {coefficients.map((c) => (
                    <tr key={c.name} className="border-t border-gray-100 hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                          <span className="text-gray-700 text-sm" style={{ fontWeight: 600 }}>{c.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 text-sm text-right font-mono" style={{ fontWeight: 600 }}>{c.beta.toFixed(2)}</td>
                      <td className="px-4 py-3 text-gray-500 text-sm text-right font-mono">{c.stdError.toFixed(3)}</td>
                      <td className="px-4 py-3 text-right font-mono text-sm">
                        <span className={c.pValue < 0.05 ? "text-emerald-500" : "text-red-400"}>
                          {c.pValue < 0.001 ? "<0.001" : c.pValue.toFixed(3)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-900 text-sm text-right font-mono" style={{ fontWeight: 600 }}>{c.elasticity.toFixed(2)}x</td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`text-[10px] px-2 py-1 rounded-full ${
                            c.pValue < 0.01 ? "bg-emerald-50 text-emerald-600" : c.pValue < 0.05 ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-500"
                          }`}
                          style={{ fontWeight: 600 }}
                        >
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
            <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-4" style={{ fontWeight: 600 }}>Análisis de Residuos</h3>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={residualData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="week" stroke="#d1d5db" tick={{ fontSize: 10, fill: "#9ca3af" }} />
                <YAxis stroke="#d1d5db" tick={{ fontSize: 10, fill: "#9ca3af" }} />
                <Tooltip contentStyle={tt} />
                <Bar dataKey="residual" fill="#6366f1" radius={[3, 3, 0, 0]} name="Residuo" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {activeTab === "attribution" && (
        <>
          <div className="bg-white border border-gray-200/80 rounded-2xl p-5">
            <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-4" style={{ fontWeight: 600 }}>Contribución por Canal</h3>
            <div className="space-y-4">
              {coefficients.map((c) => (
                <div key={c.name}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                      <span className="text-gray-700" style={{ fontWeight: 600 }}>{c.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400 text-xs">Elasticidad: <span className="text-gray-900 font-mono" style={{ fontWeight: 600 }}>{c.elasticity.toFixed(2)}x</span></span>
                      <span className="text-gray-700 font-mono" style={{ fontWeight: 600 }}>{c.contribution}%</span>
                    </div>
                  </div>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${c.contribution}%`, backgroundColor: c.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200/80 rounded-2xl p-5">
            <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-4" style={{ fontWeight: 600 }}>Inversión por Canal (Stacked)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={result.weeks}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="week" stroke="#d1d5db" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                <YAxis stroke="#d1d5db" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                <Tooltip contentStyle={tt} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {coefficients.map((c) => (
                  <Area key={c.name} type="monotone" dataKey={c.column} stackId="1" stroke={c.color} fill={c.color} fillOpacity={0.15} name={c.name} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {activeTab === "optimization" && (
        <>
          <div className="bg-white border border-gray-200/80 rounded-2xl p-5">
            <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-1" style={{ fontWeight: 600 }}>Curvas de Rendimiento Decreciente</h3>
            <p className="text-gray-400 text-[10px] mb-4">Top 3 canales por elasticidad</p>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={result.diminishingReturns}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="spend" stroke="#d1d5db" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                <YAxis stroke="#d1d5db" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                <Tooltip contentStyle={tt} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {Object.keys(result.diminishingReturns[0] || {})
                  .filter((k) => k !== "spend")
                  .map((ch) => {
                    const channel = coefficients.find((c) => c.name === ch);
                    return (
                      <Line key={ch} type="monotone" dataKey={ch} stroke={channel?.color ?? "#6366f1"} strokeWidth={2} dot={false} />
                    );
                  })}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white border border-gray-200/80 rounded-2xl p-5">
            <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-4" style={{ fontWeight: 600 }}>Asignación Óptima vs Actual</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-gray-500 text-xs mb-3" style={{ fontWeight: 600 }}>Actual</p>
                {result.optimalAllocation.map((c) => (
                  <div key={`cur-${c.channel}`} className="flex items-center gap-2 mb-2">
                    <span className="text-gray-400 text-xs w-14 truncate">{c.channel}</span>
                    <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${c.current}%`, backgroundColor: c.color }} />
                    </div>
                    <span className="text-gray-400 text-xs font-mono w-10 text-right">{c.current}%</span>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-emerald-600 text-xs mb-3" style={{ fontWeight: 600 }}>Recomendación IA ✦</p>
                {result.optimalAllocation.map((c) => (
                  <div key={`opt-${c.channel}`} className="flex items-center gap-2 mb-2">
                    <span className="text-gray-400 text-xs w-14 truncate">{c.channel}</span>
                    <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${c.optimal}%`, backgroundColor: c.color }} />
                    </div>
                    <span className="text-gray-400 text-xs font-mono w-10 text-right">{c.optimal}%</span>
                  </div>
                ))}
                <p className="text-emerald-600 text-[10px] mt-3">Redistribución basada en elasticidades y significancia estadística.</p>
              </div>
            </div>
          </div>
        </>
      )}

      {result.diagnostics.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-gray-400 text-xs uppercase tracking-wider" style={{ fontWeight: 600 }}>Diagnósticos del Modelo</h3>
          {result.diagnostics.map((q) => (
            <div
              key={q.id}
              className={`border rounded-xl p-4 flex items-start gap-3 ${
                q.severity === "high" ? "bg-amber-50/50 border-amber-200" : q.severity === "medium" ? "bg-indigo-50/50 border-indigo-200" : "bg-gray-50 border-gray-200"
              }`}
            >
              {q.severity === "high" ? (
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              ) : (
                <Info className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1">
                <p className="text-gray-600 text-sm">{q.message}</p>
                <button onClick={() => navigate("/app/chat")} className="text-gray-900 text-xs mt-2 hover:underline flex items-center gap-1" style={{ fontWeight: 600 }}>
                  <MessageSquare className="w-3 h-3" /> Explorar en chat
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
