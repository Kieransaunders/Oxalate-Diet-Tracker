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
import { useSubscriptionStore } from '../state/subscriptionStore';
import { getCategoryColor, getOxalateCategory } from '../api/oxalate-api';
import { cn } from '../utils/cn';
import TrackingProgress from './TrackingProgress';
import PremiumGate from './PremiumGate';

interface MealTrackerProps {
  visible: boolean;
  onClose: () => void;
  onOpenSettings?: () => void;
}

const MealTracker: React.FC<MealTrackerProps> = ({ visible, onClose, onOpenSettings }) => {
  const {
    currentDay,
    dailyLimit,
    removeMealItem,
    setDailyLimit,
    clearDay,
  } = useMealStore();
  
  const { userPreferences, setTargetDailyLimit } = useUserPreferencesStore();
  const { 
    status: subscriptionStatus, 
    canTrack, 
    startTracking,
    incrementTrackingDay, 
    getRemainingTrackingDays 
  } = useSubscriptionStore();

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
            {subscriptionStatus === 'premium' ? (
              <Text className="text-green-600 text-sm">
                Premium: Unlimited tracking
              </Text>
            ) : (
              <Text className="text-gray-600 text-sm">
                Free: {getRemainingTrackingDays()} days remaining
              </Text>
            )}
          </View>
          <View className="flex-row items-center">
            {onOpenSettings && (
              <Pressable
                onPress={onOpenSettings}
                className="w-8 h-8 items-center justify-center rounded-full bg-gray-100 mr-3"
              >
                <Ionicons name="settings-outline" size={20} color="#6b7280" />
              </Pressable>
            )}
            <Pressable
              onPress={onClose}
              className="w-8 h-8 items-center justify-center rounded-full bg-gray-100"
            >
              <Ionicons name="close" size={20} color="#6b7280" />
            </Pressable>
          </View>
        </View>

        <ScrollView className="flex-1 px-6 py-6">
          {canTrack() ? (
            <>
              {/* Help Text */}
              <View className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-8">
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
            </>
          ) : (
            <PremiumGate 
              feature="tracking" 
              customMessage="Your 7-day free tracking trial has ended. Upgrade to Premium for unlimited meal tracking with progress analytics!"
            >
              <View className="opacity-50">
                <View className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-8">
                  <View className="flex-row items-start">
                    <Ionicons name="analytics" size={20} color="#9ca3af" />
                    <View className="flex-1 ml-3">
                      <Text className="text-gray-500 font-medium text-sm mb-1">
                        Tracking Unavailable
                      </Text>
                      <Text className="text-gray-400 text-xs leading-4">
                        Upgrade to Premium to continue tracking your oxalate intake.
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </PremiumGate>
          )}

          {canTrack() && (
            <>

          {/* 7-Day Progress Overview */}
          <View className="mb-8">
            <TrackingProgress
              onOpenTracker={() => {}} // Empty since we're already in the tracker
              hideDetailsButton={true} // Hide the details button since we're in the tracker
              showEditLimit={true} // Show edit limit button in tracker
              onEditLimit={() => setShowLimitEditor(true)} // Handle edit limit press
            />
          </View>


          {/* Meal Items */}
          <View className="mb-8">
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
            </>
          )}
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