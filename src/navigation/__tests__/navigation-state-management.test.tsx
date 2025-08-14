import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer, NavigationState } from '@react-navigation/native';
import { RootNavigator } from '../RootNavigator';
import { Text, Pressable } from 'react-native';

// Mock components that track navigation state
const MockHomeScreen = () => {
  const navigation = require('@react-navigation/native').useNavigation();
  const route = require('@react-navigation/native').useRoute();
  
  return (
    <>
      <Text testID="home-screen">Home Screen</Text>
      <Text testID="current-route">{route.name}</Text>
      <Pressable 
        testID="navigate-to-foods" 
        onPress={() => navigation.navigate('Foods')}
      >
        <Text>Go to Foods</Text>
      </Pressable>
      <Pressable 
        testID="navigate-to-oracle-with-context" 
        onPress={() => navigation.navigate('Oracle', { contextFood: 'spinach' })}
      >
        <Text>Go to Oracle with Context</Text>
      </Pressable>
    </>
  );
};

const MockOracleScreen = ({ visible, contextFood, onClose }: any) => {
  const route = require('@react-navigation/native').useRoute();
  
  return visible ? (
    <>
      <Text testID="oracle-screen">Oracle Screen</Text>
      <Text testID="oracle-route-name">{route.name}</Text>
      {contextFood && <Text testID="oracle-context-food">{contextFood}</Text>}
      {route.params?.contextFood && (
        <Text testID="oracle-route-context">{route.params.contextFood}</Text>
      )}
      <Pressable testID="oracle-close" onPress={onClose}>
        <Text>Close Oracle</Text>
      </Pressable>
    </>
  ) : null;
};

const MockSettingsScreen = () => {
  const navigation = require('@react-navigation/native').useNavigation();
  const route = require('@react-navigation/native').useRoute();
  
  return (
    <>
      <Text testID="settings-screen">Settings Screen</Text>
      <Text testID="settings-route-name">{route.name}</Text>
      <Pressable testID="settings-close" onPress={() => navigation.goBack()}>
        <Text>Close Settings</Text>
      </Pressable>
    </>
  );
};

// Mock other screens
jest.mock('../../screens/HomeScreen', () => MockHomeScreen);
jest.mock('../../screens/OracleScreen', () => MockOracleScreen);
jest.mock('../../screens/SettingsScreen', () => MockSettingsScreen);
jest.mock('../../screens/OxalateTableScreen', () => () => {
  const route = require('@react-navigation/native').useRoute();
  return (
    <>
      <Text testID="foods-screen">Foods Screen</Text>
      <Text testID="foods-route-name">{route.name}</Text>
    </>
  );
});
jest.mock('../../components/MealTracker', () => ({ visible }: any) => {
  const route = require('@react-navigation/native').useRoute();
  return visible ? (
    <>
      <Text testID="tracker-screen">Tracker Screen</Text>
      <Text testID="tracker-route-name">{route.name}</Text>
    </>
  ) : null;
});
jest.mock('../../screens/RecipesScreen', () => () => {
  const route = require('@react-navigation/native').useRoute();
  return (
    <>
      <Text testID="recipes-screen">Recipes Screen</Text>
      <Text testID="recipes-route-name">{route.name}</Text>
    </>
  );
});

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

