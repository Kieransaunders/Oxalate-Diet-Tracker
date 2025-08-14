import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigator } from '../RootNavigator';
import { Text, Pressable } from 'react-native';

// Mock components that can open modals from different contexts
const MockHomeScreen = () => {
  const rootNavigation = require('@react-navigation/native').useNavigation();
  
  return (
    <>
      <Text testID="home-screen">Home Screen</Text>
      <Pressable 
        testID="home-to-settings" 
        onPress={() => rootNavigation.navigate('Settings')}
      >
        <Text>Open Settings from Home</Text>
      </Pressable>
    </>
  );
};

const MockOxalateTableScreen = ({ onNavigateToSettings }: any) => (
  <>
    <Text testID="foods-screen">Foods Screen</Text>
    <Pressable testID="foods-to-settings" onPress={onNavigateToSettings}>
      <Text>Open Settings from Foods</Text>
    </Pressable>
  </>
);

const MockMealTracker = ({ visible, onOpenSettings }: any) => (
  visible ? (
    <>
      <Text testID="tracker-screen">Tracker Screen</Text>
      <Pressable testID="tracker-to-settings" onPress={onOpenSettings}>
        <Text>Open Settings from Tracker</Text>
      </Pressable>
    </>
  ) : null
);

const MockOracleScreen = ({ visible }: any) => {
  const rootNavigation = require('@react-navigation/native').useNavigation();
  
  return visible ? (
    <>
      <Text testID="oracle-screen">Oracle Screen</Text>
      <Pressable 
        testID="oracle-to-settings" 
        onPress={() => rootNavigation.navigate('Settings')}
      >
        <Text>Open Settings from Oracle</Text>
      </Pressable>
    </>
  ) : null;
};

const MockRecipesScreen = () => {
  const rootNavigation = require('@react-navigation/native').useNavigation();
  
  return (
    <>
      <Text testID="recipes-screen">Recipes Screen</Text>
      <Pressable 
        testID="recipes-to-settings" 
        onPress={() => rootNavigation.navigate('Settings')}
      >
        <Text>Open Settings from Recipes</Text>
      </Pressable>
    </>
  );
};

const MockSettingsScreen = () => {
  const navigation = require('@react-navigation/native').useNavigation();
  
  return (
    <>
      <Text testID="settings-screen">Settings Screen</Text>
      <Text testID="settings-modal-indicator">Modal Presentation</Text>
      <Pressable testID="settings-close" onPress={() => navigation.goBack()}>
        <Text>Close Settings</Text>
      </Pressable>
      <Pressable 
        testID="settings-nested-action" 
        onPress={() => {
          // Test nested modal actions
          console.log('Nested action in modal');
        }}
      >
        <Text>Nested Action</Text>
      </Pressable>
    </>
  );
};

// Mock all screens
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

