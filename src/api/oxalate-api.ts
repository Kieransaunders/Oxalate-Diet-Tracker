// API service for fetching oxalate foods data
const BASE_URL = 'https://api.nocodebackend.com';
const SECRET_KEY = 'f08208940ca2f0eface079050d193a4d0eb6fd8e64e62cdf0529bb61c168';

export interface OxalateFoodItem {
  id?: string;
  name: string;
  group?: string;
  oxalate_mg: number;
  category: 'Low' | 'Medium' | 'High' | 'Very High';
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
    case 'Low': return '#22c55e'; // Green
    case 'Medium': return '#f59e0b'; // Amber
    case 'High': return '#f97316'; // Orange
    case 'Very High': return '#ef4444'; // Red
    default: return '#6b7280'; // Gray
  }
};

// Mock data as fallback - comprehensive list for demo
const getMockData = (): OxalateFoodItem[] => [
  // Low oxalate foods (0-5mg)
  { id: '1', name: 'Apple', group: 'Fruits', oxalate_mg: 1, category: 'Low' },
  { id: '2', name: 'Banana', group: 'Fruits', oxalate_mg: 3, category: 'Low' },
  { id: '3', name: 'White Rice', group: 'Grains', oxalate_mg: 4, category: 'Low' },
  { id: '4', name: 'Chicken Breast', group: 'Meat & Fish', oxalate_mg: 0, category: 'Low' },
  { id: '5', name: 'Salmon', group: 'Meat & Fish', oxalate_mg: 0, category: 'Low' },
  { id: '6', name: 'Cauliflower', group: 'Vegetables', oxalate_mg: 2, category: 'Low' },
  { id: '7', name: 'Mushrooms', group: 'Vegetables', oxalate_mg: 2, category: 'Low' },
  { id: '8', name: 'Cabbage', group: 'Vegetables', oxalate_mg: 3, category: 'Low' },
  { id: '9', name: 'Cucumber', group: 'Vegetables', oxalate_mg: 1, category: 'Low' },
  { id: '10', name: 'Lettuce', group: 'Leafy Greens', oxalate_mg: 5, category: 'Low' },
  
  // Medium oxalate foods (6-10mg)
  { id: '11', name: 'Broccoli', group: 'Vegetables', oxalate_mg: 7, category: 'Medium' },
  { id: '12', name: 'Green Peas', group: 'Vegetables', oxalate_mg: 8, category: 'Medium' },
  { id: '13', name: 'Turnips', group: 'Vegetables', oxalate_mg: 10, category: 'Medium' },
  { id: '14', name: 'Strawberries', group: 'Fruits', oxalate_mg: 9, category: 'Medium' },
  { id: '15', name: 'Corn', group: 'Vegetables', oxalate_mg: 6, category: 'Medium' },
  
  // High oxalate foods (11-20mg)
  { id: '16', name: 'Carrots', group: 'Vegetables', oxalate_mg: 18, category: 'High' },
  { id: '17', name: 'Potatoes', group: 'Vegetables', oxalate_mg: 12, category: 'High' },
  { id: '18', name: 'Celery', group: 'Vegetables', oxalate_mg: 15, category: 'High' },
  { id: '19', name: 'Green Beans', group: 'Vegetables', oxalate_mg: 17, category: 'High' },
  { id: '20', name: 'Kiwi', group: 'Fruits', oxalate_mg: 16, category: 'High' },
  
  // Very High oxalate foods (>20mg)
  { id: '21', name: 'Spinach', group: 'Leafy Greens', oxalate_mg: 750, category: 'Very High' },
  { id: '22', name: 'Rhubarb', group: 'Fruits', oxalate_mg: 860, category: 'Very High' },
  { id: '23', name: 'Beets', group: 'Vegetables', oxalate_mg: 152, category: 'Very High' },
  { id: '24', name: 'Sweet Potato', group: 'Vegetables', oxalate_mg: 28, category: 'Very High' },
  { id: '25', name: 'Almonds', group: 'Nuts & Seeds', oxalate_mg: 122, category: 'Very High' },
  { id: '26', name: 'Cashews', group: 'Nuts & Seeds', oxalate_mg: 49, category: 'Very High' },
  { id: '27', name: 'Peanuts', group: 'Nuts & Seeds', oxalate_mg: 142, category: 'Very High' },
  { id: '28', name: 'Dark Chocolate', group: 'Sweets', oxalate_mg: 25, category: 'Very High' },
  { id: '29', name: 'Black Tea', group: 'Beverages', oxalate_mg: 40, category: 'Very High' },
  { id: '30', name: 'Soy Milk', group: 'Dairy Alternatives', oxalate_mg: 36, category: 'Very High' },
  { id: '31', name: 'Tofu', group: 'Legumes', oxalate_mg: 24, category: 'Very High' },
  { id: '32', name: 'Navy Beans', group: 'Legumes', oxalate_mg: 76, category: 'Very High' },
  { id: '33', name: 'Wheat Bran', group: 'Grains', oxalate_mg: 27, category: 'Very High' },
];