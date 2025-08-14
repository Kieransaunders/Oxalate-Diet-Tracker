import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useOxalateStore } from '../state/oxalateStore';
import { useRecipeStore } from '../state/recipeStore';
import { useSubscriptionStore } from '../state/subscriptionStore';
import { getCategoryColor, getCategoryBackgroundColor, determineOxalateCategory } from '../api/oxalate-api';
import { toast } from '../utils/toast';
import { cn } from '../utils/cn';
import PremiumGate from './PremiumGate';
import type { Recipe, RecipeIngredient } from '../types/recipe';
import type { OxalateFoodItem } from '../types/oxalate';

interface ManualRecipeBuilderProps {
  visible: boolean;
  onClose: () => void;
  onRecipeCreated?: (recipe: Recipe) => void;
}

interface SelectedIngredient extends RecipeIngredient {
  foodItem: OxalateFoodItem;
  quantity: number; // in grams
}

const ManualRecipeBuilder: React.FC<ManualRecipeBuilderProps> = ({
  visible,
  onClose,
  onRecipeCreated,
}) => {
  const insets = useSafeAreaInsets();
  const [recipeName, setRecipeName] = useState('');
  const [description, setDescription] = useState('');
  const [servings, setServings] = useState('4');
  const [instructions, setInstructions] = useState('');
  const [ingredients, setIngredients] = useState<SelectedIngredient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Ingredient search state
  const [searchQuery, setSearchQuery] = useState('');
  const [showFoodSearch, setShowFoodSearch] = useState(false);
  const [editingIngredientIndex, setEditingIngredientIndex] = useState<number | null>(null);

  const { foods, fetchFoods, isLoading: foodsLoading } = useOxalateStore();
  const { addRecipe, calculateRecipeOxalate } = useRecipeStore();
  const { canCreateRecipe, incrementRecipeCount } = useSubscriptionStore();

  // Search foods locally
  const searchFoods = useCallback((query: string) => {
    if (!query.trim()) return [];
    
    const searchLower = query.toLowerCase();
    return foods.filter(food => 
      food.name.toLowerCase().includes(searchLower) ||
      (food.group && food.group.toLowerCase().includes(searchLower)) ||
      (food.aliases && food.aliases.some(alias => alias.toLowerCase().includes(searchLower)))
    );
  }, [foods]);

  // Get filtered foods for search
  const filteredFoods = searchQuery.length > 0 
    ? searchFoods(searchQuery).slice(0, 10) // Limit to 10 results
    : [];

  // Calculate total oxalate
  const calculateTotalOxalate = useCallback(() => {
    return ingredients.reduce((total, ingredient) => {
      const servingSize = ingredient.foodItem.serving_grams || 100;
      const oxalatePerGram = ingredient.foodItem.oxalate_mg / servingSize;
      return total + (oxalatePerGram * ingredient.quantity);
    }, 0);
  }, [ingredients]);

  const totalOxalate = calculateTotalOxalate();
  const oxalatePerServing = servings ? totalOxalate / parseFloat(servings) : 0;
  const recipeCategory = determineOxalateCategory(oxalatePerServing);

  const handleAddIngredient = (food: OxalateFoodItem) => {
    const servingSize = food.serving_grams || 100; // Default to 100g if not defined
    const newIngredient: SelectedIngredient = {
      id: `${Date.now()}-${Math.random()}`,
      name: food.name,
      amount: servingSize.toString(),
      unit: 'g',
      oxalate_mg: food.oxalate_mg,
      category: food.category,
      foodItem: food,
      quantity: servingSize, // Default to standard serving size or 100g
    };

    setIngredients(prev => [...prev, newIngredient]);
    setSearchQuery('');
    setShowFoodSearch(false);
  };

  // Ensure foods are available when opening the builder/search
  useEffect(() => {
    if (visible && foods.length === 0) {
      fetchFoods().catch(() => {});
    }
  }, [visible, foods.length, fetchFoods]);

  useEffect(() => {
    if (showFoodSearch && foods.length === 0) {
      fetchFoods().catch(() => {});
    }
  }, [showFoodSearch, foods.length, fetchFoods]);

  const handleUpdateIngredientQuantity = (index: number, quantity: string) => {
    const numQuantity = parseFloat(quantity) || 0;
    setIngredients(prev =>
      prev.map((ingredient, i) =>
        i === index
          ? {
              ...ingredient,
              quantity: numQuantity,
              amount: `${numQuantity}g`,
            }
          : ingredient
      )
    );
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveRecipe = async () => {
    // Validation
    if (!recipeName.trim()) {
      toast.warning('Recipe Name Required', 'Please enter a name for your recipe.');
      return;
    }

    if (ingredients.length === 0) {
      toast.warning('Ingredients Required', 'Please add at least one ingredient to your recipe.');
      return;
    }

    if (!servings || parseFloat(servings) <= 0) {
      toast.warning('Invalid Servings', 'Please enter a valid number of servings.');
      return;
    }

    // Check premium limits
    if (!canCreateRecipe()) {
      return; // PremiumGate will handle showing upgrade prompt
    }

    setIsLoading(true);

    try {
      // Create recipe object
      const recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'> = {
        title: recipeName.trim(),
        description: description.trim() || undefined,
        ingredients: ingredients.map(ingredient => ({
          id: ingredient.id,
          name: ingredient.name,
          amount: ingredient.amount,
          unit: ingredient.unit,
          oxalate_mg: ingredient.oxalate_mg,
          category: ingredient.category,
        })),
        instructions: instructions.trim() ? instructions.trim().split('\n').filter(step => step.trim()) : [],
        servings: parseFloat(servings),
        totalOxalate,
        oxalatePerServing,
        category: recipeCategory,
        tags: [],
        source: 'manual',
        isFavorite: false,
      };

      // Increment recipe count (premium check)
      const canCreate = incrementRecipeCount();
      if (!canCreate) {
        toast.warning('Recipe Limit Reached', 'You have reached your recipe creation limit. Upgrade to Premium to create unlimited recipes.', {
          label: 'Upgrade',
          onPress: () => {
            onClose();
          }
        });
        return;
      }

      // Save recipe
      addRecipe(recipe);

      // Success
      toast.success(
        'Recipe Saved!',
        `Your recipe "${recipeName}" has been saved with ${oxalatePerServing.toFixed(1)}mg oxalate per serving.`,
        {
          label: 'Create Another',
          onPress: () => {
            // Reset form
            setRecipeName('');
            setDescription('');
            setInstructions('');
            setIngredients([]);
            setServings('4');
          }
        }
      );

      // Close modal and handle callback
      onClose();
      
      // Callback for parent component
      if (onRecipeCreated) {
        const savedRecipe: Recipe = {
          ...recipe,
          id: `recipe_${Date.now()}`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        onRecipeCreated(savedRecipe);
      }
    } catch (error) {
      console.error('Error saving recipe:', error);
      toast.error('Save Failed', 'Failed to save recipe. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const categoryColor = getCategoryColor(recipeCategory);

  if (!canCreateRecipe()) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <PremiumGate feature="recipes" action="create">
          <View />
        </PremiumGate>
        <View className="absolute top-12 right-4">
          <Pressable onPress={onClose} className="p-2">
            <Ionicons name="close" size={24} color="#666" />
          </Pressable>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
        {/* Header */}
        <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
          <Text className="text-xl font-bold text-gray-900">Create Recipe</Text>
          <Pressable onPress={onClose} className="p-2">
            <Ionicons name="close" size={24} color="#666" />
          </Pressable>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Basic Info */}
          <View className="p-4">
            <Text className="text-lg font-semibold text-gray-900 mb-4">Recipe Details</Text>
            
            {/* Recipe Name */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">Recipe Name *</Text>
              <TextInput
                value={recipeName}
                onChangeText={setRecipeName}
                placeholder="e.g., Low-Oxalate Vegetable Soup"
                className="border border-gray-300 rounded-lg px-3 py-3 text-base"
                maxLength={100}
              />
            </View>

            {/* Description */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">Description (Optional)</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Brief description of your recipe..."
                multiline
                numberOfLines={2}
                className="border border-gray-300 rounded-lg px-3 py-3 text-base"
                maxLength={200}
              />
            </View>

            {/* Servings */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">Number of Servings *</Text>
              <TextInput
                value={servings}
                onChangeText={setServings}
                placeholder="4"
                keyboardType="numeric"
                className="border border-gray-300 rounded-lg px-3 py-3 text-base w-24"
              />
            </View>
          </View>

          {/* Ingredients Section */}
          <View className="px-4 pb-4">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-gray-900">Ingredients</Text>
              <Pressable
                onPress={() => setShowFoodSearch(true)}
                className="bg-blue-500 px-4 py-2 rounded-lg flex-row items-center"
              >
                <Ionicons name="add" size={16} color="white" />
                <Text className="text-white font-medium ml-1">Add Ingredient</Text>
              </Pressable>
            </View>

            {/* Ingredients List */}
            {ingredients.map((ingredient, index) => (
              <View key={ingredient.id} className="bg-gray-50 rounded-lg p-3 mb-3">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-base font-medium text-gray-900 flex-1" numberOfLines={1}>
                    {ingredient.name}
                  </Text>
                  <Pressable
                    onPress={() => handleRemoveIngredient(index)}
                    className="ml-2 p-1"
                  >
                    <Ionicons name="trash-outline" size={16} color="#ef4444" />
                  </Pressable>
                </View>
                
                <View className="flex-row items-center">
                  <View
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: getCategoryColor(ingredient.category || 'Low') }}
                  />
                  <Text className="text-sm text-gray-600 flex-1">
                    {ingredient.oxalate_mg?.toFixed(1)}mg oxalate per {ingredient.foodItem.serving_grams || 100}g serving
                  </Text>
                </View>

                {/* Quantity Input */}
                <View className="flex-row items-center mt-3">
                  <Text className="text-sm font-medium text-gray-700 mr-2">Amount:</Text>
                  <TextInput
                    value={ingredient.quantity.toString()}
                    onChangeText={(text) => handleUpdateIngredientQuantity(index, text)}
                    keyboardType="numeric"
                    className="border border-gray-300 rounded px-2 py-1 text-sm w-16 text-center"
                  />
                  <Text className="text-sm text-gray-600 ml-2">grams</Text>
                  <Text className="text-sm text-gray-600 ml-4">
                    ({((ingredient.foodItem.oxalate_mg / (ingredient.foodItem.serving_grams || 100)) * ingredient.quantity).toFixed(1)}mg oxalate)
                  </Text>
                </View>
              </View>
            ))}

            {ingredients.length === 0 && (
              <View className="bg-gray-50 rounded-lg p-6 items-center">
                <Ionicons name="restaurant-outline" size={32} color="#9ca3af" />
                <Text className="text-gray-500 text-center mt-2">
                  No ingredients added yet{'\n'}Tap "Add Ingredient" to get started
                </Text>
              </View>
            )}
          </View>

          {/* Instructions */}
          <View className="px-4 pb-4">
            <Text className="text-lg font-semibold text-gray-900 mb-2">Instructions (Optional)</Text>
            <TextInput
              value={instructions}
              onChangeText={setInstructions}
              placeholder="1. Step one...&#10;2. Step two...&#10;3. Step three..."
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              className="border border-gray-300 rounded-lg px-3 py-3 text-base"
              maxLength={1000}
            />
          </View>

          {/* Recipe Summary */}
          {ingredients.length > 0 && (
            <View className="mx-4 mb-6 bg-gray-50 rounded-lg p-4">
              <Text className="text-lg font-semibold text-gray-900 mb-3">Recipe Summary</Text>
              
              <View className="flex-row items-center mb-2">
                <View
                  className="w-4 h-4 rounded-full mr-3"
                  style={{ backgroundColor: categoryColor }}
                />
                <Text className="text-base font-medium" style={{ color: categoryColor }}>
                  {oxalatePerServing.toFixed(1)}mg oxalate per serving
                </Text>
              </View>
              
              <Text className="text-sm text-gray-600">
                Total: {totalOxalate.toFixed(1)}mg oxalate • {servings} servings • {recipeCategory} oxalate
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Save Button */}
        <View className="p-4 border-t border-gray-200" style={{ paddingBottom: insets.bottom + 16 }}>
          <Pressable
            onPress={handleSaveRecipe}
            disabled={isLoading || !recipeName.trim() || ingredients.length === 0}
            className={cn(
              "py-4 rounded-lg items-center",
              isLoading || !recipeName.trim() || ingredients.length === 0
                ? "bg-gray-300"
                : "bg-blue-500"
            )}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className="text-white font-semibold text-lg">Save Recipe</Text>
            )}
          </Pressable>
        </View>

        {/* Food Search Modal */}
        <Modal visible={showFoodSearch} animationType="slide" presentationStyle="pageSheet">
          <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
            {/* Search Header */}
            <View className="flex-row items-center p-4 border-b border-gray-200">
              <Pressable onPress={() => setShowFoodSearch(false)} className="mr-3">
                <Ionicons name="arrow-back" size={24} color="#666" />
              </Pressable>
              <Text className="text-lg font-semibold text-gray-900 flex-1">Add Ingredient</Text>
            </View>

            {/* Search Input */}
            <View className="p-4">
              <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
                <Ionicons name="search" size={20} color="#9ca3af" />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search for foods (e.g., spinach, almonds...)"
                  className="flex-1 ml-2 text-base"
                  autoFocus
                />
              </View>
            </View>

            {/* Search Results */}
            <ScrollView className="flex-1">
              {foodsLoading && foods.length === 0 ? (
                <View className="items-center justify-center py-8">
                  <ActivityIndicator size="small" />
                  <Text className="text-gray-500 mt-2">Loading foods…</Text>
                </View>
              ) : searchQuery.length > 0 ? (
                filteredFoods.length > 0 ? (
                  filteredFoods.map((food) => (
                    <Pressable
                      key={food.id}
                      onPress={() => handleAddIngredient(food)}
                      className="p-4 border-b border-gray-100"
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-1">
                          <Text className="text-base font-medium text-gray-900" numberOfLines={1}>
                            {food.name}
                          </Text>
                          <View className="flex-row items-center mt-1">
                            <View
                              className="w-3 h-3 rounded-full mr-2"
                              style={{ backgroundColor: getCategoryColor(food.category) }}
                            />
                            <Text className="text-sm text-gray-600">
                              {food.oxalate_mg.toFixed(1)}mg per {food.serving_grams || 100}g • {food.category}
                            </Text>
                          </View>
                        </View>
                        <Ionicons name="add-circle" size={24} color="#3b82f6" />
                      </View>
                    </Pressable>
                  ))
                ) : (
                  <View className="p-6 items-center">
                    <Ionicons name="search" size={32} color="#9ca3af" />
                    <Text className="text-gray-500 text-center mt-2">
                      No foods found matching "{searchQuery}"
                    </Text>
                    <Text className="text-gray-400 text-center text-sm mt-1">
                      Try searching for common foods like "chicken", "rice", or "broccoli"
                    </Text>
                  </View>
                )
              ) : (
                <View className="p-6 items-center">
                  <Ionicons name="restaurant-outline" size={32} color="#9ca3af" />
                  <Text className="text-gray-500 text-center mt-2">
                    Search our database of {foods.length}+ foods
                  </Text>
                  <Text className="text-gray-400 text-center text-sm mt-1">
                    Start typing to find ingredients for your recipe
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </Modal>
      </View>
    </Modal>
  );
};

export default ManualRecipeBuilder;
