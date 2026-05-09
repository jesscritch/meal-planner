"use client";

import { useState, useEffect, useCallback } from "react";
import { Allergen, Meal, MealType, MEALS_BY_TYPE, foodMatchesMeal } from "@/app/data/meals";
import { PlanGrid, MEAL_TYPES } from "@/app/types/planner";
import { LockedSlots } from "@/app/hooks/useRatings";

const GRID_KEY = "meal-planner-grid";
const ALLERGENS_KEY = "meal-planner-allergens";
const EXTRA_INGREDIENTS_KEY = "meal-planner-extra-ingredients";

function emptyGrid(): PlanGrid {
  return {
    breakfast: Array(7).fill(null),
    lunch: Array(7).fill(null),
    dinner: Array(7).fill(null),
    snack: Array(7).fill(null),
  };
}

// Normalises an ingredient string to its base name for deduplication.
// Handles: "150g chicken breast", "Chicken breast (170g)", "1 cup broccoli", "1/2 avocado"
function ingredientBase(s: string): string {
  return s
    .replace(/\s×\d+$/, "")           // strip ×N count appended by groceryList
    .replace(/\([^)]*\)/g, "")         // strip parentheticals e.g. (150g)
    .replace(/^\d+(\.\d+)?\s*(g|kg|ml|l|cups?|tbsp|tsp|oz|lbs?|pieces?|cloves?|slices?|large|small|medium)\s*/gi, "")
    .replace(/^\d+\/\d+\s+/, "")       // fractions like 1/2
    .replace(/^\d+\s+/, "")            // plain leading numbers
    .toLowerCase()
    .trim();
}

export function mergeIngredients(existing: string[], incoming: string[]): string[] {
  const existingBases = new Set(existing.map(ingredientBase));
  const toAdd = incoming.filter((i) => !existingBases.has(ingredientBase(i)));
  return [...existing, ...toAdd].sort((a, b) => a.localeCompare(b));
}

function safeRandomMeal(
  type: MealType,
  excludedAllergens: Set<Allergen>,
  dislikedIds: Set<string> = new Set(),
  avoidedFoods: string[] = [],
): Meal {
  const pool = MEALS_BY_TYPE[type].filter(
    (m) =>
      !m.allergens.some((a) => excludedAllergens.has(a)) &&
      !dislikedIds.has(m.id) &&
      !foodMatchesMeal(m, avoidedFoods),
  );
  const source =
    pool.length > 0
      ? pool
      : MEALS_BY_TYPE[type].filter((m) => !m.allergens.some((a) => excludedAllergens.has(a)));
  return source[Math.floor(Math.random() * source.length)];
}

export function pickReplacementMeal(
  type: MealType,
  currentId: string,
  dislikedIds: Set<string>,
  allergens: Set<Allergen>,
  avoidedFoods: string[],
): Meal | null {
  const pool = MEALS_BY_TYPE[type].filter(
    (m) =>
      m.id !== currentId &&
      !dislikedIds.has(m.id) &&
      !m.allergens.some((a) => allergens.has(a)) &&
      !foodMatchesMeal(m, avoidedFoods),
  );
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function useMealPlan() {
  const [grid, setGrid] = useState<PlanGrid>(emptyGrid);
  const [activeAllergens, setActiveAllergens] = useState<Set<Allergen>>(new Set());
  const [extraIngredients, setExtraIngredients] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const storedGrid = localStorage.getItem(GRID_KEY);
      if (storedGrid) {
        const parsed = JSON.parse(storedGrid);
        if (!parsed.snack) parsed.snack = Array(7).fill(null);
        setGrid(parsed);
      }
      const storedAllergens = localStorage.getItem(ALLERGENS_KEY);
      if (storedAllergens) setActiveAllergens(new Set<Allergen>(JSON.parse(storedAllergens) as Allergen[]));
      const storedExtras = localStorage.getItem(EXTRA_INGREDIENTS_KEY);
      if (storedExtras) setExtraIngredients(JSON.parse(storedExtras));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(GRID_KEY, JSON.stringify(grid));
  }, [grid, hydrated]);

  useEffect(() => {
    if (hydrated) localStorage.setItem(ALLERGENS_KEY, JSON.stringify(Array.from(activeAllergens)));
  }, [activeAllergens, hydrated]);

  useEffect(() => {
    if (hydrated) localStorage.setItem(EXTRA_INGREDIENTS_KEY, JSON.stringify(extraIngredients));
  }, [extraIngredients, hydrated]);

  const toggleAllergen = useCallback((allergen: Allergen) => {
    setActiveAllergens((prev) => {
      const next = new Set(prev);
      if (next.has(allergen)) next.delete(allergen);
      else next.add(allergen);
      return next;
    });
  }, []);

  const setMeal = useCallback((type: MealType, day: number, meal: Meal | null) => {
    setGrid((prev) => {
      const updated = { ...prev, [type]: [...prev[type]] };
      updated[type][day] = meal;
      return updated;
    });
  }, []);

  const autoFill = useCallback(
    (options?: { dislikedIds?: Set<string>; lockedSlots?: LockedSlots; avoidedFoods?: string[] }) => {
      const { dislikedIds = new Set<string>(), lockedSlots, avoidedFoods = [] } = options ?? {};
      setGrid((prev) => {
        const next: PlanGrid = emptyGrid();
        for (const type of MEAL_TYPES) {
          if (MEALS_BY_TYPE[type].length === 0) {
            // No library entries for this type (e.g. snack) — preserve existing
            next[type] = [...prev[type]];
            continue;
          }
          for (let d = 0; d < 7; d++) {
            if (lockedSlots?.[type][d] && prev[type][d]) {
              next[type][d] = prev[type][d];
            } else {
              next[type][d] = safeRandomMeal(type, activeAllergens, dislikedIds, avoidedFoods);
            }
          }
        }
        return next;
      });
    },
    [activeAllergens],
  );

  const clearAll = useCallback(() => {
    setGrid(emptyGrid());
    setExtraIngredients([]);
  }, []);

  const addToGrocery = useCallback((incoming: string[]) => {
    setExtraIngredients((prev) => mergeIngredients(prev, incoming));
  }, []);

  const stats = (() => {
    const coreMealTypes = (["breakfast", "lunch", "dinner"] as const);
    let totalCal = 0, totalProt = 0, filled = 0;
    for (const type of coreMealTypes) {
      for (const meal of grid[type]) {
        if (meal) { totalCal += meal.calories; totalProt += meal.protein; filled++; }
      }
    }
    const activeDays = coreMealTypes.reduce((acc, t) => {
      grid[t].forEach((m, i) => { if (m) acc.add(i); });
      return acc;
    }, new Set<number>()).size;
    return {
      avgCalories: filled ? Math.round(totalCal / Math.max(activeDays, 1)) : 0,
      avgProtein: filled ? Math.round(totalProt / Math.max(activeDays, 1)) : 0,
      filled,
    };
  })();

  const groceryList = (): string[] => {
    // Static ingredients from the current plan
    const counts: Record<string, number> = {};
    for (const type of MEAL_TYPES) {
      for (const meal of grid[type]) {
        if (meal) {
          for (const ing of meal.ingredients) {
            counts[ing] = (counts[ing] ?? 0) + 1;
          }
        }
      }
    }
    const staticItems = Object.entries(counts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([ing, n]) => (n > 1 ? `${ing} ×${n}` : ing));

    // Merge with extras added via "Add to grocery list"
    return mergeIngredients(staticItems, extraIngredients);
  };

  return { grid, hydrated, activeAllergens, toggleAllergen, setMeal, autoFill, clearAll, addToGrocery, stats, groceryList };
}
