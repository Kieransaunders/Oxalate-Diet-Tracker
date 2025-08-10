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