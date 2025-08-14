import React from 'react';
import {
  View,
  Text,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMealStore } from '../state/mealStore';
import { useUserPreferencesStore } from '../state/userPreferencesStore';
import { getCategoryColor, getOxalateCategory } from '../api/oxalate-api';
import { cn } from '../utils/cn';

interface TrackingProgressProps {
  onOpenTracker: () => void;
  hideDetailsButton?: boolean;
  showEditLimit?: boolean;
  onEditLimit?: () => void;
}

const TrackingProgress: React.FC<TrackingProgressProps> = ({ onOpenTracker, hideDetailsButton = false, showEditLimit = false, onEditLimit }) => {
  const { currentDay, mealHistory } = useMealStore();
  const { userPreferences } = useUserPreferencesStore();

  const effectiveDailyLimit = userPreferences.targetDailyLimit;
  const progressPercentage = (currentDay.totalOxalate / effectiveDailyLimit) * 100;
  const isOverLimit = currentDay.totalOxalate > effectiveDailyLimit;
  const currentCategory = getOxalateCategory(currentDay.totalOxalate);

  // Get last 7 days of data for mini chart
  const getLast7Days = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      if (dateString === currentDay.date) {
        days.push({ date: dateString, oxalate: currentDay.totalOxalate });
      } else {
        const historicalDay = mealHistory.find(day => day.date === dateString);
        days.push({ 
          date: dateString, 
          oxalate: historicalDay ? historicalDay.totalOxalate : 0 
        });
      }
    }
    
    return days;
  };

  const weekData = getLast7Days();
  const maxOxalate = Math.max(...weekData.map(d => d.oxalate), effectiveDailyLimit);

  const getDayLabel = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (dateString === today.toISOString().split('T')[0]) return 'Today';
    if (dateString === yesterday.toISOString().split('T')[0]) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3);
  };

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
      className="bg-white rounded-lg p-4 shadow-sm border border-gray-100"
    >
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-1">
          <Text className="text-lg font-bold text-gray-900">Today's Progress</Text>
          <Text className="text-gray-600 text-sm">{getDietAwareMessage()}</Text>
        </View>
        <View className="items-end">
          <View className="flex-row items-center">
            <View className="items-end mr-3">
              <Text 
                className="text-xl font-bold"
                style={{ color: isOverLimit ? '#ef4444' : getCategoryColor(currentCategory) }}
              >
                {currentDay.totalOxalate.toFixed(1)}
              </Text>
              <Text className="text-gray-500 text-sm">of {effectiveDailyLimit}mg</Text>
            </View>
            {showEditLimit && onEditLimit && (
              <Pressable
                onPress={onEditLimit}
                className="flex-row items-center"
              >
                <Text className="text-blue-500 text-xs mr-1">Edit</Text>
                <Ionicons name="settings-outline" size={14} color="#3b82f6" />
              </Pressable>
            )}
          </View>
        </View>
      </View>

      {/* Progress Bar */}
      <View className="bg-gray-200 h-2 rounded-full mb-4">
        <View
          className="h-2 rounded-full"
          style={{
            width: `${Math.min(progressPercentage, 100)}%`,
            backgroundColor: isOverLimit ? '#ef4444' : getCategoryColor(currentCategory),
          }}
        />
      </View>

      {/* 7-Day Mini Chart */}
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-sm font-medium text-gray-700">7-Day Trend</Text>
        <Text className="text-xs text-gray-500">{currentDay.items.length} foods today</Text>
      </View>

      <View className="space-y-1">
        {/* Chart bars and regular days (Mon-Fri) */}
        <View className="flex-row items-end justify-between h-12">
          {weekData.slice(0, 5).map((day, index) => {
            const height = maxOxalate > 0 ? (day.oxalate / maxOxalate) * 40 : 0;
            const dayCategory = getOxalateCategory(day.oxalate);
            
            return (
              <View key={day.date} className="flex-1 items-center">
                <View
                  className="w-4 rounded-t-sm mb-1"
                  style={{
                    height: Math.max(height, 1),
                    backgroundColor: day.oxalate > effectiveDailyLimit 
                      ? '#ef4444' 
                      : getCategoryColor(dayCategory),
                    opacity: 0.6,
                  }}
                />
                <Text className="text-xs text-center text-gray-500">
                  {getDayLabel(day.date)}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Yesterday row */}
        {weekData[5] && (
          <View className="flex-row items-center py-2 bg-gray-50 rounded px-2">
            <Text className="text-sm font-medium text-gray-700 flex-1">Yesterday</Text>
            <View className="flex-row items-center">
              <View
                className="w-3 h-3 rounded-full mr-2"
                style={{
                  backgroundColor: weekData[5].oxalate > effectiveDailyLimit 
                    ? '#ef4444' 
                    : getCategoryColor(getOxalateCategory(weekData[5].oxalate)),
                }}
              />
              <Text className="text-sm font-semibold text-gray-900">
                {weekData[5].oxalate.toFixed(1)} mg
              </Text>
            </View>
          </View>
        )}

        {/* Today row */}
        {weekData[6] && (
          <View className="flex-row items-center py-2 bg-blue-50 rounded px-2">
            <Text className="text-sm font-bold text-blue-900 flex-1">Today</Text>
            <View className="flex-row items-center">
              <View
                className="w-3 h-3 rounded-full mr-2"
                style={{
                  backgroundColor: isOverLimit ? '#ef4444' : getCategoryColor(currentCategory),
                }}
              />
              <Text className="text-sm font-bold text-blue-900">
                {currentDay.totalOxalate.toFixed(1)} mg
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Tap to view details */}
      {!hideDetailsButton && (
        <View className="flex-row items-center justify-center mt-3">
          <Text className="text-blue-600 text-sm font-medium mr-1">Tap to view details</Text>
          <Ionicons name="chevron-forward" size={14} color="#3b82f6" />
        </View>
      )}
    </Pressable>
  );
};

export default TrackingProgress;