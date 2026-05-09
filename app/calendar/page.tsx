"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────
interface LogEntry {
  id: string;
  timestamp: number;
  summary: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  notes: string;
}

interface DayTotals {
  entries: LogEntry[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// ── Constants ─────────────────────────────────────────────────────────
const GOALS = { calories: 1500, protein: 170 };

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_NAMES = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const FULL_DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

// ── Pure helpers ──────────────────────────────────────────────────────
function ymdToStr(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function daysInMonth(y: number, m: number): number {
  return new Date(y, m + 1, 0).getDate();
}

// Mon-indexed offset for the 1st of the month (0 = Mon, 6 = Sun)
function monthOffset(y: number, m: number): number {
  return (new Date(y, m, 1).getDay() + 6) % 7;
}

function isGoalMet(t: DayTotals): boolean {
  return Math.abs(t.calories - GOALS.calories) <= 100 && t.protein >= GOALS.protein;
}

function ringColor(calories: number): string {
  const diff = calories - GOALS.calories;
  if (Math.abs(diff) <= 100) return "#10b981"; // emerald
  if (diff > 100) return "#ef4444";            // red
  return "#f59e0b";                            // amber
}

function loadAllLogs(): Record<string, DayTotals> {
  const result: Record<string, DayTotals> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith("food-log-")) continue;
      const dateStr = key.slice("food-log-".length);
      const entries: LogEntry[] = JSON.parse(localStorage.getItem(key) ?? "[]");
      if (!entries.length) continue;
      const totals = entries.reduce(
        (a, e) => ({
          calories: a.calories + e.calories,
          protein: a.protein + e.protein,
          carbs: a.carbs + e.carbs,
          fat: a.fat + e.fat,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );
      result[dateStr] = { entries, ...totals };
    }
  } catch { /* localStorage unavailable */ }
  return result;
}

function computeStreaks(logs: Record<string, DayTotals>, viewY: number, viewM: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Current streak — walk backwards from today
  let current = 0;
  const cursor = new Date(today);
  while (true) {
    const s = ymdToStr(cursor.getFullYear(), cursor.getMonth(), cursor.getDate());
    const log = logs[s];
    if (!log || !isGoalMet(log)) break;
    current++;
    cursor.setDate(cursor.getDate() - 1);
  }

  // Best streak within the viewed month
  const dim = daysInMonth(viewY, viewM);
  let best = 0, run = 0;
  for (let d = 1; d <= dim; d++) {
    const dayDate = new Date(viewY, viewM, d);
    if (dayDate > today) { run = 0; continue; }
    const log = logs[ymdToStr(viewY, viewM, d)];
    if (log && isGoalMet(log)) { run++; best = Math.max(best, run); }
    else run = 0;
  }

  return { current, best };
}

// ── Sub-components ────────────────────────────────────────────────────
function ProgressRing({ pct, color, size }: { pct: number; color: string; size: number }) {
  const sw = 2.5;
  const r = (size - sw * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(1, pct));
  const c = size / 2;
  return (
    <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
      <circle cx={c} cy={c} r={r} fill="none" stroke="#e5e7eb" strokeWidth={sw} />
      <circle
        cx={c} cy={c} r={r} fill="none" stroke={color} strokeWidth={sw}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
      />
    </svg>
  );
}

function DayCell({
  day, isFuture, isToday, totals, selected, onClick,
}: {
  day: number;
  isFuture: boolean;
  isToday: boolean;
  totals: DayTotals | null;
  selected: boolean;
  onClick: () => void;
}) {
  const hasData = !!totals && totals.entries.length > 0;
  const pct = hasData ? totals!.calories / GOALS.calories : 0;
  const color = hasData ? ringColor(totals!.calories) : "#e5e7eb";
  const goalMet = hasData && isGoalMet(totals!);

  return (
    <div
      onClick={() => hasData && !isFuture && onClick()}
      className={[
        "h-full p-1.5 sm:p-2 flex flex-col transition-colors",
        selected ? "bg-gray-100/60" : "",
        !isFuture && hasData ? "cursor-pointer hover:bg-gray-50" : "cursor-default",
        isFuture ? "bg-gray-50/60" : "",
      ].join(" ")}
    >
      {/* Day number row */}
      <div className="flex items-start justify-between mb-1">
        <span
          className={[
            "text-[11px] sm:text-sm font-medium leading-none flex items-center justify-center",
            isToday
              ? "w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gray-900 text-white text-[10px] sm:text-[11px] font-semibold"
              : isFuture
              ? "text-gray-300"
              : "text-gray-700",
          ].join(" ")}
        >
          {day}
        </span>
        {/* Checkmark (mobile only, shown outside ring) */}
        {goalMet && (
          <span className="sm:hidden text-emerald-500 text-[9px] font-bold leading-none">✓</span>
        )}
      </div>

      {/* Progress content */}
      {hasData && !isFuture && (
        <>
          {/* Mobile: compact ring */}
          <div className="sm:hidden flex justify-center mt-0.5">
            <ProgressRing pct={pct} color={color} size={26} />
          </div>

          {/* Desktop: larger ring + stats */}
          <div className="hidden sm:flex flex-col items-center gap-0.5 mt-0.5">
            <div className="relative">
              <ProgressRing pct={pct} color={color} size={38} />
              {goalMet && (
                <span className="absolute inset-0 flex items-center justify-center text-[10px] text-emerald-600 font-bold">
                  ✓
                </span>
              )}
            </div>
            <p className="text-[10px] tabular-nums text-gray-500 leading-none">
              {Math.round(totals!.calories)} kcal
            </p>
            <p className="text-[10px] tabular-nums text-gray-400 leading-none">
              {Math.round(totals!.protein)}g prot
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function DayDetailPanel({
  dateStr, totals, onClose,
}: {
  dateStr: string;
  totals: DayTotals;
  onClose: () => void;
}) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const goalMet = isGoalMet(totals);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[80vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              {FULL_DAY_NAMES[date.getDay()]}, {MONTH_NAMES[date.getMonth()]} {date.getDate()}
            </h3>
            <p className={`text-xs font-medium mt-0.5 ${goalMet ? "text-emerald-500" : "text-gray-400"}`}>
              {goalMet ? "Both goals met ✓" : "Goals not fully met"}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">
          {/* Daily totals */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Daily Totals</p>
            <div className="grid grid-cols-4 gap-2 text-center">
              {([
                { label: "Cal", value: Math.round(totals.calories), unit: "kcal", color: "text-orange-500" },
                { label: "Protein", value: Math.round(totals.protein), unit: "g", color: "text-blue-500" },
                { label: "Carbs", value: Math.round(totals.carbs), unit: "g", color: "text-emerald-500" },
                { label: "Fat", value: Math.round(totals.fat), unit: "g", color: "text-yellow-500" },
              ] as const).map(({ label, value, unit, color }) => (
                <div key={label}>
                  <p className={`text-xl font-bold tabular-nums ${color}`}>{value}</p>
                  <p className="text-[10px] text-gray-400">{unit}</p>
                  <p className="text-[10px] text-gray-500 font-medium">{label}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between text-[11px] text-gray-400">
              <span>Goal: {GOALS.calories} kcal</span>
              <span>Goal: {GOALS.protein}g protein</span>
            </div>
          </div>

          {/* Logged entries */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Logged Meals</p>
            <div className="space-y-0">
              {totals.entries.map((e) => (
                <div
                  key={e.id}
                  className="flex items-start justify-between gap-3 py-2.5 border-b border-gray-100 last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 font-medium leading-snug">{e.summary}</p>
                    {e.notes && (
                      <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{e.notes}</p>
                    )}
                    <p className="text-[10px] text-gray-300 mt-1">
                      {new Date(e.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-gray-700 tabular-nums">{e.calories} kcal</p>
                    <p className="text-xs text-gray-400 tabular-nums">{e.protein}g protein</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────
export default function CalendarPage() {
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  const [viewY, setViewY] = useState(todayDate.getFullYear());
  const [viewM, setViewM] = useState(todayDate.getMonth());
  const [logs, setLogs] = useState<Record<string, DayTotals>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setLogs(loadAllLogs());
    setHydrated(true);
  }, []);

  if (!hydrated) return null;

  const { current: currentStreak, best: bestStreak } = computeStreaks(logs, viewY, viewM);

  // Build grid cells
  const dim = daysInMonth(viewY, viewM);
  const offset = monthOffset(viewY, viewM);
  const cells: (number | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= dim; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const isCurrentMonth = viewY === todayDate.getFullYear() && viewM === todayDate.getMonth();

  function navigate(delta: number) {
    let m = viewM + delta, y = viewY;
    if (m < 0) { y--; m = 11; }
    if (m > 11) { y++; m = 0; }
    setViewY(y);
    setViewM(m);
    setSelected(null);
  }

  function goToToday() {
    setViewY(todayDate.getFullYear());
    setViewM(todayDate.getMonth());
    setSelected(null);
  }

  const selectedTotals = selected ? (logs[selected] ?? null) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">

        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Progress Calendar</h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-0.5">1,500 kcal · 170g protein per day</p>
          </div>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
            ← Planner
          </Link>
        </div>

        {/* Streak banner */}
        <div className="bg-white border border-gray-200 rounded-xl px-5 py-4 mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl" aria-hidden="true">🔥</span>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {currentStreak} day streak
              </p>
              <p className="text-xs text-gray-400">Consecutive days both goals hit</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-900">{bestStreak} days</p>
            <p className="text-xs text-gray-400">Best this month</p>
          </div>
        </div>

        {/* Calendar card */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-4">

          {/* Month navigation */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:bg-gray-100 rounded-lg transition-colors text-xl leading-none"
              aria-label="Previous month"
            >
              ‹
            </button>

            <div className="flex items-center gap-3">
              <h2 className="text-sm font-semibold text-gray-900">
                {MONTH_NAMES[viewM]} {viewY}
              </h2>
              {!isCurrentMonth && (
                <button
                  onClick={goToToday}
                  className="text-xs text-gray-400 hover:text-gray-700 border border-gray-200 rounded-md px-2 py-0.5 transition-colors"
                >
                  Today
                </button>
              )}
            </div>

            <button
              onClick={() => navigate(1)}
              disabled={isCurrentMonth}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:bg-gray-100 rounded-lg transition-colors text-xl leading-none disabled:opacity-20 disabled:cursor-default"
              aria-label="Next month"
            >
              ›
            </button>
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 border-b border-gray-100">
            {DAY_NAMES.map((d) => (
              <div key={d} className="py-2 text-center text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wide">
                <span className="sm:hidden">{d[0]}</span>
                <span className="hidden sm:inline">{d}</span>
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              const isLastCol = i % 7 === 6;
              const borderCls = `border-b border-gray-100${isLastCol ? "" : " border-r border-gray-100"}`;

              if (day === null) {
                return (
                  <div
                    key={`blank-${i}`}
                    className={`${borderCls} h-20 sm:h-28 bg-gray-50/40`}
                  />
                );
              }

              const dateStr = ymdToStr(viewY, viewM, day);
              const dayDate = new Date(viewY, viewM, day);
              const isFuture = dayDate > todayDate;
              const isToday =
                viewY === todayDate.getFullYear() &&
                viewM === todayDate.getMonth() &&
                day === todayDate.getDate();

              return (
                <div key={dateStr} className={`${borderCls} h-20 sm:h-28`}>
                  <DayCell
                    day={day}
                    isFuture={isFuture}
                    isToday={isToday}
                    totals={logs[dateStr] ?? null}
                    selected={selected === dateStr}
                    onClick={() => setSelected(selected === dateStr ? null : dateStr)}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-gray-400 px-1">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>On track (±100 kcal)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span>Under goal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <span>Over goal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-500 font-bold text-sm">✓</span>
            <span>Both goals met</span>
          </div>
        </div>

      </div>

      {/* Day detail panel */}
      {selected && selectedTotals && (
        <DayDetailPanel
          dateStr={selected}
          totals={selectedTotals}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
