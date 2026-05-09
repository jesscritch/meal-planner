"use client";

import { useState, useEffect } from "react";
import { Meal } from "@/app/data/meals";
import { RecipeData } from "@/app/api/recipe/route";

interface Props {
  meal: Meal;
  onAddToGrocery: (ingredients: string[]) => void;
  onChangeMeal: () => void;
  onClose: () => void;
}

const CACHE_PREFIX = "recipe-";

type Tab = "ingredients" | "instructions";

export default function RecipeModal({ meal, onAddToGrocery, onChangeMeal, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("ingredients");
  const [recipe, setRecipe] = useState<RecipeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const cacheKey = CACHE_PREFIX + meal.id;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        setRecipe(JSON.parse(cached));
        return;
      } catch {}
    }

    setLoading(true);
    setError(false);
    fetch("/api/recipe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mealName: meal.name }),
    })
      .then((r) => r.json())
      .then((data: RecipeData & { error?: string }) => {
        if (data.error) throw new Error(data.error);
        setRecipe(data);
        localStorage.setItem(cacheKey, JSON.stringify(data));
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [meal.id, meal.name]);

  function handleAddToGrocery() {
    if (!recipe) return;
    onAddToGrocery(recipe.ingredients);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-xl shadow-xl flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-gray-100 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold text-gray-900 leading-tight">{meal.name}</h2>
              <p className="text-xs text-gray-400 mt-0.5">{meal.calories} kcal · {meal.protein}g protein</p>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors text-lg leading-none"
              aria-label="Close"
            >×</button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-3">
            {(["ingredients", "instructions"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors capitalize ${
                  tab === t
                    ? "bg-gray-900 text-white"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
              <p className="text-sm text-gray-400">Generating recipe…</p>
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <p className="text-sm text-gray-500">Couldn&apos;t load recipe — try again.</p>
              <button
                onClick={() => {
                  setError(false);
                  setRecipe(null);
                  setLoading(true);
                  fetch("/api/recipe", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ mealName: meal.name }),
                  })
                    .then((r) => r.json())
                    .then((data: RecipeData & { error?: string }) => {
                      if (data.error) throw new Error(data.error);
                      setRecipe(data);
                      localStorage.setItem(CACHE_PREFIX + meal.id, JSON.stringify(data));
                    })
                    .catch(() => setError(true))
                    .finally(() => setLoading(false));
                }}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {recipe && !loading && tab === "ingredients" && (
            <ul className="space-y-2">
              {recipe.ingredients.map((ing, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
                  {ing}
                </li>
              ))}
            </ul>
          )}

          {recipe && !loading && tab === "instructions" && (
            <div>
              {recipe.cookTime && (
                <p className="text-xs text-gray-400 mb-4">⏱ Ready in {recipe.cookTime}</p>
              )}
              <ol className="space-y-4">
                {recipe.instructions.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-gray-700">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-gray-100 text-gray-500 text-[11px] font-semibold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 shrink-0 flex gap-2">
          <button
            onClick={handleAddToGrocery}
            disabled={!recipe || loading}
            className="flex-1 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {added ? "Added ✓" : "Add to grocery list"}
          </button>
          <button
            onClick={onChangeMeal}
            className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Change meal
          </button>
        </div>
      </div>
    </div>
  );
}
