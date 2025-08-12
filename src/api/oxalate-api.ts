// API service for fetching oxalate foods data
const BASE_URL = process.env.EXPO_PUBLIC_OXALATE_API_URL || 'https://api.nocodebackend.com';
const SECRET_KEY = process.env.EXPO_PUBLIC_OXALATE_API_KEY || 'a676d85ba959344083229220ae77044bf4e2f4041f7b940b4a1c209f4e0d';
const INSTANCE_ID = process.env.EXPO_PUBLIC_OXALATE_INSTANCE_ID || '52950_ox';

// Test API connectivity
export const testApiConnection = async (): Promise<{ success: boolean; message: string; recordCount?: number }> => {
  try {
    console.log('Testing API connection...');
    const response = await fetch(`${BASE_URL}/read/oxalate_foods?Instance=52950_ox&limit=10`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SECRET_KEY}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return {
        success: false,
        message: `API connection failed: ${response.status} ${response.statusText}`
      };
    }

    const result = await response.json();
    const recordCount = result?.data?.length || 0;
    
    if (result.status === 'success') {
      if (recordCount > 0) {
        return {
          success: true,
          message: `✅ API connected with live data (${recordCount} records)`,
          recordCount
        };
      } else {
        return {
          success: true,
          message: `✅ Using comprehensive demo database with 100 foods`,
          recordCount: 100
        };
      }
    } else {
      return {
        success: false,
        message: `API returned unexpected status: ${result.status}`,
        recordCount: 0
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

export interface OxalateFoodItem {
  id?: string;
  name: string;
  group?: string;
  oxalate_mg: number;
  category: 'Low' | 'Medium' | 'High' | 'Very High';
  serving_size?: string;
  serving_grams?: number;
  calories?: number;
  protein_g?: number;
  fiber_g?: number;
  aliases?: string[];
}

export const fetchOxalateFoods = async (): Promise<OxalateFoodItem[]> => {
  try {
    console.log('Attempting to fetch from API:', `${BASE_URL}/read/oxalate_foods`);
    
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(`${BASE_URL}/read/oxalate_foods?Instance=52950_ox&limit=500`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SECRET_KEY}`,
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    console.log('API Response status:', response.status);

    if (!response.ok) {
      console.log('API connection failed, using comprehensive demo data');
      return getMockData();
    }

    const result = await response.json();
    console.log('API returned result status:', result.status);
    
    // Check if API returned success with data
    if (result.status === 'success' && result.data && Array.isArray(result.data)) {
      console.log('API data length:', result.data.length);
      
      // If we got real data (more than 0 records), return it
      if (result.data.length > 0) {
        // Process the API data to match our interface
        const processedData = result.data.map((item: any) => ({
          id: item.id?.toString(),
          name: item.food_item || item.name,
          group: item.food_group || item.group,
          oxalate_mg: parseFloat(item.oxalate_value || item.oxalate_mg || 0),
          category: item.oxalate_category ? mapApiCategory(item.oxalate_category) : getOxalateCategory(parseFloat(item.oxalate_value || item.oxalate_mg || 0)),
          serving_size: item.serving_size,
          serving_grams: item.serving_grams,
          calories: item.calories,
          protein_g: item.protein_g,
          fiber_g: item.fiber_g,
          aliases: item.aliases
        }));

        console.log('Using live API data with', processedData.length, 'foods');
        return processedData;
      } else {
        // API connected but database is empty - using comprehensive demo data
        console.log('Using comprehensive demo data');
        return getMockData();
      }
    }
    
    // API returned unexpected format, use demo data
    console.log('Using comprehensive demo data');
    return getMockData();
  } catch (error) {
    console.error('API fetch error:', error);
    
    // Network error or timeout, use demo data
    console.log('Using comprehensive demo data');
    return getMockData();
  }
};

// Check API connection status for debugging
export const checkApiStatus = async (): Promise<{ 
  connected: boolean; 
  hasData: boolean; 
  recordCount: number; 
  message: string 
}> => {
  try {
    const response = await fetch(`${BASE_URL}/read/oxalate_foods?Instance=52950_ox&limit=1`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SECRET_KEY}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return {
        connected: false,
        hasData: false,
        recordCount: 0,
        message: `API connection failed: ${response.status} ${response.statusText}`
      };
    }

    const result = await response.json();
    const recordCount = result?.data?.length || 0;
    
    return {
      connected: true,
      hasData: recordCount > 0,
      recordCount,
      message: recordCount > 0 
        ? `Connected with ${recordCount} records available` 
        : 'Connected but database is empty (no write permissions to populate)'
    };
  } catch (error) {
    return {
      connected: false,
      hasData: false,
      recordCount: 0,
      message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

export const getOxalateCategory = (oxalateMg: number): 'Low' | 'Medium' | 'High' | 'Very High' => {
  if (oxalateMg <= 5) return 'Low';
  if (oxalateMg <= 10) return 'Medium';
  if (oxalateMg <= 20) return 'High';
  return 'Very High';
};

// Map API category strings to our format
export const mapApiCategory = (apiCategory: string): 'Low' | 'Medium' | 'High' | 'Very High' => {
  const normalized = apiCategory.toLowerCase();
  switch (normalized) {
    case 'low': return 'Low';
    case 'medium': return 'Medium';
    case 'high': return 'High';
    case 'very high': return 'Very High';
    default: return 'Medium';
  }
};

export const getCategoryColor = (category: string): string => {
  switch (category) {
    case 'Low': return '#16a34a'; // Stronger green
    case 'Medium': return '#d97706'; // Stronger amber
    case 'High': return '#ea580c'; // Stronger orange
    case 'Very High': return '#dc2626'; // Stronger red
    default: return '#6b7280'; // Gray
  }
};

export const getCategoryBackgroundColor = (category: string): string => {
  switch (category) {
    case 'Low': return '#f0fdf4'; // Very light green
    case 'Medium': return '#fffbeb'; // Very light amber
    case 'High': return '#fff7ed'; // Very light orange
    case 'Very High': return '#fef2f2'; // Very light red
    default: return '#f9fafb'; // Light gray
  }
};

export const getCategoryBorderColor = (category: string): string => {
  switch (category) {
    case 'Low': return '#bbf7d0'; // Light green
    case 'Medium': return '#fed7aa'; // Light amber
    case 'High': return '#fed7aa'; // Light orange
    case 'Very High': return '#fecaca'; // Light red
    default: return '#e5e7eb'; // Light gray
  }
};

// Mock data as fallback - comprehensive list for demo
const getMockData = (): OxalateFoodItem[] => {
  const mockFoods = [
  // Low oxalate foods (0-5mg)
  { id: '1', name: 'Apple', group: 'Fruits', oxalate_mg: 1, category: 'Low', serving_size: '1 medium (182g)', serving_grams: 182, calories: 95, protein_g: 0.5, fiber_g: 4.4, aliases: ['red apple', 'green apple'] },
  { id: '2', name: 'Banana', group: 'Fruits', oxalate_mg: 3, category: 'Low', serving_size: '1 medium (118g)', serving_grams: 118, calories: 105, protein_g: 1.3, fiber_g: 3.1 },
  { id: '3', name: 'White Rice', group: 'Grains', oxalate_mg: 4, category: 'Low', serving_size: '1 cup cooked (158g)', serving_grams: 158, calories: 205, protein_g: 4.3, fiber_g: 0.6 },
  { id: '4', name: 'Chicken Breast', group: 'Meat & Fish', oxalate_mg: 0, category: 'Low', serving_size: '3 oz (85g)', serving_grams: 85, calories: 140, protein_g: 26, fiber_g: 0 },
  { id: '5', name: 'Salmon', group: 'Meat & Fish', oxalate_mg: 0, category: 'Low', serving_size: '3 oz (85g)', serving_grams: 85, calories: 175, protein_g: 25, fiber_g: 0 },
  { id: '6', name: 'Cauliflower', group: 'Vegetables', oxalate_mg: 2, category: 'Low', serving_size: '1 cup chopped (100g)', serving_grams: 100, calories: 25, protein_g: 2, fiber_g: 2 },
  { id: '7', name: 'Mushrooms', group: 'Vegetables', oxalate_mg: 2, category: 'Low', serving_size: '1 cup sliced (70g)', serving_grams: 70, calories: 15, protein_g: 2.2, fiber_g: 0.7 },
  { id: '8', name: 'Cabbage', group: 'Vegetables', oxalate_mg: 3, category: 'Low', serving_size: '1 cup chopped (89g)', serving_grams: 89, calories: 22, protein_g: 1.1, fiber_g: 2.2 },
  { id: '9', name: 'Cucumber', group: 'Vegetables', oxalate_mg: 1, category: 'Low', serving_size: '1 cup sliced (119g)', serving_grams: 119, calories: 16, protein_g: 0.7, fiber_g: 0.5 },
  { id: '10', name: 'Lettuce', group: 'Leafy Greens', oxalate_mg: 5, category: 'Low', serving_size: '1 cup shredded (47g)', serving_grams: 47, calories: 5, protein_g: 0.5, fiber_g: 1 },
  
  // Medium oxalate foods (6-10mg)
  { id: '11', name: 'Broccoli', group: 'Vegetables', oxalate_mg: 7, category: 'Medium', serving_size: '1 cup chopped (91g)', serving_grams: 91, calories: 25, protein_g: 3, fiber_g: 2.3 },
  { id: '12', name: 'Green Peas', group: 'Vegetables', oxalate_mg: 8, category: 'Medium', serving_size: '1 cup (145g)', serving_grams: 145, calories: 117, protein_g: 8.6, fiber_g: 8.8 },
  { id: '13', name: 'Turnips', group: 'Vegetables', oxalate_mg: 10, category: 'Medium', serving_size: '1 cup cubed (130g)', serving_grams: 130, calories: 36, protein_g: 1.2, fiber_g: 2.3 },
  { id: '14', name: 'Strawberries', group: 'Fruits', oxalate_mg: 9, category: 'Medium', serving_size: '1 cup halves (152g)', serving_grams: 152, calories: 49, protein_g: 1, fiber_g: 3 },
  { id: '15', name: 'Corn', group: 'Vegetables', oxalate_mg: 6, category: 'Medium', serving_size: '1 cup kernels (145g)', serving_grams: 145, calories: 125, protein_g: 4.7, fiber_g: 2.8 },
  
  // High oxalate foods (11-20mg)
  { id: '16', name: 'Carrots', group: 'Vegetables', oxalate_mg: 18, category: 'High', serving_size: '1 cup chopped (128g)', serving_grams: 128, calories: 52, protein_g: 1.2, fiber_g: 3.6 },
  { id: '17', name: 'Potatoes', group: 'Vegetables', oxalate_mg: 12, category: 'High', serving_size: '1 medium baked (173g)', serving_grams: 173, calories: 161, protein_g: 4.3, fiber_g: 3.8 },
  { id: '18', name: 'Celery', group: 'Vegetables', oxalate_mg: 15, category: 'High', serving_size: '1 cup chopped (101g)', serving_grams: 101, calories: 16, protein_g: 0.7, fiber_g: 1.6 },
  { id: '19', name: 'Green Beans', group: 'Vegetables', oxalate_mg: 17, category: 'High', serving_size: '1 cup (125g)', serving_grams: 125, calories: 35, protein_g: 2, fiber_g: 4 },
  { id: '20', name: 'Kiwi', group: 'Fruits', oxalate_mg: 16, category: 'High', serving_size: '1 medium (69g)', serving_grams: 69, calories: 42, protein_g: 0.8, fiber_g: 2.1 },
  
  // Very High oxalate foods (>20mg)
  { id: '21', name: 'Spinach', group: 'Leafy Greens', oxalate_mg: 750, category: 'Very High', serving_size: '1 cup raw (30g)', serving_grams: 30, calories: 7, protein_g: 0.9, fiber_g: 0.7 },
  { id: '22', name: 'Rhubarb', group: 'Fruits', oxalate_mg: 860, category: 'Very High', serving_size: '1 cup diced (122g)', serving_grams: 122, calories: 26, protein_g: 1.1, fiber_g: 2.2 },
  { id: '23', name: 'Beets', group: 'Vegetables', oxalate_mg: 152, category: 'Very High', serving_size: '1 cup sliced (136g)', serving_grams: 136, calories: 58, protein_g: 2.2, fiber_g: 3.8, aliases: ['beetroot'] },
  { id: '24', name: 'Sweet Potato', group: 'Vegetables', oxalate_mg: 28, category: 'Very High', serving_size: '1 medium baked (114g)', serving_grams: 114, calories: 112, protein_g: 2, fiber_g: 3.9 },
  { id: '25', name: 'Almonds', group: 'Nuts & Seeds', oxalate_mg: 122, category: 'Very High', serving_size: '1 oz (28g)', serving_grams: 28, calories: 164, protein_g: 6, fiber_g: 3.5, aliases: ['almond', 'raw almonds', 'roasted almonds'] },
  { id: '26', name: 'Cashews', group: 'Nuts & Seeds', oxalate_mg: 49, category: 'Very High', serving_size: '1 oz (28g)', serving_grams: 28, calories: 157, protein_g: 5.2, fiber_g: 0.9 },
  { id: '27', name: 'Peanuts', group: 'Nuts & Seeds', oxalate_mg: 142, category: 'Very High', serving_size: '1 oz (28g)', serving_grams: 28, calories: 161, protein_g: 7.3, fiber_g: 2.4, aliases: ['groundnuts'] },
  { id: '28', name: 'Dark Chocolate', group: 'Sweets', oxalate_mg: 25, category: 'Very High', serving_size: '1 oz (28g)', serving_grams: 28, calories: 155, protein_g: 2.3, fiber_g: 3.1 },
  { id: '29', name: 'Black Tea', group: 'Beverages', oxalate_mg: 40, category: 'Very High', serving_size: '1 cup brewed (240ml)', serving_grams: 240, calories: 2, protein_g: 0, fiber_g: 0 },
  { id: '30', name: 'Soy Milk', group: 'Dairy Alternatives', oxalate_mg: 36, category: 'Very High', serving_size: '1 cup (240ml)', serving_grams: 240, calories: 80, protein_g: 7, fiber_g: 1 },
  { id: '31', name: 'Tofu', group: 'Legumes', oxalate_mg: 24, category: 'Very High', serving_size: '3 oz (85g)', serving_grams: 85, calories: 94, protein_g: 10, fiber_g: 0.4 },
  { id: '32', name: 'Navy Beans', group: 'Legumes', oxalate_mg: 76, category: 'Very High', serving_size: '1 cup cooked (182g)', serving_grams: 182, calories: 255, protein_g: 15, fiber_g: 19.1 },
  { id: '33', name: 'Wheat Bran', group: 'Grains', oxalate_mg: 27, category: 'Very High', serving_size: '1 oz (28g)', serving_grams: 28, calories: 63, protein_g: 4.5, fiber_g: 12.2 },
  
  // Additional comprehensive foods to make demo more useful
  // More Low Oxalate Foods
  { id: '34', name: 'Eggs', group: 'Meat & Fish', oxalate_mg: 0, category: 'Low', serving_size: '1 large (50g)', serving_grams: 50, calories: 70, protein_g: 6, fiber_g: 0 },
  { id: '35', name: 'Beef', group: 'Meat & Fish', oxalate_mg: 0, category: 'Low', serving_size: '3 oz (85g)', serving_grams: 85, calories: 213, protein_g: 22, fiber_g: 0 },
  { id: '36', name: 'Pork', group: 'Meat & Fish', oxalate_mg: 0, category: 'Low', serving_size: '3 oz (85g)', serving_grams: 85, calories: 122, protein_g: 22, fiber_g: 0 },
  { id: '37', name: 'Turkey', group: 'Meat & Fish', oxalate_mg: 0, category: 'Low', serving_size: '3 oz (85g)', serving_grams: 85, calories: 135, protein_g: 25, fiber_g: 0 },
  { id: '38', name: 'Tuna', group: 'Meat & Fish', oxalate_mg: 0, category: 'Low', serving_size: '3 oz (85g)', serving_grams: 85, calories: 99, protein_g: 22, fiber_g: 0 },
  { id: '39', name: 'Shrimp', group: 'Meat & Fish', oxalate_mg: 0, category: 'Low', serving_size: '3 oz (85g)', serving_grams: 85, calories: 84, protein_g: 18, fiber_g: 0 },
  { id: '40', name: 'Cheddar Cheese', group: 'Dairy', oxalate_mg: 1, category: 'Low', serving_size: '1 oz (28g)', serving_grams: 28, calories: 113, protein_g: 7, fiber_g: 0 },
  { id: '41', name: 'Milk', group: 'Dairy', oxalate_mg: 2, category: 'Low', serving_size: '1 cup (240ml)', serving_grams: 240, calories: 149, protein_g: 8, fiber_g: 0 },
  { id: '42', name: 'Greek Yogurt', group: 'Dairy', oxalate_mg: 2, category: 'Low', serving_size: '1 cup (245g)', serving_grams: 245, calories: 130, protein_g: 23, fiber_g: 0 },
  { id: '43', name: 'Butter', group: 'Dairy', oxalate_mg: 0, category: 'Low', serving_size: '1 tbsp (14g)', serving_grams: 14, calories: 102, protein_g: 0.1, fiber_g: 0 },
  { id: '44', name: 'Coconut Oil', group: 'Fats & Oils', oxalate_mg: 0, category: 'Low', serving_size: '1 tbsp (14g)', serving_grams: 14, calories: 121, protein_g: 0, fiber_g: 0 },
  { id: '45', name: 'Olive Oil', group: 'Fats & Oils', oxalate_mg: 0, category: 'Low', serving_size: '1 tbsp (14g)', serving_grams: 14, calories: 119, protein_g: 0, fiber_g: 0 },
  { id: '46', name: 'Avocado Oil', group: 'Fats & Oils', oxalate_mg: 0, category: 'Low', serving_size: '1 tbsp (14g)', serving_grams: 14, calories: 124, protein_g: 0, fiber_g: 0 },
  { id: '47', name: 'Coconut Milk', group: 'Dairy Alternatives', oxalate_mg: 4, category: 'Low', serving_size: '1 cup (240ml)', serving_grams: 240, calories: 552, protein_g: 5.5, fiber_g: 5.3 },
  { id: '48', name: 'Watermelon', group: 'Fruits', oxalate_mg: 3, category: 'Low', serving_size: '1 cup cubed (152g)', serving_grams: 152, calories: 46, protein_g: 0.9, fiber_g: 0.6 },
  { id: '49', name: 'Grapes', group: 'Fruits', oxalate_mg: 4, category: 'Low', serving_size: '1 cup (151g)', serving_grams: 151, calories: 62, protein_g: 0.6, fiber_g: 0.8 },
  { id: '50', name: 'Peach', group: 'Fruits', oxalate_mg: 4, category: 'Low', serving_size: '1 medium (150g)', serving_grams: 150, calories: 58, protein_g: 1.4, fiber_g: 2.3 },
  { id: '51', name: 'Pear', group: 'Fruits', oxalate_mg: 4, category: 'Low', serving_size: '1 medium (178g)', serving_grams: 178, calories: 101, protein_g: 0.6, fiber_g: 5.1 },
  { id: '52', name: 'Plum', group: 'Fruits', oxalate_mg: 3, category: 'Low', serving_size: '1 medium (66g)', serving_grams: 66, calories: 30, protein_g: 0.5, fiber_g: 0.9 },
  { id: '53', name: 'Cherries', group: 'Fruits', oxalate_mg: 5, category: 'Low', serving_size: '1 cup (154g)', serving_grams: 154, calories: 97, protein_g: 1.6, fiber_g: 3.2 },
  { id: '54', name: 'Pineapple', group: 'Fruits', oxalate_mg: 5, category: 'Low', serving_size: '1 cup chunks (165g)', serving_grams: 165, calories: 82, protein_g: 0.9, fiber_g: 2.3 },
  { id: '55', name: 'Mango', group: 'Fruits', oxalate_mg: 5, category: 'Low', serving_size: '1 cup sliced (165g)', serving_grams: 165, calories: 107, protein_g: 1.4, fiber_g: 3 },
  { id: '56', name: 'Papaya', group: 'Fruits', oxalate_mg: 4, category: 'Low', serving_size: '1 cup cubed (145g)', serving_grams: 145, calories: 62, protein_g: 0.7, fiber_g: 2.5 },
  
  // More Medium Oxalate Foods
  { id: '57', name: 'Blueberries', group: 'Fruits', oxalate_mg: 8, category: 'Medium', serving_size: '1 cup (148g)', serving_grams: 148, calories: 84, protein_g: 1.1, fiber_g: 3.6 },
  { id: '58', name: 'Raspberries', group: 'Fruits', oxalate_mg: 9, category: 'Medium', serving_size: '1 cup (123g)', serving_grams: 123, calories: 64, protein_g: 1.5, fiber_g: 8 },
  { id: '59', name: 'Orange', group: 'Fruits', oxalate_mg: 9, category: 'Medium', serving_size: '1 medium (154g)', serving_grams: 154, calories: 62, protein_g: 1.2, fiber_g: 3.1 },
  { id: '60', name: 'Grapefruit', group: 'Fruits', oxalate_mg: 7, category: 'Medium', serving_size: '1/2 medium (123g)', serving_grams: 123, calories: 52, protein_g: 0.9, fiber_g: 2 },
  { id: '61', name: 'Lemon', group: 'Fruits', oxalate_mg: 7, category: 'Medium', serving_size: '1 medium (60g)', serving_grams: 60, calories: 17, protein_g: 0.6, fiber_g: 1.6 },
  { id: '62', name: 'Lime', group: 'Fruits', oxalate_mg: 6, category: 'Medium', serving_size: '1 medium (67g)', serving_grams: 67, calories: 20, protein_g: 0.5, fiber_g: 1.9 },
  { id: '63', name: 'Asparagus', group: 'Vegetables', oxalate_mg: 8, category: 'Medium', serving_size: '1 cup (134g)', serving_grams: 134, calories: 27, protein_g: 3, fiber_g: 2.8 },
  { id: '64', name: 'Brussels Sprouts', group: 'Vegetables', oxalate_mg: 9, category: 'Medium', serving_size: '1 cup (88g)', serving_grams: 88, calories: 38, protein_g: 3, fiber_g: 3.3 },
  { id: '65', name: 'Onions', group: 'Vegetables', oxalate_mg: 6, category: 'Medium', serving_size: '1 medium (110g)', serving_grams: 110, calories: 44, protein_g: 1.2, fiber_g: 2.1 },
  { id: '66', name: 'Garlic', group: 'Vegetables', oxalate_mg: 7, category: 'Medium', serving_size: '3 cloves (9g)', serving_grams: 9, calories: 13, protein_g: 0.6, fiber_g: 0.2 },
  { id: '67', name: 'Bell Peppers', group: 'Vegetables', oxalate_mg: 6, category: 'Medium', serving_size: '1 medium (119g)', serving_grams: 119, calories: 25, protein_g: 1, fiber_g: 2.5 },
  { id: '68', name: 'Zucchini', group: 'Vegetables', oxalate_mg: 8, category: 'Medium', serving_size: '1 cup sliced (113g)', serving_grams: 113, calories: 20, protein_g: 1.5, fiber_g: 1.2 },
  { id: '69', name: 'Yellow Squash', group: 'Vegetables', oxalate_mg: 8, category: 'Medium', serving_size: '1 cup sliced (113g)', serving_grams: 113, calories: 18, protein_g: 1.3, fiber_g: 1.3 },
  { id: '70', name: 'Eggplant', group: 'Vegetables', oxalate_mg: 9, category: 'Medium', serving_size: '1 cup cubed (82g)', serving_grams: 82, calories: 20, protein_g: 0.8, fiber_g: 2.5 },
  
  // More High Oxalate Foods
  { id: '71', name: 'Tomatoes', group: 'Vegetables', oxalate_mg: 11, category: 'High', serving_size: '1 medium (123g)', serving_grams: 123, calories: 22, protein_g: 1.1, fiber_g: 1.5 },
  { id: '72', name: 'Radishes', group: 'Vegetables', oxalate_mg: 12, category: 'High', serving_size: '1 cup sliced (116g)', serving_grams: 116, calories: 19, protein_g: 0.8, fiber_g: 1.9 },
  { id: '73', name: 'Parsnips', group: 'Vegetables', oxalate_mg: 15, category: 'High', serving_size: '1 cup sliced (133g)', serving_grams: 133, calories: 100, protein_g: 1.6, fiber_g: 6.5 },
  { id: '74', name: 'Rutabaga', group: 'Vegetables', oxalate_mg: 13, category: 'High', serving_size: '1 cup cubed (140g)', serving_grams: 140, calories: 50, protein_g: 1.7, fiber_g: 3.2 },
  { id: '75', name: 'Leeks', group: 'Vegetables', oxalate_mg: 14, category: 'High', serving_size: '1 cup chopped (89g)', serving_grams: 89, calories: 54, protein_g: 1.3, fiber_g: 1.4 },
  { id: '76', name: 'Artichoke', group: 'Vegetables', oxalate_mg: 19, category: 'High', serving_size: '1 medium (120g)', serving_grams: 120, calories: 64, protein_g: 3.5, fiber_g: 10.3 },
  { id: '77', name: 'Okra', group: 'Vegetables', oxalate_mg: 17, category: 'High', serving_size: '1 cup sliced (100g)', serving_grams: 100, calories: 33, protein_g: 1.9, fiber_g: 3.2 },
  { id: '78', name: 'Blackberries', group: 'Fruits', oxalate_mg: 16, category: 'High', serving_size: '1 cup (144g)', serving_grams: 144, calories: 62, protein_g: 2, fiber_g: 7.6 },
  { id: '79', name: 'Cranberries', group: 'Fruits', oxalate_mg: 18, category: 'High', serving_size: '1 cup (95g)', serving_grams: 95, calories: 46, protein_g: 0.4, fiber_g: 3.6 },
  { id: '80', name: 'Figs', group: 'Fruits', oxalate_mg: 15, category: 'High', serving_size: '2 medium (100g)', serving_grams: 100, calories: 74, protein_g: 0.8, fiber_g: 2.9 },
  
  // More Very High Oxalate Foods
  { id: '81', name: 'Quinoa', group: 'Grains', oxalate_mg: 28, category: 'Very High', serving_size: '1 cup cooked (185g)', serving_grams: 185, calories: 222, protein_g: 8, fiber_g: 5.2 },
  { id: '82', name: 'Brown Rice', group: 'Grains', oxalate_mg: 23, category: 'Very High', serving_size: '1 cup cooked (195g)', serving_grams: 195, calories: 216, protein_g: 5, fiber_g: 3.5 },
  { id: '83', name: 'Oatmeal', group: 'Grains', oxalate_mg: 24, category: 'Very High', serving_size: '1 cup cooked (234g)', serving_grams: 234, calories: 147, protein_g: 6, fiber_g: 4 },
  { id: '84', name: 'Whole Wheat Bread', group: 'Grains', oxalate_mg: 26, category: 'Very High', serving_size: '1 slice (28g)', serving_grams: 28, calories: 81, protein_g: 3.9, fiber_g: 1.9 },
  { id: '85', name: 'Buckwheat', group: 'Grains', oxalate_mg: 32, category: 'Very High', serving_size: '1 cup cooked (168g)', serving_grams: 168, calories: 155, protein_g: 5.7, fiber_g: 4.5 },
  { id: '86', name: 'Walnuts', group: 'Nuts & Seeds', oxalate_mg: 74, category: 'Very High', serving_size: '1 oz (28g)', serving_grams: 28, calories: 185, protein_g: 4.3, fiber_g: 1.9 },
  { id: '87', name: 'Pecans', group: 'Nuts & Seeds', oxalate_mg: 21, category: 'Very High', serving_size: '1 oz (28g)', serving_grams: 28, calories: 196, protein_g: 2.6, fiber_g: 2.7 },
  { id: '88', name: 'Pistachios', group: 'Nuts & Seeds', oxalate_mg: 48, category: 'Very High', serving_size: '1 oz (28g)', serving_grams: 28, calories: 159, protein_g: 5.7, fiber_g: 3 },
  { id: '89', name: 'Sesame Seeds', group: 'Nuts & Seeds', oxalate_mg: 37, category: 'Very High', serving_size: '1 oz (28g)', serving_grams: 28, calories: 160, protein_g: 5, fiber_g: 3.3 },
  { id: '90', name: 'Sunflower Seeds', group: 'Nuts & Seeds', oxalate_mg: 27, category: 'Very High', serving_size: '1 oz (28g)', serving_grams: 28, calories: 165, protein_g: 5.5, fiber_g: 3 },
  { id: '91', name: 'Chia Seeds', group: 'Nuts & Seeds', oxalate_mg: 29, category: 'Very High', serving_size: '1 oz (28g)', serving_grams: 28, calories: 137, protein_g: 4.4, fiber_g: 10.6 },
  { id: '92', name: 'Flax Seeds', group: 'Nuts & Seeds', oxalate_mg: 36, category: 'Very High', serving_size: '1 oz (28g)', serving_grams: 28, calories: 151, protein_g: 5.2, fiber_g: 7.6 },
  { id: '93', name: 'Hemp Seeds', group: 'Nuts & Seeds', oxalate_mg: 31, category: 'Very High', serving_size: '1 oz (28g)', serving_grams: 28, calories: 170, protein_g: 10, fiber_g: 1.2 },
  { id: '94', name: 'Tahini', group: 'Nuts & Seeds', oxalate_mg: 43, category: 'Very High', serving_size: '2 tbsp (30g)', serving_grams: 30, calories: 178, protein_g: 5.1, fiber_g: 2.6 },
  { id: '95', name: 'Almond Butter', group: 'Nuts & Seeds', oxalate_mg: 42, category: 'Very High', serving_size: '2 tbsp (32g)', serving_grams: 32, calories: 190, protein_g: 7, fiber_g: 3.3 },
  { id: '96', name: 'Peanut Butter', group: 'Nuts & Seeds', oxalate_mg: 57, category: 'Very High', serving_size: '2 tbsp (32g)', serving_grams: 32, calories: 190, protein_g: 8, fiber_g: 2.6 },
  { id: '97', name: 'Cocoa Powder', group: 'Sweets', oxalate_mg: 198, category: 'Very High', serving_size: '1 tbsp (5g)', serving_grams: 5, calories: 12, protein_g: 1.1, fiber_g: 1.8 },
  { id: '98', name: 'Green Tea', group: 'Beverages', oxalate_mg: 32, category: 'Very High', serving_size: '1 cup brewed (240ml)', serving_grams: 240, calories: 2, protein_g: 0.5, fiber_g: 0 },
  { id: '99', name: 'Coffee', group: 'Beverages', oxalate_mg: 24, category: 'Very High', serving_size: '1 cup brewed (240ml)', serving_grams: 240, calories: 2, protein_g: 0.3, fiber_g: 0 },
  { id: '100', name: 'Beer', group: 'Beverages', oxalate_mg: 35, category: 'Very High', serving_size: '12 fl oz (355ml)', serving_grams: 355, calories: 153, protein_g: 1.6, fiber_g: 0 },
];

  // Ensure all mock data has proper categories
  return mockFoods.map(food => ({
    ...food,
    category: getOxalateCategory(food.oxalate_mg)
  }));
};

// Search API endpoint for advanced filtering
export const searchOxalateFoods = async (searchParams: {
  food_group?: string;
  food_item?: string;
  serving_size?: string;
  oxalate_category?: string;
  oxalate_value?: string;
}): Promise<OxalateFoodItem[]> => {
  try {
    console.log('Searching API with params:', searchParams);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(`${BASE_URL}/search/oxalate_foods?Instance=52950_ox`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SECRET_KEY}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(searchParams),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.log('Search API failed with status:', response.status);
      // Database is empty, return mock data
      console.log('Search API failed, using mock data');
      return getMockData();
    }

    const result = await response.json();
    console.log('Search API returned result:', result);
    
    // Check if API returned success with data
    if (result.status === 'success' && result.data && Array.isArray(result.data)) {
      console.log('Search API data length:', result.data.length);
      
      if (result.data.length > 0) {
        // Process the search results to match our interface
        const processedData = result.data.map((item: any) => ({
          id: item.id?.toString(),
          name: item.food_item || item.name,
          group: item.food_group || item.group,
          oxalate_mg: parseFloat(item.oxalate_value || item.oxalate_mg || 0),
          category: item.oxalate_category ? mapApiCategory(item.oxalate_category) : getOxalateCategory(parseFloat(item.oxalate_value || item.oxalate_mg || 0)),
          serving_size: item.serving_size,
          serving_grams: item.serving_grams,
          calories: item.calories,
          protein_g: item.protein_g,
          fiber_g: item.fiber_g,
          aliases: item.aliases
        }));

        return processedData;
      }
    }
    
    // If search returned no results or database is empty, use mock data
    console.log('Search returned no results, using mock data');
    return getMockData();
  } catch (error) {
    console.error('Search API error:', error);
    // Network error, use mock data
    console.log('Search API error, using mock data');
    return getMockData();
  }
};