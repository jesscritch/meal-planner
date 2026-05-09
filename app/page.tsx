"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useMealPlan, pickReplacementMeal } from "@/app/hooks/useMealPlan";
import { usePreferences } from "@/app/hooks/usePreferences";
import { useRatings } from "@/app/hooks/useRatings";
import { useFoodLog } from "@/app/hooks/useFoodLog";
import { DAYS, FULL_DAYS, MEAL_TYPES, MEAL_TYPE_LABELS, ActiveCell, MealSuggestion } from "@/app/types/planner";
import { Meal, MealType } from "@/app/data/meals";
import MealCell from "@/app/components/MealCell";
import MealModal from "@/app/components/MealModal";
import RecipeModal from "@/app/components/RecipeModal";
import GroceryModal from "@/app/components/GroceryModal";
import FoodLogPanel from "@/app/components/FoodLogPanel";
import StatsBar from "@/app/components/StatsBar";
import AllergyFilter from "@/app/components/AllergyFilter";

function SettingsIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
    </svg>
  );
}

type CellKey = string; // `${type}-${day}`
const cellKey = (type: MealType, day: number): CellKey => `${type}-${day}`;

// Maps JS getDay() (0=Sun) to our Mon-first index (0=Mon)
function todayDayIndex() {
  return (new Date().getDay() + 6) % 7;
}

