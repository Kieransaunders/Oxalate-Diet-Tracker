import { 
  testApiConnection, 
  fetchOxalateFoods, 
  searchOxalateFoods, 
  getOxalateCategory, 
  getCategoryColor,
  mapApiCategory 
} from '../oxalate-api';

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('oxalate-api', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('testApiConnection', () => {
    it('should return success when API is connected with data', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          status: 'success',
          data: [
            { id: '1', food_item: 'Test Food', oxalate_value: '10' },
            { id: '2', food_item: 'Another Food', oxalate_value: '5' },
          ]
        })
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await testApiConnection();

      expect(result.success).toBe(true);
      expect(result.recordCount).toBe(2);
      expect(result.message).toContain('API connected with live data');
    });

    it('should return demo data message when API has no data', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          status: 'success',
          data: []
        })
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await testApiConnection();

      expect(result.success).toBe(true);
      expect(result.recordCount).toBe(100);
      expect(result.message).toContain('comprehensive demo database');
    });

    it('should handle API connection failure', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found'
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await testApiConnection();

      expect(result.success).toBe(false);
      expect(result.message).toContain('API connection failed: 404 Not Found');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await testApiConnection();

      expect(result.success).toBe(false);
      expect(result.message).toContain('Connection failed: Network error');
    });
  });

  describe('fetchOxalateFoods', () => {
    it('should fetch and process API data successfully', async () => {
      const mockApiData = [
        {
          id: '1',
          food_item: 'Spinach',
          food_group: 'vegetables',
          oxalate_value: '750',
          serving_size: '1 cup',
          calories: 7
        },
        {
          id: '2',
          food_item: 'Rice',
          food_group: 'grains',
          oxalate_value: '2',
          serving_size: '1 cup',
          calories: 205
        }
      ];

      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          status: 'success',
          data: mockApiData
        })
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const foods = await fetchOxalateFoods();

      expect(foods).toHaveLength(2);
      expect(foods[0]).toMatchObject({
        id: '1',
        name: 'Spinach',
        group: 'vegetables',
        oxalate_mg: 750,
        category: 'Very High',
        serving_size: '1 cup',
        calories: 7
      });
    });

    it('should use demo data when API fails', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const foods = await fetchOxalateFoods();

      expect(foods).toBeDefined();
      expect(foods.length).toBeGreaterThan(0);
      expect(foods[0]).toHaveProperty('name');
      expect(foods[0]).toHaveProperty('oxalate_mg');
      expect(foods[0]).toHaveProperty('category');
    });

    it('should handle API timeout', async () => {
      mockFetch.mockImplementation(() => 
        new Promise((resolve) => {
          // Simulate a request that never resolves
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve({ status: 'success', data: [] })
          } as any), 15000); // Longer than the 10s timeout
        })
      );

      const foodsPromise = fetchOxalateFoods();
      
      // Fast-forward time to trigger timeout
      jest.advanceTimersByTime(10000);

      const foods = await foodsPromise;

      expect(foods).toBeDefined();
      expect(foods.length).toBeGreaterThan(0); // Should fall back to demo data
    });

    it('should use demo data when API returns no data', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          status: 'success',
          data: []
        })
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const foods = await fetchOxalateFoods();

      expect(foods).toBeDefined();
      expect(foods.length).toBeGreaterThan(0); // Should use demo data
    });
  });

  describe('searchOxalateFoods', () => {
    it('should search foods by name', async () => {
      const mockSearchResults = [
        {
          id: '1',
          food_item: 'Spinach',
          food_group: 'vegetables',
          oxalate_value: '750'
        }
      ];

      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          status: 'success',
          data: mockSearchResults
        })
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const results = await searchOxalateFoods({ food_item: 'spinach' });

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Spinach');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('food_item=spinach'),
        expect.any(Object)
      );
    });

    it('should search foods by group', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          status: 'success',
          data: []
        })
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      await searchOxalateFoods({ food_group: 'vegetables' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('food_group=vegetables'),
        expect.any(Object)
      );
    });

    it('should handle search API errors', async () => {
      mockFetch.mockRejectedValue(new Error('Search failed'));

      const results = await searchOxalateFoods({ food_item: 'test' });

      expect(results).toEqual([]);
    });
  });

  describe('getOxalateCategory', () => {
    it('should categorize low oxalate foods correctly', () => {
      expect(getOxalateCategory(2)).toBe('Low');
      expect(getOxalateCategory(5)).toBe('Low');
    });

    it('should categorize medium oxalate foods correctly', () => {
      expect(getOxalateCategory(6)).toBe('Medium');
      expect(getOxalateCategory(10)).toBe('Medium');
    });

    it('should categorize high oxalate foods correctly', () => {
      expect(getOxalateCategory(11)).toBe('High');
      expect(getOxalateCategory(20)).toBe('High');
    });

    it('should categorize very high oxalate foods correctly', () => {
      expect(getOxalateCategory(21)).toBe('Very High');
      expect(getOxalateCategory(100)).toBe('Very High');
      expect(getOxalateCategory(1000)).toBe('Very High');
    });

    it('should handle zero and negative values', () => {
      expect(getOxalateCategory(0)).toBe('Low');
      expect(getOxalateCategory(-1)).toBe('Low');
    });
  });

  describe('getCategoryColor', () => {
    it('should return correct colors for categories', () => {
      expect(getCategoryColor('Low')).toBe('#10b981');
      expect(getCategoryColor('Medium')).toBe('#f59e0b');
      expect(getCategoryColor('High')).toBe('#f97316');
      expect(getCategoryColor('Very High')).toBe('#ef4444');
    });
  });

  describe('mapApiCategory', () => {
    it('should map API categories correctly', () => {
      expect(mapApiCategory('low')).toBe('Low');
      expect(mapApiCategory('Low')).toBe('Low');
      expect(mapApiCategory('LOW')).toBe('Low');
      
      expect(mapApiCategory('medium')).toBe('Medium');
      expect(mapApiCategory('Medium')).toBe('Medium');
      
      expect(mapApiCategory('high')).toBe('High');
      expect(mapApiCategory('High')).toBe('High');
      
      expect(mapApiCategory('very high')).toBe('Very High');
      expect(mapApiCategory('Very High')).toBe('Very High');
    });

    it('should handle unknown categories', () => {
      expect(mapApiCategory('unknown')).toBe('Low'); // Default fallback
    });
  });
});