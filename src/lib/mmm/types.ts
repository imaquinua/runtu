export interface MMMChannel {
  name: string;          // "TV", "Digital", "TikTok"...
  column: string;        // "inv_tv", "inv_digital"...
  color: string;         // hex color para charts
  beta: number;          // coeficiente de regresión
  stdError: number;      // error estándar del coeficiente
  tStat: number;         // estadístico t
  pValue: number;        // p-value
  elasticity: number;    // elasticidad: (β × mean(X)) / mean(Y)
  meanSpend: number;     // promedio de inversión
  totalSpend: number;    // suma total
  contribution: number;  // % contribución al modelo
}

export interface MMMWeekData {
  week: string;
  ventas: number;
  predicted: number;
  residual: number;
  // canales dinámicos
  [key: string]: number | string;
}

export interface MMMDiagnostic {
  id: string;
  severity: "high" | "medium" | "low";
  message: string;
  channel?: string;
}

export interface MMMResult {
  filename: string;
  channels: MMMChannel[];
  weeks: MMMWeekData[];
  intercept: number;
  rSquared: number;
  adjustedRSquared: number;
  fStatistic: number;
  fPValue: number;
  durbinWatson: number;
  mape: number;
  meanVentas: number;
  totalVentas: number;
  n: number;
  k: number;
  diagnostics: MMMDiagnostic[];
  optimalAllocation: { channel: string; current: number; optimal: number; color: string }[];
  diminishingReturns: { spend: number; [channel: string]: number }[];
  createdAt: string;
}

export interface MMMError {
  message: string;
  field?: string;
}
