import React from 'react';
import { render } from '@testing-library/react-native';
import HomeScreen from '../../screens/HomeScreen';

// Mock React Navigation hooks
const mockNavigate = jest.fn();
const mockRootNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(() => ({
    navigate: mockNavigate,
  })),
}));

// Mock the stores
jest.mock('../../state/mealStore', () => ({
  useMealStore: () => ({
    currentDay: {
      date: '2024-01-15',
      items: [
        { 
          id: '1', 
          food: { name: 'Spinach', oxalate_mg: 15.5 }, 
          portion: 1, 
          oxalateAmount: 15.5, 
          timestamp: Date.now() 
        },
        { 
          id: '2', 
          food: { name: 'Almonds', oxalate_mg: 8.2 }, 
          portion: 1, 
          oxalateAmount: 8.2, 
          timestamp: Date.now() 
        }
      ],
      totalOxalate: 23.7
    }
  })
}));

jest.mock('../../state/subscriptionStore', () => ({
  useSubscriptionStore: () => ({
    status: 'free',
    getRemainingOracleQuestions: () => 5,
    getRemainingRecipes: () => 3
  })
}));

// Mock safe area context
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

describe('HomeScreen Navigation Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock useNavigation to return different navigation objects for tab and root navigation
    const { useNavigation } = require('@react-navigation/native');
    useNavigation
      .mockReturnValueOnce({ navigate: mockNavigate }) // First call for tab navigation
      .mockReturnValueOnce({ navigate: mockRootNavigate }); // Second call for root navigation
  });

  const renderHomeScreen = () => {
    return render(<HomeScreen />);
  };

  it('renders HomeScreen correctly with navigation context', () => {
    const { getByText } = renderHomeScreen();
    
    expect(getByText('Oxalate Tracker')).toBeTruthy();
    expect(getByText('Browse Foods')).toBeTruthy();
    expect(getByText('Meal Tracker')).toBeTruthy();
    expect(getByText('AI Oracle')).toBeTruthy();
    expect(getByText('My Recipes')).toBeTruthy();
  });

  it('displays correct meal summary data', () => {
    const { getByText } = renderHomeScreen();
    
    expect(getByText('23.7mg')).toBeTruthy(); // Total oxalate from mocked data
    expect(getByText('2 items logged today')).toBeTruthy();
  });

  it('displays correct subscription status for free user', () => {
    const { getByText } = renderHomeScreen();
    
    expect(getByText('Free Plan')).toBeTruthy();
    expect(getByText('5 left this month')).toBeTruthy(); // Oracle questions
    expect(getByText('3 left')).toBeTruthy(); // Recipes
  });

  it('uses navigation hooks correctly', () => {
    renderHomeScreen();
    
    // Verify that useNavigation was called twice (once for tab nav, once for root nav)
    const { useNavigation } = require('@react-navigation/native');
    expect(useNavigation).toHaveBeenCalledTimes(2);
  });

  it('renders without navigation errors', () => {
    // This test verifies that the component renders successfully with navigation hooks
    const { getByText } = renderHomeScreen();
    
    expect(getByText('Oxalate Tracker')).toBeTruthy();
    expect(getByText('Browse Foods')).toBeTruthy();
    expect(getByText('Meal Tracker')).toBeTruthy();
    expect(getByText('AI Oracle')).toBeTruthy();
    expect(getByText('My Recipes')).toBeTruthy();
  });
});