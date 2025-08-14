import React from 'react';
import { createStackNavigator, StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import HomeScreen from '../screens/HomeScreen';
import OxalateTableScreen from '../screens/OxalateTableScreen';
import MealTrackerScreen from '../screens/MealTrackerScreen';
import OracleScreen from '../screens/OracleScreen';
import RecipesScreen from '../screens/RecipesScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { RootStackParamList } from './types';

const Stack = createStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
      }}
    >
      {/* Home screen - the main entry point */}
      <Stack.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          headerShown: false,
        }}
      />
      
      {/* Foods screen */}
      <Stack.Screen 
        name="Foods" 
        component={OxalateTableScreenWrapper}
        options={{
          headerShown: false,
        }}
      />
      
      {/* Tracker screen */}
      <Stack.Screen 
        name="Tracker" 
        component={TrackerScreenWrapper}
        options={{
          headerShown: false,
        }}
      />
      
      {/* Oracle screen */}
      <Stack.Screen 
        name="Oracle" 
        component={OracleScreenWrapper}
        options={{
          headerShown: false,
        }}
      />
      
      {/* Recipes screen */}
      <Stack.Screen 
        name="Recipes" 
        component={RecipesScreenWrapper}
        options={{
          headerShown: false,
        }}
      />
      
      {/* Settings modal */}
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          presentation: 'modal',
          headerShown: false,
          gestureEnabled: true,
          animationEnabled: true,
          cardStyle: { backgroundColor: 'transparent' },
          cardOverlayEnabled: true,
          cardStyleInterpolator: ({ current, layouts }) => ({
            cardStyle: {
              transform: [
                {
                  translateY: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [layouts.screen.height, 0],
                  }),
                },
              ],
            },
            overlayStyle: {
              opacity: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.5],
              }),
            },
          }),
        }}
      />
    </Stack.Navigator>
  );
}

// Wrapper components to handle navigation using React Navigation hooks

function OxalateTableScreenWrapper() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  
  return (
    <OxalateTableScreen
      onNavigateToHome={() => navigation.navigate('Home')}
      onNavigateToSettings={() => navigation.navigate('Settings')}
      onNavigateToTracker={() => navigation.navigate('Tracker')}
    />
  );
}

function TrackerScreenWrapper() {
  return <MealTrackerScreen />;
}

function OracleScreenWrapper({ route }: { route: any }) {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  
  return (
    <OracleScreen
      visible={true}
      isTabScreen={false}  // Changed to false so it shows back button
      contextFood={route.params?.contextFood}
      onClose={() => navigation.goBack()}  // Use goBack() for better navigation
    />
  );
}

function RecipesScreenWrapper() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  
  return (
    <RecipesScreen
      isTabScreen={true}
      onClose={() => navigation.navigate('Home')}
      onNavigateToTracker={() => navigation.navigate('Tracker')}
    />
  );
}

