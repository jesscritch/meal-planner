import { Meal, MealType } from "@/app/data/meals";

export type DayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export const FULL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;
export const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner"];
export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
};

export type PlanGrid = Record<MealType, (Meal | null)[]>;

export interface ActiveCell {
  day: number;
  type: MealType;
}

export interface FoodLogEntry {
  id: string;
  timestamp: number;
  transcript: string;
  summary: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  notes: string;
}

export interface MealSuggestion {
  meal: string;
  calories: number;
  protein: number;
  reason: string;
}

export interface SuggestionsResult {
  remaining: { calories: number; protein: number };
  suggestions: MealSuggestion[];
}
