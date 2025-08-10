import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OxalateStore, OxalateFoodItem, OxalateCategory } from '../types/oxalate';
import { fetchOxalateFoods } from '../api/oxalate-api';

export const useOxalateStore = create<OxalateStore>()(
  persist(
    (set, get) => ({
      foods: [],
      filteredFoods: [],
      filters: {
        search: '',
        selectedCategories: ['Low', 'Medium', 'High', 'Very High'],
        sortBy: 'name',
        sortDirection: 'asc',
      },
      isLoading: false,
      error: null,

      fetchFoods: async () => {
        set({ isLoading: true, error: null });
        try {
          const foods = await fetchOxalateFoods();
          set({ foods, isLoading: false });
          get().applyFilters();
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch foods',
            isLoading: false 
          });
        }
      },

      setSearch: (search: string) => {
        set((state) => ({
          filters: { ...state.filters, search }
        }));
        get().applyFilters();
      },

      toggleCategory: (category: OxalateCategory) => {
        set((state) => {
          const selectedCategories = state.filters.selectedCategories.includes(category)
            ? state.filters.selectedCategories.filter(c => c !== category)
            : [...state.filters.selectedCategories, category];
          
          return {
            filters: { ...state.filters, selectedCategories }
          };
        });
        get().applyFilters();
      },

      setSorting: (sortBy: 'name' | 'oxalate' | 'category', direction?: 'asc' | 'desc') => {
        set((state) => {
          const currentDirection = state.filters.sortBy === sortBy && state.filters.sortDirection === 'asc' ? 'desc' : 'asc';
          const sortDirection = direction || currentDirection;
          
          return {
            filters: { ...state.filters, sortBy, sortDirection }
          };
        });
        get().applyFilters();
      },

      applyFilters: () => {
        const { foods, filters } = get();
        
        let filtered = [...foods];

        // Apply search filter
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          filtered = filtered.filter(food => 
            food.name.toLowerCase().includes(searchLower) ||
            (food.group && food.group.toLowerCase().includes(searchLower))
          );
        }

        // Apply category filter
        filtered = filtered.filter(food => 
          filters.selectedCategories.includes(food.category)
        );

        // Apply sorting
        filtered.sort((a, b) => {
          let aValue: string | number;
          let bValue: string | number;

          switch (filters.sortBy) {
            case 'name':
              aValue = a.name.toLowerCase();
              bValue = b.name.toLowerCase();
              break;
            case 'oxalate':
              aValue = a.oxalate_mg;
              bValue = b.oxalate_mg;
              break;
            case 'category':
              const categoryOrder = { 'Low': 1, 'Medium': 2, 'High': 3, 'Very High': 4 };
              aValue = categoryOrder[a.category];
              bValue = categoryOrder[b.category];
              break;
            default:
              return 0;
          }

          if (filters.sortDirection === 'asc') {
            return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
          } else {
            return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
          }
        });

        set({ filteredFoods: filtered });
      },
    }),
    {
      name: 'oxalate-store',
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