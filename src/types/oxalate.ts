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

export interface DataSourceInfo {
  isLive: boolean;
  count: number;
  source: string;
  description: string;
}

export interface OxalateStore {
  foods: OxalateFoodItem[];
  filteredFoods: OxalateFoodItem[];
  filters: FilterState;
  isLoading: boolean;
  error: string | null;
  lastSyncTime: number | null;
  isOnline: boolean;
  
  // Actions
  fetchFoods: (forceRefresh?: boolean) => Promise<void>;
  setSearch: (search: string) => void;
  toggleCategory: (category: OxalateCategory) => void;
  setSorting: (sortBy: 'name' | 'oxalate' | 'category', direction?: 'asc' | 'desc') => void;
  applyFilters: () => void;
  searchFoodsAdvanced: (searchTerm: string) => Promise<void>;
  checkNetworkStatus: () => Promise<boolean>;
  
  // Data source info
  isUsingLiveData: () => boolean;
  getDataSourceInfo: () => DataSourceInfo;
}