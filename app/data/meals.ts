export type MealType = "breakfast" | "lunch" | "dinner";
export type Allergen = "gluten" | "dairy" | "eggs" | "fish" | "shellfish" | "nuts" | "soy";

export const ALLERGEN_LABELS: Record<Allergen, string> = {
  gluten: "Gluten",
  dairy: "Dairy",
  eggs: "Eggs",
  fish: "Fish",
  shellfish: "Shellfish",
  nuts: "Nuts",
  soy: "Soy",
};

export const ALL_ALLERGENS: Allergen[] = ["gluten", "dairy", "eggs", "fish", "shellfish", "nuts", "soy"];

export interface Meal {
  id: string;
  name: string;
  type: MealType;
  calories: number;
  protein: number;
  ingredients: string[];
  keywords: string[];
  allergens: Allergen[];
}

export const MEALS: Meal[] = [
  // Breakfasts ~300 cal / ~30g protein
  {
    id: "b1",
    name: "Greek Yogurt & Berries",
    type: "breakfast",
    calories: 290,
    protein: 28,
    ingredients: ["Greek yogurt (2% fat, 200g)", "Mixed berries (100g)", "Honey (1 tsp)", "Granola (20g)"],
    keywords: ["greek yogurt", "yogurt", "berries", "honey", "granola"],
    allergens: ["dairy", "gluten"],
  },
  {
    id: "b2",
    name: "Egg White Omelette",
    type: "breakfast",
    calories: 305,
    protein: 32,
    ingredients: ["Egg whites (5 large)", "Spinach (30g)", "Cherry tomatoes (50g)", "Feta cheese (20g)", "Olive oil (1 tsp)"],
    keywords: ["eggs", "egg whites", "spinach", "tomatoes", "feta", "olive oil"],
    allergens: ["eggs", "dairy"],
  },
  {
    id: "b3",
    name: "Cottage Cheese Pancakes",
    type: "breakfast",
    calories: 310,
    protein: 30,
    ingredients: ["Cottage cheese (150g)", "Eggs (2 large)", "Oat flour (40g)", "Baking powder (1/2 tsp)", "Banana (1/2)"],
    keywords: ["cottage cheese", "eggs", "oats", "oat flour", "banana"],
    allergens: ["dairy", "eggs", "gluten"],
  },
  {
    id: "b4",
    name: "Protein Overnight Oats",
    type: "breakfast",
    calories: 295,
    protein: 29,
    ingredients: ["Rolled oats (60g)", "Protein powder, vanilla (1 scoop)", "Almond milk (150ml)", "Chia seeds (1 tbsp)", "Peanut butter (1 tbsp)"],
    keywords: ["oats", "protein powder", "almond milk", "chia seeds", "peanut butter", "almonds"],
    allergens: ["gluten", "nuts"],
  },
  {
    id: "b5",
    name: "Turkey & Egg Scramble",
    type: "breakfast",
    calories: 300,
    protein: 34,
    ingredients: ["Lean turkey mince (100g)", "Eggs (2 large)", "Bell pepper (1/2)", "Onion (1/4)", "Olive oil (1 tsp)"],
    keywords: ["turkey", "eggs", "bell pepper", "onion", "olive oil"],
    allergens: ["eggs"],
  },
  {
    id: "b6",
    name: "Smoked Salmon Bagel",
    type: "breakfast",
    calories: 315,
    protein: 28,
    ingredients: ["Smoked salmon (80g)", "Whole wheat bagel (1 small)", "Low-fat cream cheese (30g)", "Capers (1 tbsp)", "Red onion (sliced)"],
    keywords: ["salmon", "smoked salmon", "bagel", "cream cheese", "capers", "red onion"],
    allergens: ["fish", "gluten", "dairy"],
  },

  // Lunches ~420 cal / ~45g protein
  {
    id: "l1",
    name: "Grilled Chicken Caesar",
    type: "lunch",
    calories: 420,
    protein: 46,
    ingredients: ["Chicken breast (150g)", "Romaine lettuce (80g)", "Parmesan (20g)", "Light Caesar dressing (2 tbsp)", "Whole wheat croutons (20g)"],
    keywords: ["chicken", "lettuce", "parmesan", "caesar dressing", "croutons"],
    allergens: ["dairy", "gluten"],
  },
  {
    id: "l2",
    name: "Tuna & White Bean Bowl",
    type: "lunch",
    calories: 415,
    protein: 45,
    ingredients: ["Canned tuna in water (150g)", "White beans (100g)", "Cherry tomatoes (80g)", "Cucumber (60g)", "Olive oil (1 tbsp)", "Lemon juice"],
    keywords: ["tuna", "white beans", "tomatoes", "cucumber", "olive oil", "lemon"],
    allergens: ["fish"],
  },
  {
    id: "l3",
    name: "Turkey Quinoa Bowl",
    type: "lunch",
    calories: 425,
    protein: 44,
    ingredients: ["Lean turkey breast (130g)", "Cooked quinoa (80g)", "Roasted zucchini (80g)", "Feta cheese (20g)", "Tzatziki (2 tbsp)"],
    keywords: ["turkey", "quinoa", "zucchini", "feta", "tzatziki"],
    allergens: ["dairy"],
  },
  {
    id: "l4",
    name: "Shrimp Stir-Fry",
    type: "lunch",
    calories: 410,
    protein: 47,
    ingredients: ["Shrimp, peeled (180g)", "Brown rice (70g)", "Broccoli (100g)", "Snap peas (60g)", "Soy sauce (1 tbsp)", "Sesame oil (1 tsp)", "Garlic"],
    keywords: ["shrimp", "rice", "broccoli", "snap peas", "soy sauce", "garlic"],
    allergens: ["shellfish", "soy"],
  },
  {
    id: "l5",
    name: "Beef & Veggie Wrap",
    type: "lunch",
    calories: 430,
    protein: 43,
    ingredients: ["Lean beef strips (130g)", "Whole wheat tortilla (1 large)", "Mixed greens (30g)", "Avocado (1/4)", "Greek yogurt (2 tbsp)", "Salsa (2 tbsp)"],
    keywords: ["beef", "red meat", "tortilla", "avocado", "greek yogurt", "yogurt", "salsa"],
    allergens: ["gluten", "dairy"],
  },
  {
    id: "l6",
    name: "Lentil Chicken Soup",
    type: "lunch",
    calories: 405,
    protein: 45,
    ingredients: ["Chicken breast (120g)", "Red lentils (60g)", "Diced tomatoes (100g)", "Spinach (30g)", "Chicken broth (300ml)", "Cumin", "Garlic"],
    keywords: ["chicken", "lentils", "tomatoes", "spinach", "garlic", "cumin"],
    allergens: [],
  },

  // Dinners ~400 cal / ~48g protein
  {
    id: "d1",
    name: "Baked Salmon & Asparagus",
    type: "dinner",
    calories: 390,
    protein: 48,
    ingredients: ["Salmon fillet (180g)", "Asparagus (120g)", "Lemon (1/2)", "Olive oil (1 tbsp)", "Garlic (2 cloves)", "Dill"],
    keywords: ["salmon", "asparagus", "lemon", "olive oil", "garlic", "dill"],
    allergens: ["fish"],
  },
  {
    id: "d2",
    name: "Chicken & Sweet Potato",
    type: "dinner",
    calories: 405,
    protein: 47,
    ingredients: ["Chicken breast (170g)", "Sweet potato (150g)", "Green beans (100g)", "Olive oil (1 tbsp)", "Paprika", "Rosemary"],
    keywords: ["chicken", "sweet potato", "green beans", "olive oil", "paprika"],
    allergens: [],
  },
  {
    id: "d3",
    name: "Lean Beef Stir-Fry",
    type: "dinner",
    calories: 400,
    protein: 49,
    ingredients: ["Lean beef sirloin (160g)", "Brown rice (60g)", "Mixed peppers (100g)", "Mushrooms (80g)", "Oyster sauce (1 tbsp)", "Sesame oil (1 tsp)"],
    keywords: ["beef", "red meat", "rice", "peppers", "bell peppers", "mushrooms"],
    allergens: ["soy"],
  },
  {
    id: "d4",
    name: "Baked Cod & Broccoli",
    type: "dinner",
    calories: 370,
    protein: 50,
    ingredients: ["Cod fillet (200g)", "Broccoli florets (150g)", "Cherry tomatoes (80g)", "Olive oil (1 tbsp)", "Lemon", "Garlic", "Herbs"],
    keywords: ["cod", "fish", "broccoli", "tomatoes", "olive oil", "lemon", "garlic"],
    allergens: ["fish"],
  },
  {
    id: "d5",
    name: "Turkey Meatballs & Zucchini",
    type: "dinner",
    calories: 410,
    protein: 46,
    ingredients: ["Turkey mince (180g)", "Zucchini noodles (150g)", "Marinara sauce (80g)", "Parmesan (15g)", "Garlic", "Italian herbs"],
    keywords: ["turkey", "zucchini", "marinara", "parmesan", "garlic"],
    allergens: ["dairy"],
  },
  {
    id: "d6",
    name: "Prawn & Chickpea Curry",
    type: "dinner",
    calories: 395,
    protein: 48,
    ingredients: ["Prawns (180g)", "Chickpeas (80g)", "Coconut milk, light (80ml)", "Diced tomatoes (100g)", "Spinach (40g)", "Curry powder", "Ginger", "Garlic"],
    keywords: ["prawns", "shrimp", "chickpeas", "coconut milk", "spinach", "curry", "ginger", "garlic"],
    allergens: ["shellfish"],
  },
];

export const MEALS_BY_TYPE: Record<MealType, Meal[]> = {
  breakfast: MEALS.filter((m) => m.type === "breakfast"),
  lunch: MEALS.filter((m) => m.type === "lunch"),
  dinner: MEALS.filter((m) => m.type === "dinner"),
};

export function foodMatchesMeal(meal: Meal, foods: string[]): boolean {
  if (foods.length === 0) return false;
  return foods.some((food) => {
    const f = food.toLowerCase().trim();
    return meal.keywords.some((kw) => {
      const k = kw.toLowerCase();
      return k.includes(f) || f.includes(k);
    });
  });
}
