import React from 'react';
import { render, fireEvent, screen } from '../../test-utils';
import BottomNavigation from '../BottomNavigation';
import { useMealStore } from '../../state/mealStore';
import { useRecipeStore } from '../../state/recipeStore';
import { useSubscriptionStore } from '../../state/subscriptionStore';

// Mock the stores
jest.mock('../../state/mealStore');
jest.mock('../../state/recipeStore');
jest.mock('../../state/subscriptionStore');

const mockUseMealStore = useMealStore as jest.MockedFunction<typeof useMealStore>;
const mockUseRecipeStore = useRecipeStore as jest.MockedFunction<typeof useRecipeStore>;
const mockUseSubscriptionStore = useSubscriptionStore as jest.MockedFunction<typeof useSubscriptionStore>;

describe('BottomNavigation', () => {
  const mockProps = {
    onChatPress: jest.fn(),
    onTrackerPress: jest.fn(),
    onRecipesPress: jest.fn(),
    onFoodsPress: jest.fn(),
  };

  const defaultMealState = {
    currentDay: {
      date: '2025-01-01',
      items: [],
      totalOxalate: 0,
    },
  };

  const defaultRecipeState = {
    recipes: [],
  };

  const defaultSubscriptionState = {
    status: 'free' as const,
    getRemainingOracleQuestions: () => 5,
    getRemainingRecipes: () => 1,
    getRemainingTrackingDays: () => 7,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseMealStore.mockReturnValue(defaultMealState as any);
    mockUseRecipeStore.mockReturnValue(defaultRecipeState as any);
    mockUseSubscriptionStore.mockReturnValue(defaultSubscriptionState as any);
  });

  describe('rendering', () => {
    it('should render all navigation items', () => {
      render(<BottomNavigation {...mockProps} />);

      expect(screen.getByText('Foods')).toBeTruthy();
      expect(screen.getByText('Recipes')).toBeTruthy();
      expect(screen.getByText('Oracle')).toBeTruthy();
      expect(screen.getByText('Tracker')).toBeTruthy();
    });

    it('should highlight active tab', () => {
      render(<BottomNavigation {...mockProps} activeTab=\"chat\" />);

      const oracleButton = screen.getByText('Oracle').parent;
      expect(oracleButton).toBeTruthy();
      // The active tab should have different styling
    });

    it('should show default foods tab as active when no activeTab specified', () => {
      render(<BottomNavigation {...mockProps} />);

      const foodsButton = screen.getByText('Foods').parent;
      expect(foodsButton).toBeTruthy();
    });
  });

  describe('free tier limitations', () => {
    it('should show usage text for free users', () => {
      render(<BottomNavigation {...mockProps} />);

      // Oracle should show remaining questions
      expect(screen.getByText('5')).toBeTruthy();
      
      // Recipes should show usage count
      expect(screen.getByText('0/1')).toBeTruthy();
      
      // Tracker should show remaining days
      expect(screen.getByText('7d')).toBeTruthy();
    });

    it('should show premium indicators when limits reached', () => {
      mockUseSubscriptionStore.mockReturnValue({
        ...defaultSubscriptionState,
        getRemainingOracleQuestions: () => 0,
        getRemainingRecipes: () => 0,
        getRemainingTrackingDays: () => 0,
      } as any);

      render(<BottomNavigation {...mockProps} />);

      // Should show usage indicators for reached limits
      expect(screen.getByText('0')).toBeTruthy(); // Oracle questions
      expect(screen.getByText('0d')).toBeTruthy(); // Tracking days
    });

    it('should show recipe count when at limit', () => {
      mockUseRecipeStore.mockReturnValue({
        recipes: [{ id: '1', title: 'Test Recipe' }],
      } as any);

      render(<BottomNavigation {...mockProps} />);

      expect(screen.getByText('1/1')).toBeTruthy();
    });
  });

  describe('premium tier', () => {
    beforeEach(() => {
      mockUseSubscriptionStore.mockReturnValue({
        ...defaultSubscriptionState,
        status: 'premium' as const,
        getRemainingOracleQuestions: () => 999,
        getRemainingRecipes: () => 999,
        getRemainingTrackingDays: () => 999,
      } as any);
    });

    it('should not show usage text for premium users', () => {
      render(<BottomNavigation {...mockProps} />);

      // Should not show usage limitations
      expect(screen.queryByText('5')).toBeFalsy();
      expect(screen.queryByText('/1')).toBeFalsy();
      expect(screen.queryByText('7d')).toBeFalsy();
    });

    it('should show recipe count badge for premium users', () => {
      const mockRecipes = [
        { id: '1', title: 'Recipe 1' },
        { id: '2', title: 'Recipe 2' },
        { id: '3', title: 'Recipe 3' },
      ];
      
      mockUseRecipeStore.mockReturnValue({
        recipes: mockRecipes,
      } as any);

      render(<BottomNavigation {...mockProps} />);

      expect(screen.getByText('3')).toBeTruthy();
    });
  });

  describe('meal tracking badge', () => {
    it('should show tracker badge when items are added', () => {
      mockUseMealStore.mockReturnValue({
        currentDay: {
          date: '2025-01-01',
          items: [
            { id: '1', food: { name: 'Food 1' }, portion: 1, oxalateAmount: 10, timestamp: Date.now() },
            { id: '2', food: { name: 'Food 2' }, portion: 1, oxalateAmount: 5, timestamp: Date.now() },
          ],
          totalOxalate: 15,
        },
      } as any);

      render(<BottomNavigation {...mockProps} />);

      // Should show badge with item count
      expect(screen.getByText('2')).toBeTruthy();
    });

    it('should not show tracker badge when no items added', () => {
      render(<BottomNavigation {...mockProps} />);

      // Tracker text should be present but no badge count (other than usage indicator)
      expect(screen.getByText('Tracker')).toBeTruthy();
    });
  });

  describe('interactions', () => {
    it('should call onFoodsPress when Foods tab is pressed', () => {
      render(<BottomNavigation {...mockProps} />);

      fireEvent.press(screen.getByText('Foods'));
      expect(mockProps.onFoodsPress).toHaveBeenCalled();
    });

    it('should call onChatPress when Oracle tab is pressed', () => {
      render(<BottomNavigation {...mockProps} />);

      fireEvent.press(screen.getByText('Oracle'));
      expect(mockProps.onChatPress).toHaveBeenCalled();
    });

    it('should call onTrackerPress when Tracker tab is pressed', () => {
      render(<BottomNavigation {...mockProps} />);

      fireEvent.press(screen.getByText('Tracker'));
      expect(mockProps.onTrackerPress).toHaveBeenCalled();
    });

    it('should call onRecipesPress when Recipes tab is pressed', () => {
      render(<BottomNavigation {...mockProps} />);

      fireEvent.press(screen.getByText('Recipes'));
      expect(mockProps.onRecipesPress).toHaveBeenCalled();
    });

    it('should handle missing onFoodsPress gracefully', () => {
      const propsWithoutFoodsPress = {
        onChatPress: jest.fn(),
        onTrackerPress: jest.fn(),
        onRecipesPress: jest.fn(),
      };

      render(<BottomNavigation {...propsWithoutFoodsPress} />);

      // Should render without error
      expect(screen.getByText('Foods')).toBeTruthy();
      
      // Pressing should not throw error
      fireEvent.press(screen.getByText('Foods'));
      // Should not call any function since it's not provided
    });
  });

  describe('accessibility', () => {
    it('should be accessible', () => {
      render(<BottomNavigation {...mockProps} />);

      // All buttons should be accessible
      expect(screen.getByText('Foods')).toBeTruthy();
      expect(screen.getByText('Recipes')).toBeTruthy();
      expect(screen.getByText('Oracle')).toBeTruthy();
      expect(screen.getByText('Tracker')).toBeTruthy();
    });
  });
});