import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Keyboard,
  Modal,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useOxalateStore } from '../state/oxalateStore';
import { useMealStore } from '../state/mealStore';
import { useOracleStore } from '../state/oracleStore';
import { useUserPreferencesStore } from '../state/userPreferencesStore';
import { useSubscriptionStore } from '../state/subscriptionStore';
import { getCategoryColor, getCategoryBackgroundColor, getCategoryBorderColor } from '../api/oxalate-api';
import { cn } from '../utils/cn';
import NutritionModal from '../components/NutritionModal';
import MealTracker from '../components/MealTracker';
import DailyProgressBar from '../components/DailyProgressBar';
import OracleScreen from './OracleScreen';
import BottomNavigation from '../components/BottomNavigation';
import RecipesScreen from './RecipesScreen';
import SettingsScreen from './SettingsScreen';
import PaywallModal from '../components/PaywallModal';
import type { OxalateCategory, OxalateFoodItem } from '../types/oxalate';
import type { DietType } from '../types/userPreferences';

const OxalateTableScreen = () => {
  const insets = useSafeAreaInsets();
  const [selectedFood, setSelectedFood] = useState<OxalateFoodItem | null>(null);
  const [showNutritionModal, setShowNutritionModal] = useState(false);
  const [showMealTracker, setShowMealTracker] = useState(false);
  const [showOracle, setShowOracle] = useState(false);
  const [showRecipes, setShowRecipes] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [oracleContextFood, setOracleContextFood] = useState<string | undefined>(undefined);
  const [groupByCategory, setGroupByCategory] = useState(false);
  const [showRecommendedOnly, setShowRecommendedOnly] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  
  const {
    foods,
    filteredFoods,
    filters,
    isLoading,
    error,
    fetchFoods,
    setSearch,
    toggleCategory,
    setSorting,

    isOnline,
  } = useOxalateStore();

  const { addMealItem, currentDay } = useMealStore();
  const { clearChat } = useOracleStore();
  const { userPreferences } = useUserPreferencesStore();
  const { startTracking, incrementTrackingDay } = useSubscriptionStore();

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
    // Close nutrition modal first
    setShowNutritionModal(false);
    setSelectedFood(null);
    
    // Show a brief success feedback
    Alert.alert('Added to Meal', `${food.name} added to your daily tracker!`, [
      { 
        text: 'View Tracker', 
        onPress: () => {
          setTimeout(() => setShowMealTracker(true), 100);
        }
      },
      { 
        text: 'Ask Oracle', 
        onPress: () => {
          setTimeout(() => {
            setOracleContextFood(food.name);
            setShowOracle(true);
          }, 100);
        }
      },
      { text: 'OK' }
    ]);
  };

  const openOracleForFood = (foodName: string) => {
    clearChat(); // Clear the chat window when opening Oracle
    setOracleContextFood(foodName);
    setShowOracle(true);
  };

  const handleFoodsTabPress = () => {
    // Scroll to top when Foods tab is tapped
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleRecipeSaved = () => {
    // Show a brief confirmation and optionally open recipes
    Alert.alert('Recipe Saved!', 'Your recipe has been saved successfully.', [
      { text: 'OK' },
      { text: 'View Recipes', onPress: () => setShowRecipes(true) },
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

  // Diet-aware helper functions
  const getFoodRecommendationStatus = (food: OxalateFoodItem) => {
    const { dietType } = userPreferences;
    const oxalateLevel = food.oxalate_mg;
    
    switch (dietType) {
      case 'low-oxalate':
        if (oxalateLevel <= 5) return 'excellent';
        if (oxalateLevel <= 10) return 'good';
        if (oxalateLevel <= 20) return 'moderate';
        return 'avoid';
      
      case 'moderate-oxalate':
        if (oxalateLevel <= 10) return 'excellent';
        if (oxalateLevel <= 25) return 'good';
        if (oxalateLevel <= 50) return 'moderate';
        return 'caution';
      
      case 'high-oxalate':
        if (oxalateLevel >= 40) return 'excellent'; // Very High oxalate - most nutrient-dense
        if (oxalateLevel >= 20) return 'good';      // High oxalate - good nutrition
        if (oxalateLevel >= 10) return 'moderate';  // Medium oxalate - okay choice
        return 'low-priority'; // Low oxalate foods are fine but not the focus
      
      case 'unrestricted':
        return 'good'; // All foods are fine
      
      default:
        return 'good';
    }
  };

  const getDietRecommendationBadge = (food: OxalateFoodItem) => {
    const status = getFoodRecommendationStatus(food);
    const { dietType } = userPreferences;
    
    switch (status) {
      case 'excellent':
        return {
          show: true,
          text: dietType === 'high-oxalate' ? 'Nutrient Dense' : 'Perfect Choice',
          icon: 'star' as const,
          color: '#16a34a', // green
          bgColor: '#dcfce7',
        };
      case 'good':
        return {
          show: dietType === 'low-oxalate' || dietType === 'moderate-oxalate',
          text: 'Good Choice',
          icon: 'thumbs-up' as const,
          color: '#2563eb', // blue
          bgColor: '#dbeafe',
        };
      case 'moderate':
        return {
          show: dietType === 'low-oxalate',
          text: 'Use Sparingly',
          icon: 'warning' as const,
          color: '#d97706', // amber
          bgColor: '#fef3c7',
        };
      case 'avoid':
        return {
          show: true,
          text: 'Avoid',
          icon: 'close-circle' as const,
          color: '#dc2626', // red
          bgColor: '#fee2e2',
        };
      case 'caution':
        return {
          show: true,
          text: 'Use Caution',
          icon: 'alert-circle' as const,
          color: '#ea580c', // orange
          bgColor: '#ffedd5',
        };
      case 'low-priority':
        return {
          show: false, // Don't show badge for low-priority items in high-oxalate diets
          text: 'Lower Priority',
          icon: 'remove-circle' as const,
          color: '#9ca3af', // gray
          bgColor: '#f9fafb',
        };
      default:
        return { show: false, text: '', icon: 'star' as const, color: '#6b7280', bgColor: '#f3f4f6' };
    }
  };

  const getDietAwareMessage = () => {
    const { dietType } = userPreferences;
    
    switch (dietType) {
      case 'low-oxalate':
        return 'Foods marked with ⭐ are excellent for kidney stone prevention';
      case 'moderate-oxalate':
        return 'Balanced approach - focus on foods marked ⭐ and 👍';
      case 'high-oxalate':
        return 'Enjoy nutrient-dense foods ⭐ with proper preparation methods';
      case 'unrestricted':
        return 'Browse all foods - oxalate content shown for educational purposes';
      default:
        return '';
    }
  };

  // Get recommended foods based on user's diet type and filter state
  const recommendedFoods = React.useMemo(() => {
    if (!showRecommendedOnly) {
      return filteredFoods;
    }
    
    // When showing recommended foods, start with all foods and apply search + recommendation filters
    let foodsToFilter = foods;
    
    // Apply search filter if there is one
    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase().trim();
      foodsToFilter = foodsToFilter.filter((food) =>
        food.name.toLowerCase().includes(searchTerm) ||
        (food.group && food.group.toLowerCase().includes(searchTerm))
      );
    }
    
    // Apply recommendation filter based on diet type
    const recommendedFoods = foodsToFilter.filter((food) => {
      const status = getFoodRecommendationStatus(food);
      
      if (userPreferences.dietType === 'high-oxalate') {
        // For high-oxalate diets, show excellent, good, and moderate foods (prioritize higher oxalate)
        return status === 'excellent' || status === 'good' || status === 'moderate';
      } else {
        // For other diets, show excellent and good foods
        return status === 'excellent' || status === 'good';
      }
    });

    // Sort high-oxalate diet foods by oxalate content (highest first)
    if (userPreferences.dietType === 'high-oxalate') {
      return recommendedFoods.sort((a, b) => b.oxalate_mg - a.oxalate_mg);
    }

    return recommendedFoods;
  }, [foods, filteredFoods, showRecommendedOnly, userPreferences.dietType, filters.search]);

  // Group foods by category for grouped view
  const groupedFoods = React.useMemo(() => {
    if (!groupByCategory) return null;
    
    const groups: Record<string, OxalateFoodItem[]> = {};
    recommendedFoods.forEach(food => {
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
  }, [recommendedFoods, groupByCategory]);

  const getSortIcon = (column: 'name' | 'oxalate' | 'category') => {
    if (filters.sortBy !== column) return 'swap-vertical';
    return filters.sortDirection === 'asc' ? 'chevron-up' : 'chevron-down';
  };

  const renderCategoryFilter = (category: OxalateCategory) => {
    const isSelected = filters.selectedCategories.includes(category);
    const color = getCategoryColor(category);
    const isDisabled = showRecommendedOnly;
    
    return (
      <Pressable
        key={category}
        onPress={isDisabled ? undefined : () => toggleCategory(category)}
        disabled={isDisabled}
        className={cn(
          "flex-row items-center px-2.5 py-1.5 rounded-lg mr-2 mb-1.5",
          isDisabled ? "opacity-30" : (isSelected ? "opacity-100" : "opacity-40")
        )}
        style={{ backgroundColor: isSelected && !isDisabled ? color + '20' : '#f3f4f6' }}
      >
        <Ionicons
          name={getCategoryIcon(category)}
          size={14}
          color={isDisabled ? '#d1d5db' : color}
          style={{ marginRight: 4 }}
        />
        <Text 
          className="text-xs font-medium"
          style={{ color: isDisabled ? '#d1d5db' : (isSelected ? color : '#6b7280') }}
        >
          {category}
        </Text>
      </Pressable>
    );
  };

  const renderFoodRow = (food: any, index: number | string) => {
    const backgroundColor = getCategoryBackgroundColor(food.category);
    const borderColor = getCategoryBorderColor(food.category);
    const recommendationBadge = getDietRecommendationBadge(food);
    
    return (
      <Pressable
        onPress={() => openNutritionModal(food)}
        className="flex-row items-center px-4 py-3 border-b active:opacity-70"
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
        
        {/* Food Info - Fixed width to prevent pushing */}
        <View className="flex-1 mr-3">
          <View className="flex-row items-start">
            <View className="flex-1 mr-2">
              <View className="flex-row items-center flex-wrap">
                <Text 
                  className="font-semibold text-gray-900 text-base"
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {food.name}
                </Text>
                {recommendationBadge.show && (
                  <View 
                    className="ml-2 px-2 py-0.5 rounded-full flex-row items-center"
                    style={{ backgroundColor: recommendationBadge.bgColor }}
                  >
                    <Ionicons 
                      name={recommendationBadge.icon} 
                      size={10} 
                      color={recommendationBadge.color} 
                    />
                    <Text 
                      className="text-xs font-medium ml-1"
                      style={{ color: recommendationBadge.color }}
                    >
                      {recommendationBadge.text}
                    </Text>
                  </View>
                )}
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
            
            {/* Action Icons - Fixed position */}
            <View className="flex-row items-center">
              <Pressable 
                onPress={() => openNutritionModal(food)}
                className="p-1 mr-1"
              >
                <Ionicons name="information-circle-outline" size={16} color="#6b7280" />
              </Pressable>
              <Pressable 
                onPress={() => openOracleForFood(food.name)}
                className="p-1"
              >
                <Ionicons name="chatbubble-outline" size={14} color="#10b981" />
              </Pressable>
            </View>
          </View>
        </View>
        
        {/* Oxalate Amount - Fixed width */}
        <View className="items-end" style={{ minWidth: 80 }}>
          <Text 
            className="font-bold text-lg"
            style={{ color: getCategoryColor(food.category) }}
          >
            {food.oxalate_mg} mg
          </Text>
          <Text 
            className="text-xs font-semibold px-2 py-1 rounded-full text-white text-center"
            style={{ 
              backgroundColor: getCategoryColor(food.category),
              minWidth: 60,
            }}
          >
            {food.category}
          </Text>
        </View>
        
        {/* Arrow indicator - Fixed position */}
        <View style={{ width: 24, alignItems: 'center' }}>
          <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
        </View>
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

  // Remove error display since we gracefully fall back to mock data
  // if (error) { ... }

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="bg-white px-4 py-6 border-b border-gray-200">
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-1">
            <Text className="text-2xl font-bold text-gray-900">
              {userPreferences.dietType === 'low-oxalate' ? 'Low-Oxalate Foods' :
               userPreferences.dietType === 'moderate-oxalate' ? 'Balanced Oxalate Foods' :
               userPreferences.dietType === 'high-oxalate' ? 'Nutrient-Dense Foods' :
               'Food Database'}
            </Text>
          </View>
          <Pressable
            onPress={() => setShowSettings(true)}
            className="w-10 h-10 items-center justify-center rounded-full bg-gray-100 ml-4"
          >
            <Ionicons name="settings-outline" size={20} color="#374151" />
          </Pressable>
        </View>
      </View>

      {/* Daily Progress Bar */}
      <DailyProgressBar
        onOpenTracker={() => setShowMealTracker(true)}
      />

      {/* Search Bar */}
      <View className="px-4 py-2 bg-white border-b border-gray-200">
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


      {/* Category Filters - only show when not using recommended filter */}
      {!showRecommendedOnly && (
        <View className="px-4 py-2 bg-white border-b border-gray-200">
          <View className="flex-row flex-wrap">
            {categories.map(renderCategoryFilter)}
          </View>
        </View>
      )}

      {/* View Toggle & Results Count */}
      <View className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex-row items-center justify-between">
        <Text className="text-sm text-gray-600">
          {isLoading ? 'Loading...' : `${recommendedFoods.length} foods found`}
        </Text>
        
        <View className="flex-row items-center space-x-2">
          {/* Recommended Filter - only show for restricted diets */}
          {userPreferences.dietType !== 'unrestricted' && (
            <Pressable
              onPress={() => setShowRecommendedOnly(!showRecommendedOnly)}
              className={cn(
                "flex-row items-center px-2.5 py-1 rounded-lg border",
                showRecommendedOnly 
                  ? "bg-green-100 border-green-300" 
                  : "bg-white border-gray-200"
              )}
            >
              <Ionicons 
                name="star" 
                size={14} 
                color={showRecommendedOnly ? '#16a34a' : '#6b7280'} 
              />
              <Text 
                className={cn(
                  "text-xs font-medium ml-1",
                  showRecommendedOnly ? "text-green-700" : "text-gray-600"
                )}
              >
                {showRecommendedOnly ? 'Recommended' : 'Recommend'}
              </Text>
            </Pressable>
          )}
          
          {/* Group View Toggle */}
          <Pressable
            onPress={() => setGroupByCategory(!groupByCategory)}
            className="flex-row items-center bg-white px-2.5 py-1 rounded-lg border border-gray-200"
          >
            <Ionicons 
              name={groupByCategory ? "list" : "albums"} 
              size={14} 
              color="#6b7280" 
            />
            <Text className="text-gray-700 text-xs ml-1 font-medium">
              {groupByCategory ? 'List' : 'Group'}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Table */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="text-gray-600 mt-2">Loading foods...</Text>
        </View>
      ) : groupByCategory ? (
        // Grouped View
        <ScrollView 
          ref={scrollViewRef} 
          className="flex-1" 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={() => fetchFoods(true)}
              tintColor="#16a34a"
            />
          }
        >
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
              {group.foods.map((food, index) => {
                // Create stable key for grouped foods with group context
                const hashString = `${food.name}-${food.oxalate_mg}-${food.category}-${food.group || ''}`;
                const stableKey = `group-${group.name.replace(/[^a-zA-Z0-9]/g, '')}-${index}-${hashString.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}`;
                return (
                  <View key={stableKey}>
                    {renderFoodRow(food, index)}
                  </View>
                );
              })}
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
        <ScrollView 
          ref={scrollViewRef} 
          className="flex-1" 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={() => fetchFoods(true)}
              tintColor="#16a34a"
            />
          }
        >
          {renderHeader()}
          {recommendedFoods.map((food, index) => {
            // Create stable key using multiple food properties to ensure uniqueness
            const hashString = `${food.name}-${food.oxalate_mg}-${food.category}-${food.group || ''}`;
            const stableKey = `list-${index}-${hashString.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}`;
            return (
              <View key={stableKey}>
                {renderFoodRow(food, index)}
              </View>
            );
          })}
          
          {recommendedFoods.length === 0 && !isLoading && (
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
        onOpenSettings={() => {
          setShowMealTracker(false);
          setShowSettings(true);
        }}
      />

      {/* Bottom Navigation */}
      <BottomNavigation
        onFoodsPress={handleFoodsTabPress}
        onRecipesPress={() => setShowRecipes(true)}
        onChatPress={() => {
          setOracleContextFood(undefined);
          setShowOracle(true);
        }}
        onTrackerPress={() => {
          // Start or increment tracking for free users
          startTracking();
          incrementTrackingDay();
          setShowMealTracker(true);
        }}
        activeTab="foods"
      />

      {/* Oracle Screen Modal */}
      <OracleScreen
        visible={showOracle}
        onClose={() => {
          setShowOracle(false);
          setOracleContextFood(undefined);
        }}
        contextFood={oracleContextFood}
      />

      {/* Recipes Screen Modal */}
      <Modal
        visible={showRecipes}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowRecipes(false)}
      >
        <RecipesScreen 
          onClose={() => setShowRecipes(false)} 
          onNavigateToTracker={() => {
            setShowRecipes(false);
            setShowMealTracker(true);
          }}
        />
      </Modal>

      {/* Settings Screen */}
      <SettingsScreen 
        visible={showSettings}
        onClose={() => setShowSettings(false)}
      />

      {/* Paywall Modal - Rendered at top level to avoid nested modal issues */}
      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        feature="oracle"
      />
    </View>
  );
};

export default OxalateTableScreen;