import { act, renderHook } from '@testing-library/react-native';
import { useMealStore } from '../mealStore';
import { createMockFood, createMockAsyncStorage } from '../../test-utils';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => createMockAsyncStorage());

describe('mealStore', () => {
  beforeEach(() => {
    // Clear the store state before each test
    act(() => {
      useMealStore.getState().clearDay();
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useMealStore());
      
      expect(result.current.currentDay.items).toEqual([]);
      expect(result.current.currentDay.totalOxalate).toBe(0);
      expect(result.current.mealHistory).toEqual([]);
      expect(result.current.dailyLimit).toBe(50);
      expect(result.current.currentDay.date).toBe(new Date().toISOString().split('T')[0]);
    });
  });

  describe('addMealItem', () => {
    it('should add a meal item to current day', () => {
      const { result } = renderHook(() => useMealStore());
      const mockFood = createMockFood({ name: 'Test Food', oxalate_mg: 20 });

      act(() => {
        result.current.addMealItem(mockFood, 1.5, 30);
      });

      expect(result.current.currentDay.items).toHaveLength(1);
      expect(result.current.currentDay.items[0]).toMatchObject({
        food: mockFood,
        portion: 1.5,
        oxalateAmount: 30,
      });
      expect(result.current.currentDay.totalOxalate).toBe(30);
    });

    it('should add multiple meal items and sum oxalate', () => {
      const { result } = renderHook(() => useMealStore());
      const food1 = createMockFood({ name: 'Food 1', oxalate_mg: 10 });
      const food2 = createMockFood({ name: 'Food 2', oxalate_mg: 15 });

      act(() => {
        result.current.addMealItem(food1, 1, 10);
        result.current.addMealItem(food2, 2, 30);
      });

      expect(result.current.currentDay.items).toHaveLength(2);
      expect(result.current.currentDay.totalOxalate).toBe(40);
    });

    it('should generate unique IDs for meal items', () => {
      const { result } = renderHook(() => useMealStore());
      const mockFood = createMockFood();

      act(() => {
        result.current.addMealItem(mockFood, 1, 10);
        result.current.addMealItem(mockFood, 1, 10);
      });

      const ids = result.current.currentDay.items.map(item => item.id);
      expect(new Set(ids).size).toBe(2); // All IDs should be unique
    });
  });

  describe('removeMealItem', () => {
    it('should remove a meal item and update total oxalate', () => {
      const { result } = renderHook(() => useMealStore());
      const mockFood = createMockFood();

      act(() => {
        result.current.addMealItem(mockFood, 1, 25);
      });

      const itemId = result.current.currentDay.items[0].id;

      act(() => {
        result.current.removeMealItem(itemId);
      });

      expect(result.current.currentDay.items).toHaveLength(0);
      expect(result.current.currentDay.totalOxalate).toBe(0);
    });

    it('should not affect state when removing non-existent item', () => {
      const { result } = renderHook(() => useMealStore());
      const mockFood = createMockFood();

      act(() => {
        result.current.addMealItem(mockFood, 1, 25);
      });

      const initialState = result.current.currentDay;

      act(() => {
        result.current.removeMealItem('non-existent-id');
      });

      expect(result.current.currentDay).toEqual(initialState);
    });
  });

  describe('setDailyLimit', () => {
    it('should update the daily limit', () => {
      const { result } = renderHook(() => useMealStore());

      act(() => {
        result.current.setDailyLimit(100);
      });

      expect(result.current.dailyLimit).toBe(100);
    });
  });

  describe('clearDay', () => {
    it('should clear all items from current day', () => {
      const { result } = renderHook(() => useMealStore());
      const mockFood = createMockFood();

      act(() => {
        result.current.addMealItem(mockFood, 1, 25);
        result.current.addMealItem(mockFood, 2, 30);
      });

      expect(result.current.currentDay.items).toHaveLength(2);

      act(() => {
        result.current.clearDay();
      });

      expect(result.current.currentDay.items).toHaveLength(0);
      expect(result.current.currentDay.totalOxalate).toBe(0);
    });
  });

  describe('findFoodByName', () => {
    const mockFoodDatabase = [
      createMockFood({ name: 'Spinach', oxalate_mg: 750 }),
      createMockFood({ name: 'Eggs', oxalate_mg: 5 }),
      createMockFood({ name: 'Blueberries', oxalate_mg: 15 }),
      createMockFood({ name: 'White Rice', oxalate_mg: 2, aliases: ['rice', 'rice flour'] }),
    ];

    it('should find food by exact name match', () => {
      const { result } = renderHook(() => useMealStore());
      
      const food = result.current.findFoodByName('Spinach', mockFoodDatabase);
      expect(food?.name).toBe('Spinach');
    });

    it('should find food by case-insensitive match', () => {
      const { result } = renderHook(() => useMealStore());
      
      const food = result.current.findFoodByName('spinach', mockFoodDatabase);
      expect(food?.name).toBe('Spinach');
    });

    it('should find food by partial match', () => {
      const { result } = renderHook(() => useMealStore());
      
      const food = result.current.findFoodByName('blue', mockFoodDatabase);
      expect(food?.name).toBe('Blueberries');
    });

    it('should find food by alias', () => {
      const { result } = renderHook(() => useMealStore());
      
      const food = result.current.findFoodByName('rice', mockFoodDatabase);
      expect(food?.name).toBe('White Rice');
    });

    it('should return null for non-existent food', () => {
      const { result } = renderHook(() => useMealStore());
      
      const food = result.current.findFoodByName('non-existent-food', mockFoodDatabase);
      expect(food).toBeNull();
    });

    it('should return null for empty name', () => {
      const { result } = renderHook(() => useMealStore());
      
      const food = result.current.findFoodByName('', mockFoodDatabase);
      expect(food).toBeNull();
    });
  });

  describe('addRecipeIngredients', () => {
    const mockFoodDatabase = [
      createMockFood({ name: 'Eggs', oxalate_mg: 5 }),
      createMockFood({ name: 'White Rice', oxalate_mg: 2 }),
      createMockFood({ name: 'Butter', oxalate_mg: 1 }),
    ];

    it('should add recipe ingredients to meal tracker', () => {
      const { result } = renderHook(() => useMealStore());
      
      const recipe = {
        title: 'Test Recipe',
        ingredients: [
          { name: '2 eggs' },
          { name: '1 cup white rice' },
          { name: '1 tbsp butter' },
        ],
        servings: 4,
      };

      let addResult;
      act(() => {
        addResult = result.current.addRecipeIngredients(recipe, mockFoodDatabase);
      });

      expect(addResult.added).toBe(3);
      expect(addResult.notFound).toHaveLength(0);
      expect(result.current.currentDay.items).toHaveLength(3);
    });

    it('should handle ingredients not found in database', () => {
      const { result } = renderHook(() => useMealStore());
      
      const recipe = {
        title: 'Test Recipe',
        ingredients: [
          { name: '2 eggs' },
          { name: '1 cup unknown ingredient' },
        ],
        servings: 2,
      };

      let addResult;
      act(() => {
        addResult = result.current.addRecipeIngredients(recipe, mockFoodDatabase);
      });

      expect(addResult.added).toBe(1);
      expect(addResult.notFound).toEqual(['unknown ingredient']);
      expect(result.current.currentDay.items).toHaveLength(1);
    });

    it('should clean ingredient names properly', () => {
      const { result } = renderHook(() => useMealStore());
      
      const recipe = {
        title: 'Test Recipe',
        ingredients: [
          { name: '2 large fresh eggs, beaten' },
          { name: '1 cup all-purpose white rice' },
        ],
        servings: 1,
      };

      let addResult;
      act(() => {
        addResult = result.current.addRecipeIngredients(recipe, mockFoodDatabase);
      });

      expect(addResult.added).toBe(2);
      expect(result.current.currentDay.items[0].food.name).toBe('Eggs');
      expect(result.current.currentDay.items[1].food.name).toBe('White Rice');
    });
  });

  describe('getMealForDate', () => {
    it('should return current day for today', () => {
      const { result } = renderHook(() => useMealStore());
      const today = new Date().toISOString().split('T')[0];
      
      const meal = result.current.getMealForDate(today);
      expect(meal).toBe(result.current.currentDay);
    });

    it('should return undefined for non-existent date', () => {
      const { result } = renderHook(() => useMealStore());
      
      const meal = result.current.getMealForDate('2023-01-01');
      expect(meal).toBeUndefined();
    });
  });
});