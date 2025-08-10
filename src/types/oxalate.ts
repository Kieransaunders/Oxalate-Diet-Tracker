export type OxalateCategory = 'Low' | 'Medium' | 'High' | 'Very High';

export interface OxalateFoodItem {
  id?: string;
  name: string;
  group?: string;
  oxalate_mg: number;
  category: OxalateCategory;
  serving_size?: string;
  serving_grams?: number;
  calories?: number;
  protein_g?: number;
  fiber_g?: number;
  aliases?: string[];
}

export interface FilterState {
  search: string;
  selectedCategories: OxalateCategory[];
  sortBy: 'name' | 'oxalate' | 'category';
  sortDirection: 'asc' | 'desc';
}

export interface OxalateStore {
  foods: OxalateFoodItem[];
  filteredFoods: OxalateFoodItem[];
  filters: FilterState;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchFoods: () => Promise<void>;
  setSearch: (search: string) => void;
  toggleCategory: (category: OxalateCategory) => void;
  setSorting: (sortBy: 'name' | 'oxalate' | 'category', direction?: 'asc' | 'desc') => void;
  applyFilters: () => void;
}