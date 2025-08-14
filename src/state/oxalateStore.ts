import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';
import { OxalateStore, OxalateCategory } from '../types/oxalate';
import { fetchOxalateFoods, searchOxalateFoods } from '../api/oxalate-api';

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
      lastSyncTime: null,
      isOnline: true,

      // Check network connectivity
      checkNetworkStatus: async () => {
        try {
          const networkState = await Network.getNetworkStateAsync();
          const isOnline = networkState.isConnected && networkState.isInternetReachable;
          set({ isOnline });
          return isOnline || false;
        } catch (error) {
          console.log('Network check failed:', error);
          set({ isOnline: false });
          return false;
        }
      },

      fetchFoods: async (forceRefresh = false) => {
        set({ isLoading: true, error: null });
        
        try {
          const isOnline = await get().checkNetworkStatus();
          const { foods: cachedFoods, lastSyncTime } = get();
          
          // Use cached data if offline or if we have recent data and not forcing refresh
          const cacheAge = lastSyncTime ? Date.now() - lastSyncTime : Infinity;
          const cacheIsRecent = cacheAge < 24 * 60 * 60 * 1000; // 24 hours
          
          if (!isOnline && cachedFoods.length > 0) {
            console.log('Using cached data (offline)');
            set({ isLoading: false });
            get().applyFilters();
            return;
          }
          
          if (!forceRefresh && cachedFoods.length > 0 && cacheIsRecent && isOnline) {
            console.log('Using recent cached data');
            set({ isLoading: false });
            get().applyFilters();
            return;
          }
          
          // Fetch fresh data from API
          if (isOnline) {
            console.log('Fetching fresh data from API');
            const foods = await fetchOxalateFoods();
            set({ 
              foods, 
              isLoading: false, 
              error: null,
              lastSyncTime: Date.now()
            });
            get().applyFilters();
          } else {
            // Offline and no cached data - use mock data
            console.log('Offline with no cache - using demo data');
            const foods = await fetchOxalateFoods(); // This will return mock data
            set({ 
              foods,
              isLoading: false,
              error: null
            });
            get().applyFilters();
          }
        } catch (error) {
          console.error('Error in fetchFoods:', error);
          const foods = await fetchOxalateFoods(); // Fallback to mock data
          set({ 
            foods,
            isLoading: false,
            error: null
          });
          get().applyFilters();
        }
      },

      setSearch: (search: string) => {
        const trimmedSearch = search.trim();
        set((state) => ({
          filters: { ...state.filters, search: trimmedSearch }
        }));
        
        // Only apply filters if search has meaningful content
        if (trimmedSearch !== get().filters.search.trim()) {
          get().applyFilters();
        }
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
        
        // Early return if no foods
        if (foods.length === 0) {
          set({ filteredFoods: [] });
          return;
        }

        let filtered = foods;
        
        // Apply category filter first (most selective)
        if (filters.selectedCategories.length < 4) { // Only filter if not all categories selected
          const categorySet = new Set(filters.selectedCategories);
          filtered = filtered.filter(food => categorySet.has(food.category));
        }

        // Apply search filter with optimized string matching
        if (filters.search && filters.search.trim().length > 0) {
          const searchTerms = filters.search.toLowerCase().trim().split(/\s+/);
          
          filtered = filtered.filter(food => {
            const searchableText = [
              food.name.toLowerCase(),
              food.group?.toLowerCase() || '',
              ...(food.aliases?.map(alias => alias.toLowerCase()) || [])
            ].join(' ');
            
            // All search terms must match (AND logic)
            return searchTerms.every(term => searchableText.includes(term));
          });
        }

        // Apply sorting with memoized comparison functions
        if (filtered.length > 1) {
          const sortDirection = filters.sortDirection === 'asc' ? 1 : -1;
          
          switch (filters.sortBy) {
            case 'name':
              filtered.sort((a, b) => a.name.localeCompare(b.name) * sortDirection);
              break;
            case 'oxalate':
              filtered.sort((a, b) => (a.oxalate_mg - b.oxalate_mg) * sortDirection);
              break;
            case 'category': {
              const categoryOrder = { 'Low': 1, 'Medium': 2, 'High': 3, 'Very High': 4 };
              filtered.sort((a, b) => {
                return (categoryOrder[a.category] - categoryOrder[b.category]) * sortDirection;
              });
              break;
            }
              break;
          }
        }

        set({ filteredFoods: filtered });
      },

      // Enhanced search using API search endpoint when available
      searchFoodsAdvanced: async (searchTerm: string) => {
        set({ isLoading: true, error: null });
        
        try {
          // Try API search first if we have more than just mock data
          const { foods } = get();
          if (foods.length > 100) { // Only use API search if we have live data
            const searchResults = await searchOxalateFoods({
              food_item: searchTerm,
              food_group: searchTerm // Search in both name and group
            });
            
            set({ foods: searchResults, isLoading: false });
            get().applyFilters();
            return;
          }
        } catch (_error) {
          console.log('Advanced search failed, falling back to local search');
        }
        
        // Fall back to local search
        set((state) => ({
          filters: { ...state.filters, search: searchTerm },
          isLoading: false
        }));
        get().applyFilters();
      },

      // Check if we're using live API data or mock data
      isUsingLiveData: () => {
        const { foods } = get();
        return foods.length > 100; // Mock data has exactly 100 items
      },

      // Get data source info for display
      getDataSourceInfo: () => {
        const { foods, isOnline, lastSyncTime } = get();
        const isLive = foods.length > 100;
        const cacheAge = lastSyncTime ? Date.now() - lastSyncTime : null;
        const cacheAgeHours = cacheAge ? Math.floor(cacheAge / (1000 * 60 * 60)) : null;
        
        let source = '';
        let description = '';
        
        if (isLive && isOnline) {
          source = 'Live API Database';
          description = `${foods.length} foods from API`;
          if (cacheAgeHours !== null) {
            description += cacheAgeHours === 0 ? ' (just synced)' : ` (synced ${cacheAgeHours}h ago)`;
          }
        } else if (isLive && !isOnline) {
          source = 'Cached API Data';
          description = `${foods.length} foods (offline)`;
          if (cacheAgeHours !== null) {
            description += ` - last sync ${cacheAgeHours}h ago`;
          }
        } else {
          source = 'Demo Database';
          description = `${foods.length} comprehensive demo foods`;
        }
        
        return {
          isLive,
          count: foods.length,
          source,
          description
        };
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