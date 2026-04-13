import MLR from "ml-regression-multivariate-linear";
import * as ss from "simple-statistics";
import type { MMMChannel, MMMResult, MMMWeekData, MMMDiagnostic } from "./types";

// Paleta fija por orden de aparición
const CHANNEL_COLORS = ["#111827", "#6366f1", "#6d28d9", "#10b981", "#ef4444", "#f59e0b", "#06b6d4", "#ec4899"];

// Nombres "bonitos" conocidos para columnas estándar
const CHANNEL_LABELS: Record<string, string> = {
  inv_tv: "TV",
  tv: "TV",
  inv_digital: "Digital",
  digital: "Digital",
  inv_tiktok: "TikTok",
  tiktok: "TikTok",
  inv_ooh: "OOH",
  ooh: "OOH",
  inv_radio: "Radio",
  radio: "Radio",
  inv_meta: "Meta",
  meta: "Meta",
  inv_google: "Google Ads",
  google: "Google Ads",
  inv_instagram: "Instagram",
  instagram: "Instagram",
  inv_facebook: "Facebook",
  facebook: "Facebook",
};

/**
 * Detecta columnas del CSV:
 * - `ventas` (o `sales`, `revenue`): target
 * - `semana` (o `week`, `period`): label de periodo
 * - cualquier columna que empiece con `inv_` o matchee con CHANNEL_LABELS: canal
 */
function detectColumns(rows: Record<string, string>[]): {
  timeCol: string;
  salesCol: string;
  channelCols: string[];
} {
  if (rows.length === 0) throw new Error("El CSV está vacío");

  const keys = Object.keys(rows[0]).map((k) => k.trim().toLowerCase());
  const originalKeys = Object.keys(rows[0]);
  const keyMap = new Map<string, string>();
  keys.forEach((k, i) => keyMap.set(k, originalKeys[i]));

  const findOriginal = (candidates: string[]) => {
    for (const c of candidates) {
      if (keyMap.has(c)) return keyMap.get(c)!;
    }
    return null;
  };

  const timeCol = findOriginal(["semana", "week", "periodo", "period", "fecha", "date"]);
  const salesCol = findOriginal(["ventas", "sales", "revenue", "y"]);

  if (!timeCol) throw new Error("No se encontró columna de tiempo (ej: semana, week, fecha)");
  if (!salesCol) throw new Error("No se encontró columna de ventas (ej: ventas, sales)");

  const channelCols = originalKeys.filter((k) => {
    const lower = k.trim().toLowerCase();
    if (lower === timeCol.toLowerCase() || lower === salesCol.toLowerCase()) return false;
    return lower.startsWith("inv_") || CHANNEL_LABELS[lower] !== undefined;
  });

  if (channelCols.length < 2) {
    throw new Error("Se necesitan al menos 2 canales de inversión (columnas que empiecen con inv_)");
  }

  return { timeCol, salesCol, channelCols };
}

function getChannelLabel(column: string): string {
  const lower = column.trim().toLowerCase();
  if (CHANNEL_LABELS[lower]) return CHANNEL_LABELS[lower];
  // inv_xxx → Xxx
  if (lower.startsWith("inv_")) {
    const name = lower.substring(4);
    return name.charAt(0).toUpperCase() + name.slice(1);
  }
  return column;
}

/**
 * P-value aproximado para un estadístico t con df grados de libertad.
 * Usa aproximación de la distribución t para df ≥ 30.
 * Para df pequeños la aproximación no es exacta pero suficiente para MVP.
 */
function tDistributionPValue(tStat: number, df: number): number {
  const absT = Math.abs(tStat);
  // Aproximación rápida usando fórmula de Hill (1970)
  const x = df / (df + absT * absT);
  // Incomplete beta function approximation via continued fraction
  const a = df / 2;
  const b = 0.5;
  const betaIncomplete = incompleteBeta(x, a, b);
  return Math.min(1, Math.max(0, betaIncomplete));
}

function incompleteBeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  // Approximation using continued fraction
  const bt = Math.exp(
    logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x)
  );
  if (x < (a + 1) / (a + b + 2)) {
    return (bt * betaContinuedFraction(x, a, b)) / a;
  }
  return 1 - (bt * betaContinuedFraction(1 - x, b, a)) / b;
}

