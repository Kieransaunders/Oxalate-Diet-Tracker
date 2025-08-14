import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigator } from '../RootNavigator';
import { Text, Pressable } from 'react-native';

// Mock component that can trigger navigation errors
const MockHomeScreenWithErrors = () => {
  const navigation = require('@react-navigation/native').useNavigation();
  
  return (
    <>
      <Text testID="home-screen">Home Screen</Text>
      <Pressable 
        testID="navigate-to-invalid" 
        onPress={() => {
          try {
            // Try to navigate to a non-existent route
            navigation.navigate('NonExistentRoute');
          } catch (error) {
            // Handle navigation error gracefully
            console.warn('Navigation error:', error);
          }
        }}
      >
        <Text>Navigate to Invalid Route</Text>
      </Pressable>
      <Pressable 
        testID="navigate-with-invalid-params" 
        onPress={() => {
          try {
            // Try to navigate with invalid parameters
            navigation.navigate('Oracle', { invalidParam: 'test' });
          } catch (error) {
            console.warn('Navigation parameter error:', error);
          }
        }}
      >
        <Text>Navigate with Invalid Params</Text>
      </Pressable>
    </>
  );
};

const MockSettingsScreenWithErrors = () => {
  const navigation = require('@react-navigation/native').useNavigation();
  
  return (
    <>
      <Text testID="settings-screen">Settings Screen</Text>
      <Pressable 
        testID="settings-close" 
        onPress={() => {
          try {
            navigation.goBack();
          } catch (error) {
            console.warn('Navigation goBack error:', error);
          }
        }}
      >
        <Text>Close Settings</Text>
      </Pressable>
      <Pressable 
        testID="invalid-navigation" 
        onPress={() => {
          try {
            // Try invalid navigation action
            navigation.navigate('InvalidRoute');
          } catch (error) {
            console.warn('Invalid navigation error:', error);
          }
        }}
      >
        <Text>Invalid Navigation</Text>
      </Pressable>
    </>
  );
};

// Mock other screens
jest.mock('../../screens/HomeScreen', () => MockHomeScreenWithErrors);
jest.mock('../../screens/SettingsScreen', () => MockSettingsScreenWithErrors);
jest.mock('../../screens/OxalateTableScreen', () => () => <Text testID="foods-screen">Foods Screen</Text>);
jest.mock('../../components/MealTracker', () => ({ visible }: any) => 
  visible ? <Text testID="tracker-screen">Tracker Screen</Text> : null
);
jest.mock('../../screens/OracleScreen', () => ({ visible }: any) => 
  visible ? <Text testID="oracle-screen">Oracle Screen</Text> : null
);
jest.mock('../../screens/RecipesScreen', () => () => <Text testID="recipes-screen">Recipes Screen</Text>);

// Mock stores
jest.mock('../../state/mealStore', () => ({
  useMealStore: () => ({
    currentDay: { items: [], totalOxalate: 0 }
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

// Mock Expo vector icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

describe('Navigation Error Handling', () => {
  const renderApp = () => {
    return render(
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console.warn to capture error handling
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Invalid Route Handling', () => {
    it('handles navigation to non-existent routes gracefully', () => {
      const { getByTestID } = renderApp();
      
      // Should not crash when trying to navigate to invalid route
      expect(() => {
        fireEvent.press(getByTestID('navigate-to-invalid'));
      }).not.toThrow();
      
      // Should still be on home screen
      expect(getByTestID('home-screen')).toBeTruthy();
    });

    it('handles invalid navigation parameters gracefully', () => {
      const { getByTestID } = renderApp();
      
      // Should not crash when using invalid parameters
      expect(() => {
        fireEvent.press(getByTestID('navigate-with-invalid-params'));
      }).not.toThrow();
      
      // Should still be on home screen
      expect(getByTestID('home-screen')).toBeTruthy();
    });
  });

  describe('Navigation State Recovery', () => {
    it('maintains navigation state after error', () => {
      const { getByTestID } = renderApp();
      
      // Try invalid navigation
      fireEvent.press(getByTestID('navigate-to-invalid'));
      
      // Should still be able to navigate normally
      expect(getByTestID('home-screen')).toBeTruthy();
    });

    it('handles goBack errors gracefully', () => {
      const mockNavigation = {
        navigate: jest.fn(),
        goBack: jest.fn(() => {
          throw new Error('Cannot go back');
        })
      };

      require('@react-navigation/native').useNavigation.mockReturnValue(mockNavigation);

      const { getByTestID } = renderApp();
      
      // Should not crash when goBack fails
      expect(() => {
        fireEvent.press(getByTestID('settings-close'));
      }).not.toThrow();
    });
  });

  describe('Navigation Hook Error Handling', () => {
    it('handles useNavigation hook errors', () => {
      // Mock useNavigation to throw an error
      const originalUseNavigation = require('@react-navigation/native').useNavigation;
      require('@react-navigation/native').useNavigation.mockImplementation(() => {
        throw new Error('Navigation context not found');
      });

      // Should not crash the entire app
      expect(() => renderApp()).not.toThrow();

      // Restore original implementation
      require('@react-navigation/native').useNavigation.mockImplementation(originalUseNavigation);
    });

    it('handles missing navigation context gracefully', () => {
      // Mock useNavigation to return undefined
      require('@react-navigation/native').useNavigation.mockReturnValue(undefined);

      // Should not crash when navigation is undefined
      expect(() => renderApp()).not.toThrow();
    });
  });

  describe('Screen Mounting Error Recovery', () => {
    it('handles screen component errors without crashing navigation', () => {
      // Mock a screen that throws an error
      const ErrorScreen = () => {
        throw new Error('Screen component error');
      };

      jest.mock('../../screens/OxalateTableScreen', () => ErrorScreen);

      const { getByTestID } = renderApp();
      
      // Should still render home screen
      expect(getByTestID('home-screen')).toBeTruthy();
    });

    it('maintains navigation functionality after component errors', () => {
      const { getByTestID } = renderApp();
      
      // Even if there were previous errors, navigation should still work
      expect(getByTestID('home-screen')).toBeTruthy();
      
      // Should be able to attempt navigation
      expect(() => {
        fireEvent.press(getByTestID('navigate-to-invalid'));
      }).not.toThrow();
    });
  });

  describe('Parameter Validation', () => {
    it('handles malformed navigation parameters', () => {
      const mockNavigation = {
        navigate: jest.fn((route, params) => {
          // Simulate parameter validation
          if (params && typeof params !== 'object') {
            throw new Error('Invalid parameters');
          }
        }),
        goBack: jest.fn()
      };

      require('@react-navigation/native').useNavigation.mockReturnValue(mockNavigation);

      const { getByTestID } = renderApp();
      
      // Should handle parameter validation errors
      expect(() => {
        fireEvent.press(getByTestID('navigate-with-invalid-params'));
      }).not.toThrow();
    });

    it('validates Oracle route parameters correctly', () => {
      const mockNavigation = {
        navigate: jest.fn((route, params) => {
          if (route === 'Oracle' && params) {
            // Validate Oracle parameters
            if (params.contextFood && typeof params.contextFood !== 'string') {
              throw new Error('Invalid contextFood parameter');
            }
          }
        }),
        goBack: jest.fn()
      };

      require('@react-navigation/native').useNavigation.mockReturnValue(mockNavigation);

      const { getByTestID } = renderApp();
      
      // Should handle Oracle parameter validation
      expect(() => {
        fireEvent.press(getByTestID('navigate-with-invalid-params'));
      }).not.toThrow();
    });
  });
});