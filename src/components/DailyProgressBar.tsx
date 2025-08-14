import React from 'react';
import {
  View,
  Text,
  Pressable,
} from 'react-native';
import { useMealStore } from '../state/mealStore';
import { useUserPreferencesStore } from '../state/userPreferencesStore';
import { getCategoryColor, getOxalateCategory } from '../api/oxalate-api';

interface DailyProgressBarProps {
  onOpenTracker: () => void;
}

const DailyProgressBar: React.FC<DailyProgressBarProps> = ({ onOpenTracker }) => {
  const { currentDay } = useMealStore();
  const { userPreferences } = useUserPreferencesStore();

  const effectiveDailyLimit = userPreferences.targetDailyLimit;
  const progressPercentage = (currentDay.totalOxalate / effectiveDailyLimit) * 100;
  const isOverLimit = currentDay.totalOxalate > effectiveDailyLimit;
  const currentCategory = getOxalateCategory(currentDay.totalOxalate);

  const getDietAwareMessage = () => {
    const { dietType } = userPreferences;
    
    if (dietType === 'high-oxalate') {
      return 'Focus on nutrient-dense foods';
    } else if (dietType === 'unrestricted') {
      return 'Tracking for awareness';
    } else {
      if (progressPercentage <= 50) {
        return 'Within daily target';
      } else if (progressPercentage <= 80) {
        return 'Good progress';
      } else if (progressPercentage <= 100) {
        return 'Approaching limit';
      } else {
        return 'Consider lower oxalate foods';
      }
    }
  };

  return (
    <Pressable
      onPress={onOpenTracker}
      className="mx-4 my-4 bg-white rounded-lg p-4 shadow-sm border border-gray-100"
    >
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-1">
          <Text className="text-base font-bold text-gray-900">Today's Progress</Text>
          <Text className="text-gray-600 text-sm">{getDietAwareMessage()}</Text>
        </View>
        <View className="items-end">
          <Text 
            className="text-lg font-bold"
            style={{ color: isOverLimit ? '#ef4444' : getCategoryColor(currentCategory) }}
          >
            {currentDay.totalOxalate.toFixed(1)}
          </Text>
          <Text className="text-gray-500 text-xs">of {effectiveDailyLimit}mg</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View className="bg-gray-200 h-2 rounded-full">
        <View
          className="h-2 rounded-full"
          style={{
            width: `${Math.min(progressPercentage, 100)}%`,
            backgroundColor: isOverLimit ? '#ef4444' : getCategoryColor(currentCategory),
          }}
        />
      </View>
    </Pressable>
  );
};

export default DailyProgressBar;