import type { OxalateCategory } from './oxalate';

export interface RecipeIngredient {
  id: string;
  name: string;
  amount: string;
  unit?: string;
  oxalate_mg?: number;
  category?: OxalateCategory;
  notes?: string;
}

export interface Recipe {
  id: string;
  title: string;
  description?: string;
  ingredients: RecipeIngredient[];
  instructions: string[];
  servings: number;
  prepTime?: number; // in minutes
  cookTime?: number; // in minutes
  totalOxalate: number;
  oxalatePerServing: number;
  category: OxalateCategory;
  tags: string[];
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  cuisine?: string;
  createdAt: number;
  updatedAt: number;
  source?: 'chatbot' | 'manual' | 'imported';
  isFavorite: boolean;
  notes?: string;
}

export interface RecipeStore {
  recipes: Recipe[];
  favoriteRecipes: Recipe[];
  searchQuery: string;
  selectedTags: string[];
  sortBy: 'recent' | 'name' | 'oxalate' | 'prepTime';
  filterByCategory: OxalateCategory[];
  
  // Actions
  addRecipe: (recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateRecipe: (id: string, updates: Partial<Recipe>) => void;
  deleteRecipe: (id: string) => void;
  toggleFavorite: (id: string) => void;
  setSearchQuery: (query: string) => void;
  toggleTag: (tag: string) => void;
  setSortBy: (sort: 'recent' | 'name' | 'oxalate' | 'prepTime') => void;
  toggleCategoryFilter: (category: OxalateCategory) => void;
  getFilteredRecipes: () => Recipe[];
  calculateRecipeOxalate: (ingredients: RecipeIngredient[]) => number;
  parseRecipeFromText: (text: string) => Partial<Recipe> | null;
}