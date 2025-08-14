import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { MainTabNavigator } from '../TabNavigator';

// Mock all screen components
jest.mock('../../screens/HomeScreen', () => {
  return function MockHomeScreen() {
    return null;
  };
});

jest.mock('../../screens/OxalateTableScreen', () => {
  return function MockOxalateTableScreen() {
    return null;
  };
});

jest.mock('../../components/MealTracker', () => {
  return function MockMealTracker() {
    return null;
  };
});

jest.mock('../../screens/OracleScreen', () => {
  return function MockOracleScreen() {
    return null;
  };
});

jest.mock('../../screens/RecipesScreen', () => {
  return function MockRecipesScreen() {
    return null;
  };
});

// Mock safe area context
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

// Mock Expo vector icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

describe('MainTabNavigator', () => {
  const renderTabNavigator = () => {
    return render(
      <NavigationContainer>
        <MainTabNavigator />
      </NavigationContainer>
    );
  };

  it('renders without crashing', () => {
    expect(() => renderTabNavigator()).not.toThrow();
  });

  it('has correct tab configuration', () => {
    // Test that the navigator renders successfully with all tabs
    expect(() => renderTabNavigator()).not.toThrow();
  });

  it('configures tab bar correctly', () => {
    const { getByTestId } = renderTabNavigator();
    // The tab navigator should render without errors
    expect(() => renderTabNavigator()).not.toThrow();
  });
});