function logGamma(z: number): number {
  const g = 7;
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
    -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6,
    1.5056327351493116e-7,
  ];
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  z -= 1;
  let x = c[0];
  for (let i = 1; i < g + 2; i++) x += c[i] / (z + i);
  const t = z + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

function betaContinuedFraction(x: number, a: number, b: number): number {
  const MAX_ITER = 100;
  const EPS = 3e-7;
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < 1e-30) d = 1e-30;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= MAX_ITER; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = 1 + aa / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = 1 + aa / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}

/**
 * F-distribution p-value usando relación con incomplete beta
 */
function fDistributionPValue(f: number, df1: number, df2: number): number {
  if (f <= 0) return 1;
  const x = df2 / (df2 + df1 * f);
  return incompleteBeta(x, df2 / 2, df1 / 2);
}

/**
 * Durbin-Watson statistic: detecta autocorrelación en residuos.
 * DW ≈ 2 → sin autocorrelación, DW < 1.5 o > 2.5 sugiere problema.
 */
function durbinWatson(residuals: number[]): number {
  let sumDiffSq = 0;
  let sumSq = 0;
  for (let i = 1; i < residuals.length; i++) {
    sumDiffSq += (residuals[i] - residuals[i - 1]) ** 2;
  }
  for (const r of residuals) sumSq += r * r;
  return sumSq === 0 ? 0 : sumDiffSq / sumSq;
}

/**
 * Hill transformation: f(x) = K × xⁿ / (ECₙ + xⁿ)
 * Modela rendimientos decrecientes. Ajustado empíricamente según magnitud del gasto.
 */
function hillCurve(maxSpend: number, beta: number, meanSpend: number): { spend: number; value: number }[] {
  const points: { spend: number; value: number }[] = [];
  const K = beta * meanSpend * 2;
  const EC = meanSpend * 1.5;
  const n = 1.8;
  const step = maxSpend / 8;
  for (let i = 0; i <= 8; i++) {
    const spend = step * i;
    const value = spend === 0 ? 0 : (K * spend ** n) / (EC ** n + spend ** n);
    points.push({ spend: Math.round(spend), value: Math.round(value * 10) / 10 });
  }
  return points;
}

/**
 * Estima la asignación óptima redistribuyendo el presupuesto hacia canales
 * de mayor elasticidad (ajustado por ley de rendimientos decrecientes).
 * Heurística simple: peso ∝ elasticity / (1 + spendPct×2), luego normaliza.
 */
function optimalAllocation(channels: MMMChannel[]): { channel: string; current: number; optimal: number; color: string }[] {
  const totalSpend = channels.reduce((s, c) => s + c.totalSpend, 0);
  if (totalSpend === 0) return channels.map((c) => ({ channel: c.name, current: 0, optimal: 0, color: c.color }));

  const currents = channels.map((c) => (c.totalSpend / totalSpend) * 100);

  // Penaliza canales con p-value alto (no significativos)
  const weights = channels.map((c, i) => {
    const significance = c.pValue < 0.05 ? 1 : c.pValue < 0.1 ? 0.5 : 0.1;
    const saturation = 1 + currents[i] / 50; // penaliza canales ya saturados
    return Math.max(0.01, (c.elasticity * significance) / saturation);
  });

  const totalWeight = weights.reduce((s, w) => s + w, 0);
  const optimals = weights.map((w) => (w / totalWeight) * 100);

  return channels.map((c, i) => ({
    channel: c.name,
    current: Math.round(currents[i]),
    optimal: Math.round(optimals[i]),
    color: c.color,
  }));
}

