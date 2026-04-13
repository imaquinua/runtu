interface MetricCardProps {
  label: string;
  value: string;
  delta?: string;
  deltaType?: "up" | "down";
}

export function MetricCard({ label, value, delta, deltaType }: MetricCardProps) {
  return (
    <div className="bg-white border border-gray-200/80 rounded-2xl p-5 hover:shadow-sm transition-all">
      <p className="text-gray-400 text-xs uppercase tracking-wider">{label}</p>
      <p className="text-2xl text-gray-900 mt-1" style={{ fontWeight: 800 }}>{value}</p>
      {delta && (
        <span className={`text-sm mt-1 inline-block ${deltaType === "up" ? "text-emerald-600" : "text-red-500"}`}>
          {deltaType === "up" ? "↑" : "↓"} {delta}
        </span>
      )}
    </div>
  );
}
