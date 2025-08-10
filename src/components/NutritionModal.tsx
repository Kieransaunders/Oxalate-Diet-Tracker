import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCategoryColor } from '../api/oxalate-api';
import { cn } from '../utils/cn';
import PortionSelector from './PortionSelector';
import type { OxalateFoodItem } from '../types/oxalate';

interface NutritionModalProps {
  food: OxalateFoodItem | null;
  visible: boolean;
  onClose: () => void;
  onAddToMeal?: (food: OxalateFoodItem, portion: number, oxalateAmount: number) => void;
}

const NutritionModal: React.FC<NutritionModalProps> = ({ food, visible, onClose, onAddToMeal }) => {
  const [showPortionSelector, setShowPortionSelector] = useState(false);
  
  if (!food) return null;

  const nutritionFacts = [
    { label: 'Calories', value: food.calories, unit: '' },
    { label: 'Protein', value: food.protein_g, unit: 'g' },
    { label: 'Fiber', value: food.fiber_g, unit: 'g' },
  ].filter(item => item.value !== undefined && item.value !== null);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-200">
          <View className="flex-1">
            <Text className="text-xl font-bold text-gray-900">{food.name}</Text>
            <Text className="text-gray-600">{food.group}</Text>
          </View>
          <Pressable
            onPress={onClose}
            className="w-8 h-8 items-center justify-center rounded-full bg-gray-100"
          >
            <Ionicons name="close" size={20} color="#6b7280" />
          </Pressable>
        </View>

        <ScrollView className="flex-1 px-6 py-4">
          {/* Oxalate Warning */}
          <View 
            className="p-4 rounded-lg mb-6"
            style={{ backgroundColor: getCategoryColor(food.category) + '15' }}
          >
            <View className="flex-row items-center mb-2">
              <View
                className="w-4 h-4 rounded-full mr-3"
                style={{ backgroundColor: getCategoryColor(food.category) }}
              />
              <Text 
                className="font-semibold text-lg"
                style={{ color: getCategoryColor(food.category) }}
              >
                {food.oxalate_mg} mg Oxalate
              </Text>
            </View>
            <Text 
              className="font-medium mb-1"
              style={{ color: getCategoryColor(food.category) }}
            >
              {food.category} Oxalate Food
            </Text>
            <Text className="text-gray-700 text-sm">
              {food.category === 'Low' && 'Safe for most low-oxalate diets'}
              {food.category === 'Medium' && 'Consume in moderation'}
              {food.category === 'High' && 'Limit portions or avoid if sensitive'}
              {food.category === 'Very High' && 'Best avoided on low-oxalate diets'}
            </Text>
          </View>

          {/* Serving Size */}
          {food.serving_size && (
            <View className="mb-6">
              <Text className="text-lg font-semibold text-gray-900 mb-2">Serving Size</Text>
              <Text className="text-gray-700 text-base">{food.serving_size}</Text>
              {food.serving_grams && (
                <Text className="text-gray-500 text-sm">({food.serving_grams}g)</Text>
              )}
            </View>
          )}

          {/* Nutrition Facts */}
          {nutritionFacts.length > 0 && (
            <View className="mb-6">
              <Text className="text-lg font-semibold text-gray-900 mb-3">Nutrition Facts</Text>
              <View className="bg-gray-50 rounded-lg p-4">
                {nutritionFacts.map((fact, index) => (
                  <View 
                    key={fact.label}
                    className={cn(
                      "flex-row justify-between items-center py-2",
                      index < nutritionFacts.length - 1 && "border-b border-gray-200"
                    )}
                  >
                    <Text className="text-gray-700 font-medium">{fact.label}</Text>
                    <Text className="text-gray-900 font-semibold">
                      {fact.value}{fact.unit}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Alternative Names */}
          {food.aliases && food.aliases.length > 0 && (
            <View className="mb-6">
              <Text className="text-lg font-semibold text-gray-900 mb-2">Also Known As</Text>
              <View className="flex-row flex-wrap">
                {food.aliases.map((alias, index) => (
                  <View 
                    key={index}
                    className="bg-blue-100 px-3 py-1 rounded-full mr-2 mb-2"
                  >
                    <Text className="text-blue-800 text-sm font-medium capitalize">
                      {alias}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Tips */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-2">Tips</Text>
            <View className="bg-blue-50 p-4 rounded-lg">
              <Text className="text-blue-900 text-sm leading-5">
                {food.category === 'Low' && 'This food can be enjoyed freely on most low-oxalate diets. Great for daily meals!'}
                {food.category === 'Medium' && 'Enjoy this food in moderation. Consider pairing with calcium-rich foods to reduce oxalate absorption.'}
                {food.category === 'High' && 'Limit portion sizes and frequency. Consider cooking methods that may reduce oxalate content.'}
                {food.category === 'Very High' && 'Best to avoid or strictly limit this food. If consumed, pair with calcium and stay well hydrated.'}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          {onAddToMeal && (
            <View className="flex-row space-x-3 mb-8">
              <Pressable
                onPress={() => setShowPortionSelector(true)}
                className="flex-1 bg-blue-500 py-3 rounded-lg"
              >
                <Text className="text-center font-semibold text-white">
                  Choose Portion & Add to Meal
                </Text>
              </Pressable>
            </View>
          )}
        </ScrollView>

        {/* Portion Selector Modal */}
        <PortionSelector
          food={food}
          visible={showPortionSelector}
          onClose={() => setShowPortionSelector(false)}
          onAddToMeal={onAddToMeal}
        />
      </View>
    </Modal>
  );
};

export default NutritionModal;