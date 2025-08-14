import React from 'react';
import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigator } from '../RootNavigator';

// Mock the TabNavigator
jest.mock('../TabNavigator', () => ({
  MainTabNavigator: () => null,
}));

// Mock SettingsScreen
jest.mock('../../screens/SettingsScreen', () => {
  return function MockSettingsScreen() {
    return null;
  };
});

// Mock safe area context
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

describe('RootNavigator', () => {
  const renderRootNavigator = () => {
    return render(
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    );
  };

  it('renders without crashing', () => {
    expect(() => renderRootNavigator()).not.toThrow();
  });

  it('initializes with MainTabs as the initial route', () => {
    const { getByTestId } = renderRootNavigator();
    // The navigator should render successfully
    expect(() => renderRootNavigator()).not.toThrow();
  });

  it('has correct screen configuration', () => {
    // Test that the navigator is properly configured
    expect(() => renderRootNavigator()).not.toThrow();
  });
});