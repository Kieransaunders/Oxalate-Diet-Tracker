import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RecipeStore, Recipe, RecipeIngredient } from '../types/recipe';
import { getOxalateCategory } from '../api/oxalate-api';

export const useRecipeStore = create<RecipeStore>()(
  persist(
    (set, get) => ({
      recipes: [],
      favoriteRecipes: [],
      searchQuery: '',
      selectedTags: [],
      sortBy: 'recent',
      filterByCategory: [],

      addRecipe: (recipeData) => {
        const recipe: Recipe = {
          ...recipeData,
          id: Date.now().toString(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        set((state) => ({
          recipes: [recipe, ...state.recipes],
        }));
      },

      updateRecipe: (id, updates) => {
        set((state) => ({
          recipes: state.recipes.map(recipe =>
            recipe.id === id
              ? { ...recipe, ...updates, updatedAt: Date.now() }
              : recipe
          ),
        }));
      },

      deleteRecipe: (id) => {
        set((state) => ({
          recipes: state.recipes.filter(recipe => recipe.id !== id),
        }));
      },

      toggleFavorite: (id) => {
        set((state) => ({
          recipes: state.recipes.map(recipe =>
            recipe.id === id
              ? { ...recipe, isFavorite: !recipe.isFavorite, updatedAt: Date.now() }
              : recipe
          ),
        }));
      },

      setSearchQuery: (query) => {
        set({ searchQuery: query });
      },

      toggleTag: (tag) => {
        set((state) => ({
          selectedTags: state.selectedTags.includes(tag)
            ? state.selectedTags.filter(t => t !== tag)
            : [...state.selectedTags, tag],
        }));
      },

      setSortBy: (sort) => {
        set({ sortBy: sort });
      },

      toggleCategoryFilter: (category) => {
        set((state) => ({
          filterByCategory: state.filterByCategory.includes(category)
            ? state.filterByCategory.filter(c => c !== category)
            : [...state.filterByCategory, category],
        }));
      },

      getFilteredRecipes: () => {
        const { recipes, searchQuery, selectedTags, sortBy, filterByCategory } = get();
        
        let filtered = [...recipes];

        // Apply search filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filtered = filtered.filter(recipe =>
            recipe.title.toLowerCase().includes(query) ||
            recipe.description?.toLowerCase().includes(query) ||
            recipe.ingredients.some(ing => ing.name.toLowerCase().includes(query)) ||
            recipe.tags.some(tag => tag.toLowerCase().includes(query))
          );
        }

        // Apply tag filter
        if (selectedTags.length > 0) {
          filtered = filtered.filter(recipe =>
            selectedTags.some(tag => recipe.tags.includes(tag))
          );
        }

        // Apply category filter
        if (filterByCategory.length > 0) {
          filtered = filtered.filter(recipe =>
            filterByCategory.includes(recipe.category)
          );
        }

        // Apply sorting
        filtered.sort((a, b) => {
          switch (sortBy) {
            case 'name':
              return a.title.localeCompare(b.title);
            case 'oxalate':
              return a.oxalatePerServing - b.oxalatePerServing;
            case 'prepTime':
              return (a.prepTime || 0) - (b.prepTime || 0);
            case 'recent':
            default:
              return b.updatedAt - a.updatedAt;
          }
        });

        return filtered;
      },

      calculateRecipeOxalate: (ingredients) => {
        return ingredients.reduce((total, ingredient) => {
          return total + (ingredient.oxalate_mg || 0);
        }, 0);
      },

      parseRecipeFromText: (text) => {
        try {
          // Simple recipe parser for text from chatbot
          const lines = text.split('\n').filter(line => line.trim());
          
          let title = '';
          let description = '';
          const ingredients: RecipeIngredient[] = [];
          const instructions: string[] = [];
          let servings = 1;
          let prepTime: number | undefined;
          let cookTime: number | undefined;
          
          let currentSection = '';
          
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Skip empty lines
            if (!line) continue;
            
            // Detect title (usually first non-empty line or starts with #)
            if (!title && (i === 0 || line.startsWith('#'))) {
              title = line.replace(/^#+\s*/, '').trim();
              continue;
            }
            
            // Detect sections
            const lowerLine = line.toLowerCase();
            if (lowerLine.includes('ingredient')) {
              currentSection = 'ingredients';
              continue;
            } else if (lowerLine.includes('instruction') || lowerLine.includes('direction') || lowerLine.includes('method')) {
              currentSection = 'instructions';
              continue;
            } else if (lowerLine.includes('serving')) {
              const servingMatch = line.match(/(\d+)/);
              if (servingMatch) {
                servings = parseInt(servingMatch[1]);
              }
              continue;
            } else if (lowerLine.includes('prep time') || lowerLine.includes('preparation')) {
              const timeMatch = line.match(/(\d+)/);
              if (timeMatch) {
                prepTime = parseInt(timeMatch[1]);
              }
              continue;
            } else if (lowerLine.includes('cook time') || lowerLine.includes('cooking')) {
              const timeMatch = line.match(/(\d+)/);
              if (timeMatch) {
                cookTime = parseInt(timeMatch[1]);
              }
              continue;
            }
            
            // Parse based on current section
            if (currentSection === 'ingredients') {
              // Parse ingredient line: "1 cup spinach" or "• 2 tbsp olive oil"
              const cleanLine = line.replace(/^[-•*]\s*/, '');
              const ingredient: RecipeIngredient = {
                id: Date.now().toString() + Math.random().toString(),
                name: cleanLine,
                amount: '',
              };
              
              // Try to extract amount and unit
              const amountMatch = cleanLine.match(/^(\d+(?:\.\d+)?(?:\/\d+)?)\s*(\w+)?\s+(.+)/);
              if (amountMatch) {
                ingredient.amount = amountMatch[1];
                ingredient.unit = amountMatch[2];
                ingredient.name = amountMatch[3];
              }
              
              ingredients.push(ingredient);
            } else if (currentSection === 'instructions') {
              const cleanLine = line.replace(/^\d+\.\s*/, '').replace(/^[-•*]\s*/, '');
              instructions.push(cleanLine);
            } else if (!currentSection && !title) {
              // Treat as description if no title yet
              description += (description ? ' ' : '') + line;
            }
          }
          
          if (!title) {
            title = 'Recipe from Chat';
          }
          
          const totalOxalate = get().calculateRecipeOxalate(ingredients);
          const oxalatePerServing = totalOxalate / servings;
          const category = getOxalateCategory(oxalatePerServing);
          
          return {
            title,
            description: description || 'Recipe generated from chatbot',
            ingredients,
            instructions,
            servings,
            prepTime,
            cookTime,
            totalOxalate,
            oxalatePerServing,
            category,
            tags: ['chatbot-generated'],
            source: 'chatbot' as const,
            isFavorite: false,
          };
        } catch (error) {
          console.error('Error parsing recipe:', error);
          return null;
        }
      },
    }),
    {
      name: 'recipe-store',
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