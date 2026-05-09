"use client";

import { Allergen, ALLERGEN_LABELS, ALL_ALLERGENS } from "@/app/data/meals";

interface Props {
  active: Set<Allergen>;
  onToggle: (a: Allergen) => void;
}

export default function AllergyFilter({ active, onToggle }: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider shrink-0 mr-1">Avoid</span>
      {ALL_ALLERGENS.map((a) => {
        const on = active.has(a);
        return (
          <button
            key={a}
            onClick={() => onToggle(a)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              on
                ? "bg-rose-50 border-rose-300 text-rose-600"
                : "bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            {on && <span className="mr-1">✕</span>}
            {ALLERGEN_LABELS[a]}
          </button>
        );
      })}
      {active.size > 0 && (
        <button
          onClick={() => active.forEach((a) => onToggle(a))}
          className="text-xs text-gray-300 hover:text-gray-500 ml-1 transition-colors"
        >
          Clear
        </button>
      )}
    </div>
  );
}
