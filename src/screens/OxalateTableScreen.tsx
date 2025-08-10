import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useOxalateStore } from '../state/oxalateStore';
import { useMealStore } from '../state/mealStore';
import { getCategoryColor, getCategoryBackgroundColor, getCategoryBorderColor } from '../api/oxalate-api';
import { cn } from '../utils/cn';
import NutritionModal from '../components/NutritionModal';
import MealTracker from '../components/MealTracker';
import type { OxalateCategory, OxalateFoodItem } from '../types/oxalate';

const OxalateTableScreen = () => {
  const insets = useSafeAreaInsets();
  const [selectedFood, setSelectedFood] = useState<OxalateFoodItem | null>(null);
  const [showNutritionModal, setShowNutritionModal] = useState(false);
  const [showMealTracker, setShowMealTracker] = useState(false);
  const [groupByCategory, setGroupByCategory] = useState(false);
  
  const {
    filteredFoods,
    filters,
    isLoading,
    error,
    fetchFoods,
    setSearch,
    toggleCategory,
    setSorting,
  } = useOxalateStore();

  const { addMealItem, currentDay } = useMealStore();

  const openNutritionModal = (food: OxalateFoodItem) => {
    setSelectedFood(food);
    setShowNutritionModal(true);
  };

  const closeNutritionModal = () => {
    setShowNutritionModal(false);
    setSelectedFood(null);
  };

  const handleAddToMeal = (food: OxalateFoodItem, portion: number, oxalateAmount: number) => {
    addMealItem(food, portion, oxalateAmount);
    // Show a brief success feedback
    Alert.alert('Added to Meal', `${food.name} added to your daily tracker!`, [
      { text: 'View Tracker', onPress: () => setShowMealTracker(true) },
      { text: 'OK' }
    ]);
  };

  useEffect(() => {
    fetchFoods();
  }, [fetchFoods]);

  const categories: OxalateCategory[] = ['Low', 'Medium', 'High', 'Very High'];

  const getCategoryIcon = (category: OxalateCategory) => {
    switch (category) {
      case 'Low': return 'checkmark-circle';
      case 'Medium': return 'warning';
      case 'High': return 'alert-circle';
      case 'Very High': return 'close-circle';
    }
  };

  const getFoodGroupIcon = (group: string) => {
    switch (group) {
      case 'Fruits': return '🍎';
      case 'Vegetables': return '🥕';
      case 'Leafy Greens': return '🥬';
      case 'Nuts & Seeds': return '🥜';
      case 'Grains': return '🌾';
      case 'Meat & Fish': return '🐟';
      case 'Dairy Alternatives': return '🥛';
      case 'Legumes': return '🫘';
      case 'Beverages': return '🫖';
      case 'Sweets': return '🍫';
      default: return '🍽️';
    }
  };

  // Group foods by category for grouped view
  const groupedFoods = React.useMemo(() => {
    if (!groupByCategory) return null;
    
    const groups: Record<string, OxalateFoodItem[]> = {};
    filteredFoods.forEach(food => {
      const group = food.group || 'Other';
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(food);
    });
    
    // Sort groups by average oxalate content (lowest first)
    return Object.entries(groups)
      .map(([groupName, foods]) => ({
        name: groupName,
        foods: foods.sort((a, b) => a.oxalate_mg - b.oxalate_mg),
        avgOxalate: foods.reduce((sum, food) => sum + food.oxalate_mg, 0) / foods.length,
      }))
      .sort((a, b) => a.avgOxalate - b.avgOxalate);
  }, [filteredFoods, groupByCategory]);

  const getSortIcon = (column: 'name' | 'oxalate' | 'category') => {
    if (filters.sortBy !== column) return 'swap-vertical';
    return filters.sortDirection === 'asc' ? 'chevron-up' : 'chevron-down';
  };

  const renderCategoryFilter = (category: OxalateCategory) => {
    const isSelected = filters.selectedCategories.includes(category);
    const color = getCategoryColor(category);
    
    return (
      <Pressable
        key={category}
        onPress={() => toggleCategory(category)}
        className={cn(
          "flex-row items-center px-3 py-2 rounded-lg mr-2 mb-2",
          isSelected ? "opacity-100" : "opacity-40"
        )}
        style={{ backgroundColor: isSelected ? color + '20' : '#f3f4f6' }}
      >
        <Ionicons
          name={getCategoryIcon(category)}
          size={16}
          color={color}
          style={{ marginRight: 6 }}
        />
        <Text 
          className="text-sm font-medium"
          style={{ color: isSelected ? color : '#6b7280' }}
        >
          {category}
        </Text>
      </Pressable>
    );
  };

  const renderFoodRow = (food: any, index: number) => {
    const backgroundColor = getCategoryBackgroundColor(food.category);
    const borderColor = getCategoryBorderColor(food.category);
    
    return (
      <Pressable
        key={food.id || index}
        onPress={() => openNutritionModal(food)}
        className="flex-row items-center px-4 py-4 border-b active:opacity-70"
        style={{ 
          backgroundColor,
          borderBottomColor: borderColor,
          borderBottomWidth: 1,
        }}
      >
        {/* Traffic Light Indicator */}
        <View
          className="w-4 h-4 rounded-full mr-4 shadow-sm"
          style={{ 
            backgroundColor: getCategoryColor(food.category),
            elevation: 2,
          }}
        />
        
        {/* Food Info */}
        <View className="flex-1">
          <View className="flex-row items-center">
            <Text className="font-semibold text-gray-900 text-base">{food.name}</Text>
            <Pressable 
              onPress={() => openNutritionModal(food)}
              className="ml-2 p-1"
            >
              <Ionicons name="information-circle-outline" size={16} color="#6b7280" />
            </Pressable>
          </View>
          {food.group && (
            <Text className="text-sm text-gray-600 mt-0.5">{food.group}</Text>
          )}
          {food.serving_size && (
            <Text className="text-xs text-gray-500 mt-1">
              Serving: {food.serving_size}
            </Text>
          )}
          {food.calories && (
            <Text className="text-xs text-gray-500">
              {food.calories} cal{food.protein_g ? ` • ${food.protein_g}g protein` : ''}{food.fiber_g ? ` • ${food.fiber_g}g fiber` : ''}
            </Text>
          )}
        </View>
        
        {/* Oxalate Amount - More Prominent */}
        <View className="items-end ml-3">
          <Text 
            className="font-bold text-lg"
            style={{ color: getCategoryColor(food.category) }}
          >
            {food.oxalate_mg} mg
          </Text>
          <Text 
            className="text-xs font-semibold px-2 py-1 rounded-full text-white"
            style={{ 
              backgroundColor: getCategoryColor(food.category),
            }}
          >
            {food.category}
          </Text>
        </View>
        
        {/* Arrow indicator */}
        <Ionicons name="chevron-forward" size={16} color="#d1d5db" style={{ marginLeft: 8 }} />
      </Pressable>
    );
  };

  const renderHeader = () => (
    <View className="bg-gray-50 px-4 py-3 border-b border-gray-200">
      <View className="flex-row items-center justify-between">
        {/* Name Column Header */}
        <Pressable
          className="flex-1 flex-row items-center"
          onPress={() => setSorting('name')}
        >
          <Text className="font-semibold text-gray-700">Food Name</Text>
          <Ionicons
            name={getSortIcon('name')}
            size={16}
            color="#6b7280"
            style={{ marginLeft: 4 }}
          />
        </Pressable>
        
        {/* Oxalate Column Header */}
        <Pressable
          className="flex-row items-center mr-4"
          onPress={() => setSorting('oxalate')}
        >
          <Text className="font-semibold text-gray-700">Oxalate</Text>
          <Ionicons
            name={getSortIcon('oxalate')}
            size={16}
            color="#6b7280"
            style={{ marginLeft: 4 }}
          />
        </Pressable>
      </View>
    </View>
  );

  if (error) {
    return (
      <View className="flex-1 items-center justify-center px-4">
        <Ionicons name="warning" size={48} color="#ef4444" />
        <Text className="text-lg font-semibold text-gray-900 mt-4 text-center">
          Unable to load data
        </Text>
        <Text className="text-gray-600 mt-2 text-center">
          {error}
        </Text>
        <Pressable
          onPress={fetchFoods}
          className="bg-blue-500 px-6 py-3 rounded-lg mt-4"
        >
          <Text className="text-white font-semibold">Try Again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="bg-white px-4 py-6 border-b border-gray-200">
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            <Text className="text-2xl font-bold text-gray-900 mb-2">
              Low-Oxalate Foods
            </Text>
            <Text className="text-gray-600">
              Traffic-light system for oxalate content
            </Text>
          </View>
          
          {/* Daily Tracker Button */}
          <Pressable
            onPress={() => setShowMealTracker(true)}
            className="bg-blue-500 px-4 py-2 rounded-lg flex-row items-center"
          >
            <Ionicons name="restaurant" size={16} color="white" />
            <Text className="text-white font-semibold ml-2">Tracker</Text>
            {currentDay.items.length > 0 && (
              <View className="bg-white rounded-full w-5 h-5 items-center justify-center ml-2">
                <Text className="text-blue-500 text-xs font-bold">
                  {currentDay.items.length}
                </Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      {/* Search Bar */}
      <View className="px-4 py-3 bg-white border-b border-gray-200">
        <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
          <Ionicons name="search" size={20} color="#6b7280" />
          <TextInput
            className="flex-1 ml-2 text-gray-900"
            placeholder="Search foods or groups..."
            value={filters.search}
            onChangeText={setSearch}
            onSubmitEditing={Keyboard.dismiss}
          />
          {filters.search ? (
            <Pressable onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={20} color="#6b7280" />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Category Filters */}
      <View className="px-4 py-3 bg-white border-b border-gray-200">
        <Text className="text-sm font-medium text-gray-700 mb-2">
          Filter by category:
        </Text>
        <View className="flex-row flex-wrap">
          {categories.map(renderCategoryFilter)}
        </View>
      </View>

      {/* View Toggle & Results Count */}
      <View className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex-row items-center justify-between">
        <Text className="text-sm text-gray-600">
          {isLoading ? 'Loading...' : `${filteredFoods.length} foods found`}
        </Text>
        
        <Pressable
          onPress={() => setGroupByCategory(!groupByCategory)}
          className="flex-row items-center bg-white px-3 py-1 rounded-lg border border-gray-200"
        >
          <Ionicons 
            name={groupByCategory ? "list" : "albums"} 
            size={16} 
            color="#6b7280" 
          />
          <Text className="text-gray-700 text-sm ml-1 font-medium">
            {groupByCategory ? 'List View' : 'Group View'}
          </Text>
        </Pressable>
      </View>

      {/* Table */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="text-gray-600 mt-2">Loading foods...</Text>
        </View>
      ) : groupByCategory ? (
        // Grouped View
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {groupedFoods?.map((group) => (
            <View key={group.name} className="mb-4">
              {/* Group Header */}
              <View className="bg-gray-100 px-4 py-3 border-b border-gray-200">
                <View className="flex-row items-center">
                  <Text className="text-2xl mr-3">{getFoodGroupIcon(group.name)}</Text>
                  <View className="flex-1">
                    <Text className="font-bold text-gray-900 text-lg">{group.name}</Text>
                    <Text className="text-gray-600 text-sm">
                      {group.foods.length} foods • Avg: {group.avgOxalate.toFixed(1)} mg oxalate
                    </Text>
                  </View>
                </View>
              </View>
              
              {/* Group Foods */}
              {group.foods.map((food, index) => renderFoodRow(food, index))}
            </View>
          ))}
          
          {(!groupedFoods || groupedFoods.length === 0) && (
            <View className="items-center justify-center py-12">
              <Ionicons name="search" size={48} color="#d1d5db" />
              <Text className="text-lg text-gray-500 mt-2">No foods found</Text>
              <Text className="text-gray-400 mt-1 text-center px-4">
                Try adjusting your search or category filters
              </Text>
            </View>
          )}
        </ScrollView>
      ) : (
        // List View
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {renderHeader()}
          {filteredFoods.map(renderFoodRow)}
          
          {filteredFoods.length === 0 && !isLoading && (
            <View className="items-center justify-center py-12">
              <Ionicons name="search" size={48} color="#d1d5db" />
              <Text className="text-lg text-gray-500 mt-2">No foods found</Text>
              <Text className="text-gray-400 mt-1 text-center px-4">
                Try adjusting your search or category filters
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Nutrition Modal */}
      <NutritionModal
        food={selectedFood}
        visible={showNutritionModal}
        onClose={closeNutritionModal}
        onAddToMeal={handleAddToMeal}
      />

      {/* Meal Tracker Modal */}
      <MealTracker
        visible={showMealTracker}
        onClose={() => setShowMealTracker(false)}
      />
    </View>
  );
};

export default OxalateTableScreen;