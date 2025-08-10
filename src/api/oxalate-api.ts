// API service for fetching oxalate foods data
const BASE_URL = 'https://api.nocodebackend.com';
const SECRET_KEY = 'f08208940ca2f0eface079050d193a4d0eb6fd8e64e62cdf0529bb61c168';

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
    const response = await fetch(`${BASE_URL}/read/oxalate_foods`, {
      method: 'GET',
      headers: {
        'Secret': SECRET_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Process the data and add category based on oxalate content
    const processedData = (data.data || data).map((item: any) => ({
      ...item,
      category: getOxalateCategory(item.oxalate_mg || item.oxalate || 0)
    }));

    return processedData;
  } catch (error) {
    console.error('Error fetching oxalate foods:', error);
    
    // Return mock data if API fails
    return getMockData();
  }
};

export const getOxalateCategory = (oxalateMg: number): 'Low' | 'Medium' | 'High' | 'Very High' => {
  if (oxalateMg <= 5) return 'Low';
  if (oxalateMg <= 10) return 'Medium';
  if (oxalateMg <= 20) return 'High';
  return 'Very High';
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
const getMockData = (): OxalateFoodItem[] => [
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
  { id: '25', name: 'Almonds', group: 'Nuts & Seeds', oxalate_mg: 122, category: 'Very High', serving_size: '1 oz (28g)', serving_grams: 28, calories: 164, protein_g: 6, fiber_g: 3.5 },
  { id: '26', name: 'Cashews', group: 'Nuts & Seeds', oxalate_mg: 49, category: 'Very High', serving_size: '1 oz (28g)', serving_grams: 28, calories: 157, protein_g: 5.2, fiber_g: 0.9 },
  { id: '27', name: 'Peanuts', group: 'Nuts & Seeds', oxalate_mg: 142, category: 'Very High', serving_size: '1 oz (28g)', serving_grams: 28, calories: 161, protein_g: 7.3, fiber_g: 2.4, aliases: ['groundnuts'] },
  { id: '28', name: 'Dark Chocolate', group: 'Sweets', oxalate_mg: 25, category: 'Very High', serving_size: '1 oz (28g)', serving_grams: 28, calories: 155, protein_g: 2.3, fiber_g: 3.1 },
  { id: '29', name: 'Black Tea', group: 'Beverages', oxalate_mg: 40, category: 'Very High', serving_size: '1 cup brewed (240ml)', serving_grams: 240, calories: 2, protein_g: 0, fiber_g: 0 },
  { id: '30', name: 'Soy Milk', group: 'Dairy Alternatives', oxalate_mg: 36, category: 'Very High', serving_size: '1 cup (240ml)', serving_grams: 240, calories: 80, protein_g: 7, fiber_g: 1 },
  { id: '31', name: 'Tofu', group: 'Legumes', oxalate_mg: 24, category: 'Very High', serving_size: '3 oz (85g)', serving_grams: 85, calories: 94, protein_g: 10, fiber_g: 0.4 },
  { id: '32', name: 'Navy Beans', group: 'Legumes', oxalate_mg: 76, category: 'Very High', serving_size: '1 cup cooked (182g)', serving_grams: 182, calories: 255, protein_g: 15, fiber_g: 19.1 },
  { id: '33', name: 'Wheat Bran', group: 'Grains', oxalate_mg: 27, category: 'Very High', serving_size: '1 oz (28g)', serving_grams: 28, calories: 63, protein_g: 4.5, fiber_g: 12.2 },
];