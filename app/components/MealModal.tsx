"use client";

import { useEffect, useRef } from "react";
import { Allergen, ALLERGEN_LABELS, Meal, MealType, MEALS_BY_TYPE, foodMatchesMeal } from "@/app/data/meals";
import { DAYS, MEAL_TYPE_LABELS } from "@/app/types/planner";

interface Props {
  type: MealType;
  day: number;
  current: Meal | null;
  activeAllergens: Set<Allergen>;
  likedFoods: string[];
  avoidedFoods: string[];
  likedMealIds: Set<string>;
  dislikedMealIds: Set<string>;
  onSelect: (meal: Meal) => void;
  onRemove: () => void;
  onClose: () => void;
}

const TYPE_HEADING: Record<MealType, string> = {
  breakfast: "text-amber-700",
  lunch: "text-sky-700",
  dinner: "text-violet-700",
};

const SELECTED_RING: Record<MealType, string> = {
  breakfast: "ring-2 ring-amber-400 bg-amber-50",
  lunch: "ring-2 ring-sky-400 bg-sky-50",
  dinner: "ring-2 ring-violet-400 bg-violet-50",
};

export default function MealModal({
  type, day, current, activeAllergens, likedFoods, avoidedFoods,
  likedMealIds, dislikedMealIds,
  onSelect, onRemove, onClose,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const prev = document.activeElement as HTMLElement;
    el.focus();
    return () => prev?.focus();
  }, []);

  const allMeals = MEALS_BY_TYPE[type];

  // 1. Allergen filter
  const allergenSafe = activeAllergens.size > 0
    ? allMeals.filter((m) => !m.allergens.some((a) => activeAllergens.has(a)))
    : allMeals;
  const hiddenByAllergen = allMeals.length - allergenSafe.length;

  // 2. Disliked meals filter (always, unless it's the current meal — still show it so user can remove)
  const afterDisliked = allergenSafe.filter((m) => !dislikedMealIds.has(m.id) || m.id === current?.id);

  // 3. Preference avoided filter
  const prefFiltered = avoidedFoods.length > 0
    ? afterDisliked.filter((m) => !foodMatchesMeal(m, avoidedFoods) || m.id === current?.id)
    : afterDisliked;
  const showPrefFallback = prefFiltered.length === 0 && afterDisliked.length > 0;
  const afterPrefFilter = showPrefFallback ? afterDisliked : prefFiltered;

  // 4. Sort: liked (food pref match) first, then rest
  const isPrefLiked = (m: Meal) => foodMatchesMeal(m, likedFoods);
  const sorted = [
    ...afterPrefFilter.filter(isPrefLiked),
    ...afterPrefFilter.filter((m) => !isPrefLiked(m)),
  ];

  // 5. Allergen-conflicting current at top
  const conflictingCurrent = current && current.allergens.some((a) => activeAllergens.has(a)) ? current : null;
  const displayMeals = conflictingCurrent
    ? [conflictingCurrent, ...sorted.filter((m) => m.id !== conflictingCurrent.id)]
    : sorted;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={ref}
        tabIndex={-1}
        className="bg-white rounded-t-2xl sm:rounded-xl w-full sm:max-w-md sm:mx-4 outline-none overflow-hidden max-h-[88vh] sm:max-h-[80vh] flex flex-col"
      >
        {/* Mobile drag handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-8 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 sm:py-4 border-b border-gray-100 shrink-0">
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wider ${TYPE_HEADING[type]}`}>
              {MEAL_TYPE_LABELS[type]}
            </p>
            <h2 className="text-base font-semibold text-gray-900">{DAYS[day]}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none w-8 h-8 flex items-center justify-center">
            ×
          </button>
        </div>

        {/* Notices */}
        <div className="shrink-0">
          {hiddenByAllergen > 0 && (
            <div className="mx-4 mt-3 px-3 py-2 bg-rose-50 border border-rose-100 rounded-lg flex items-start gap-2">
              <span className="text-rose-400 text-sm mt-0.5 shrink-0">!</span>
              <p className="text-xs text-rose-600">
                {hiddenByAllergen} meal{hiddenByAllergen > 1 ? "s" : ""} hidden — contains{" "}
                {Array.from(activeAllergens).map((a) => ALLERGEN_LABELS[a]).join(", ")}
              </p>
            </div>
          )}
          {showPrefFallback && (
            <div className="mx-4 mt-2 px-3 py-2 bg-orange-50 border border-orange-100 rounded-lg flex items-start gap-2">
              <span className="text-orange-400 text-sm mt-0.5 shrink-0">~</span>
              <p className="text-xs text-orange-600">No matches for your preferences — showing all options</p>
            </div>
          )}
        </div>

        {/* Meal list */}
        <div className="p-4 space-y-2 overflow-y-auto flex-1">
          {displayMeals.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No meals available for your current filters.</p>
          ) : (
            displayMeals.map((meal) => {
              const isSelected = current?.id === meal.id;
              const isConflicting = meal.allergens.some((a) => activeAllergens.has(a));
              const isPrefLikedMeal = !isConflicting && isPrefLiked(meal);
              const isRatedByUser = likedMealIds.has(meal.id);
              const isDisliked = dislikedMealIds.has(meal.id);

              return (
                <button
                  key={meal.id}
                  onClick={() => { onSelect(meal); onClose(); }}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                    isConflicting
                      ? "border-rose-200 bg-rose-50 hover:border-rose-300"
                      : isSelected
                      ? SELECTED_RING[type]
                      : "border-gray-200 hover:border-gray-300 active:bg-gray-50 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className={`text-sm font-medium ${isConflicting ? "text-rose-700" : "text-gray-800"}`}>
                      {meal.name}
                    </span>
                    <div className="flex items-center gap-1 shrink-0 mt-0.5">
                      {isRatedByUser && (
                        <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full leading-none">
                          ⭐ rated
                        </span>
                      )}
                      {isPrefLikedMeal && !isRatedByUser && (
                        <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full leading-none">
                          ★ liked
                        </span>
                      )}
                      {isConflicting && (
                        <span className="text-xs text-rose-400 font-medium">allergen</span>
                      )}
                      {isDisliked && !isConflicting && (
                        <span className="text-xs text-gray-300 font-medium">👎</span>
                      )}
                      {isSelected && !isConflicting && (
                        <span className="text-xs text-gray-400">current</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-3 mt-1 text-xs text-gray-500">
                    <span>{meal.calories} cal</span>
                    <span className="font-medium">{meal.protein}g protein</span>
                  </div>
                  <ul className="mt-1.5 flex flex-wrap gap-1">
                    {meal.ingredients.map((ing) => (
                      <li key={ing} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                        {ing}
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })
          )}
        </div>

        {/* Remove button */}
        {current && (
          <div className="px-4 pb-4 shrink-0 border-t border-gray-100 pt-3">
            <button
              onClick={() => { onRemove(); onClose(); }}
              className="w-full py-2.5 text-sm text-red-500 hover:text-red-700 active:bg-red-50 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
            >
              Remove meal
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