export default function Page() {
  const { grid, hydrated, activeAllergens, toggleAllergen, setMeal, autoFill, clearAll, addToGrocery, stats, groceryList } = useMealPlan();
  const { likedFoods, avoidedFoods } = usePreferences();
  const { likedMealIds, dislikedMealIds, lockedSlots, likeMeal, dislikeMeal, lockSlot, unlockSlot, clearLocks } = useRatings();
  const { entries: logEntries, addEntry: addLogEntry, totals: logTotals, goals: logGoals } = useFoodLog();

  const [activeCell, setActiveCell] = useState<ActiveCell | null>(null);
  const [detailCell, setDetailCell] = useState<ActiveCell | null>(null);
  const [showGrocery, setShowGrocery] = useState(false);
  const [showFoodLog, setShowFoodLog] = useState(false);
  const [selectedDay, setSelectedDay] = useState(0);
  const [fadingCells, setFadingCells] = useState<Set<CellKey>>(new Set());
  const [noOptionsCells, setNoOptionsCells] = useState<Set<CellKey>>(new Set());

  const handleAutoFill = useCallback(() => {
    autoFill({ dislikedIds: dislikedMealIds, lockedSlots, avoidedFoods });
  }, [autoFill, dislikedMealIds, lockedSlots, avoidedFoods]);

  if (!hydrated) return null;

  const activeMeal = activeCell ? grid[activeCell.type][activeCell.day] : null;

  function cellConflicts(meal: Meal | null) {
    return !!meal && meal.allergens.some((a) => activeAllergens.has(a));
  }

  function handleThumbsUp(type: MealType, day: number, meal: Meal) {
    if (lockedSlots[type][day]) {
      // Already locked — toggle off
      unlockSlot(type, day);
    } else {
      likeMeal(meal.id);
      lockSlot(type, day);
      // Clear any no-options state on this cell
      setNoOptionsCells((prev) => { const s = new Set(prev); s.delete(cellKey(type, day)); return s; });
    }
  }

  function handleThumbsDown(type: MealType, day: number, meal: Meal) {
    const key = cellKey(type, day);

    // Fade out
    setFadingCells((prev) => new Set(Array.from(prev).concat(key)));

    setTimeout(() => {
      dislikeMeal(meal.id);
      unlockSlot(type, day);

      const next = pickReplacementMeal(type, meal.id, new Set(Array.from(dislikedMealIds).concat(meal.id)), activeAllergens, avoidedFoods);

      if (next) {
        setMeal(type, day, next);
        setNoOptionsCells((prev) => { const s = new Set(prev); s.delete(key); return s; });
      } else {
        setNoOptionsCells((prev) => new Set(Array.from(prev).concat(key)));
      }

      // Fade back in
      setFadingCells((prev) => { const s = new Set(prev); s.delete(key); return s; });
    }, 150);
  }

  function handleClearAll() {
    clearAll();
    clearLocks();
    setNoOptionsCells(new Set());
  }

  function handleAddToMealPlan(suggestion: MealSuggestion) {
    const day = todayDayIndex();
    // Find the first empty slot today, preferring time-appropriate type
    const hour = new Date().getHours();
    const preferredOrder: MealType[] =
      hour < 12 ? ["breakfast", "lunch", "dinner"]
      : hour < 17 ? ["lunch", "dinner", "breakfast"]
      : ["dinner", "lunch", "breakfast"];

    const targetType = preferredOrder.find((t) => !grid[t][day]) ?? null;
    if (!targetType) return; // all slots taken today

    const syntheticMeal: Meal = {
      id: `suggested-${Date.now()}`,
      name: suggestion.meal,
      type: targetType,
      calories: suggestion.calories,
      protein: suggestion.protein,
      ingredients: [],
      keywords: [],
      allergens: [],
    };
    setMeal(targetType, day, syntheticMeal);
  }

  function renderCell(type: MealType, day: number) {
    const meal = grid[type][day];
    const key = cellKey(type, day);
    return (
      <MealCell
        key={key}
        meal={meal}
        type={type}
        day={day}
        hasConflict={cellConflicts(meal)}
        isLocked={lockedSlots[type][day]}
        noOptions={noOptionsCells.has(key)}
        fading={fadingCells.has(key)}
        onThumbsUp={() => meal && handleThumbsUp(type, day, meal)}
        onThumbsDown={() => meal && handleThumbsDown(type, day, meal)}
        onClick={() => meal ? setDetailCell({ day, type }) : setActiveCell({ day, type })}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">

        {/* Header */}
        <div className="mb-5">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Meal Planner</h1>
              <p className="text-xs sm:text-sm text-gray-400 mt-0.5">1,500 kcal · 170g protein per day</p>
            </div>
            {/* Desktop buttons */}
            <div className="hidden sm:flex items-center gap-2">
              <button onClick={handleAutoFill} className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-700 transition-colors">
                Auto-fill week
              </button>
              <button onClick={() => setShowGrocery(true)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                Grocery list
              </button>
              <button onClick={handleClearAll} className="px-4 py-2 text-sm font-medium text-gray-400 bg-white border border-gray-200 rounded-lg hover:text-red-500 hover:border-red-200 transition-colors">
                Clear all
              </button>
              <Link
                href="/calendar"
                className="p-2 text-gray-400 hover:text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                title="Progress calendar"
              >
                <CalendarIcon />
              </Link>
              <Link
                href="/settings"
                className="p-2 text-gray-400 hover:text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                title="Food preferences"
              >
                <SettingsIcon />
              </Link>
            </div>
            {/* Mobile: calendar + settings icons in header */}
            <div className="sm:hidden flex items-center gap-1">
              <Link href="/calendar" className="p-2 text-gray-400 hover:text-gray-600 transition-colors" title="Progress calendar">
                <CalendarIcon />
              </Link>
              <Link href="/settings" className="p-2 text-gray-400 hover:text-gray-600 transition-colors" title="Food preferences">
                <SettingsIcon />
              </Link>
            </div>
          </div>
          {/* Mobile action buttons */}
          <div className="grid grid-cols-3 gap-2 sm:hidden">
            <button onClick={handleAutoFill} className="py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-700 transition-colors">
              Auto-fill
            </button>
            <button onClick={() => setShowGrocery(true)} className="py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              Groceries
            </button>
            <button onClick={handleClearAll} className="py-2 text-sm font-medium text-gray-400 bg-white border border-gray-200 rounded-lg hover:text-red-500 hover:border-red-200 transition-colors">
              Clear all
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-3">
          <StatsBar avgCalories={stats.avgCalories} avgProtein={stats.avgProtein} filled={stats.filled} />
        </div>

        {/* Allergy filter */}
        <div className="mb-5 sm:mb-6">
          <AllergyFilter active={activeAllergens} onToggle={toggleAllergen} />
        </div>

        {/* ── Mobile: day-navigator view ── */}
        <div className="sm:hidden">
          <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 mb-3">
            <button
              onClick={() => setSelectedDay((d) => Math.max(0, d - 1))}
              disabled={selectedDay === 0}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-20 transition-colors text-lg"
              aria-label="Previous day"
            >‹</button>
            <span className="text-sm font-semibold text-gray-800">{FULL_DAYS[selectedDay]}</span>
            <button
              onClick={() => setSelectedDay((d) => Math.min(6, d + 1))}
              disabled={selectedDay === 6}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-20 transition-colors text-lg"
              aria-label="Next day"
            >›</button>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {MEAL_TYPES.map((type, ri) => (
              <div key={type} className={`flex items-center gap-3 p-3 ${ri < MEAL_TYPES.length - 1 ? "border-b border-gray-100" : ""}`}>
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider w-14 shrink-0 leading-tight">
                  {MEAL_TYPE_LABELS[type]}
                </span>
                <div className="flex-1">
                  {renderCell(type, selectedDay)}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-2 mt-4">
            {DAYS.map((day, i) => (
              <button
                key={day}
                onClick={() => setSelectedDay(i)}
                className={`w-2 h-2 rounded-full transition-colors ${i === selectedDay ? "bg-gray-800" : "bg-gray-200 hover:bg-gray-400"}`}
                aria-label={FULL_DAYS[i]}
              />
            ))}
          </div>
        </div>

        {/* ── Desktop: full 7-column grid ── */}
        <div className="hidden sm:block bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="grid grid-cols-[100px_repeat(7,1fr)] border-b border-gray-100">
            <div className="px-3 py-2" />
            {DAYS.map((day) => (
              <div key={day} className="px-2 py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide border-l border-gray-100">
                {day}
              </div>
            ))}
          </div>
          {MEAL_TYPES.map((type, ri) => (
            <div key={type} className={`grid grid-cols-[100px_repeat(7,1fr)] ${ri < MEAL_TYPES.length - 1 ? "border-b border-gray-100" : ""}`}>
              <div className="px-3 py-3 flex items-center">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{MEAL_TYPE_LABELS[type]}</span>
              </div>
              {DAYS.map((_, day) => (
                <div key={day} className="p-1.5 border-l border-gray-100">
                  {renderCell(type, day)}
                </div>
              ))}
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-300 text-center mt-6">Plan auto-saved to local storage</p>
      </div>

      {/* Floating voice log button */}
      <button
        onClick={() => setShowFoodLog(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gray-900 hover:bg-gray-700 text-white rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-105 z-40"
        aria-label="Open food log"
        title="Voice food log"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
          <path d="M7 4a3 3 0 016 0v6a3 3 0 01-6 0V4zm-2 6a1 1 0 012 0 3 3 0 006 0 1 1 0 012 0 5 5 0 01-4 4.9V17h2a1 1 0 010 2H7a1 1 0 010-2h2v-2.1A5 5 0 015 10z" />
        </svg>
      </button>

      {detailCell && (() => {
        const detailMeal = grid[detailCell.type][detailCell.day];
        return detailMeal ? (
          <RecipeModal
            meal={detailMeal}
            onAddToGrocery={addToGrocery}
            onChangeMeal={() => {
              const saved = detailCell;
              setDetailCell(null);
              setActiveCell(saved);
            }}
            onClose={() => setDetailCell(null)}
          />
        ) : null;
      })()}

      {activeCell && (
        <MealModal
          type={activeCell.type}
          day={activeCell.day}
          current={activeMeal}
          activeAllergens={activeAllergens}
          likedFoods={likedFoods}
          avoidedFoods={avoidedFoods}
          likedMealIds={likedMealIds}
          dislikedMealIds={dislikedMealIds}
          onSelect={(meal) => {
            setMeal(activeCell.type, activeCell.day, meal);
            unlockSlot(activeCell.type, activeCell.day);
            setNoOptionsCells((prev) => { const s = new Set(prev); s.delete(cellKey(activeCell.type, activeCell.day)); return s; });
          }}
          onRemove={() => {
            setMeal(activeCell.type, activeCell.day, null);
            unlockSlot(activeCell.type, activeCell.day);
            setNoOptionsCells((prev) => { const s = new Set(prev); s.delete(cellKey(activeCell.type, activeCell.day)); return s; });
          }}
          onClose={() => setActiveCell(null)}
        />
      )}

      {showGrocery && (
        <GroceryModal items={groceryList()} onClose={() => setShowGrocery(false)} />
      )}

      {showFoodLog && (
        <FoodLogPanel
          onClose={() => setShowFoodLog(false)}
          entries={logEntries}
          onAddEntry={addLogEntry}
          totals={logTotals}
          goals={logGoals}
          onAddToMealPlan={handleAddToMealPlan}
        />
      )}
    </div>
  );
}
