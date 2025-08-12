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

      // Helper function to find food in database by name (enhanced fuzzy matching)
      findFoodByName: (foodName: string, foodDatabase: OxalateFoodItem[]): OxalateFoodItem | null => {
        if (!foodName || foodName.trim() === '') return null;
        
        const cleanName = foodName.toLowerCase().trim();
        
        // Try exact match first
        let match = foodDatabase.find(food => 
          food.name.toLowerCase() === cleanName
        );
        if (match) return match;
        
        // Try exact match with common variations
        const commonMappings: Record<string, string[]> = {
          'egg': ['eggs'],
          'eggs': ['egg'],
          'blueberry': ['blueberries'],
          'blueberries': ['blueberry'],
          'flour': ['white rice', 'rice flour'], // Low-oxalate alternatives
          'milk': ['milk', 'coconut milk'],
          'butter': ['butter'],
          'sugar': ['sugar'], // May not be in database
        };
        
        if (commonMappings[cleanName]) {
          for (const alternative of commonMappings[cleanName]) {
            match = foodDatabase.find(food => 
              food.name.toLowerCase() === alternative.toLowerCase()
            );
            if (match) return match;
          }
        }
        
        // Try partial match (ingredient contains food name or vice versa)
        match = foodDatabase.find(food => {
          const foodNameLower = food.name.toLowerCase();
          return foodNameLower.includes(cleanName) || cleanName.includes(foodNameLower);
        });
        if (match) return match;
        
        // Try word-based matching (split by spaces and check individual words)
        const nameWords = cleanName.split(/\s+/);
        match = foodDatabase.find(food => {
          const foodWords = food.name.toLowerCase().split(/\s+/);
          return nameWords.some(nameWord => 
            foodWords.some(foodWord => 
              nameWord === foodWord || 
              (nameWord.length > 3 && foodWord.includes(nameWord)) ||
              (foodWord.length > 3 && nameWord.includes(foodWord))
            )
          );
        });
        if (match) return match;
        
        // Try alias matching
        match = foodDatabase.find(food => 
          food.aliases?.some(alias => {
            const aliasLower = alias.toLowerCase();
            return aliasLower === cleanName || 
                   aliasLower.includes(cleanName) || 
                   cleanName.includes(aliasLower);
          })
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
          // Enhanced ingredient name cleaning
          let cleanIngredientName = ingredient.name;
          
          // Remove fractions at the start first
          cleanIngredientName = cleanIngredientName.replace(/^\d+\/\d+\s+/i, '');
          
          // Remove measurements and quantities at the start (with or without numbers)
          cleanIngredientName = cleanIngredientName.replace(/^(?:\d+(?:\.\d+)?\s*)?(?:cups?|tbsp|tablespoons?|tsp|teaspoons?|oz|ounces?|lbs?|pounds?|grams?|g|ml|milliliters?|l|liters?)\s+/i, '');
          
          // Remove remaining numbers at the start
          cleanIngredientName = cleanIngredientName.replace(/^\d+\s+/i, '');
          
          // Remove articles and quantifiers
          cleanIngredientName = cleanIngredientName.replace(/^(?:a\s+|an\s+|the\s+|some\s+|few\s+|pinch\s+of\s+|dash\s+of\s+)/i, '');
          
          // Remove adjectives and descriptors
          cleanIngredientName = cleanIngredientName.replace(/^(?:large\s+|small\s+|medium\s+|fresh\s+|frozen\s+|dried\s+|chopped\s+|sliced\s+|diced\s+|minced\s+|melted\s+|softened\s+|room\s+temperature\s+|all-purpose\s+)/i, '');
          
          // Take only the main ingredient (before comma or parentheses)
          cleanIngredientName = cleanIngredientName.split(/[,\(]/)[0].trim();

          // Try multiple variations of the ingredient name
          const variations = [
            cleanIngredientName,
            // Try singular/plural variations
            cleanIngredientName.endsWith('s') ? cleanIngredientName.slice(0, -1) : cleanIngredientName + 's',
            // Try common substitutions
            cleanIngredientName.replace(/^egg$/, 'eggs'),
            cleanIngredientName.replace(/^flour$/, 'white rice'), // Common low-oxalate flour substitute
            cleanIngredientName.replace(/^butter$/, 'butter'),
            cleanIngredientName.replace(/^milk$/, 'milk'),
            cleanIngredientName.replace(/^sugar$/, 'sugar'), // This might not be in database
            cleanIngredientName.replace(/^blueberries$/, 'blueberries'),
          ];

          let foodMatch = null;
          for (const variation of variations) {
            foodMatch = findFoodByName(variation, foodDatabase);
            if (foodMatch) break;
          }
          
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