import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMealStore } from '../state/mealStore';
import { useUserPreferencesStore } from '../state/userPreferencesStore';
import { getCategoryColor, getOxalateCategory } from '../api/oxalate-api';
import { cn } from '../utils/cn';

interface MealTrackerProps {
  visible: boolean;
  onClose: () => void;
}

const MealTracker: React.FC<MealTrackerProps> = ({ visible, onClose }) => {
  const {
    currentDay,
    dailyLimit,
    removeMealItem,
    setDailyLimit,
    clearDay,
  } = useMealStore();
  
  const { userPreferences, setTargetDailyLimit } = useUserPreferencesStore();

  const [showLimitEditor, setShowLimitEditor] = useState(false);
  const [limitInput, setLimitInput] = useState(userPreferences.targetDailyLimit.toString());

  // Update limitInput when user preferences change
  useEffect(() => {
    setLimitInput(userPreferences.targetDailyLimit.toString());
  }, [userPreferences.targetDailyLimit]);

  // Use the limit from user preferences
  const effectiveDailyLimit = userPreferences.targetDailyLimit;
  const progressPercentage = (currentDay.totalOxalate / effectiveDailyLimit) * 100;
  const isOverLimit = currentDay.totalOxalate > effectiveDailyLimit;
  const currentCategory = getOxalateCategory(currentDay.totalOxalate);

  const handleSaveLimit = () => {
    const newLimit = parseFloat(limitInput);
    if (newLimit > 0) {
      // Update both stores to keep them in sync
      setTargetDailyLimit(newLimit);
      setDailyLimit(newLimit);
    }
    setShowLimitEditor(false);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getDietAwareHelpText = () => {
    const { dietType } = userPreferences;
    
    switch (dietType) {
      case 'low-oxalate':
        return 'Track foods you eat throughout the day. Low-oxalate diets typically recommend staying under 40-50mg per day for kidney stone prevention.';
      case 'moderate-oxalate':
        return 'Monitor your daily oxalate intake while maintaining nutritional balance. Aim for 50-100mg per day as a moderate approach.';
      case 'high-oxalate':
        return 'Track your nutrient-dense food choices. You can enjoy higher oxalate foods with proper preparation and calcium pairing.';
      case 'unrestricted':
        return 'Track your daily oxalate intake for educational purposes. No restrictions needed, but awareness is valuable.';
      default:
        return 'Track foods you eat throughout the day. Customize your daily limit to match your dietary goals.';
    }
  };

  const getDietAwareProgressMessage = () => {
    const { dietType } = userPreferences;
    const percentage = progressPercentage;
    
    if (dietType === 'high-oxalate') {
      if (percentage < 50) {
        return 'Consider adding more nutrient-dense foods to your day';
      } else if (percentage < 100) {
        return 'Great balance of nutritious foods!';
      } else {
        return 'Excellent nutrient intake - remember to pair with calcium';
      }
    } else if (dietType === 'unrestricted') {
      return `${currentDay.totalOxalate.toFixed(1)}mg tracked for awareness`;
    } else {
      // low-oxalate and moderate-oxalate
      if (percentage <= 50) {
        return 'Excellent! Well within your safe zone';
      } else if (percentage <= 80) {
        return 'Good progress, staying within limits';
      } else if (percentage <= 100) {
        return 'Approaching your daily limit';
      } else {
        return 'Consider reducing portion sizes or choosing lower oxalate alternatives.';
      }
    }
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
            <Text className="text-xl font-bold text-gray-900">Daily Tracker</Text>
            <Text className="text-gray-600">{currentDay.date}</Text>
          </View>
          <Pressable
            onPress={onClose}
            className="w-8 h-8 items-center justify-center rounded-full bg-gray-100"
          >
            <Ionicons name="close" size={20} color="#6b7280" />
          </Pressable>
        </View>

        <ScrollView className="flex-1 px-6 py-4">
          {/* Help Text */}
          <View className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
            <View className="flex-row items-start">
              <Ionicons name="analytics" size={20} color="#7c3aed" />
              <View className="flex-1 ml-3">
                <Text className="text-purple-900 font-medium text-sm mb-1">
                  Monitor Your Daily Oxalate Intake
                </Text>
                <Text className="text-purple-700 text-xs leading-4">
                  {getDietAwareHelpText()} Tap "Edit Limit" to customize your target.
                </Text>
              </View>
            </View>
          </View>

          {/* Daily Progress */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-lg font-semibold text-gray-900">Daily Progress</Text>
              <Pressable
                onPress={() => setShowLimitEditor(true)}
                className="flex-row items-center"
              >
                <Text className="text-blue-500 text-sm mr-1">Edit Limit</Text>
                <Ionicons name="settings-outline" size={16} color="#3b82f6" />
              </Pressable>
            </View>
            
            {/* Progress Bar */}
            <View className="bg-gray-200 h-4 rounded-full mb-3">
              <View
                className="h-4 rounded-full"
                style={{
                  width: `${Math.min(progressPercentage, 100)}%`,
                  backgroundColor: isOverLimit ? '#ef4444' : getCategoryColor(currentCategory),
                }}
              />
            </View>
            
            <View className="flex-row justify-between items-center">
              <Text 
                className="font-bold text-lg"
                style={{ color: isOverLimit ? '#ef4444' : getCategoryColor(currentCategory) }}
              >
                {currentDay.totalOxalate.toFixed(1)} mg
              </Text>
              <Text className="text-gray-600">
                of {effectiveDailyLimit} mg limit
              </Text>
            </View>

            {/* Diet-aware progress message */}
            <View className="mt-3">
              <Text className="text-sm text-gray-600 text-center">
                {getDietAwareProgressMessage()}
              </Text>
            </View>

            {/* Show warning only for restrictive diets */}
            {isOverLimit && userPreferences.dietType !== 'unrestricted' && userPreferences.dietType !== 'high-oxalate' && (
              <View className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
                <View className="flex-row items-center">
                  <Ionicons name="warning" size={16} color="#ef4444" />
                  <Text className="text-red-800 font-medium ml-2">Over Daily Limit</Text>
                </View>
                <Text className="text-red-700 text-sm mt-1">
                  {getDietAwareProgressMessage()}
                </Text>
              </View>
            )}
          </View>

          {/* Meal Items */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-semibold text-gray-900">
                Today's Foods ({currentDay.items.length})
              </Text>
              {currentDay.items.length > 0 && (
                <Pressable
                  onPress={clearDay}
                  className="px-3 py-1 bg-gray-100 rounded-lg"
                >
                  <Text className="text-gray-700 text-sm">Clear All</Text>
                </Pressable>
              )}
            </View>

            {currentDay.items.length === 0 ? (
              <View className="bg-gray-50 p-6 rounded-lg items-center">
                <Ionicons name="restaurant-outline" size={48} color="#d1d5db" />
                <Text className="text-gray-500 mt-2 text-center">
                  No foods added yet
                </Text>
                <Text className="text-gray-400 text-sm text-center">
                  Add foods from the main list to track your daily oxalate intake
                </Text>
              </View>
            ) : (
              <View className="space-y-3">
                {currentDay.items.map((item) => (
                  <View
                    key={item.id}
                    className="bg-white border border-gray-200 rounded-lg p-4"
                  >
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1">
                        <Text className="font-semibold text-gray-900">
                          {item.food.name}
                        </Text>
                        <Text className="text-gray-600 text-sm">
                          {item.portion}× serving • {formatTime(item.timestamp)}
                        </Text>
                        {item.food.serving_size && (
                          <Text className="text-gray-500 text-xs mt-1">
                            {item.food.serving_size}
                          </Text>
                        )}
                      </View>
                      
                      <View className="items-end ml-3">
                        <Text 
                          className="font-bold"
                          style={{ color: getCategoryColor(getOxalateCategory(item.oxalateAmount)) }}
                        >
                          {item.oxalateAmount.toFixed(1)} mg
                        </Text>
                        <Pressable
                          onPress={() => removeMealItem(item.id)}
                          className="mt-2 p-1"
                        >
                          <Ionicons name="trash-outline" size={16} color="#ef4444" />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Limit Editor Modal */}
        <Modal
          visible={showLimitEditor}
          animationType="fade"
          transparent
          onRequestClose={() => setShowLimitEditor(false)}
        >
          <View className="flex-1 bg-black bg-opacity-50 items-center justify-center px-6">
            <View className="bg-white rounded-lg p-6 w-full max-w-sm">
              <Text className="text-lg font-semibold text-gray-900 mb-4">
                Set Daily Oxalate Limit
              </Text>
              
              <View className="mb-4">
                <Text className="text-gray-700 mb-2">Daily limit (mg)</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-3 py-2"
                  value={limitInput}
                  onChangeText={setLimitInput}
                  keyboardType="decimal-pad"
                  placeholder="Enter limit"
                />
                <Text className="text-gray-500 text-xs mt-1">
                  Common limits: 40mg (strict), 50mg (moderate), 100mg (loose)
                </Text>
              </View>

              <View className="flex-row space-x-3">
                <Pressable
                  onPress={() => setShowLimitEditor(false)}
                  className="flex-1 bg-gray-200 py-2 rounded-lg"
                >
                  <Text className="text-center font-medium text-gray-700">Cancel</Text>
                </Pressable>
                
                <Pressable
                  onPress={handleSaveLimit}
                  className="flex-1 bg-blue-500 py-2 rounded-lg"
                >
                  <Text className="text-center font-medium text-white">Save</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
};

export default MealTracker;