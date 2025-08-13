import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRecipeStore } from '../state/recipeStore';
import { useMealStore } from '../state/mealStore';
import { useOxalateStore } from '../state/oxalateStore';
import { useSubscriptionStore } from '../state/subscriptionStore';
import { getCategoryColor, getCategoryBackgroundColor } from '../api/oxalate-api';
import { cn } from '../utils/cn';
import RecipeGeneratorScreen from './RecipeGeneratorScreen';
import EditRecipeModal from '../components/EditRecipeModal';
import PremiumGate from '../components/PremiumGate';
import type { Recipe } from '../types/recipe';

interface RecipesScreenProps {
  onClose?: () => void;
  onNavigateToTracker?: () => void;
}

const RecipesScreen: React.FC<RecipesScreenProps> = ({ onClose, onNavigateToTracker }) => {
  const insets = useSafeAreaInsets();
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [showRecipeGenerator, setShowRecipeGenerator] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const {
    searchQuery,
    sortBy,
    filterByCategory,
    setSearchQuery,
    setSortBy,
    toggleCategoryFilter,
    toggleFavorite,
    deleteRecipe,
    getFilteredRecipes,
    recipes,
  } = useRecipeStore();
  
  const { addRecipeIngredients } = useMealStore();
  const { foods } = useOxalateStore();
  const { 
    status: subscriptionStatus, 
    canCreateRecipe, 
    incrementRecipeCount, 
    getRemainingRecipes 
  } = useSubscriptionStore();

  const filteredRecipes = getFilteredRecipes();

  const handleRecipePress = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setShowRecipeModal(true);
  };

  const handleAddToTracker = (recipe: Recipe) => {
    try {
      const result = addRecipeIngredients({
        title: recipe.title,
        ingredients: recipe.ingredients,
        servings: recipe.servings
      }, foods);

      let message = `Added ${result.added} ingredients from "${recipe.title}" to your daily tracker!`;
      if (result.totalOxalate > 0) {
        message += `\n\nTotal oxalate: ${result.totalOxalate.toFixed(1)}mg`;
      }
      if (result.notFound.length > 0) {
        message += `\n\nNote: ${result.notFound.length} ingredients couldn't be found in the food database: ${result.notFound.join(', ')}`;
      }

      Alert.alert(
        'Ingredients Added to Tracker',
        message,
        [
          { text: 'OK', style: 'cancel' },
          { 
            text: 'View Tracker', 
            style: 'default',
            onPress: () => {
              if (onNavigateToTracker) {
                onNavigateToTracker();
              }
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to add ingredients to tracker. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleDeleteRecipe = (recipe: Recipe) => {
    Alert.alert(
      'Delete Recipe',
      `Are you sure you want to delete "${recipe.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteRecipe(recipe.id),
        },
      ]
    );
  };

  const formatTime = (minutes?: number) => {
    if (!minutes) return 'N/A';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const renderRecipeCard = (recipe: Recipe) => {
    const backgroundColor = getCategoryBackgroundColor(recipe.category);
    const categoryColor = getCategoryColor(recipe.category);

    return (
      <Pressable
        key={recipe.id}
        onPress={() => handleRecipePress(recipe)}
        className="bg-white rounded-lg mb-3 shadow-sm"
        style={{ 
          backgroundColor,
          borderLeftWidth: 4,
          borderLeftColor: categoryColor,
        }}
      >
        <View className="p-4">
          {/* Header */}
          <View className="flex-row items-start justify-between mb-2">
            <View className="flex-1 pr-2">
              <Text className="text-lg font-bold text-gray-900">{recipe.title}</Text>
              {recipe.description && (
                <Text className="text-gray-600 text-sm mt-1" numberOfLines={2}>
                  {recipe.description}
                </Text>
              )}
            </View>
            
            <View className="flex-row items-center space-x-2">
              <Pressable
                onPress={() => handleAddToTracker(recipe)}
                className="bg-blue-500 px-2 py-1 rounded"
              >
                <Text className="text-white text-xs font-medium">Add to Tracker</Text>
              </Pressable>
              
              <Pressable
                onPress={() => toggleFavorite(recipe.id)}
                className="p-1"
              >
                <Ionicons
                  name={recipe.isFavorite ? "heart" : "heart-outline"}
                  size={20}
                  color={recipe.isFavorite ? "#ef4444" : "#6b7280"}
                />
              </Pressable>
              
              <Pressable
                onPress={() => handleDeleteRecipe(recipe)}
                className="p-1"
              >
                <Ionicons name="trash-outline" size={18} color="#6b7280" />
              </Pressable>
            </View>
          </View>

          {/* Oxalate Info */}
          <View className="flex-row items-center mb-3">
            <View
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: categoryColor }}
            />
            <Text 
              className="font-semibold text-sm"
              style={{ color: categoryColor }}
            >
              {recipe.oxalatePerServing.toFixed(1)} mg oxalate per serving
            </Text>
            <Text className="text-gray-500 text-sm ml-2">
              • {recipe.category}
            </Text>
          </View>

          {/* Recipe Details */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center space-x-4">
              <View className="flex-row items-center">
                <Ionicons name="people-outline" size={16} color="#6b7280" />
                <Text className="text-gray-600 text-sm ml-1">{recipe.servings}</Text>
              </View>
              
              {recipe.prepTime && (
                <View className="flex-row items-center">
                  <Ionicons name="time-outline" size={16} color="#6b7280" />
                  <Text className="text-gray-600 text-sm ml-1">{formatTime(recipe.prepTime)}</Text>
                </View>
              )}
              
              {recipe.difficulty && (
                <View className="flex-row items-center">
                  <Ionicons name="star-outline" size={16} color="#6b7280" />
                  <Text className="text-gray-600 text-sm ml-1">{recipe.difficulty}</Text>
                </View>
              )}
            </View>

            {recipe.source === 'chatbot' && (
              <View className="bg-green-100 px-2 py-1 rounded-full">
                <Text className="text-green-800 text-xs font-medium">AI Generated</Text>
              </View>
            )}
          </View>

          {/* Tags */}
          {recipe.tags.length > 0 && (
            <View className="flex-row flex-wrap mt-2">
              {recipe.tags.slice(0, 3).map((tag) => (
                <View key={tag} className="bg-gray-100 px-2 py-1 rounded-full mr-2 mb-1">
                  <Text className="text-gray-700 text-xs">{tag}</Text>
                </View>
              ))}
              {recipe.tags.length > 3 && (
                <Text className="text-gray-500 text-xs py-1">+{recipe.tags.length - 3} more</Text>
              )}
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="bg-white px-4 py-6 border-b border-gray-200">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-2xl font-bold text-gray-900 mb-2">
              My Recipes
            </Text>
            {subscriptionStatus === 'premium' ? (
              <Text className="text-green-600 text-sm">
                Premium: Unlimited recipes
              </Text>
            ) : (
              <Text className="text-gray-600 text-sm">
                Free: {recipes.length}/1 recipe used
              </Text>
            )}
            <Text className="text-gray-600">
              {filteredRecipes.length} saved recipes
            </Text>
          </View>
          
          {onClose && (
            <Pressable
              onPress={onClose}
              className="w-8 h-8 items-center justify-center rounded-full bg-gray-100"
            >
              <Ionicons name="close" size={20} color="#6b7280" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Search and Filters */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        {/* Search */}
        <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2 mb-3">
          <Ionicons name="search" size={20} color="#6b7280" />
          <TextInput
            className="flex-1 ml-2 text-gray-900"
            placeholder="Search recipes..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Sort */}
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-medium text-gray-700">Sort by:</Text>
          <View className="flex-row space-x-2">
            {(['recent', 'name', 'oxalate', 'prepTime'] as const).map((sort) => (
              <Pressable
                key={sort}
                onPress={() => setSortBy(sort)}
                className={cn(
                  "px-3 py-1 rounded-full border",
                  sortBy === sort
                    ? "bg-blue-100 border-blue-300"
                    : "bg-white border-gray-300"
                )}
              >
                <Text className={cn(
                  "text-sm font-medium",
                  sortBy === sort ? "text-blue-700" : "text-gray-600"
                )}>
                  {sort === 'prepTime' ? 'Time' : sort.charAt(0).toUpperCase() + sort.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      {/* Recipes List */}
      <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
        {filteredRecipes.length === 0 ? (
          <View className="items-center justify-center py-8">
            {/* Help Banner */}
            <View className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 mx-2">
              <View className="flex-row items-start">
                <Ionicons name="bulb" size={20} color="#16a34a" />
                <View className="flex-1 ml-3">
                  <Text className="text-green-900 font-medium text-sm mb-1">
                    How to Save Recipes
                  </Text>
                  <Text className="text-green-700 text-xs leading-4">
                    {"1. Tap the green ➕ button to generate recipes\n2. Or ask the AI Assistant for recipes\n3. All recipes include calculated oxalate content"}
                  </Text>
                </View>
              </View>
            </View>
            
            <Ionicons name="restaurant-outline" size={64} color="#d1d5db" />
            <Text className="text-xl text-gray-500 mt-4 font-medium">No Recipes Yet</Text>
            <Text className="text-gray-400 text-center mt-2 px-4">
              Tap the green ➕ button to generate your first recipe!
            </Text>
          </View>
        ) : (
          filteredRecipes.map(renderRecipeCard)
        )}
      </ScrollView>

      {/* Floating Action Button - Generate Recipe */}
      {canCreateRecipe() ? (
        <Pressable
          onPress={() => {
            if (subscriptionStatus === 'free') {
              incrementRecipeCount();
            }
            setShowRecipeGenerator(true);
          }}
          className="absolute bottom-6 right-6 w-14 h-14 bg-green-500 rounded-full items-center justify-center shadow-lg"
          style={{ elevation: 5 }}
        >
          <Ionicons name="add" size={28} color="white" />
        </Pressable>
      ) : (
        <PremiumGate 
          feature="recipes" 
          showUpgradePrompt={true}
          customMessage="You've created your 1 free recipe. Upgrade to Premium for unlimited recipe storage!"
        >
          <Pressable
            onPress={() => {}}
            className="absolute bottom-6 right-6 w-14 h-14 bg-gray-400 rounded-full items-center justify-center shadow-lg opacity-50"
            style={{ elevation: 5 }}
          >
            <Ionicons name="lock-closed" size={28} color="white" />
          </Pressable>
        </PremiumGate>
      )}

      {/* Recipe Generator Modal */}
      <RecipeGeneratorScreen
        visible={showRecipeGenerator}
        onClose={() => setShowRecipeGenerator(false)}
        onRecipeCreated={(recipe) => {
          setSelectedRecipe(recipe);
          setShowRecipeGenerator(false);
          setShowRecipeModal(true);
        }}
        onNavigateToTracker={onNavigateToTracker}
      />

      {/* Recipe Detail Modal */}
      {selectedRecipe && (
        <RecipeDetailModal
          recipe={selectedRecipe}
          visible={showRecipeModal}
          onClose={() => {
            setShowRecipeModal(false);
            setSelectedRecipe(null);
          }}
          onEdit={() => {
            setShowRecipeModal(false);
            setShowEditModal(true);
          }}
          onAddToTracker={handleAddToTracker}
        />
      )}

      {/* Edit Recipe Modal */}
      {selectedRecipe && (
        <EditRecipeModal
          recipe={selectedRecipe}
          visible={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedRecipe(null);
          }}
          onSave={() => {
            // Refresh the recipe list and close modals
            setShowEditModal(false);
            setSelectedRecipe(null);
          }}
        />
      )}
    </View>
  );
};

// Recipe Detail Modal Component
interface RecipeDetailModalProps {
  recipe: Recipe;
  visible: boolean;
  onClose: () => void;
  onEdit: () => void;
  onAddToTracker: (recipe: Recipe) => void;
}

const RecipeDetailModal: React.FC<RecipeDetailModalProps> = ({ recipe, visible, onClose, onEdit, onAddToTracker }) => {
  const insets = useSafeAreaInsets();
  const { toggleFavorite } = useRecipeStore();

  const formatTime = (minutes?: number) => {
    if (!minutes) return 'N/A';
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours} hour${hours > 1 ? 's' : ''}`;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-white">
        {/* Header */}
        <View 
          className="bg-white px-6 py-4 border-b border-gray-200"
          style={{ paddingTop: insets.top + 16 }}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-4">
              <Text className="text-xl font-bold text-gray-900">{recipe.title}</Text>
              {recipe.description && (
                <Text className="text-gray-600 mt-1">{recipe.description}</Text>
              )}
            </View>
            
            <View className="flex-row items-center space-x-2">
              <Pressable
                onPress={() => onAddToTracker(recipe)}
                className="bg-blue-500 px-3 py-2 rounded-lg"
              >
                <Text className="text-white text-sm font-medium">Add to Tracker</Text>
              </Pressable>
              
              <Pressable
                onPress={() => toggleFavorite(recipe.id)}
                className="w-10 h-10 items-center justify-center rounded-full bg-gray-100"
              >
                <Ionicons
                  name={recipe.isFavorite ? "heart" : "heart-outline"}
                  size={20}
                  color={recipe.isFavorite ? "#ef4444" : "#6b7280"}
                />
              </Pressable>
              
              <Pressable
                onPress={onEdit}
                className="w-10 h-10 items-center justify-center rounded-full bg-blue-100"
              >
                <Ionicons name="create-outline" size={20} color="#3b82f6" />
              </Pressable>
              
              <Pressable
                onPress={onClose}
                className="w-10 h-10 items-center justify-center rounded-full bg-gray-100"
              >
                <Ionicons name="close" size={20} color="#6b7280" />
              </Pressable>
            </View>
          </View>
        </View>

        <ScrollView className="flex-1 px-6 py-4">
          {/* Recipe Info */}
          <View className="bg-gray-50 rounded-lg p-4 mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <View
                  className="w-4 h-4 rounded-full mr-3"
                  style={{ backgroundColor: getCategoryColor(recipe.category) }}
                />
                <Text 
                  className="font-bold text-lg"
                  style={{ color: getCategoryColor(recipe.category) }}
                >
                  {recipe.oxalatePerServing.toFixed(1)} mg
                </Text>
                <Text className="text-gray-600 ml-2">oxalate per serving</Text>
              </View>
              
              <Text 
                className="font-semibold px-3 py-1 rounded-full text-white text-sm"
                style={{ backgroundColor: getCategoryColor(recipe.category) }}
              >
                {recipe.category}
              </Text>
            </View>
            
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center space-x-6">
                <View className="items-center">
                  <Ionicons name="people" size={20} color="#6b7280" />
                  <Text className="text-gray-600 text-sm mt-1">{recipe.servings} servings</Text>
                </View>
                
                {recipe.prepTime && (
                  <View className="items-center">
                    <Ionicons name="time" size={20} color="#6b7280" />
                    <Text className="text-gray-600 text-sm mt-1">{formatTime(recipe.prepTime)}</Text>
                  </View>
                )}
                
                {recipe.cookTime && (
                  <View className="items-center">
                    <Ionicons name="flame" size={20} color="#6b7280" />
                    <Text className="text-gray-600 text-sm mt-1">{formatTime(recipe.cookTime)}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Ingredients */}
          <View className="mb-6">
            <Text className="text-xl font-bold text-gray-900 mb-3">Ingredients</Text>
            {recipe.ingredients.map((ingredient, index) => (
              <View key={ingredient.id} className="flex-row items-center py-2">
                <View className="w-6 h-6 rounded-full bg-blue-100 items-center justify-center mr-3">
                  <Text className="text-blue-700 text-xs font-bold">{index + 1}</Text>
                </View>
                <Text className="flex-1 text-gray-900">
                  {ingredient.amount} {ingredient.unit} {ingredient.name}
                </Text>
                {ingredient.oxalate_mg && (
                  <Text className="text-gray-500 text-sm">
                    {ingredient.oxalate_mg}mg
                  </Text>
                )}
              </View>
            ))}
          </View>

          {/* Instructions */}
          <View className="mb-6">
            <Text className="text-xl font-bold text-gray-900 mb-3">Instructions</Text>
            {recipe.instructions.map((instruction, index) => (
              <View key={index} className="flex-row items-start py-3">
                <View className="w-8 h-8 rounded-full bg-green-100 items-center justify-center mr-3 mt-1">
                  <Text className="text-green-700 text-sm font-bold">{index + 1}</Text>
                </View>
                <Text className="flex-1 text-gray-900 leading-6">{instruction}</Text>
              </View>
            ))}
          </View>

          {/* Tags */}
          {recipe.tags.length > 0 && (
            <View className="mb-6">
              <Text className="text-xl font-bold text-gray-900 mb-3">Tags</Text>
              <View className="flex-row flex-wrap">
                {recipe.tags.map((tag) => (
                  <View key={tag} className="bg-blue-100 px-3 py-1 rounded-full mr-2 mb-2">
                    <Text className="text-blue-700 text-sm font-medium">{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Notes */}
          {recipe.notes && (
            <View className="mb-6">
              <Text className="text-xl font-bold text-gray-900 mb-3">Notes</Text>
              <Text className="text-gray-700 leading-6">{recipe.notes}</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

export default RecipesScreen;