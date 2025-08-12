import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MealStore, DayMeal, MealItem } from '../types/meal';
import type { OxalateFoodItem } from '../types/oxalate';

const getTodayString = () => {
  return new Date().toISOString().split('T')[0];
};

const createEmptyDay = (date: string): DayMeal => ({
  date,
  items: [],
  totalOxalate: 0,
});

export const useMealStore = create<MealStore>()(
  persist(
    (set, get) => ({
      currentDay: createEmptyDay(getTodayString()),
      mealHistory: [],
      dailyLimit: 50, // Default 50mg daily limit

      // Helper function to find food in database by name (fuzzy matching)
      findFoodByName: (foodName: string, foodDatabase: OxalateFoodItem[]): OxalateFoodItem | null => {
        const cleanName = foodName.toLowerCase().trim();
        
        // Try exact match first
        let match = foodDatabase.find(food => 
          food.name.toLowerCase() === cleanName
        );
        
        if (match) return match;
        
        // Try partial match
        match = foodDatabase.find(food => 
          food.name.toLowerCase().includes(cleanName) || 
          cleanName.includes(food.name.toLowerCase())
        );
        
        if (match) return match;
        
        // Try alias matching
        match = foodDatabase.find(food => 
          food.aliases?.some(alias => 
            alias.toLowerCase().includes(cleanName) || 
            cleanName.includes(alias.toLowerCase())
          )
        );
        
        return match || null;
      },

      addMealItem: (food: OxalateFoodItem, portion: number, oxalateAmount: number) => {
        const today = getTodayString();
        const newItem: MealItem = {
          id: Date.now().toString(),
          food,
          portion,
          oxalateAmount,
          timestamp: Date.now(),
        };

        set((state) => {
          // Update current day if it's today, otherwise create new day
          let updatedCurrentDay = state.currentDay;
          let updatedHistory = [...state.mealHistory];

          if (state.currentDay.date === today) {
            updatedCurrentDay = {
              ...state.currentDay,
              items: [...state.currentDay.items, newItem],
              totalOxalate: state.currentDay.totalOxalate + oxalateAmount,
            };
          } else {
            // Save current day to history if it has items
            if (state.currentDay.items.length > 0) {
              updatedHistory.push(state.currentDay);
            }
            
            // Create new current day
            updatedCurrentDay = {
              date: today,
              items: [newItem],
              totalOxalate: oxalateAmount,
            };
          }

          return {
            currentDay: updatedCurrentDay,
            mealHistory: updatedHistory,
          };
        });
      },

      removeMealItem: (itemId: string) => {
        set((state) => {
          const itemToRemove = state.currentDay.items.find(item => item.id === itemId);
          if (!itemToRemove) return state;

          return {
            currentDay: {
              ...state.currentDay,
              items: state.currentDay.items.filter(item => item.id !== itemId),
              totalOxalate: state.currentDay.totalOxalate - itemToRemove.oxalateAmount,
            },
          };
        });
      },

      setDailyLimit: (limit: number) => {
        set({ dailyLimit: limit });
      },

      getMealForDate: (date: string) => {
        const { currentDay, mealHistory } = get();
        if (currentDay.date === date) {
          return currentDay;
        }
        return mealHistory.find(day => day.date === date);
      },

      clearDay: () => {
        set({ currentDay: createEmptyDay(getTodayString()) });
      },

      // Add all ingredients from a recipe to the tracker
      addRecipeIngredients: (recipe: { 
        title: string; 
        ingredients: Array<{ name: string; amount?: string; }>; 
        servings: number;
      }, foodDatabase: OxalateFoodItem[]): { 
        added: number; 
        notFound: string[]; 
        totalOxalate: number; 
      } => {
        const { addMealItem, findFoodByName } = get();
        let added = 0;
        let totalOxalate = 0;
        const notFound: string[] = [];

        recipe.ingredients.forEach((ingredient) => {
          // Clean ingredient name (remove amounts/measurements)
          const cleanIngredientName = ingredient.name
            .replace(/^\d+(?:\.\d+)?\s*(?:cups?|tbsp|tsp|oz|lbs?|grams?|g|ml|l)\s*/i, '')
            .replace(/^(?:a\s+)?(?:few\s+)?(?:pinch\s+of\s+)?/i, '')
            .split(',')[0]
            .trim();

          const foodMatch = findFoodByName(cleanIngredientName, foodDatabase);
          
          if (foodMatch) {
            // Use default portion size (typically 1 serving)
            const portionSize = 1;
            const oxalateAmount = (foodMatch.oxalate_mg / recipe.servings) * portionSize;
            
            addMealItem(foodMatch, portionSize, oxalateAmount);
            added++;
            totalOxalate += oxalateAmount;
          } else {
            notFound.push(cleanIngredientName);
          }
        });

        return { added, notFound, totalOxalate };
      },
    }),
    {
      name: 'meal-store',
      storage: {
        getItem: async (name) => {
          const value = await AsyncStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: async (name, value) => {
          await AsyncStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: async (name) => {
          await AsyncStorage.removeItem(name);
        },
      },
    }
  )
);