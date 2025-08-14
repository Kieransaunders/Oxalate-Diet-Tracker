import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRecipeStore } from '../state/recipeStore';
import { getOxalateCategory } from '../api/oxalate-api';
import { toast } from '../utils/toast';
import { cn } from '../utils/cn';
import type { Recipe } from '../types/recipe';

interface EditRecipeModalProps {
  recipe: Recipe;
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
}

const EditRecipeModal: React.FC<EditRecipeModalProps> = ({ recipe, visible, onClose, onSave }) => {
  const insets = useSafeAreaInsets();
  const { updateRecipe } = useRecipeStore();
  
  const [title, setTitle] = useState(recipe.title);
  const [description, setDescription] = useState(recipe.description || '');
  const [servings, setServings] = useState(recipe.servings.toString());
  const [prepTime, setPrepTime] = useState(recipe.prepTime?.toString() || '');
  const [cookTime, setCookTime] = useState(recipe.cookTime?.toString() || '');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | undefined>(recipe.difficulty);
  const [notes, setNotes] = useState(recipe.notes || '');
  const [ingredients, setIngredients] = useState(recipe.ingredients.map(ing => ing.name).join('\n'));
  const [instructions, setInstructions] = useState(recipe.instructions.join('\n'));

  const handleSave = () => {
    if (!title.trim()) {
      toast.warning('Recipe Title Required', 'Please enter a title for your recipe.');
      return;
    }

    // Parse ingredients back to array
    const ingredientList = ingredients.split('\n').filter(ing => ing.trim()).map((ing, index) => ({
      id: `${Date.now()}_${index}`,
      name: ing.trim(),
      amount: '',
    }));

    // Parse instructions back to array
    const instructionList = instructions.split('\n').filter(inst => inst.trim()).map(inst => inst.trim());

    // Calculate oxalate (keep original for now, could be enhanced)
    const newServings = parseInt(servings) || 1;
    const oxalatePerServing = recipe.totalOxalate / newServings;
    const category = getOxalateCategory(oxalatePerServing);

    const updates: Partial<Recipe> = {
      title: title.trim(),
      description: description.trim() || undefined,
      servings: newServings,
      prepTime: parseInt(prepTime) || undefined,
      cookTime: parseInt(cookTime) || undefined,
      difficulty,
      notes: notes.trim() || undefined,
      ingredients: ingredientList,
      instructions: instructionList,
      oxalatePerServing,
      category,
    };

    updateRecipe(recipe.id, updates);
    onSave();
    onClose();
  };

  const difficultyOptions: ('Easy' | 'Medium' | 'Hard')[] = ['Easy', 'Medium', 'Hard'];

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
          className="bg-blue-500 px-6 py-4 border-b border-blue-600"
          style={{ paddingTop: insets.top + 16 }}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-xl font-bold text-white">Edit Recipe</Text>
              <Text className="text-blue-100 text-sm">Customize your recipe details</Text>
            </View>
            
            <View className="flex-row items-center space-x-3">
              <Pressable
                onPress={handleSave}
                className="bg-blue-400 px-4 py-2 rounded-lg"
              >
                <Text className="text-white font-semibold">Save</Text>
              </Pressable>
              
              <Pressable
                onPress={onClose}
                className="w-8 h-8 items-center justify-center rounded-full bg-blue-400"
              >
                <Ionicons name="close" size={18} color="white" />
              </Pressable>
            </View>
          </View>
        </View>

        <ScrollView className="flex-1 px-6 py-4">
          {/* Basic Info */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-4">Basic Information</Text>
            
            <View className="mb-4">
              <Text className="font-medium text-gray-700 mb-2">Recipe Title *</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-3 py-3 text-gray-900"
                placeholder="e.g., Delicious Low-Oxalate Chicken Curry"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View className="mb-4">
              <Text className="font-medium text-gray-700 mb-2">Description</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-3 py-3 text-gray-900"
                placeholder="Brief description of the recipe..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Recipe Details Row */}
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
                <Text className="font-medium text-gray-700 mb-2">Prep Time (min)</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                  placeholder="15"
                  value={prepTime}
                  onChangeText={setPrepTime}
                  keyboardType="numeric"
                />
              </View>
              
              <View className="flex-1">
                <Text className="font-medium text-gray-700 mb-2">Cook Time (min)</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                  placeholder="30"
                  value={cookTime}
                  onChangeText={setCookTime}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Difficulty */}
            <View className="mb-4">
              <Text className="font-medium text-gray-700 mb-2">Difficulty</Text>
              <View className="flex-row space-x-2">
                {difficultyOptions.map((option) => (
                  <Pressable
                    key={option}
                    onPress={() => setDifficulty(difficulty === option ? undefined : option)}
                    className={cn(
                      "px-4 py-2 rounded-lg border",
                      difficulty === option
                        ? "bg-blue-100 border-blue-300"
                        : "bg-gray-100 border-gray-300"
                    )}
                  >
                    <Text className={cn(
                      "font-medium",
                      difficulty === option ? "text-blue-700" : "text-gray-600"
                    )}>
                      {option}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          {/* Ingredients */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-2">Ingredients</Text>
            <Text className="text-gray-600 text-sm mb-3">Enter each ingredient on a new line</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-3 py-3 text-gray-900"
              placeholder="2 cups chicken breast, diced&#10;1 tablespoon olive oil&#10;1 teaspoon garlic powder..."
              value={ingredients}
              onChangeText={setIngredients}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
            />
          </View>

          {/* Instructions */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-2">Instructions</Text>
            <Text className="text-gray-600 text-sm mb-3">Enter each step on a new line</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-3 py-3 text-gray-900"
              placeholder="Heat oil in a large pan over medium heat&#10;Add chicken and cook until golden&#10;Season with garlic powder and cook for 2 minutes..."
              value={instructions}
              onChangeText={setInstructions}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
            />
          </View>

          {/* Notes */}
          <View className="mb-8">
            <Text className="text-lg font-bold text-gray-900 mb-2">Notes</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-3 py-3 text-gray-900"
              placeholder="Any additional tips, variations, or notes..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

export default EditRecipeModal;