"use client";

import { useState, useEffect, useCallback } from "react";
import { FoodLogEntry } from "@/app/types/planner";

const GOALS = { calories: 1500, protein: 170 };

function todayKey() {
  return `food-log-${new Date().toISOString().slice(0, 10)}`;
}

export function useFoodLog() {
  const [entries, setEntries] = useState<FoodLogEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(todayKey());
      setEntries(raw ? JSON.parse(raw) : []);
    } catch {
      setEntries([]);
    }
    setHydrated(true);
  }, []);

  const addEntry = useCallback((entry: FoodLogEntry) => {
    setEntries((prev) => {
      const next = [...prev, entry];
      localStorage.setItem(todayKey(), JSON.stringify(next));
      return next;
    });
  }, []);

  const totals = entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      protein: acc.protein + e.protein,
      carbs: acc.carbs + e.carbs,
      fat: acc.fat + e.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return { entries, addEntry, totals, goals: GOALS, hydrated };
}