function generateDiagnostics(
  channels: MMMChannel[],
  rSquared: number,
  durbinWatsonStat: number,
  allocation: { channel: string; current: number; optimal: number }[]
): MMMDiagnostic[] {
  const diag: MMMDiagnostic[] = [];

  // Canales no significativos
  for (const ch of channels) {
    if (ch.pValue > 0.1) {
      diag.push({
        id: `nonsig-${ch.name}`,
        severity: "medium",
        message: `${ch.name} tiene un p-value de ${ch.pValue.toFixed(2)} (no significativo al 90%). Su contribución puede ser ruido estadístico.`,
        channel: ch.name,
      });
    }
  }

  // Canales sub-asignados (elasticidad alta, % bajo)
  const topElasticity = [...channels].sort((a, b) => b.elasticity - a.elasticity)[0];
  if (topElasticity && topElasticity.pValue < 0.05) {
    const alloc = allocation.find((a) => a.channel === topElasticity.name);
    if (alloc && alloc.optimal > alloc.current + 5) {
      diag.push({
        id: `underallocated-${topElasticity.name}`,
        severity: "high",
        message: `${topElasticity.name} muestra la elasticidad más alta (${topElasticity.elasticity.toFixed(1)}x) pero solo recibe ${alloc.current}% del presupuesto. ¿Estás subasignando?`,
        channel: topElasticity.name,
      });
    }
  }

  // Autocorrelación
  if (durbinWatsonStat < 1.5 || durbinWatsonStat > 2.5) {
    diag.push({
      id: "autocorrelation",
      severity: "low",
      message: `Durbin-Watson = ${durbinWatsonStat.toFixed(2)}. Autocorrelación de residuos sugiere efectos carry-over no modelados.`,
    });
  }

  // R² bajo
  if (rSquared < 0.6) {
    diag.push({
      id: "low-r2",
      severity: "high",
      message: `R² = ${rSquared.toFixed(2)}. El modelo explica menos del 60% de la variación. Considera agregar más variables o revisar outliers.`,
    });
  }

  return diag;
}

/**
 * Ejecuta el análisis MMM completo sobre filas ya parseadas del CSV.
 */
