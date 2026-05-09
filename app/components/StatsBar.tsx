"use client";

interface Props {
  avgCalories: number;
  avgProtein: number;
  filled: number;
}

function StatPill({ label, value, target, unit }: { label: string; value: number; target: number; unit: string }) {
  const pct = Math.min(value / target, 1);
  const over = value > target;
  const barColor = over ? "bg-red-400" : pct > 0.85 ? "bg-emerald-400" : "bg-gray-300";

  return (
    <div className="flex-1 min-w-[120px]">
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-xs text-gray-500">{label}</span>
        <span className={`text-sm font-semibold ${over ? "text-red-500" : "text-gray-800"}`}>
          {value}{unit}
          <span className="text-xs font-normal text-gray-400"> / {target}{unit}</span>
        </span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct * 100}%` }} />
      </div>
    </div>
  );
}

export default function StatsBar({ avgCalories, avgProtein, filled }: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex flex-wrap gap-4 items-center">
      <StatPill label="Avg daily calories" value={avgCalories} target={1500} unit=" kcal" />
      <div className="w-px h-8 bg-gray-100 hidden sm:block" />
      <StatPill label="Avg daily protein" value={avgProtein} target={170} unit="g" />
      <div className="w-px h-8 bg-gray-100 hidden sm:block" />
      <div className="flex-1 min-w-[120px]">
        <div className="flex justify-between items-baseline mb-1">
          <span className="text-xs text-gray-500">Meals planned</span>
          <span className="text-sm font-semibold text-gray-800">
            {filled}<span className="text-xs font-normal text-gray-400"> / 21</span>
          </span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${filled === 21 ? "bg-emerald-400" : "bg-gray-300"}`}
            style={{ width: `${(filled / 21) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
