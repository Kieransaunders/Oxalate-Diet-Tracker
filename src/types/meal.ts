import type { OxalateFoodItem } from './oxalate';

export interface MealItem {
  id: string;
  food: OxalateFoodItem;
  portion: number;
  oxalateAmount: number;
  timestamp: number;
}

export interface DayMeal {
  date: string; // YYYY-MM-DD format
  items: MealItem[];
  totalOxalate: number;
  dailyLimit?: number;
}

export interface MealStore {
  currentDay: DayMeal;
  mealHistory: DayMeal[];
  dailyLimit: number;
  
  // Actions
  addMealItem: (food: OxalateFoodItem, portion: number, oxalateAmount: number) => void;
  removeMealItem: (itemId: string) => void;
  setDailyLimit: (limit: number) => void;
  getMealForDate: (date: string) => DayMeal | undefined;
  clearDay: () => void;
  addRecipeIngredients: (recipe: { 
    title: string; 
    ingredients: Array<{ name: string; amount?: string; }>; 
    servings: number;
  }, foodDatabase: OxalateFoodItem[]) => { 
    added: number; 
    notFound: string[]; 
    totalOxalate: number; 
  };
  findFoodByName: (foodName: string, foodDatabase: OxalateFoodItem[]) => OxalateFoodItem | null;
}