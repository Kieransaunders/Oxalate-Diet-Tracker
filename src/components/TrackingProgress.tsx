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
}

const TrackingProgress: React.FC<TrackingProgressProps> = ({ onOpenTracker }) => {
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
    if (dateString === yesterday.toISOString().split('T')[0]) return 'Yest';
    
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
        return 'Well within safe zone';
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
    <View className="mx-4 mb-4">
      {/* Today's Progress */}
      <Pressable
        onPress={onOpenTracker}
        className="bg-white rounded-lg p-4 shadow-sm border border-gray-100"
      >
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-1">
            <Text className="text-lg font-bold text-gray-900">Today's Progress</Text>
            <Text className="text-gray-600 text-sm">{getDietAwareMessage()}</Text>
          </View>
          <View className="items-end">
            <Text 
              className="text-xl font-bold"
              style={{ color: isOverLimit ? '#ef4444' : getCategoryColor(currentCategory) }}
            >
              {currentDay.totalOxalate.toFixed(1)}
            </Text>
            <Text className="text-gray-500 text-sm">of {effectiveDailyLimit}mg</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View className="bg-gray-200 h-2 rounded-full mb-3">
          <View
            className="h-2 rounded-full"
            style={{
              width: `${Math.min(progressPercentage, 100)}%`,
              backgroundColor: isOverLimit ? '#ef4444' : getCategoryColor(currentCategory),
            }}
          />
        </View>

        {/* 7-Day Mini Chart */}
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-sm font-medium text-gray-700">7-Day Trend</Text>
          <Text className="text-xs text-gray-500">{currentDay.items.length} foods today</Text>
        </View>

        <View className="flex-row items-end justify-between h-12">
          {weekData.map((day, index) => {
            const height = maxOxalate > 0 ? (day.oxalate / maxOxalate) * 40 : 0;
            const isToday = day.date === currentDay.date;
            const dayCategory = getOxalateCategory(day.oxalate);
            
            return (
              <View key={day.date} className="flex-1 items-center">
                <View
                  className="w-4 rounded-t-sm mb-1"
                  style={{
                    height: Math.max(height, 1),
                    backgroundColor: isToday 
                      ? (isOverLimit ? '#ef4444' : getCategoryColor(currentCategory))
                      : day.oxalate > effectiveDailyLimit 
                        ? '#ef4444' 
                        : getCategoryColor(dayCategory),
                    opacity: isToday ? 1 : 0.6,
                  }}
                />
                <Text className={cn(
                  "text-xs",
                  isToday ? "font-bold text-gray-900" : "text-gray-500"
                )}>
                  {getDayLabel(day.date)}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Tap to view details */}
        <View className="flex-row items-center justify-center mt-2">
          <Text className="text-blue-600 text-sm font-medium mr-1">Tap to view details</Text>
          <Ionicons name="chevron-forward" size={14} color="#3b82f6" />
        </View>
      </Pressable>
    </View>
  );
};

export default TrackingProgress;