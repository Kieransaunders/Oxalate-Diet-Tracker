import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { generateRecipe, quickRecipePrompts, parseRecipeResponse, RecipeGenerationRequest, setOfflineMode, isInOfflineMode } from '../api/recipe-generator-api';
import { useRecipeStore } from '../state/recipeStore';
import { getOxalateCategory } from '../api/oxalate-api';
import { cn } from '../utils/cn';

interface RecipeGeneratorScreenProps {
  visible: boolean;
  onClose: () => void;
  onRecipeCreated?: (recipe: any) => void;
}

const RecipeGeneratorScreen: React.FC<RecipeGeneratorScreenProps> = ({ visible, onClose, onRecipeCreated }) => {
  const insets = useSafeAreaInsets();
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedRecipe, setGeneratedRecipe] = useState<string | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert' | undefined>();
  const [lastError, setLastError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard' | undefined>();
  const [servings, setServings] = useState('4');
  const [cookingTime, setCookingTime] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(true);
  const [offlineMode, setOfflineModeState] = useState(isInOfflineMode());
  
  const { addRecipe } = useRecipeStore();

  const handleQuickRecipe = async (prompt: any) => {
    setIsGenerating(true);
    setGeneratedRecipe(null);
    setLastError(null);
    setShowCustomForm(false); // Hide custom form when quick option is selected
    
    try {
      const request: RecipeGenerationRequest = {
        question: prompt.prompt,
        mealType: prompt.mealType,
        servings: prompt.servings,
        cookingTime: prompt.cookingTime,
        difficulty: prompt.difficulty,
        dietaryRestrictions: prompt.dietaryRestrictions,
      };
      
      const response = await generateRecipe(request);
      
      if (response.text) {
        setGeneratedRecipe(response.text);
        setLastError(null);
        
        // Show success message if this was a fallback recipe
        if (response.text.includes('Curated Recipe')) {
          // Brief toast-like feedback that fallback was used
          setTimeout(() => {
            Alert.alert('Recipe Ready!', 'Served you a delicious recipe from our curated collection.', [{ text: 'Great!' }]);
          }, 500);
        }
      } else if (response.error) {
        setLastError(response.error);
        // Don't show alert immediately, let user see the error in UI
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate recipe. Please try again.';
      setLastError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCustomRecipe = async () => {
    if (!customPrompt.trim()) {
      Alert.alert('Please enter a recipe request');
      return;
    }
    
    setIsGenerating(true);
    setGeneratedRecipe(null);
    setLastError(null);
    
    try {
      const request: RecipeGenerationRequest = {
        question: customPrompt,
        mealType: selectedMealType,
        servings: parseInt(servings) || 4,
        cookingTime: parseInt(cookingTime) || undefined,
        difficulty: selectedDifficulty,
        dietaryRestrictions: ['low-oxalate'],
      };
      
      const response = await generateRecipe(request);
      
      if (response.text) {
        setGeneratedRecipe(response.text);
        setLastError(null);
        
        // Show success message if this was a fallback recipe
        if (response.text.includes('Curated Recipe')) {
          setTimeout(() => {
            Alert.alert('Recipe Ready!', 'Served you a delicious recipe from our curated collection.', [{ text: 'Great!' }]);
          }, 500);
        }
      } else if (response.error) {
        setLastError(response.error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate recipe. Please try again.';
      setLastError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveRecipe = () => {
    if (!generatedRecipe) return;
    
    try {
      const parsedRecipe = parseRecipeResponse(generatedRecipe);
      const category = getOxalateCategory(parsedRecipe.oxalatePerServing);
      
      const recipeToSave = {
        ...parsedRecipe,
        category,
      };
      
      addRecipe(recipeToSave);
      onRecipeCreated?.(recipeToSave);
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to save recipe. Please try again.');
    }
  };

  const renderQuickPrompt = (prompt: any, index: number) => (
    <Pressable
      key={index}
      onPress={() => handleQuickRecipe(prompt)}
      disabled={isGenerating}
      className={cn(
        "bg-white border border-blue-200 rounded-lg p-4 mb-3",
        isGenerating ? "opacity-50" : "active:bg-blue-50"
      )}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="font-semibold text-gray-900 mb-1">{prompt.title}</Text>
          <Text className="text-gray-600 text-sm">{prompt.prompt}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#6b7280" />
      </View>
    </Pressable>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-gray-50">
        {/* Header */}
        <View 
          className="bg-green-500 px-6 py-4 border-b border-green-600"
          style={{ paddingTop: insets.top + 16 }}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-xl font-bold text-white">
                Recipe Generator
              </Text>
              <Text className="text-green-100 text-sm">
                AI-powered low-oxalate recipe creation
              </Text>
            </View>
            
            <Pressable
              onPress={onClose}
              className="w-8 h-8 items-center justify-center rounded-full bg-green-400"
            >
              <Ionicons name="close" size={18} color="white" />
            </Pressable>
          </View>
        </View>

        <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
          {!generatedRecipe ? (
            <>
              {/* Help Text */}
              <View className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <View className="flex-row items-start">
                  <Ionicons name="bulb" size={20} color="#3b82f6" />
                  <View className="flex-1 ml-3">
                    <Text className="text-blue-900 font-medium text-sm mb-1">
                      Generate Perfect Low-Oxalate Recipes
                    </Text>
                    <Text className="text-blue-700 text-xs leading-4">
                      Choose a quick option below or create a custom recipe. All recipes are optimized for low-oxalate diets and include calculated oxalate content.
                    </Text>
                  </View>
                </View>
              </View>

              {/* Offline Mode Toggle */}
              <View className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-orange-900 font-medium text-sm">Offline Mode</Text>
                    <Text className="text-orange-700 text-xs">Use pre-made recipes if AI is unavailable</Text>
                  </View>
                  <Pressable
                    onPress={() => {
                      const newOfflineMode = !offlineMode;
                      setOfflineModeState(newOfflineMode);
                      setOfflineMode(newOfflineMode);
                    }}
                    className={cn(
                      "w-12 h-6 rounded-full border-2",
                      offlineMode ? "bg-orange-400 border-orange-400" : "bg-gray-200 border-gray-300"
                    )}
                  >
                    <View className={cn(
                      "w-4 h-4 rounded-full bg-white transition-all",
                      offlineMode ? "ml-6" : "ml-0"
                    )} />
                  </Pressable>
                </View>
              </View>

              {/* Quick Recipe Options */}
              <View className="mb-6">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-lg font-bold text-gray-900">Quick Recipe Ideas</Text>
                  {!showCustomForm && (
                    <Pressable
                      onPress={() => setShowCustomForm(true)}
                      className="bg-blue-100 px-3 py-1 rounded-lg"
                    >
                      <Text className="text-blue-700 text-sm font-medium">Custom Recipe</Text>
                    </Pressable>
                  )}
                </View>
                {quickRecipePrompts.map(renderQuickPrompt)}
              </View>

              {/* Custom Recipe Generator */}
              {showCustomForm && (
                <View className="bg-white rounded-lg p-4 mb-6">
                <Text className="text-lg font-bold text-gray-900 mb-4">Custom Recipe Request</Text>
                
                {/* Custom Prompt */}
                <View className="mb-4">
                  <Text className="font-medium text-gray-700 mb-2">What would you like to cook?</Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg px-3 py-3 text-gray-900"
                    placeholder="e.g., 'A spicy low-oxalate chicken curry'"
                    value={customPrompt}
                    onChangeText={setCustomPrompt}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                {/* Meal Type */}
                <View className="mb-4">
                  <Text className="font-medium text-gray-700 mb-2">Meal Type</Text>
                  <View className="flex-row flex-wrap">
                    {(['breakfast', 'lunch', 'dinner', 'snack', 'dessert'] as const).map((type) => (
                      <Pressable
                        key={type}
                        onPress={() => setSelectedMealType(selectedMealType === type ? undefined : type)}
                        className={cn(
                          "px-3 py-2 rounded-full mr-2 mb-2 border",
                          selectedMealType === type
                            ? "bg-green-100 border-green-300"
                            : "bg-gray-100 border-gray-300"
                        )}
                      >
                        <Text className={cn(
                          "text-sm font-medium capitalize",
                          selectedMealType === type ? "text-green-700" : "text-gray-600"
                        )}>
                          {type}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Options Row */}
                <View className="flex-row space-x-4 mb-4">
                  <View className="flex-1">
                    <Text className="font-medium text-gray-700 mb-2">Servings</Text>
                    <TextInput
                      className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                      placeholder="4"
                      value={servings}
                      onChangeText={setServings}
                      keyboardType="numeric"
                    />
                  </View>
                  
                  <View className="flex-1">
                    <Text className="font-medium text-gray-700 mb-2">Max Time (min)</Text>
                    <TextInput
                      className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                      placeholder="30"
                      value={cookingTime}
                      onChangeText={setCookingTime}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                {/* Generate Button */}
                <Pressable
                  onPress={handleCustomRecipe}
                  disabled={isGenerating || !customPrompt.trim()}
                  className={cn(
                    "py-3 rounded-lg flex-row items-center justify-center",
                    isGenerating || !customPrompt.trim()
                      ? "bg-gray-300"
                      : "bg-green-500"
                  )}
                >
                  {isGenerating ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Ionicons name="restaurant" size={20} color="white" />
                  )}
                  <Text className={cn(
                    "font-semibold ml-2",
                    isGenerating || !customPrompt.trim() ? "text-gray-500" : "text-white"
                  )}>
                    {isGenerating ? 'Generating...' : 'Generate Recipe'}
                  </Text>
                </Pressable>
              </View>
              )}
            </>
          ) : (
            /* Generated Recipe Display */
            <View className="bg-white rounded-lg p-4 mb-6">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-bold text-gray-900">Generated Recipe</Text>
                <View className="flex-row space-x-2">
                  <Pressable
                    onPress={() => {
                      setGeneratedRecipe(null);
                      setShowCustomForm(true);
                      setLastError(null);
                    }}
                    className="bg-gray-100 px-3 py-2 rounded-lg"
                  >
                    <Text className="text-gray-700 font-medium">New Recipe</Text>
                  </Pressable>
                  
                  <Pressable
                    onPress={handleSaveRecipe}
                    className="bg-green-500 px-4 py-2 rounded-lg"
                  >
                    <Text className="text-white font-medium">Save Recipe</Text>
                  </Pressable>
                </View>
              </View>
              
              <ScrollView className="max-h-96">
                <Text className="text-gray-900 leading-6">{generatedRecipe}</Text>
              </ScrollView>
            </View>
          )}

          {/* Loading State */}
          {isGenerating && (
            <View className="bg-white rounded-lg p-6 items-center">
              <ActivityIndicator size="large" color="#22c55e" />
              <Text className="text-gray-600 mt-3 font-medium">
                Creating your perfect recipe...
              </Text>
              <Text className="text-gray-500 text-sm mt-1">
                If this takes too long, we'll serve you a curated recipe instead
              </Text>
            </View>
          )}

          {/* Error State */}
          {lastError && !isGenerating && (
            <View className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <View className="flex-row items-start">
                <Ionicons name="alert-circle" size={20} color="#ef4444" />
                <View className="flex-1 ml-3">
                  <Text className="text-red-900 font-medium text-sm mb-1">
                    Unable to Generate Recipe
                  </Text>
                  <Text className="text-red-700 text-xs leading-4 mb-3">
                    {lastError}
                  </Text>
                  
                  {lastError.includes('temporarily unavailable') && (
                    <Text className="text-red-600 text-xs mb-3">
                      Don't worry! We've provided a delicious pre-made recipe below instead.
                    </Text>
                  )}
                  
                  <Pressable
                    onPress={() => {
                      setLastError(null);
                      // Retry the last action
                      if (customPrompt.trim()) {
                        handleCustomRecipe();
                      }
                    }}
                    className="bg-red-100 px-3 py-2 rounded-lg self-start"
                  >
                    <Text className="text-red-800 font-medium text-sm">Try Again</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

export default RecipeGeneratorScreen;