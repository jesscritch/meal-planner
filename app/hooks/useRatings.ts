"use client";

import { useState, useEffect, useCallback } from "react";
import { MealType } from "@/app/data/meals";

const LIKED_KEY = "meal-planner-liked-meals";
const DISLIKED_KEY = "meal-planner-disliked-meals";
const LOCKED_KEY = "meal-planner-locked-slots";

export type LockedSlots = Record<MealType, boolean[]>;

function emptyLocked(): LockedSlots {
  return {
    breakfast: Array(7).fill(false),
    lunch: Array(7).fill(false),
    dinner: Array(7).fill(false),
    snack: Array(7).fill(false),
  };
}

export function useRatings() {
  const [likedMealIds, setLikedMealIds] = useState<Set<string>>(new Set());
  const [dislikedMealIds, setDislikedMealIds] = useState<Set<string>>(new Set());
  const [lockedSlots, setLockedSlots] = useState<LockedSlots>(emptyLocked);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const liked = localStorage.getItem(LIKED_KEY);
      if (liked) setLikedMealIds(new Set<string>(JSON.parse(liked)));
      const disliked = localStorage.getItem(DISLIKED_KEY);
      if (disliked) setDislikedMealIds(new Set<string>(JSON.parse(disliked)));
      const locked = localStorage.getItem(LOCKED_KEY);
      if (locked) {
        const parsed = JSON.parse(locked);
        if (!parsed.snack) parsed.snack = Array(7).fill(false);
        setLockedSlots(parsed);
      }
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(LIKED_KEY, JSON.stringify(Array.from(likedMealIds)));
  }, [likedMealIds, hydrated]);

  useEffect(() => {
    if (hydrated) localStorage.setItem(DISLIKED_KEY, JSON.stringify(Array.from(dislikedMealIds)));
  }, [dislikedMealIds, hydrated]);

  useEffect(() => {
    if (hydrated) localStorage.setItem(LOCKED_KEY, JSON.stringify(lockedSlots));
  }, [lockedSlots, hydrated]);

  const likeMeal = useCallback((mealId: string) => {
    setLikedMealIds((prev) => new Set(Array.from(prev).concat(mealId)));
  }, []);

  const dislikeMeal = useCallback((mealId: string) => {
    setDislikedMealIds((prev) => new Set(Array.from(prev).concat(mealId)));
    setLikedMealIds((prev) => { const s = new Set(prev); s.delete(mealId); return s; });
  }, []);

  const lockSlot = useCallback((type: MealType, day: number) => {
    setLockedSlots((prev) => {
      const next = { ...prev, [type]: [...prev[type]] };
      next[type][day] = true;
      return next;
    });
  }, []);

  const unlockSlot = useCallback((type: MealType, day: number) => {
    setLockedSlots((prev) => {
      const next = { ...prev, [type]: [...prev[type]] };
      next[type][day] = false;
      return next;
    });
  }, []);

  const clearLocks = useCallback(() => setLockedSlots(emptyLocked()), []);

  return {
    likedMealIds, dislikedMealIds, lockedSlots, hydrated,
    likeMeal, dislikeMeal, lockSlot, unlockSlot, clearLocks,
  };
}