export function runMMM(rows: Record<string, string>[], filename = "data.csv"): MMMResult {
  const { timeCol, salesCol, channelCols } = detectColumns(rows);

  // Convertir a numérico y limpiar
  const clean: { time: string; sales: number; spends: number[] }[] = rows.map((r) => {
    const sales = parseFloat(r[salesCol]);
    const spends = channelCols.map((c) => parseFloat(r[c]) || 0);
    return { time: r[timeCol], sales: isNaN(sales) ? 0 : sales, spends };
  }).filter((r) => r.sales > 0);

  if (clean.length < channelCols.length + 3) {
    throw new Error(`Necesitas al menos ${channelCols.length + 3} semanas de datos para un modelo estable`);
  }

  const X = clean.map((r) => r.spends);
  const Y = clean.map((r) => [r.sales]);

  // Regresión multivariada
  const mlr = new MLR(X, Y, { intercept: true });
  const predictions = X.map((x) => mlr.predict(x)[0]);
  const residuals = clean.map((r, i) => r.sales - predictions[i]);

  const meanY = ss.mean(clean.map((r) => r.sales));
  const meanX = channelCols.map((_, i) => ss.mean(clean.map((r) => r.spends[i])));
  const totalX = channelCols.map((_, i) => ss.sum(clean.map((r) => r.spends[i])));

  // R²
  const ssTot = ss.sum(clean.map((r) => (r.sales - meanY) ** 2));
  const ssRes = ss.sum(residuals.map((r) => r * r));
  const rSquared = 1 - ssRes / ssTot;

  const n = clean.length;
  const k = channelCols.length; // número de predictores
  const df = n - k - 1;
  const adjustedR2 = 1 - ((1 - rSquared) * (n - 1)) / df;

  // F-Statistic
  const msr = (ssTot - ssRes) / k;
  const mse = ssRes / df;
  const fStat = msr / mse;
  const fPValue = fDistributionPValue(fStat, k, df);

  // Standard errors de coeficientes (usando MSE y matriz X)
  // SE(βi) ≈ sqrt(MSE / Σ(Xi - mean(Xi))²)  — aproximación sin matriz inversa
  const weights = mlr.weights as unknown as number[][];
  // En ml-regression-multivariate-linear, weights es matriz [features+1][outputs]
  // Con intercept, el primero es el intercepto
  const coefficients: number[] = [];
  for (let i = 0; i < weights.length; i++) {
    coefficients.push(weights[i][0]);
  }
  const intercept = coefficients[0];
  const betas = coefficients.slice(1);

  // Cálculo de standard errors aproximados
  const stdErrors: number[] = betas.map((_, i) => {
    const xi = clean.map((r) => r.spends[i]);
    const meanXi = meanX[i];
    const ssxi = ss.sum(xi.map((x) => (x - meanXi) ** 2));
    return Math.sqrt(mse / ssxi);
  });

  // MAPE
  const mape = ss.mean(
    clean.map((r, i) => Math.abs((r.sales - predictions[i]) / r.sales))
  ) * 100;

  // Durbin-Watson
  const dw = durbinWatson(residuals);

  // Construir objetos de canales
  const channels: MMMChannel[] = channelCols.map((col, i) => {
    const beta = betas[i];
    const stdError = stdErrors[i];
    const tStat = stdError === 0 ? 0 : beta / stdError;
    const pValue = tDistributionPValue(tStat, df);
    const elasticity = meanY === 0 ? 0 : (beta * meanX[i]) / meanY;
    return {
      name: getChannelLabel(col),
      column: col,
      color: CHANNEL_COLORS[i % CHANNEL_COLORS.length],
      beta: Math.round(beta * 100) / 100,
      stdError: Math.round(stdError * 1000) / 1000,
      tStat: Math.round(tStat * 100) / 100,
      pValue: Math.round(pValue * 10000) / 10000,
      elasticity: Math.round(elasticity * 100) / 100,
      meanSpend: Math.round(meanX[i] * 100) / 100,
      totalSpend: Math.round(totalX[i] * 100) / 100,
      contribution: 0, // se calcula abajo
    };
  });

  // Contribución: abs(β × mean_spend) / sum de todas
  const absContribs = channels.map((c) => Math.abs(c.beta * c.meanSpend));
  const totalContrib = ss.sum(absContribs);
  channels.forEach((c, i) => {
    c.contribution = totalContrib === 0 ? 0 : Math.round((absContribs[i] / totalContrib) * 100);
  });

  // Semanas con predicciones y residuos
  const weeks: MMMWeekData[] = clean.map((r, i) => {
    const row: MMMWeekData = {
      week: r.time,
      ventas: Math.round(r.sales * 10) / 10,
      predicted: Math.round(predictions[i] * 10) / 10,
      residual: Math.round(residuals[i] * 10) / 10,
    };
    channels.forEach((c, ci) => {
      row[c.column] = Math.round(r.spends[ci] * 10) / 10;
    });
    return row;
  });

  // Asignación óptima
  const allocation = optimalAllocation(channels);

  // Rendimientos decrecientes (top 3 canales)
  const top3 = [...channels].sort((a, b) => b.elasticity - a.elasticity).slice(0, 3);
  const maxSpendOverall = Math.max(...channels.map((c) => c.meanSpend * 2));
  const diminishingReturns: { spend: number; [k: string]: number }[] = [];
  for (let i = 0; i <= 8; i++) {
    const spend = (maxSpendOverall / 8) * i;
    const point: { spend: number; [k: string]: number } = { spend: Math.round(spend) };
    top3.forEach((ch) => {
      const curve = hillCurve(maxSpendOverall, ch.beta, ch.meanSpend);
      point[ch.name] = curve[i]?.value ?? 0;
    });
    diminishingReturns.push(point);
  }

  // Diagnósticos
  const diagnostics = generateDiagnostics(channels, rSquared, dw, allocation);

  return {
    filename,
    channels,
    weeks,
    intercept: Math.round(intercept * 100) / 100,
    rSquared: Math.round(rSquared * 10000) / 10000,
    adjustedRSquared: Math.round(adjustedR2 * 10000) / 10000,
    fStatistic: Math.round(fStat * 100) / 100,
    fPValue: Math.round(fPValue * 10000) / 10000,
    durbinWatson: Math.round(dw * 100) / 100,
    mape: Math.round(mape * 100) / 100,
    meanVentas: Math.round(meanY * 100) / 100,
    totalVentas: Math.round(ss.sum(clean.map((r) => r.sales)) * 100) / 100,
    n,
    k,
    diagnostics,
    optimalAllocation: allocation,
    diminishingReturns,
    createdAt: new Date().toISOString(),
  };
}
