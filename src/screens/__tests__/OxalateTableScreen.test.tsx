import React from 'react';
import { render, fireEvent, screen, waitFor } from '../../test-utils';
import OxalateTableScreen from '../OxalateTableScreen';
import { useOxalateStore } from '../../state/oxalateStore';
import { useMealStore } from '../../state/mealStore';
import { createMockFood } from '../../test-utils';

// Mock the stores
jest.mock('../../state/oxalateStore');
jest.mock('../../state/mealStore');

const mockUseOxalateStore = useOxalateStore as jest.MockedFunction<typeof useOxalateStore>;
const mockUseMealStore = useMealStore as jest.MockedFunction<typeof useMealStore>;

// Mock child components
jest.mock('../../components/BottomNavigation', () => {
  return function MockBottomNavigation({ onChatPress, onTrackerPress, onRecipesPress }: any) {
    return (
      <div data-testid="bottom-navigation\">
        <button onClick={onChatPress}>Chat</button>
        <button onClick={onTrackerPress}>Tracker</button>
        <button onClick={onRecipesPress}>Recipes</button>
      </div>
    );
  };
});

jest.mock('../../components/NutritionModal', () => {
  return function MockNutritionModal({ visible, food, onClose }: any) {
    return visible ? (
      <div data-testid="nutrition-modal\">
        <div>{food?.name}</div>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null;
  };
});

jest.mock('../../components/MealTracker', () => {
  return function MockMealTracker({ visible, onClose }: any) {
    return visible ? (
      <div data-testid="meal-tracker\">
        <button onClick={onClose}>Close Tracker</button>
      </div>
    ) : null;
  };
});

describe('OxalateTableScreen', () => {
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

  const defaultOxalateState = {
    foods: mockFoods,
    filteredFoods: mockFoods,
    filters: {
      search: '',
      selectedCategories: ['Low', 'Medium', 'High', 'Very High'],
      sortBy: 'name',
      sortDirection: 'asc',
    },
    isLoading: false,
    error: null,
    lastSyncTime: Date.now(),
    isOnline: true,
    fetchFoods: jest.fn(),
    setSearch: jest.fn(),
    toggleCategory: jest.fn(),
    setSorting: jest.fn(),
    applyFilters: jest.fn(),
    searchFoodsAdvanced: jest.fn(),
    checkNetworkStatus: jest.fn(),
    isUsingLiveData: jest.fn(() => false),
    getDataSourceInfo: jest.fn(() => ({
      isLive: false,
      count: 3,
      source: 'Demo Database',
      description: '3 comprehensive demo foods'
    })),
  };

  const defaultMealState = {
    currentDay: {
      date: '2025-01-01',
      items: [],
      totalOxalate: 0,
    },
    mealHistory: [],
    dailyLimit: 50,
    addMealItem: jest.fn(),
    removeMealItem: jest.fn(),
    setDailyLimit: jest.fn(),
    getMealForDate: jest.fn(),
    clearDay: jest.fn(),
    findFoodByName: jest.fn(),
    addRecipeIngredients: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseOxalateStore.mockReturnValue(defaultOxalateState as any);
    mockUseMealStore.mockReturnValue(defaultMealState as any);
  });

  describe('rendering', () => {
    it('should render the main screen with food list', () => {
      render(<OxalateTableScreen />);

      expect(screen.getByText('Oxalate Food Database')).toBeTruthy();
      expect(screen.getByTestId('bottom-navigation')).toBeTruthy();
      
      // Should show food items
      expect(screen.getByText('Spinach')).toBeTruthy();
      expect(screen.getByText('Blueberries')).toBeTruthy();
      expect(screen.getByText('Rice')).toBeTruthy();
    });

    it('should show loading state', () => {
      mockUseOxalateStore.mockReturnValue({
        ...defaultOxalateState,
        isLoading: true,
        filteredFoods: [],
      } as any);

      render(<OxalateTableScreen />);

      expect(screen.getByText('Loading foods...')).toBeTruthy();
    });

    it('should show empty state when no foods found', () => {
      mockUseOxalateStore.mockReturnValue({
        ...defaultOxalateState,
        filteredFoods: [],
        isLoading: false,
      } as any);

      render(<OxalateTableScreen />);

      expect(screen.getByText('No foods found')).toBeTruthy();
    });
  });

  describe('search functionality', () => {
    it('should call setSearch when search input changes', () => {
      const mockSetSearch = jest.fn();
      mockUseOxalateStore.mockReturnValue({
        ...defaultOxalateState,
        setSearch: mockSetSearch,
      } as any);

      render(<OxalateTableScreen />);

      const searchInput = screen.getByPlaceholderText('Search foods...');
      fireEvent.changeText(searchInput, 'spinach');

      expect(mockSetSearch).toHaveBeenCalledWith('spinach');
    });

    it('should show filtered results', () => {
      mockUseOxalateStore.mockReturnValue({
        ...defaultOxalateState,
        filteredFoods: [mockFoods[0]], // Only spinach
        filters: {
          ...defaultOxalateState.filters,
          search: 'spinach',
        },
      } as any);

      render(<OxalateTableScreen />);

      expect(screen.getByText('Spinach')).toBeTruthy();
      expect(screen.queryByText('Blueberries')).toBeFalsy();
      expect(screen.queryByText('Rice')).toBeFalsy();
    });
  });

  describe('filtering functionality', () => {
    it('should call toggleCategory when category filter is pressed', () => {
      const mockToggleCategory = jest.fn();
      mockUseOxalateStore.mockReturnValue({
        ...defaultOxalateState,
        toggleCategory: mockToggleCategory,
      } as any);

      render(<OxalateTableScreen />);

      // Find and press a category filter (this may need adjustment based on actual UI)
      const filterButton = screen.getByText('Low'); // Assuming category buttons show category names
      fireEvent.press(filterButton);

      expect(mockToggleCategory).toHaveBeenCalledWith('Low');
    });
  });

  describe('sorting functionality', () => {
    it('should call setSorting when sort option is selected', () => {
      const mockSetSorting = jest.fn();
      mockUseOxalateStore.mockReturnValue({
        ...defaultOxalateState,
        setSorting: mockSetSorting,
      } as any);

      render(<OxalateTableScreen />);

      // Find and press sort button (this may need adjustment based on actual UI)
      const sortButton = screen.getByText('Sort'); // Assuming there's a sort button
      fireEvent.press(sortButton);

      // This would trigger a sort menu or change sort order
      expect(mockSetSorting).toHaveBeenCalled();
    });
  });

  describe('nutrition modal', () => {
    it('should open nutrition modal when food item is pressed', () => {
      render(<OxalateTableScreen />);

      const spinachItem = screen.getByText('Spinach');
      fireEvent.press(spinachItem);

      expect(screen.getByTestId('nutrition-modal')).toBeTruthy();
      expect(screen.getByText('Spinach')).toBeTruthy(); // Should show in modal
    });

    it('should close nutrition modal when close is pressed', () => {
      render(<OxalateTableScreen />);

      // Open modal
      fireEvent.press(screen.getByText('Spinach'));
      expect(screen.getByTestId('nutrition-modal')).toBeTruthy();

      // Close modal
      fireEvent.press(screen.getByText('Close'));
      expect(screen.queryByTestId('nutrition-modal')).toBeFalsy();
    });
  });

  describe('meal tracker integration', () => {
    it('should open meal tracker when tracker button is pressed', () => {
      render(<OxalateTableScreen />);

      fireEvent.press(screen.getByText('Tracker'));

      expect(screen.getByTestId('meal-tracker')).toBeTruthy();
    });

    it('should close meal tracker when close is pressed', () => {
      render(<OxalateTableScreen />);

      // Open tracker
      fireEvent.press(screen.getByText('Tracker'));
      expect(screen.getByTestId('meal-tracker')).toBeTruthy();

      // Close tracker
      fireEvent.press(screen.getByText('Close Tracker'));
      expect(screen.queryByTestId('meal-tracker')).toBeFalsy();
    });

    it('should add food to meal tracker from nutrition modal', async () => {
      const mockAddMealItem = jest.fn();
      mockUseMealStore.mockReturnValue({
        ...defaultMealState,
        addMealItem: mockAddMealItem,
      } as any);

      render(<OxalateTableScreen />);

      // Open nutrition modal
      fireEvent.press(screen.getByText('Spinach'));
      
      // Add to tracker (this would be a button in the nutrition modal)
      const addButton = screen.getByText('Add to Tracker'); // Assuming this button exists
      fireEvent.press(addButton);

      expect(mockAddMealItem).toHaveBeenCalledWith(
        mockFoods[0], // The spinach food item
        expect.any(Number), // portion
        expect.any(Number)  // oxalate amount
      );
    });
  });

  describe('data source information', () => {
    it('should show data source info', () => {
      render(<OxalateTableScreen />);

      expect(screen.getByText('Demo Database')).toBeTruthy();
      expect(screen.getByText('3 comprehensive demo foods')).toBeTruthy();
    });

    it('should show live data info when connected to API', () => {
      mockUseOxalateStore.mockReturnValue({
        ...defaultOxalateState,
        getDataSourceInfo: () => ({
          isLive: true,
          count: 324,
          source: 'Live API Database',
          description: '324 foods from API (just synced)'
        }),
      } as any);

      render(<OxalateTableScreen />);

      expect(screen.getByText('Live API Database')).toBeTruthy();
      expect(screen.getByText('324 foods from API (just synced)')).toBeTruthy();
    });
  });

  describe('pull to refresh', () => {
    it('should trigger fetchFoods on pull to refresh', async () => {
      const mockFetchFoods = jest.fn().mockResolvedValue(undefined);
      mockUseOxalateStore.mockReturnValue({
        ...defaultOxalateState,
        fetchFoods: mockFetchFoods,
      } as any);

      render(<OxalateTableScreen />);

      // Simulate pull to refresh
      const scrollView = screen.getByTestId('food-list'); // Assuming the list has this testID
      fireEvent(scrollView, 'onRefresh');

      await waitFor(() => {
        expect(mockFetchFoods).toHaveBeenCalledWith(true); // Force refresh
      });
    });
  });

  describe('error handling', () => {
    it('should show error message when there is an error', () => {
      mockUseOxalateStore.mockReturnValue({
        ...defaultOxalateState,
        error: 'Failed to load foods',
        isLoading: false,
      } as any);

      render(<OxalateTableScreen />);

      expect(screen.getByText('Failed to load foods')).toBeTruthy();
    });
  });

  describe('navigation', () => {
    it('should handle chat navigation', () => {
      render(<OxalateTableScreen />);

      fireEvent.press(screen.getByText('Chat'));

      // This would typically navigate to chat screen
      // In a real app, you'd test navigation mocks
    });

    it('should handle recipes navigation', () => {
      render(<OxalateTableScreen />);

      fireEvent.press(screen.getByText('Recipes'));

      // This would typically navigate to recipes screen
    });
  });

  describe('initial data loading', () => {
    it('should fetch foods on component mount', () => {
      const mockFetchFoods = jest.fn();
      mockUseOxalateStore.mockReturnValue({
        ...defaultOxalateState,
        fetchFoods: mockFetchFoods,
      } as any);

      render(<OxalateTableScreen />);

      expect(mockFetchFoods).toHaveBeenCalled();
    });
  });
});