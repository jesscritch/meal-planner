"use client";

import { useState, useEffect } from "react";

export const PREFS_KEY = "meal-planner-preferences";

export function usePreferences() {
  const [likedFoods, setLikedFoods] = useState<string[]>([]);
  const [avoidedFoods, setAvoidedFoods] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PREFS_KEY);
      if (stored) {
        const p = JSON.parse(stored);
        setLikedFoods(p.likedFoods ?? []);
        setAvoidedFoods(p.avoidedFoods ?? []);
      }
    } catch {}
    setHydrated(true);
  }, []);

  return { likedFoods, avoidedFoods, hydrated };
}

export function savePreferences(liked: string[], avoided: string[]): void {
  localStorage.setItem(PREFS_KEY, JSON.stringify({ likedFoods: liked, avoidedFoods: avoided }));
}
