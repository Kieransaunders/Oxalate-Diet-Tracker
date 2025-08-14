import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigator } from '../RootNavigator';
import { Text, Pressable } from 'react-native';

// Create mock components that can trigger navigation
const MockHomeScreen = () => {
  const navigation = require('@react-navigation/native').useNavigation();
  const rootNavigation = require('@react-navigation/native').useNavigation();
  
  return (
    <>
      <Text testID="home-screen">Home Screen</Text>
      <Pressable 
        testID="navigate-to-foods" 
        onPress={() => navigation.navigate('Foods')}
      >
        <Text>Go to Foods</Text>
      </Pressable>
      <Pressable 
        testID="navigate-to-tracker" 
        onPress={() => navigation.navigate('Tracker')}
      >
        <Text>Go to Tracker</Text>
      </Pressable>
      <Pressable 
        testID="navigate-to-oracle" 
        onPress={() => navigation.navigate('Oracle')}
      >
        <Text>Go to Oracle</Text>
      </Pressable>
      <Pressable 
        testID="navigate-to-recipes" 
        onPress={() => navigation.navigate('Recipes')}
      >
        <Text>Go to Recipes</Text>
      </Pressable>
      <Pressable 
        testID="navigate-to-settings" 
        onPress={() => rootNavigation.navigate('Settings')}
      >
        <Text>Go to Settings</Text>
      </Pressable>
    </>
  );
};

const MockOxalateTableScreen = ({ onNavigateToHome, onNavigateToSettings }: any) => (
  <>
    <Text testID="foods-screen">Foods Screen</Text>
    <Pressable testID="foods-to-home" onPress={onNavigateToHome}>
      <Text>Back to Home</Text>
    </Pressable>
    <Pressable testID="foods-to-settings" onPress={onNavigateToSettings}>
      <Text>Open Settings</Text>
    </Pressable>
  </>
);

const MockMealTracker = ({ visible, onClose, onOpenSettings }: any) => (
  visible ? (
    <>
      <Text testID="tracker-screen">Tracker Screen</Text>
      <Pressable testID="tracker-close" onPress={onClose}>
        <Text>Close Tracker</Text>
      </Pressable>
      <Pressable testID="tracker-to-settings" onPress={onOpenSettings}>
        <Text>Open Settings</Text>
      </Pressable>
    </>
  ) : null
);

const MockOracleScreen = ({ visible, onClose, contextFood }: any) => (
  visible ? (
    <>
      <Text testID="oracle-screen">Oracle Screen</Text>
      {contextFood && <Text testID="oracle-context">{contextFood}</Text>}
      <Pressable testID="oracle-close" onPress={onClose}>
        <Text>Close Oracle</Text>
      </Pressable>
    </>
  ) : null
);

const MockRecipesScreen = ({ onClose, onNavigateToTracker }: any) => (
  <>
    <Text testID="recipes-screen">Recipes Screen</Text>
    <Pressable testID="recipes-close" onPress={onClose}>
      <Text>Close Recipes</Text>
    </Pressable>
    <Pressable testID="recipes-to-tracker" onPress={onNavigateToTracker}>
      <Text>Go to Tracker</Text>
    </Pressable>
  </>
);

const MockSettingsScreen = () => {
  const navigation = require('@react-navigation/native').useNavigation();
  
  return (
    <>
      <Text testID="settings-screen">Settings Screen</Text>
      <Pressable testID="settings-close" onPress={() => navigation.goBack()}>
        <Text>Close Settings</Text>
      </Pressable>
    </>
  );
};

// Mock all the screen components
jest.mock('../../screens/HomeScreen', () => MockHomeScreen);
jest.mock('../../screens/OxalateTableScreen', () => MockOxalateTableScreen);
jest.mock('../../components/MealTracker', () => MockMealTracker);
jest.mock('../../screens/OracleScreen', () => MockOracleScreen);
jest.mock('../../screens/RecipesScreen', () => MockRecipesScreen);
jest.mock('../../screens/SettingsScreen', () => MockSettingsScreen);

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

