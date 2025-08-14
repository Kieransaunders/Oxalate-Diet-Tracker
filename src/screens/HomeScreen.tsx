import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useMealStore } from '../state/mealStore';
import { useSubscriptionStore } from '../state/subscriptionStore';
import { cn } from '../utils/cn';
import { RootStackParamList } from '../navigation/types';
import ConsistentHeader from '../components/ConsistentHeader';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

interface HomeScreenProps {
  // No props needed - using navigation hooks directly
}

const HomeScreen: React.FC<HomeScreenProps> = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { currentDay } = useMealStore();
  const { status = 'free', getRemainingOracleQuestions, getRemainingRecipes } = useSubscriptionStore();
  
  const todaysMeals = currentDay?.items || [];
  const totalOxalate = currentDay?.totalOxalate || 0;
  
  const remainingQuestions = getRemainingOracleQuestions() || 0;
  const remainingRecipes = getRemainingRecipes() || 0;

  // Header configuration
  const headerActions = [
    {
      icon: 'settings-outline' as const,
      onPress: () => navigation.navigate('Settings'),
      testID: 'settings-button',
    },
  ];

  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });

  const quickActions = [
    {
      title: 'Browse Foods',
      subtitle: 'Search food with oxalate data',
      icon: 'restaurant-outline',
      color: '#10b981',
      onPress: () => navigation.navigate('Foods'),
    },
    {
      title: 'Meal Tracker',
      subtitle: `${todaysMeals?.length || 0} items logged today`,
      icon: 'clipboard-outline',
      color: '#3b82f6',
      onPress: () => navigation.navigate('Tracker'),
    },
    {
      title: 'AI Oracle',
      subtitle: status === 'premium' 
        ? `${remainingQuestions || 0} questions left today`
        : `${remainingQuestions || 0} questions left this month`,
      icon: 'chatbubble-ellipses-outline',
      color: '#8b5cf6',
      onPress: () => navigation.navigate('Oracle', {}),
    },
    {
      title: 'My Recipes',
      subtitle: status === 'premium' 
        ? `${remainingRecipes || 0} recipes left today`
        : `${remainingRecipes || 0} recipes left`,
      icon: 'book-outline',
      color: '#f59e0b',
      onPress: () => navigation.navigate('Recipes'),
    },
  ];

  const oxalateLevel = 
    totalOxalate <= 20 ? { level: 'Low', color: '#10b981', message: 'Great job staying low!' } :
    totalOxalate <= 40 ? { level: 'Medium', color: '#f59e0b', message: 'Moderate intake today' } :
    totalOxalate <= 100 ? { level: 'High', color: '#f97316', message: 'Watch your intake' } :
    { level: 'Very High', color: '#ef4444', message: 'Consider lower oxalate options' };

  return (
    <View className="flex-1 bg-white">
      <ConsistentHeader
        title="Oxalate Tracker"
        subtitle={currentDate}
        rightActions={headerActions}
        showBorder={true}
      />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Today's Summary */}
        <View className="mx-6 mb-6 bg-gray-50 rounded-xl p-4">
          <Text className="text-lg font-semibold text-gray-900 mb-3">Today's Summary</Text>
          
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-sm text-gray-600">Total Oxalate</Text>
              <Text className="text-2xl font-bold" style={{ color: oxalateLevel.color }}>
                {totalOxalate.toFixed(1)}mg
              </Text>
              <Text className="text-xs" style={{ color: oxalateLevel.color }}>
                {oxalateLevel.message}
              </Text>
            </View>
            
            <View className="flex-1 items-end">
              <View
                className="w-16 h-16 rounded-full items-center justify-center"
                style={{ backgroundColor: `${oxalateLevel.color}20` }}
              >
                <Text className="text-xs font-medium" style={{ color: oxalateLevel.color }}>
                  {oxalateLevel.level}
                </Text>
              </View>
            </View>
          </View>

          {todaysMeals.length > 0 && (
            <View className="mt-4 pt-4 border-t border-gray-200">
              <Text className="text-sm text-gray-600 mb-2">Recent items:</Text>
              {todaysMeals.slice(-2).map((item, index) => (
                <Text key={index} className="text-xs text-gray-500">
                  • {item.food.name} ({item.oxalateAmount.toFixed(1)}mg)
                </Text>
              ))}
            </View>
          )}
        </View>

        {/* Subscription Status */}
        {status === 'free' && (
          <View className="mx-6 mb-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-100">
            <View className="flex-row items-center mb-2">
              <Ionicons name="star-outline" size={20} color="#8b5cf6" />
              <Text className="text-base font-semibold text-purple-900 ml-2">Free Plan</Text>
            </View>
            <Text className="text-sm text-purple-700 mb-3">
              Upgrade to Premium for unlimited access to all features
            </Text>
            <View className="flex-row">
              <View className="flex-1">
                <Text className="text-xs text-purple-600">Oracle Questions</Text>
                <Text className="text-sm font-medium text-purple-800">
                  {remainingQuestions} left this month
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-xs text-purple-600">Recipes</Text>
                <Text className="text-sm font-medium text-purple-800">
                  {remainingRecipes} left
                </Text>
              </View>
            </View>
          </View>
        )}

        {status === 'premium' && (
          <View className="mx-6 mb-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
            <View className="flex-row items-center mb-2">
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              <Text className="text-base font-semibold text-green-900 ml-2">Premium Active</Text>
            </View>
            <Text className="text-sm text-green-700">
              Unlimited access to all features
            </Text>
          </View>
        )}

        {/* Quick Actions */}
        <View className="mx-6 mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</Text>
          
          <View className="space-y-3">
            {quickActions.map((action, index) => (
              <Pressable
                key={index}
                onPress={action.onPress}
                className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm active:scale-95"
                style={{ 
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                  elevation: 2,
                }}
              >
                <View className="flex-row items-center">
                  <View
                    className="w-12 h-12 rounded-full items-center justify-center mr-4"
                    style={{ backgroundColor: `${action.color}20` }}
                  >
                    <Ionicons name={action.icon as any} size={24} color={action.color} />
                  </View>
                  
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-gray-900">
                      {action.title}
                    </Text>
                    <Text className="text-sm text-gray-600 mt-1">
                      {action.subtitle}
                    </Text>
                  </View>
                  
                  <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Tips Section */}
        <View className="mx-6 mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Daily Tips</Text>
          
          <View className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <View className="flex-row items-start">
              <Ionicons name="bulb-outline" size={20} color="#3b82f6" />
              <View className="flex-1 ml-3">
                <Text className="text-blue-900 font-medium text-sm mb-1">
                  Low-Oxalate Tip of the Day
                </Text>
                <Text className="text-blue-700 text-sm leading-5">
                  {totalOxalate > 40 
                    ? "Try pairing high-oxalate foods with calcium-rich options to reduce absorption."
                    : totalOxalate > 0
                    ? "Great job keeping your oxalate intake moderate today!"
                    : "Start logging your meals to track your daily oxalate intake."
                  }
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
};

export default HomeScreen;