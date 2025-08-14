import { act, renderHook } from '@testing-library/react-native';
import { useOxalateStore } from '../oxalateStore';
import { createMockFood, createMockAsyncStorage } from '../../test-utils';
import * as Network from 'expo-network';
const { NetworkStateType } = Network;
import { fetchOxalateFoods, searchOxalateFoods } from '../../api/oxalate-api';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
}));

// Mock Network
jest.mock('expo-network', () => ({
  getNetworkStateAsync: jest.fn(),
}));

// Mock API functions
jest.mock('../../api/oxalate-api', () => ({
  fetchOxalateFoods: jest.fn(),
  searchOxalateFoods: jest.fn(),
  getCategoryColor: jest.fn(),
  getOxalateCategory: jest.fn(),
}));

const mockNetwork = Network as jest.Mocked<typeof Network>;
const mockFetchOxalateFoods = fetchOxalateFoods as jest.MockedFunction<typeof fetchOxalateFoods>;
const mockSearchOxalateFoods = searchOxalateFoods as jest.MockedFunction<typeof searchOxalateFoods>;

describe('oxalateStore', () => {
  const mockFoods = [
    createMockFood({ 
      id: '1', 
      name: 'Spinach', 
      oxalate_mg: 750, 
      category: 'Very High',
      group: 'vegetables'
    }),
    createMockFood({ 
      id: '2', 
      name: 'Blueberries', 
      oxalate_mg: 15, 
      category: 'Medium',
      group: 'fruits'
    }),
    createMockFood({ 
      id: '3', 
      name: 'Rice', 
      oxalate_mg: 2, 
      category: 'Low',
      group: 'grains'
    }),
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset store state
    act(() => {
      useOxalateStore.setState({
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
      });
    });

    // Default network state
    mockNetwork.getNetworkStateAsync.mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
      type: NetworkStateType.WIFI,
    });

    // Default API response
    mockFetchOxalateFoods.mockResolvedValue(mockFoods);
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useOxalateStore());
      
      expect(result.current.foods).toEqual([]);
      expect(result.current.filteredFoods).toEqual([]);
      expect(result.current.filters.search).toBe('');
      expect(result.current.filters.selectedCategories).toEqual(['Low', 'Medium', 'High', 'Very High']);
      expect(result.current.filters.sortBy).toBe('name');
      expect(result.current.filters.sortDirection).toBe('asc');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('checkNetworkStatus', () => {
    it('should detect online status', async () => {
      mockNetwork.getNetworkStateAsync.mockResolvedValue({
        isConnected: true,
        isInternetReachable: true,
        type: NetworkStateType.WIFI,
      });

      const { result } = renderHook(() => useOxalateStore());

      let isOnline = false;
      await act(async () => {
        isOnline = await result.current.checkNetworkStatus();
      });

      expect(isOnline).toBe(true);
      expect(result.current.isOnline).toBe(true);
    });

    it('should detect offline status', async () => {
      mockNetwork.getNetworkStateAsync.mockResolvedValue({
        isConnected: false,
        isInternetReachable: false,
        type: NetworkStateType.NONE,
      });

      const { result } = renderHook(() => useOxalateStore());

      let isOnline = true;
      await act(async () => {
        isOnline = await result.current.checkNetworkStatus();
      });

      expect(isOnline).toBe(false);
      expect(result.current.isOnline).toBe(false);
    });

    it('should handle network check error', async () => {
      mockNetwork.getNetworkStateAsync.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useOxalateStore());

      let isOnline = true;
      await act(async () => {
        isOnline = await result.current.checkNetworkStatus();
      });

      expect(isOnline).toBe(false);
      expect(result.current.isOnline).toBe(false);
    });
  });

  describe('fetchFoods', () => {
    it('should fetch foods successfully when online', async () => {
      const { result } = renderHook(() => useOxalateStore());

      await act(async () => {
        await result.current.fetchFoods();
      });

      expect(result.current.foods).toEqual(mockFoods);
      expect(result.current.filteredFoods).toEqual(mockFoods);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.lastSyncTime).toBeTruthy();
    });

    it('should use cached data when offline', async () => {
      const { result } = renderHook(() => useOxalateStore());

      // First, set up cached data
      act(() => {
        useOxalateStore.setState({
          foods: mockFoods,
          lastSyncTime: Date.now(),
        });
      });

      // Then simulate going offline
      mockNetwork.getNetworkStateAsync.mockResolvedValue({
        isConnected: false,
        isInternetReachable: false,
        type: NetworkStateType.NONE,
      });

      await act(async () => {
        await result.current.fetchFoods();
      });

      expect(result.current.foods).toEqual(mockFoods);
      expect(result.current.isLoading).toBe(false);
      expect(mockFetchOxalateFoods).toHaveBeenCalledTimes(0); // Should not call API when offline with cache
    });

    it('should force refresh when requested', async () => {
      const { result } = renderHook(() => useOxalateStore());

      // Set up recent cached data
      act(() => {
        useOxalateStore.setState({
          foods: mockFoods,
          lastSyncTime: Date.now() - 1000, // 1 second ago (very recent)
        });
      });

      await act(async () => {
        await result.current.fetchFoods(true); // Force refresh
      });

      expect(mockFetchOxalateFoods).toHaveBeenCalled();
      expect(result.current.foods).toEqual(mockFoods);
    });

    it('should handle API error gracefully', async () => {
      mockFetchOxalateFoods.mockRejectedValueOnce(new Error('API Error'));
      mockFetchOxalateFoods.mockResolvedValueOnce(mockFoods); // Fallback call

      const { result } = renderHook(() => useOxalateStore());

      await act(async () => {
        await result.current.fetchFoods();
      });

      expect(result.current.foods).toEqual(mockFoods);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull(); // Error should be cleared
    });
  });

  describe('filtering and searching', () => {
    beforeEach(async () => {
      const { result } = renderHook(() => useOxalateStore());
      
      await act(async () => {
        await result.current.fetchFoods();
      });
    });

    it('should filter by search term', () => {
      const { result } = renderHook(() => useOxalateStore());

      act(() => {
        result.current.setSearch('spin');
      });

      expect(result.current.filteredFoods).toHaveLength(1);
      expect(result.current.filteredFoods[0].name).toBe('Spinach');
    });

    it('should filter by category', () => {
      const { result } = renderHook(() => useOxalateStore());

      act(() => {
        result.current.toggleCategory('Low');
        result.current.toggleCategory('Medium');
        result.current.toggleCategory('High');
      });

      // Only 'Very High' should remain selected
      expect(result.current.filteredFoods).toHaveLength(1);
      expect(result.current.filteredFoods[0].category).toBe('Very High');
    });

    it('should sort by name', () => {
      const { result } = renderHook(() => useOxalateStore());

      act(() => {
        result.current.setSorting('name', 'asc');
      });

      const names = result.current.filteredFoods.map(food => food.name);
      expect(names).toEqual(['Blueberries', 'Rice', 'Spinach']);
    });

    it('should sort by oxalate content', () => {
      const { result } = renderHook(() => useOxalateStore());

      act(() => {
        result.current.setSorting('oxalate', 'desc');
      });

      const oxalateValues = result.current.filteredFoods.map(food => food.oxalate_mg);
      expect(oxalateValues).toEqual([750, 15, 2]);
    });

    it('should sort by category', () => {
      const { result } = renderHook(() => useOxalateStore());

      act(() => {
        result.current.setSorting('category', 'asc');
      });

      const categories = result.current.filteredFoods.map(food => food.category);
      expect(categories).toEqual(['Low', 'Medium', 'Very High']);
    });

    it('should toggle sort direction', () => {
      const { result } = renderHook(() => useOxalateStore());

      // First sort ascending
      act(() => {
        result.current.setSorting('name', 'asc');
      });

      let names = result.current.filteredFoods.map(food => food.name);
      expect(names).toEqual(['Blueberries', 'Rice', 'Spinach']);

      // Toggle to descending
      act(() => {
        result.current.setSorting('name'); // Should toggle direction
      });

      names = result.current.filteredFoods.map(food => food.name);
      expect(names).toEqual(['Spinach', 'Rice', 'Blueberries']);
    });
  });

  describe('advanced search', () => {
    it('should use API search when live data is available', async () => {
      const searchResults = [mockFoods[0]]; // Only spinach
      mockSearchOxalateFoods.mockResolvedValue(searchResults);

      const { result } = renderHook(() => useOxalateStore());

      // Set up live data (more than 100 items)
      const largeFoodArray = new Array(150).fill(null).map((_, i) => 
        createMockFood({ id: i.toString(), name: `Food ${i}` })
      );
      
      act(() => {
        useOxalateStore.setState({ foods: largeFoodArray });
      });

      await act(async () => {
        await result.current.searchFoodsAdvanced('spinach');
      });

      expect(mockSearchOxalateFoods).toHaveBeenCalledWith({
        food_item: 'spinach',
        food_group: 'spinach',
      });
      expect(result.current.foods).toEqual(searchResults);
    });

    it('should fall back to local search when API search fails', async () => {
      mockSearchOxalateFoods.mockRejectedValue(new Error('Search API error'));

      const { result } = renderHook(() => useOxalateStore());

      // Set up live data
      const largeFoodArray = new Array(150).fill(null).map((_, i) => 
        createMockFood({ id: i.toString(), name: `Food ${i}` })
      );
      
      act(() => {
        useOxalateStore.setState({ foods: largeFoodArray });
      });

      await act(async () => {
        await result.current.searchFoodsAdvanced('food');
      });

      expect(result.current.filters.search).toBe('food');
      expect(result.current.isLoading).toBe(false);
    });

    it('should use local search for demo data', async () => {
      const { result } = renderHook(() => useOxalateStore());

      // Use mock data (small dataset)
      await act(async () => {
        await result.current.fetchFoods();
      });

      await act(async () => {
        await result.current.searchFoodsAdvanced('rice');
      });

      expect(mockSearchOxalateFoods).not.toHaveBeenCalled();
      expect(result.current.filters.search).toBe('rice');
    });
  });

  describe('data source information', () => {
    it('should identify demo data', () => {
      const { result } = renderHook(() => useOxalateStore());

      act(() => {
        useOxalateStore.setState({ 
          foods: mockFoods, // Small dataset
          isOnline: true 
        });
      });

      const dataSource = result.current.getDataSourceInfo();
      
      expect(dataSource.isLive).toBe(false);
      expect(dataSource.source).toBe('Demo Database');
      expect(dataSource.count).toBe(3);
    });

    it('should identify live API data when online', () => {
      const { result } = renderHook(() => useOxalateStore());

      const largeFoodArray = new Array(150).fill(null).map((_, i) => 
        createMockFood({ id: i.toString(), name: `Food ${i}` })
      );

      act(() => {
        useOxalateStore.setState({ 
          foods: largeFoodArray,
          isOnline: true,
          lastSyncTime: Date.now() - 3600000 // 1 hour ago
        });
      });

      const dataSource = result.current.getDataSourceInfo();
      
      expect(dataSource.isLive).toBe(true);
      expect(dataSource.source).toBe('Live API Database');
      expect(dataSource.count).toBe(150);
      expect(dataSource.description).toContain('synced 1h ago');
    });

    it('should identify cached API data when offline', () => {
      const { result } = renderHook(() => useOxalateStore());

      const largeFoodArray = new Array(150).fill(null).map((_, i) => 
        createMockFood({ id: i.toString(), name: `Food ${i}` })
      );

      act(() => {
        useOxalateStore.setState({ 
          foods: largeFoodArray,
          isOnline: false,
          lastSyncTime: Date.now() - 7200000 // 2 hours ago
        });
      });

      const dataSource = result.current.getDataSourceInfo();
      
      expect(dataSource.isLive).toBe(true);
      expect(dataSource.source).toBe('Cached API Data');
      expect(dataSource.count).toBe(150);
      expect(dataSource.description).toContain('last sync 2h ago');
    });
  });

  describe('isUsingLiveData', () => {
    it('should return false for demo data', () => {
      const { result } = renderHook(() => useOxalateStore());

      act(() => {
        useOxalateStore.setState({ foods: mockFoods });
      });

      expect(result.current.isUsingLiveData()).toBe(false);
    });

    it('should return true for live data', () => {
      const { result } = renderHook(() => useOxalateStore());

      const largeFoodArray = new Array(150).fill(null).map((_, i) => 
        createMockFood({ id: i.toString(), name: `Food ${i}` })
      );

      act(() => {
        useOxalateStore.setState({ foods: largeFoodArray });
      });

      expect(result.current.isUsingLiveData()).toBe(true);
    });
  });
});