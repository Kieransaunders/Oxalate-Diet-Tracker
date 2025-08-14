import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { StackNavigationProp } from '@react-navigation/stack';

// Import your screens
import HomeScreen from '../screens/HomeScreen';
import OxalateTableScreen from '../screens/OxalateTableScreen';
import MealTracker from '../components/MealTracker';
import OracleScreen from '../screens/OracleScreen';
import RecipesScreen from '../screens/RecipesScreen';

// Import types
import { MainTabParamList, RootStackParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Foods':
              iconName = focused ? 'list' : 'list-outline';
              break;
            case 'Tracker':
              iconName = focused ? 'bar-chart' : 'bar-chart-outline';
              break;
            case 'Oracle':
              iconName = focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
              break;
            case 'Recipes':
              iconName = focused ? 'restaurant' : 'restaurant-outline';
              break;
            default:
              iconName = 'circle-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : 8,
          height: Platform.OS === 'ios' ? 84 + insets.bottom : 64,
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ title: 'Home' }}
      />
      <Tab.Screen 
        name="Foods" 
        component={OxalateTableScreenWrapper}
        options={{ title: 'Foods' }}
      />
      <Tab.Screen 
        name="Tracker" 
        component={TrackerScreenWrapper}
        options={{ title: 'Tracker' }}
      />
      <Tab.Screen 
        name="Oracle" 
        component={OracleScreenWrapper}
        options={{ title: 'Oracle' }}
      />
      <Tab.Screen 
        name="Recipes" 
        component={RecipesScreenWrapper}
        options={{ title: 'Recipes' }}
      />
    </Tab.Navigator>
  );
}

// Wrapper components to handle navigation using React Navigation hooks

function OxalateTableScreenWrapper() {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const rootNavigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  
  return (
    <OxalateTableScreen
      onNavigateToHome={() => navigation.navigate('Home')}
      onNavigateToSettings={() => rootNavigation.navigate('Settings')}
    />
  );
}

function TrackerScreenWrapper() {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const rootNavigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  
  return (
    <MealTracker
      visible={true}
      onClose={() => {
        // Navigate back to Home when X button is pressed
        navigation.navigate('Home');
      }}
      onHome={() => {
        // Navigate back to Home when home button is pressed
        navigation.navigate('Home');
      }}
      onOpenSettings={() => {
        // Navigate to Settings modal using the root navigation
        rootNavigation.navigate('Settings');
      }}
    />
  );
}

// Tab-compatible Oracle screen wrapper
function OracleScreenWrapper({ route }: { route: any }) {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  
  return (
    <OracleScreen
      visible={true}
      isTabScreen={true}
      contextFood={route.params?.contextFood}
      onClose={() => {
        // Navigate back to Home when home button is pressed
        navigation.navigate('Home');
      }}
    />
  );
}

// Tab-compatible Recipes screen wrapper  
function RecipesScreenWrapper() {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  
  return (
    <RecipesScreen
      isTabScreen={true}
      onClose={() => {
        // Navigate back to Home when home button is pressed
        navigation.navigate('Home');
      }}
      onNavigateToTracker={() => {
        navigation.navigate('Tracker');
      }}
    />
  );
}