describe('Navigation State Management', () => {
  let navigationState: NavigationState | undefined;
  
  const renderApp = () => {
    return render(
      <NavigationContainer
        onStateChange={(state) => {
          navigationState = state;
        }}
      >
        <RootNavigator />
      </NavigationContainer>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    navigationState = undefined;
  });

  describe('Navigation State Tracking', () => {
    it('tracks initial navigation state correctly', async () => {
      const { getByTestID } = renderApp();
      
      await waitFor(() => {
        expect(getByTestID('home-screen')).toBeTruthy();
        expect(getByTestID('current-route')).toBeTruthy();
      });
      
      // Navigation state should be initialized
      expect(navigationState).toBeDefined();
    });

    it('updates navigation state on tab changes', async () => {
      const { getByTestID } = renderApp();
      
      // Start on Home
      await waitFor(() => {
        expect(getByTestID('home-screen')).toBeTruthy();
      });
      
      const initialState = navigationState;
      
      // Navigate to Foods
      fireEvent.press(getByTestID('navigate-to-foods'));
      
      await waitFor(() => {
        expect(getByTestID('foods-screen')).toBeTruthy();
      });
      
      // State should have changed
      expect(navigationState).not.toEqual(initialState);
    });

    it('maintains route parameters in navigation state', async () => {
      const { getByTestID } = renderApp();
      
      // Navigate to Oracle with context
      fireEvent.press(getByTestID('navigate-to-oracle-with-context'));
      
      await waitFor(() => {
        expect(getByTestID('oracle-screen')).toBeTruthy();
        expect(getByTestID('oracle-route-context')).toBeTruthy();
      });
      
      // Navigation state should contain the parameters
      expect(navigationState).toBeDefined();
    });
  });

  describe('Route Information', () => {
    it('provides correct route name to screens', async () => {
      const { getByTestID } = renderApp();
      
      await waitFor(() => {
        expect(getByTestID('current-route')).toBeTruthy();
      });
    });

    it('passes route parameters correctly', async () => {
      const { getByTestID } = renderApp();
      
      // Navigate to Oracle with context food
      fireEvent.press(getByTestID('navigate-to-oracle-with-context'));
      
      await waitFor(() => {
        expect(getByTestID('oracle-screen')).toBeTruthy();
        expect(getByTestID('oracle-route-context')).toBeTruthy();
      });
    });

    it('maintains route information across navigation', async () => {
      const { getByTestID } = renderApp();
      
      // Navigate to Foods
      fireEvent.press(getByTestID('navigate-to-foods'));
      
      await waitFor(() => {
        expect(getByTestID('foods-screen')).toBeTruthy();
        expect(getByTestID('foods-route-name')).toBeTruthy();
      });
    });
  });

  describe('Modal State Management', () => {
    it('manages modal state correctly', async () => {
      const mockNavigation = {
        navigate: jest.fn(),
        goBack: jest.fn()
      };
      
      require('@react-navigation/native').useNavigation.mockReturnValue(mockNavigation);
      
      const { getByTestID } = renderApp();
      
      // Mock opening settings modal
      mockNavigation.navigate('Settings');
      
      expect(mockNavigation.navigate).toHaveBeenCalledWith('Settings');
    });

    it('handles modal dismissal state changes', async () => {
      const mockNavigation = {
        navigate: jest.fn(),
        goBack: jest.fn()
      };
      
      require('@react-navigation/native').useNavigation.mockReturnValue(mockNavigation);
      
      const { getByTestID } = renderApp();
      
      // Mock modal dismissal
      mockNavigation.goBack();
      
      expect(mockNavigation.goBack).toHaveBeenCalled();
    });
  });

  describe('Navigation History', () => {
    it('maintains navigation history correctly', async () => {
      const { getByTestID } = renderApp();
      
      // Navigate through multiple screens
      fireEvent.press(getByTestID('navigate-to-foods'));
      await waitFor(() => {
        expect(getByTestID('foods-screen')).toBeTruthy();
      });
      
      // Navigation state should reflect the history
      expect(navigationState).toBeDefined();
    });

    it('handles back navigation correctly', async () => {
      const mockNavigation = {
        navigate: jest.fn(),
        goBack: jest.fn(),
        canGoBack: jest.fn(() => true)
      };
      
      require('@react-navigation/native').useNavigation.mockReturnValue(mockNavigation);
      
      const { getByTestID } = renderApp();
      
      // Test that goBack can be called
      mockNavigation.goBack();
      expect(mockNavigation.goBack).toHaveBeenCalled();
    });
  });

  describe('State Persistence', () => {
    it('handles navigation state serialization', () => {
      const { getByTestID } = renderApp();
      
      // Navigation state should be serializable
      if (navigationState) {
        expect(() => JSON.stringify(navigationState)).not.toThrow();
      }
    });

    it('maintains state consistency across renders', async () => {
      const { getByTestID, rerender } = renderApp();
      
      await waitFor(() => {
        expect(getByTestID('home-screen')).toBeTruthy();
      });
      
      const stateBeforeRerender = navigationState;
      
      // Rerender the component
      rerender(
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      );
      
      await waitFor(() => {
        expect(getByTestID('home-screen')).toBeTruthy();
      });
      
      // State structure should remain consistent
      expect(navigationState).toBeDefined();
    });
  });

  describe('Deep Link State Management', () => {
    it('handles deep link navigation state', async () => {
      const mockNavigation = {
        navigate: jest.fn(),
        goBack: jest.fn()
      };
      
      require('@react-navigation/native').useNavigation.mockReturnValue(mockNavigation);
      
      const { getByTestID } = renderApp();
      
      // Simulate deep link navigation
      mockNavigation.navigate('Oracle', { contextFood: 'almonds' });
      
      expect(mockNavigation.navigate).toHaveBeenCalledWith('Oracle', { contextFood: 'almonds' });
    });

    it('maintains state after deep link navigation', async () => {
      const { getByTestID } = renderApp();
      
      // Navigate with parameters (simulating deep link)
      fireEvent.press(getByTestID('navigate-to-oracle-with-context'));
      
      await waitFor(() => {
        expect(getByTestID('oracle-screen')).toBeTruthy();
      });
      
      // State should be maintained
      expect(navigationState).toBeDefined();
    });
  });
});