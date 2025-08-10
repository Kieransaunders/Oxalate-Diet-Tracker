import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCategoryColor, getOxalateCategory } from '../api/oxalate-api';
import { cn } from '../utils/cn';
import type { OxalateFoodItem } from '../types/oxalate';

interface PortionSelectorProps {
  food: OxalateFoodItem;
  visible: boolean;
  onClose: () => void;
  onAddToMeal?: (food: OxalateFoodItem, portion: number, oxalateAmount: number) => void;
}

const PortionSelector: React.FC<PortionSelectorProps> = ({ 
  food, 
  visible, 
  onClose, 
  onAddToMeal 
}) => {
  const [selectedPortion, setSelectedPortion] = useState(1);
  const [customAmount, setCustomAmount] = useState('');
  const [useCustom, setUseCustom] = useState(false);

  const standardPortions = [0.25, 0.5, 1, 1.5, 2, 3];
  
  const currentPortion = useCustom ? parseFloat(customAmount) || 0 : selectedPortion;
  const calculatedOxalate = (food.oxalate_mg * currentPortion);
  const calculatedCategory = getOxalateCategory(calculatedOxalate);
  const calculatedCalories = food.calories ? Math.round(food.calories * currentPortion) : null;

  const handleAddToMeal = () => {
    if (onAddToMeal && currentPortion > 0) {
      onAddToMeal(food, currentPortion, calculatedOxalate);
      onClose();
    }
  };

  const renderPortionButton = (portion: number) => {
    const isSelected = !useCustom && selectedPortion === portion;
    
    return (
      <Pressable
        key={portion}
        onPress={() => {
          setSelectedPortion(portion);
          setUseCustom(false);
        }}
        className={cn(
          "px-4 py-3 rounded-lg border-2 mr-3 mb-3",
          isSelected 
            ? "border-blue-500 bg-blue-50" 
            : "border-gray-200 bg-white"
        )}
      >
        <Text className={cn(
          "text-center font-medium",
          isSelected ? "text-blue-700" : "text-gray-700"
        )}>
          {portion === 1 ? '1x' : `${portion}x`}
        </Text>
        <Text className="text-xs text-gray-500 text-center">
          {portion === 1 ? 'Standard' : `${portion} servings`}
        </Text>
      </Pressable>
    );
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
        <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-200">
          <View className="flex-1">
            <Text className="text-xl font-bold text-gray-900">Choose Portion</Text>
            <Text className="text-gray-600">{food.name}</Text>
          </View>
          <Pressable
            onPress={onClose}
            className="w-8 h-8 items-center justify-center rounded-full bg-gray-100"
          >
            <Ionicons name="close" size={20} color="#6b7280" />
          </Pressable>
        </View>

        <View className="flex-1 px-6 py-6">
          {/* Standard Serving Info */}
          <View className="bg-gray-50 p-4 rounded-lg mb-6">
            <Text className="font-semibold text-gray-900 mb-1">Standard Serving</Text>
            <Text className="text-gray-700">{food.serving_size}</Text>
            <Text className="text-gray-600 text-sm">
              {food.oxalate_mg} mg oxalate{food.calories ? ` • ${food.calories} calories` : ''}
            </Text>
          </View>

          {/* Portion Selection */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-3">Select Portion</Text>
            
            {/* Standard Portions */}
            <View className="flex-row flex-wrap mb-4">
              {standardPortions.map(renderPortionButton)}
            </View>

            {/* Custom Amount */}
            <View className="border-t border-gray-200 pt-4">
              <Text className="font-medium text-gray-700 mb-2">Custom Amount</Text>
              <View className="flex-row items-center">
                <TextInput
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 mr-3"
                  placeholder="Enter multiplier"
                  value={customAmount}
                  onChangeText={setCustomAmount}
                  keyboardType="decimal-pad"
                  onFocus={() => setUseCustom(true)}
                />
                <Text className="text-gray-600">× servings</Text>
              </View>
            </View>
          </View>

          {/* Calculated Values */}
          {currentPortion > 0 && (
            <View 
              className="p-4 rounded-lg mb-6"
              style={{ 
                backgroundColor: getCategoryColor(calculatedCategory) + '15',
                borderColor: getCategoryColor(calculatedCategory) + '30',
                borderWidth: 1,
              }}
            >
              <Text className="text-lg font-semibold text-gray-900 mb-2">
                Your Portion ({currentPortion}× serving)
              </Text>
              
              <View className="flex-row items-center mb-2">
                <View
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: getCategoryColor(calculatedCategory) }}
                />
                <Text 
                  className="font-bold text-lg"
                  style={{ color: getCategoryColor(calculatedCategory) }}
                >
                  {calculatedOxalate.toFixed(1)} mg oxalate
                </Text>
              </View>
              
              <Text 
                className="font-medium mb-1"
                style={{ color: getCategoryColor(calculatedCategory) }}
              >
                {calculatedCategory} Oxalate Level
              </Text>
              
              {calculatedCalories && (
                <Text className="text-gray-700">
                  {calculatedCalories} calories
                </Text>
              )}
            </View>
          )}

          {/* Action Buttons */}
          {onAddToMeal && (
            <View className="flex-row space-x-3">
              <Pressable
                onPress={onClose}
                className="flex-1 bg-gray-200 py-3 rounded-lg"
              >
                <Text className="text-center font-semibold text-gray-700">Cancel</Text>
              </Pressable>
              
              <Pressable
                onPress={handleAddToMeal}
                disabled={currentPortion <= 0}
                className={cn(
                  "flex-1 py-3 rounded-lg",
                  currentPortion > 0 
                    ? "bg-blue-500" 
                    : "bg-gray-300"
                )}
              >
                <Text className={cn(
                  "text-center font-semibold",
                  currentPortion > 0 ? "text-white" : "text-gray-500"
                )}>
                  Add to Meal
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default PortionSelector;