describe('Navigation Integration Tests', () => {
  const renderApp = () => {
    return render(
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Tab Navigation', () => {
    it('starts on Home screen', async () => {
      const { getByTestID } = renderApp();
      
      await waitFor(() => {
        expect(getByTestID('home-screen')).toBeTruthy();
      });
    });

    it('navigates between tabs correctly', async () => {
      const { getByTestID } = renderApp();
      
      // Start on Home
      await waitFor(() => {
        expect(getByTestID('home-screen')).toBeTruthy();
      });

      // Navigate to Foods
      fireEvent.press(getByTestID('navigate-to-foods'));
      await waitFor(() => {
        expect(getByTestID('foods-screen')).toBeTruthy();
      });

      // Navigate to Tracker
      fireEvent.press(getByTestID('navigate-to-tracker'));
      await waitFor(() => {
        expect(getByTestID('tracker-screen')).toBeTruthy();
      });

      // Navigate to Oracle
      fireEvent.press(getByTestID('navigate-to-oracle'));
      await waitFor(() => {
        expect(getByTestID('oracle-screen')).toBeTruthy();
      });

      // Navigate to Recipes
      fireEvent.press(getByTestID('navigate-to-recipes'));
      await waitFor(() => {
        expect(getByTestID('recipes-screen')).toBeTruthy();
      });
    });

    it('handles Oracle navigation with context food parameter', async () => {
      const { getByTestID } = renderApp();
      
      // Mock navigation with parameters
      const mockNavigate = jest.fn();
      require('@react-navigation/native').useNavigation.mockReturnValue({
        navigate: mockNavigate
      });

      fireEvent.press(getByTestID('navigate-to-oracle'));
      
      expect(mockNavigate).toHaveBeenCalledWith('Oracle');
    });
  });

  describe('Modal Navigation', () => {
    it('opens Settings modal from Home screen', async () => {
      const { getByTestID } = renderApp();
      
      await waitFor(() => {
        expect(getByTestID('home-screen')).toBeTruthy();
      });

      fireEvent.press(getByTestID('navigate-to-settings'));
      
      await waitFor(() => {
        expect(getByTestID('settings-screen')).toBeTruthy();
      });
    });

    it('closes Settings modal correctly', async () => {
      const { getByTestID } = renderApp();
      
      // Open settings
      fireEvent.press(getByTestID('navigate-to-settings'));
      await waitFor(() => {
        expect(getByTestID('settings-screen')).toBeTruthy();
      });

      // Close settings
      fireEvent.press(getByTestID('settings-close'));
      
      await waitFor(() => {
        expect(getByTestID('home-screen')).toBeTruthy();
      });
    });

    it('opens Settings modal from Foods screen', async () => {
      const { getByTestID } = renderApp();
      
      // Navigate to Foods first
      fireEvent.press(getByTestID('navigate-to-foods'));
      await waitFor(() => {
        expect(getByTestID('foods-screen')).toBeTruthy();
      });

      // Open Settings from Foods
      fireEvent.press(getByTestID('foods-to-settings'));
      
      await waitFor(() => {
        expect(getByTestID('settings-screen')).toBeTruthy();
      });
    });

    it('opens Settings modal from Tracker screen', async () => {
      const { getByTestID } = renderApp();
      
      // Navigate to Tracker first
      fireEvent.press(getByTestID('navigate-to-tracker'));
      await waitFor(() => {
        expect(getByTestID('tracker-screen')).toBeTruthy();
      });

      // Open Settings from Tracker
      fireEvent.press(getByTestID('tracker-to-settings'));
      
      await waitFor(() => {
        expect(getByTestID('settings-screen')).toBeTruthy();
      });
    });
  });

  describe('Screen Wrapper Navigation', () => {
    it('handles Tracker close navigation', async () => {
      const { getByTestID } = renderApp();
      
      // Navigate to Tracker
      fireEvent.press(getByTestID('navigate-to-tracker'));
      await waitFor(() => {
        expect(getByTestID('tracker-screen')).toBeTruthy();
      });

      // Close Tracker (should navigate to Home)
      fireEvent.press(getByTestID('tracker-close'));
      
      await waitFor(() => {
        expect(getByTestID('home-screen')).toBeTruthy();
      });
    });

    it('handles Oracle close navigation', async () => {
      const { getByTestID } = renderApp();
      
      // Navigate to Oracle
      fireEvent.press(getByTestID('navigate-to-oracle'));
      await waitFor(() => {
        expect(getByTestID('oracle-screen')).toBeTruthy();
      });

      // Close Oracle (should navigate to Home)
      fireEvent.press(getByTestID('oracle-close'));
      
      await waitFor(() => {
        expect(getByTestID('home-screen')).toBeTruthy();
      });
    });

    it('handles Recipes close navigation', async () => {
      const { getByTestID } = renderApp();
      
      // Navigate to Recipes
      fireEvent.press(getByTestID('navigate-to-recipes'));
      await waitFor(() => {
        expect(getByTestID('recipes-screen')).toBeTruthy();
      });

      // Close Recipes (should navigate to Home)
      fireEvent.press(getByTestID('recipes-close'));
      
      await waitFor(() => {
        expect(getByTestID('home-screen')).toBeTruthy();
      });
    });

    it('handles Recipes to Tracker navigation', async () => {
      const { getByTestID } = renderApp();
      
      // Navigate to Recipes
      fireEvent.press(getByTestID('navigate-to-recipes'));
      await waitFor(() => {
        expect(getByTestID('recipes-screen')).toBeTruthy();
      });

      // Navigate from Recipes to Tracker
      fireEvent.press(getByTestID('recipes-to-tracker'));
      
      await waitFor(() => {
        expect(getByTestID('tracker-screen')).toBeTruthy();
      });
    });

    it('handles Foods to Home navigation', async () => {
      const { getByTestID } = renderApp();
      
      // Navigate to Foods
      fireEvent.press(getByTestID('navigate-to-foods'));
      await waitFor(() => {
        expect(getByTestID('foods-screen')).toBeTruthy();
      });

      // Navigate from Foods to Home
      fireEvent.press(getByTestID('foods-to-home'));
      
      await waitFor(() => {
        expect(getByTestID('home-screen')).toBeTruthy();
      });
    });
  });
});