"use client";

import Link from "next/link";
import { Meal, MealType } from "@/app/data/meals";

interface Props {
  meal: Meal | null;
  type: MealType;
  day: number;
  hasConflict: boolean;
  isLocked: boolean;
  noOptions: boolean;
  fading: boolean;
  onThumbsUp: () => void;
  onThumbsDown: () => void;
  onClick: () => void;
}

const TYPE_ACCENT: Record<MealType, string> = {
  breakfast: "bg-amber-50 border-amber-200 hover:border-amber-400",
  lunch: "bg-sky-50 border-sky-200 hover:border-sky-400",
  dinner: "bg-violet-50 border-violet-200 hover:border-violet-400",
};

const EMPTY_ACCENT: Record<MealType, string> = {
  breakfast: "border-amber-200 hover:border-amber-400 hover:bg-amber-50",
  lunch: "border-sky-200 hover:border-sky-400 hover:bg-sky-50",
  dinner: "border-violet-200 hover:border-violet-400 hover:bg-violet-50",
};

const BADGE: Record<MealType, string> = {
  breakfast: "text-amber-700",
  lunch: "text-sky-700",
  dinner: "text-violet-700",
};

function LockIcon() {
  return (
    <svg viewBox="0 0 12 12" fill="currentColor" className="w-2.5 h-2.5">
      <path d="M9 5V4a3 3 0 0 0-6 0v1H2v6h8V5H9zM5 4a1 1 0 0 1 2 0v1H5V4z" />
    </svg>
  );
}

export default function MealCell({
  meal, type, hasConflict, isLocked, noOptions, fading,
  onThumbsUp, onThumbsDown, onClick,
}: Props) {
  if (!meal) {
    return (
      <button
        onClick={onClick}
        className={`w-full h-full min-h-[80px] border-2 border-dashed rounded-lg flex items-center justify-center text-gray-300 text-2xl font-light transition-colors cursor-pointer active:scale-[0.97] ${EMPTY_ACCENT[type]}`}
        aria-label="Add meal"
      >
        +
      </button>
    );
  }

  const borderClass = isLocked
    ? "border-2 border-emerald-400"
    : hasConflict
    ? "border border-rose-200"
    : `border ${TYPE_ACCENT[type].split(" ").filter((c) => c.startsWith("border-")).join(" ")}`;

  const bgClass = isLocked
    ? "bg-emerald-50"
    : hasConflict
    ? "bg-rose-50"
    : TYPE_ACCENT[type].split(" ").filter((c) => c.startsWith("bg-")).join(" ");

  return (
    <div className={`relative w-full h-full min-h-[80px] rounded-lg group transition-opacity duration-150 ${fading ? "opacity-0" : "opacity-100"}`}>
      {/* Main clickable card area */}
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onClick(); }}
        className={`w-full h-full min-h-[80px] rounded-lg p-2 cursor-pointer transition-colors ${borderClass} ${bgClass} hover:brightness-[0.97]`}
      >
        {/* Top row: lock + allergen indicator */}
        <div className="flex items-start justify-between mb-1">
          <div className="flex items-center gap-1 min-w-0">
            {isLocked && (
              <span className="text-emerald-500 shrink-0" title="Locked">
                <LockIcon />
              </span>
            )}
            <p className={`text-xs font-semibold leading-tight line-clamp-2 ${hasConflict ? "text-rose-700" : isLocked ? "text-emerald-800" : "text-gray-800"}`}>
              {meal.name}
            </p>
          </div>
          {hasConflict && (
            <span
              className="text-[10px] bg-rose-100 text-rose-500 rounded-full w-4 h-4 flex items-center justify-center font-bold leading-none shrink-0 ml-1"
              title="Contains allergen"
            >
              !
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="flex gap-2 text-[11px]">
          <span className={hasConflict ? "text-rose-400" : isLocked ? "text-emerald-600" : "text-gray-500"}>
            {meal.calories} cal
          </span>
          <span className={`font-semibold ${hasConflict ? "text-rose-500" : isLocked ? "text-emerald-700" : BADGE[type]}`}>
            {meal.protein}g pro
          </span>
        </div>

        {/* No-options message */}
        {noOptions && (
          <p className="mt-1 text-[10px] text-orange-500 leading-tight">
            No more options —{" "}
            <Link href="/settings" onClick={(e) => e.stopPropagation()} className="underline">
              adjust settings
            </Link>
          </p>
        )}
      </div>

      {/* Rating buttons — hover on desktop, always visible on mobile */}
      {!noOptions && (
        <div className="absolute bottom-1.5 right-1.5 flex gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-100">
          <button
            onClick={(e) => { e.stopPropagation(); onThumbsUp(); }}
            title={isLocked ? "Unlock slot" : "Like & lock this meal"}
            className={`w-5 h-5 rounded flex items-center justify-center text-[11px] transition-colors ${
              isLocked
                ? "bg-emerald-100 text-emerald-600 hover:bg-emerald-200"
                : "bg-white/80 hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 border border-gray-200 hover:border-emerald-300"
            }`}
          >
            👍
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onThumbsDown(); }}
            title="Dislike & swap"
            className="w-5 h-5 rounded flex items-center justify-center text-[11px] bg-white/80 hover:bg-rose-50 text-gray-400 hover:text-rose-500 border border-gray-200 hover:border-rose-300 transition-colors"
          >
            👎
          </button>
        </div>
      )}
    </div>
  );
}