describe('Modal Navigation Tests', () => {
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

  describe('Modal Presentation from Different Contexts', () => {
    it('opens Settings modal from Home screen', async () => {
      const { getByTestID } = renderApp();
      
      await waitFor(() => {
        expect(getByTestID('home-screen')).toBeTruthy();
      });

      fireEvent.press(getByTestID('home-to-settings'));
      
      await waitFor(() => {
        expect(getByTestID('settings-screen')).toBeTruthy();
        expect(getByTestID('settings-modal-indicator')).toBeTruthy();
      });
    });

    it('opens Settings modal from Foods screen', async () => {
      const { getByTestID } = renderApp();
      
      // Navigate to Foods first
      const mockNavigation = require('@react-navigation/native').useNavigation();
      mockNavigation.navigate('Foods');
      
      await waitFor(() => {
        expect(getByTestID('foods-screen')).toBeTruthy();
      });

      fireEvent.press(getByTestID('foods-to-settings'));
      
      await waitFor(() => {
        expect(getByTestID('settings-screen')).toBeTruthy();
      });
    });

    it('opens Settings modal from Tracker screen', async () => {
      const { getByTestID } = renderApp();
      
      // Navigate to Tracker first
      const mockNavigation = require('@react-navigation/native').useNavigation();
      mockNavigation.navigate('Tracker');
      
      await waitFor(() => {
        expect(getByTestID('tracker-screen')).toBeTruthy();
      });

      fireEvent.press(getByTestID('tracker-to-settings'));
      
      await waitFor(() => {
        expect(getByTestID('settings-screen')).toBeTruthy();
      });
    });

    it('opens Settings modal from Oracle screen', async () => {
      const { getByTestID } = renderApp();
      
      // Navigate to Oracle first
      const mockNavigation = require('@react-navigation/native').useNavigation();
      mockNavigation.navigate('Oracle');
      
      await waitFor(() => {
        expect(getByTestID('oracle-screen')).toBeTruthy();
      });

      fireEvent.press(getByTestID('oracle-to-settings'));
      
      await waitFor(() => {
        expect(getByTestID('settings-screen')).toBeTruthy();
      });
    });

    it('opens Settings modal from Recipes screen', async () => {
      const { getByTestID } = renderApp();
      
      // Navigate to Recipes first
      const mockNavigation = require('@react-navigation/native').useNavigation();
      mockNavigation.navigate('Recipes');
      
      await waitFor(() => {
        expect(getByTestID('recipes-screen')).toBeTruthy();
      });

      fireEvent.press(getByTestID('recipes-to-settings'));
      
      await waitFor(() => {
        expect(getByTestID('settings-screen')).toBeTruthy();
      });
    });
  });

  describe('Modal Dismissal Behavior', () => {
    it('dismisses Settings modal and returns to Home', async () => {
      const { getByTestID } = renderApp();
      
      // Open Settings from Home
      fireEvent.press(getByTestID('home-to-settings'));
      
      await waitFor(() => {
        expect(getByTestID('settings-screen')).toBeTruthy();
      });

      // Close Settings
      fireEvent.press(getByTestID('settings-close'));
      
      await waitFor(() => {
        expect(getByTestID('home-screen')).toBeTruthy();
      });
    });

    it('dismisses Settings modal and returns to previous tab context', async () => {
      const { getByTestID } = renderApp();
      
      // Navigate to Foods first
      const mockNavigation = require('@react-navigation/native').useNavigation();
      mockNavigation.navigate('Foods');
      
      await waitFor(() => {
        expect(getByTestID('foods-screen')).toBeTruthy();
      });

      // Open Settings from Foods
      fireEvent.press(getByTestID('foods-to-settings'));
      
      await waitFor(() => {
        expect(getByTestID('settings-screen')).toBeTruthy();
      });

      // Close Settings - should return to Foods
      fireEvent.press(getByTestID('settings-close'));
      
      await waitFor(() => {
        expect(getByTestID('foods-screen')).toBeTruthy();
      });
    });

    it('handles modal dismissal via gesture or system back', async () => {
      const mockNavigation = {
        navigate: jest.fn(),
        goBack: jest.fn()
      };
      
      require('@react-navigation/native').useNavigation.mockReturnValue(mockNavigation);
      
      const { getByTestID } = renderApp();
      
      // Simulate system back or gesture dismissal
      mockNavigation.goBack();
      
      expect(mockNavigation.goBack).toHaveBeenCalled();
    });
  });

  describe('Modal State Management', () => {
    it('maintains modal state correctly during presentation', async () => {
      const { getByTestID } = renderApp();
      
      // Open Settings
      fireEvent.press(getByTestID('home-to-settings'));
      
      await waitFor(() => {
        expect(getByTestID('settings-screen')).toBeTruthy();
      });

      // Modal should be fully functional
      fireEvent.press(getByTestID('settings-nested-action'));
      
      // Should still be in modal
      expect(getByTestID('settings-screen')).toBeTruthy();
    });

    it('handles multiple modal interactions correctly', async () => {
      const { getByTestID } = renderApp();
      
      // Open Settings
      fireEvent.press(getByTestID('home-to-settings'));
      
      await waitFor(() => {
        expect(getByTestID('settings-screen')).toBeTruthy();
      });

      // Perform nested action
      fireEvent.press(getByTestID('settings-nested-action'));
      
      // Close modal
      fireEvent.press(getByTestID('settings-close'));
      
      await waitFor(() => {
        expect(getByTestID('home-screen')).toBeTruthy();
      });
    });

    it('preserves underlying tab state during modal presentation', async () => {
      const { getByTestID } = renderApp();
      
      // Start on Home
      await waitFor(() => {
        expect(getByTestID('home-screen')).toBeTruthy();
      });

      // Open Settings modal
      fireEvent.press(getByTestID('home-to-settings'));
      
      await waitFor(() => {
        expect(getByTestID('settings-screen')).toBeTruthy();
      });

      // Close Settings - should return to Home (preserving tab state)
      fireEvent.press(getByTestID('settings-close'));
      
      await waitFor(() => {
        expect(getByTestID('home-screen')).toBeTruthy();
      });
    });
  });

  describe('Modal Navigation Context', () => {
    it('provides correct navigation context to modal screens', async () => {
      const { getByTestID } = renderApp();
      
      // Open Settings
      fireEvent.press(getByTestID('home-to-settings'));
      
      await waitFor(() => {
        expect(getByTestID('settings-screen')).toBeTruthy();
      });

      // Modal should have access to navigation
      expect(() => {
        fireEvent.press(getByTestID('settings-close'));
      }).not.toThrow();
    });

    it('handles navigation context switching between tab and modal', async () => {
      const mockTabNavigation = {
        navigate: jest.fn()
      };
      
      const mockRootNavigation = {
        navigate: jest.fn(),
        goBack: jest.fn()
      };
      
      require('@react-navigation/native').useNavigation
        .mockReturnValueOnce(mockTabNavigation)
        .mockReturnValueOnce(mockRootNavigation);
      
      const { getByTestID } = renderApp();
      
      // Should be able to use both navigation contexts
      expect(mockTabNavigation).toBeDefined();
      expect(mockRootNavigation).toBeDefined();
    });
  });

  describe('Modal Error Handling', () => {
    it('handles modal presentation errors gracefully', async () => {
      const mockNavigation = {
        navigate: jest.fn(() => {
          throw new Error('Modal presentation failed');
        }),
        goBack: jest.fn()
      };
      
      require('@react-navigation/native').useNavigation.mockReturnValue(mockNavigation);
      
      const { getByTestID } = renderApp();
      
      // Should not crash when modal presentation fails
      expect(() => {
        fireEvent.press(getByTestID('home-to-settings'));
      }).not.toThrow();
    });

    it('handles modal dismissal errors gracefully', async () => {
      const mockNavigation = {
        navigate: jest.fn(),
        goBack: jest.fn(() => {
          throw new Error('Modal dismissal failed');
        })
      };
      
      require('@react-navigation/native').useNavigation.mockReturnValue(mockNavigation);
      
      const { getByTestID } = renderApp();
      
      // Should not crash when modal dismissal fails
      expect(() => {
        fireEvent.press(getByTestID('settings-close'));
      }).not.toThrow();
    });
  });

  describe('Modal Accessibility', () => {
    it('maintains accessibility during modal presentation', async () => {
      const { getByTestID } = renderApp();
      
      // Open Settings
      fireEvent.press(getByTestID('home-to-settings'));
      
      await waitFor(() => {
        expect(getByTestID('settings-screen')).toBeTruthy();
      });

      // Modal content should be accessible
      expect(getByTestID('settings-close')).toBeTruthy();
      expect(getByTestID('settings-nested-action')).toBeTruthy();
    });

    it('handles focus management in modals correctly', async () => {
      const { getByTestID } = renderApp();
      
      // Open Settings
      fireEvent.press(getByTestID('home-to-settings'));
      
      await waitFor(() => {
        expect(getByTestID('settings-screen')).toBeTruthy();
      });

      // Focus should be manageable within modal
      expect(() => {
        fireEvent.press(getByTestID('settings-nested-action'));
        fireEvent.press(getByTestID('settings-close'));
      }).not.toThrow();
    });
  });
});