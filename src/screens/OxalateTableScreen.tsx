import React, { useEffect } from 'react';
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
import { getCategoryColor } from '../api/oxalate-api';
import { cn } from '../utils/cn';
import type { OxalateCategory } from '../types/oxalate';

const OxalateTableScreen = () => {
  const insets = useSafeAreaInsets();
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
    const backgroundColor = getCategoryColor(food.category) + '15';
    const borderColor = getCategoryColor(food.category) + '30';
    
    return (
      <View
        key={food.id || index}
        className="flex-row items-center px-4 py-3 border-b"
        style={{ 
          backgroundColor,
          borderBottomColor: borderColor,
        }}
      >
        {/* Traffic Light Indicator */}
        <View
          className="w-3 h-3 rounded-full mr-3"
          style={{ backgroundColor: getCategoryColor(food.category) }}
        />
        
        {/* Food Name */}
        <View className="flex-1">
          <Text className="font-medium text-gray-900">{food.name}</Text>
          {food.group && (
            <Text className="text-sm text-gray-500">{food.group}</Text>
          )}
        </View>
        
        {/* Oxalate Amount */}
        <View className="items-end mr-4">
          <Text className="font-semibold text-gray-900">
            {food.oxalate_mg} mg
          </Text>
          <Text 
            className="text-xs font-medium"
            style={{ color: getCategoryColor(food.category) }}
          >
            {food.category}
          </Text>
        </View>
      </View>
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
        <Text className="text-2xl font-bold text-gray-900 mb-2">
          Low-Oxalate Foods
        </Text>
        <Text className="text-gray-600">
          Traffic-light system for oxalate content
        </Text>
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

      {/* Results Count */}
      <View className="px-4 py-2 bg-gray-50 border-b border-gray-200">
        <Text className="text-sm text-gray-600">
          {isLoading ? 'Loading...' : `${filteredFoods.length} foods found`}
        </Text>
      </View>

      {/* Table */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="text-gray-600 mt-2">Loading foods...</Text>
        </View>
      ) : (
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
    </View>
  );
};

export default OxalateTableScreen;