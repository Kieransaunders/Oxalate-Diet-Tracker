import React from 'react';
import {
  View,
  Text,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMealStore } from '../state/mealStore';
import { useRecipeStore } from '../state/recipeStore';
import { cn } from '../utils/cn';

interface BottomNavigationProps {
  onChatPress: () => void;
  onTrackerPress: () => void;
  onRecipesPress: () => void;
  onFoodsPress?: () => void;
  activeTab?: 'foods' | 'chat' | 'tracker' | 'recipes';
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({
  onChatPress,
  onTrackerPress,
  onRecipesPress,
  onFoodsPress,
  activeTab = 'foods'
}) => {
  const insets = useSafeAreaInsets();
  const { currentDay } = useMealStore();
  const { recipes } = useRecipeStore();

  const navItems = [
    {
      id: 'foods',
      icon: 'list-outline',
      activeIcon: 'list',
      label: 'Foods',
      onPress: onFoodsPress || (() => {}), // Optional action for foods tab
    },
    {
      id: 'recipes',
      icon: 'restaurant-outline',
      activeIcon: 'restaurant',
      label: 'Recipes',
      onPress: onRecipesPress,
      badge: recipes.length > 0 ? recipes.length : undefined,
    },
    {
      id: 'chat',
      icon: 'chatbubble-ellipses-outline',
      activeIcon: 'chatbubble-ellipses',
      label: 'Oracle',
      onPress: onChatPress,
    },
    {
      id: 'tracker',
      icon: 'bar-chart-outline',
      activeIcon: 'bar-chart',
      label: 'Tracker',
      onPress: onTrackerPress,
      badge: currentDay.items.length > 0 ? currentDay.items.length : undefined,
    },
  ];

  const renderNavItem = (item: any) => {
    const isActive = activeTab === item.id;
    
    return (
      <Pressable
        key={item.id}
        onPress={item.onPress}
        className={cn(
          "flex-1 items-center justify-center py-3 active:opacity-50",
          isActive ? "opacity-100" : "opacity-70"
        )}
        style={{ 
          paddingBottom: Math.max(insets.bottom + 4, 12),
          paddingTop: 8,
        }}
      >
        <View className="relative items-center">
          <Ionicons
            name={isActive ? item.activeIcon : item.icon}
            size={24}
            color={isActive ? "#3b82f6" : "#6b7280"}
          />
          
          {/* Badge for tracker */}
          {item.badge && (
            <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-5 h-5 items-center justify-center">
              <Text className="text-white text-xs font-bold">
                {item.badge > 99 ? '99+' : item.badge}
              </Text>
            </View>
          )}
        </View>
        
        <Text
          className={cn(
            "text-xs font-medium mt-1",
            isActive ? "text-blue-600" : "text-gray-600"
          )}
        >
          {item.label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View className="bg-white border-t border-gray-200 shadow-lg" style={{ elevation: 8 }}>
      <View className="flex-row">
        {navItems.map(renderNavItem)}
      </View>
    </View>
  );
};

export default BottomNavigation;