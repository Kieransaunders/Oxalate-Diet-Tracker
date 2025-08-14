import React from 'react';
import {
  View,
  Text,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
// Temporarily removed store imports to fix text rendering error
// import { useMealStore } from '../state/mealStore';
// import { useRecipeStore } from '../state/recipeStore';
// import { useSubscriptionStore } from '../state/subscriptionStore';
import { cn } from '../utils/cn';

interface BottomNavigationProps {
  onChatPress: () => void;
  onTrackerPress: () => void;
  onRecipesPress: () => void;
  onFoodsPress?: () => void;
  onHomePress?: () => void;
  activeTab?: 'home' | 'foods' | 'chat' | 'tracker' | 'recipes';
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({
  onChatPress,
  onTrackerPress,
  onRecipesPress,
  onFoodsPress,
  onHomePress,
  activeTab = 'foods'
}) => {
  const insets = useSafeAreaInsets();
  // Temporarily remove store access to fix text rendering error
  const currentDay = { items: [] };
  const recipes = [];
  // Temporarily remove store access to fix text rendering error
  const subscriptionStatus = 'free';

  const navItems = [
    {
      id: 'home',
      icon: 'home-outline',
      activeIcon: 'home',
      label: 'Home',
      onPress: onHomePress || (() => {}),
      isPremium: false,
    },
    {
      id: 'foods',
      icon: 'list-outline',
      activeIcon: 'list',
      label: 'Foods',
      onPress: onFoodsPress || (() => {}),
      isPremium: false, // Food database is always free
    },
    {
      id: 'recipes',
      icon: 'restaurant-outline',
      activeIcon: 'restaurant',
      label: 'Recipes',
      onPress: onRecipesPress,
      badge: undefined,
      usageText: undefined,
      isPremium: false,
    },
    {
      id: 'chat',
      icon: 'chatbubble-ellipses-outline',
      activeIcon: 'chatbubble-ellipses',
      label: 'Oracle',
      onPress: onChatPress,
      usageText: undefined,
      isPremium: false,
    },
    {
      id: 'tracker',
      icon: 'bar-chart-outline',
      activeIcon: 'bar-chart',
      label: 'Tracker',
      onPress: onTrackerPress,
      badge: undefined,
      usageText: undefined,
      isPremium: false,
    },
  ];

  const renderNavItem = (item: any) => {
    const isActive = activeTab === item.id;
    
    return (
      <Pressable
        key={item.id}
        onPress={item.onPress}
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: isActive ? 1 : 0.7,
          paddingBottom: Math.max(insets.bottom + 4, 12),
          paddingTop: 8,
        }}
      >
        <View style={{ position: 'relative', alignItems: 'center' }}>
          <Ionicons
            name={isActive ? item.activeIcon : item.icon}
            size={24}
            color={
              item.isPremium ? "#ef4444" : 
              isActive ? "#3b82f6" : "#6b7280"
            }
          />
          
          {/* Premium Lock Indicator */}
          {item.isPremium && (
            <View className="absolute -top-1 -right-1 bg-orange-500 rounded-full w-4 h-4 items-center justify-center">
              <Ionicons name="lock-closed" size={8} color="white" />
            </View>
          )}
          
          {/* Badge for counters */}
          {item.badge && item.badge > 0 && !item.isPremium && (
            <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-5 h-5 items-center justify-center">
              <Text className="text-white text-xs font-bold">
                {item.badge > 99 ? '99+' : String(item.badge)}
              </Text>
            </View>
          )}
        </View>
        
        <Text
          className={cn(
            "text-xs font-medium mt-1",
            item.isPremium ? "text-red-500" :
            isActive ? "text-blue-600" : "text-gray-600"
          )}
        >
          {item.label || ''}
        </Text>
        
        {/* Usage Text */}
        {item.usageText && item.usageText.length > 0 && !item.isPremium && (
          <Text className="text-xs text-gray-500 mt-0.5">
            {item.usageText}
          </Text>
        )}
        
        {/* Locked Text */}
        {item.isPremium && (
          <Text className="text-xs text-red-500 mt-0.5">
            Locked
          </Text>
        )}
      </Pressable>
    );
  };

  return (
    <View className="bg-white border-t border-gray-200 shadow-lg" style={{ elevation: 8 }}>
      <View className="flex-row">
        {navItems.map((item) => renderNavItem(item))}
      </View>
    </View>
  );
};

export default BottomNavigation;