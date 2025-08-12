import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUserPreferencesStore } from '../state/userPreferencesStore';
import { useMealStore } from '../state/mealStore';
import { 
  DietType, 
  MedicalCondition, 
  OxalateLevel, 
  OraclePersonality,
  dietTypePresets,
  oraclePersonalities
} from '../types/userPreferences';
import { cn } from '../utils/cn';

interface SettingsScreenProps {
  visible: boolean;
  onClose: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ visible, onClose }) => {
  const insets = useSafeAreaInsets();
  const { 
    userPreferences, 
    setDietType, 
    setTargetDailyLimit, 
    setMedicalCondition,
    updatePreferences,
    updateProfile,
    resetToDefaults 
  } = useUserPreferencesStore();
  const { setDailyLimit } = useMealStore();

  const [customLimit, setCustomLimit] = useState(userPreferences.targetDailyLimit.toString());
  const [showCustomLimit, setShowCustomLimit] = useState(false);

  const handleDietTypeChange = (dietType: DietType) => {
    setDietType(dietType);
    // Also update the meal tracker's daily limit
    const preset = dietTypePresets[dietType];
    setDailyLimit(preset.limit);
  };

  const handleCustomLimitSave = () => {
    const limit = parseFloat(customLimit);
    if (limit > 0 && limit <= 1000) {
      setTargetDailyLimit(limit);
      setDailyLimit(limit);
      setShowCustomLimit(false);
    } else {
      Alert.alert('Invalid Limit', 'Please enter a valid limit between 1-1000mg');
    }
  };

  const handleResetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to defaults? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: () => {
            resetToDefaults();
            setDailyLimit(50); // Reset meal tracker limit too
          }
        }
      ]
    );
  };

  const getDietTypeColor = (dietType: DietType) => {
    switch (dietType) {
      case 'low-oxalate': return { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-700' };
      case 'moderate-oxalate': return { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-700' };
      case 'high-oxalate': return { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-700' };
      case 'unrestricted': return { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-700' };
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View className="flex-1 bg-gray-50">
        {/* Header */}
        <View 
          className="bg-blue-600 px-4 py-4 border-b border-blue-700"
          style={{ paddingTop: insets.top + 16 }}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-white">Settings</Text>
              <Text className="text-blue-100 text-sm">Personalize your experience</Text>
            </View>
            
            <Pressable
              onPress={onClose}
              className="w-10 h-10 items-center justify-center rounded-full bg-blue-500"
            >
              <Ionicons name="close" size={20} color="white" />
            </Pressable>
          </View>
        </View>

        <ScrollView className="flex-1 px-4 py-6" showsVerticalScrollIndicator={false}>
          {/* Diet Type Section */}
          <View className="mb-8">
            <Text className="text-xl font-bold text-gray-900 mb-4">Diet Profile</Text>
            
            <View className="mb-4">
              <Text className="font-medium text-gray-700 mb-3">What type of diet are you following?</Text>
              <View className="space-y-2">
                {(Object.keys(dietTypePresets) as DietType[]).map((type) => {
                  const preset = dietTypePresets[type];
                  const colors = getDietTypeColor(type);
                  const isSelected = userPreferences.dietType === type;
                  
                  return (
                    <Pressable
                      key={type}
                      onPress={() => handleDietTypeChange(type)}
                      className={cn(
                        "p-4 rounded-lg border-2",
                        isSelected ? `${colors.bg} ${colors.border}` : "bg-white border-gray-200"
                      )}
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-1">
                          <Text className={cn(
                            "font-semibold text-base",
                            isSelected ? colors.text : "text-gray-900"
                          )}>
                            {type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} Diet
                          </Text>
                          <Text className="text-gray-600 text-sm mt-1">
                            {preset.description} • Target: {preset.limit}mg/day
                          </Text>
                        </View>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={24} color={colors.text.includes('green') ? '#16a34a' : colors.text.includes('blue') ? '#2563eb' : '#7c3aed'} />
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Custom Daily Limit */}
            <View className="bg-white rounded-lg p-4 border border-gray-200">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="font-medium text-gray-900">Daily Oxalate Target</Text>
                  <Text className="text-gray-600 text-sm">Current: {userPreferences.targetDailyLimit}mg per day</Text>
                </View>
                <Pressable
                  onPress={() => setShowCustomLimit(true)}
                  className="bg-blue-100 px-3 py-2 rounded-lg"
                >
                  <Text className="text-blue-700 font-medium text-sm">Customize</Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Medical Conditions */}
          <View className="mb-8">
            <Text className="text-xl font-bold text-gray-900 mb-4">Medical Information</Text>
            <Text className="text-gray-600 text-sm mb-3">Help us provide better guidance (optional)</Text>
            
            <View className="space-y-2">
              {[null, 'kidney-stones', 'hyperoxaluria', 'other'].map((condition) => (
                <Pressable
                  key={condition || 'none'}
                  onPress={() => setMedicalCondition(condition as MedicalCondition)}
                  className={cn(
                    "p-3 rounded-lg border flex-row items-center justify-between",
                    userPreferences.medicalCondition === condition 
                      ? "bg-blue-50 border-blue-300" 
                      : "bg-white border-gray-200"
                  )}
                >
                  <Text className={cn(
                    "font-medium",
                    userPreferences.medicalCondition === condition ? "text-blue-700" : "text-gray-900"
                  )}>
                    {condition === null ? 'No medical conditions' :
                     condition === 'kidney-stones' ? 'History of kidney stones' :
                     condition === 'hyperoxaluria' ? 'Hyperoxaluria' :
                     'Other condition'}
                  </Text>
                  {userPreferences.medicalCondition === condition && (
                    <Ionicons name="checkmark-circle" size={20} color="#2563eb" />
                  )}
                </Pressable>
              ))}
            </View>
          </View>

          {/* Oracle Personality */}
          <View className="mb-8">
            <Text className="text-xl font-bold text-gray-900 mb-4">Oracle Personality</Text>
            <Text className="text-gray-600 text-sm mb-3">Choose how the Oracle responds to your questions</Text>
            
            <View className="space-y-2">
              {(Object.keys(oraclePersonalities) as OraclePersonality[]).map((personality) => {
                const config = oraclePersonalities[personality];
                const isSelected = userPreferences.preferences.oraclePersonality === personality;
                
                return (
                  <Pressable
                    key={personality}
                    onPress={() => updatePreferences({ oraclePersonality: personality })}
                    className={cn(
                      "p-4 rounded-lg border flex-row items-start",
                      isSelected ? "bg-purple-50 border-purple-300" : "bg-white border-gray-200"
                    )}
                  >
                    <Text className="text-2xl mr-3">{config.icon}</Text>
                    <View className="flex-1">
                      <Text className={cn(
                        "font-semibold",
                        isSelected ? "text-purple-700" : "text-gray-900"
                      )}>
                        {config.name}
                      </Text>
                      <Text className="text-gray-600 text-sm mt-1">
                        {config.description}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={20} color="#7c3aed" />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Preferences */}
          <View className="mb-8">
            <Text className="text-xl font-bold text-gray-900 mb-4">App Preferences</Text>
            
            <View className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
              <View className="p-4 flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="font-medium text-gray-900">High Oxalate Warnings</Text>
                  <Text className="text-gray-600 text-sm">Show alerts for high-oxalate foods</Text>
                </View>
                <Switch
                  value={userPreferences.preferences.showHighOxalateWarnings}
                  onValueChange={(value) => updatePreferences({ showHighOxalateWarnings: value })}
                  trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
                  thumbColor={userPreferences.preferences.showHighOxalateWarnings ? '#ffffff' : '#ffffff'}
                />
              </View>
              
              <View className="p-4 flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="font-medium text-gray-900">Personalized Tips</Text>
                  <Text className="text-gray-600 text-sm">Get suggestions based on your diet type</Text>
                </View>
                <Switch
                  value={userPreferences.preferences.enablePersonalizedTips}
                  onValueChange={(value) => updatePreferences({ enablePersonalizedTips: value })}
                  trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
                  thumbColor={userPreferences.preferences.enablePersonalizedTips ? '#ffffff' : '#ffffff'}
                />
              </View>
            </View>
          </View>

          {/* Reset Section */}
          <View className="mb-8">
            <Pressable
              onPress={handleResetSettings}
              className="bg-red-50 border border-red-200 rounded-lg p-4"
            >
              <View className="flex-row items-center">
                <Ionicons name="refresh-outline" size={20} color="#dc2626" />
                <View className="flex-1 ml-3">
                  <Text className="font-medium text-red-700">Reset All Settings</Text>
                  <Text className="text-red-600 text-sm">Restore default preferences</Text>
                </View>
              </View>
            </Pressable>
          </View>
        </ScrollView>

        {/* Custom Limit Modal */}
        <Modal visible={showCustomLimit} transparent animationType="fade">
          <View className="flex-1 bg-black/50 items-center justify-center px-4">
            <View className="bg-white rounded-lg p-6 w-full max-w-sm">
              <Text className="text-lg font-bold text-gray-900 mb-4">Custom Daily Limit</Text>
              
              <Text className="text-gray-600 text-sm mb-3">
                Enter your target daily oxalate limit in mg
              </Text>
              
              <TextInput
                className="border border-gray-300 rounded-lg px-3 py-3 text-gray-900 mb-4"
                placeholder="e.g., 50"
                value={customLimit}
                onChangeText={setCustomLimit}
                keyboardType="numeric"
                autoFocus
              />
              
              <View className="flex-row space-x-3">
                <Pressable
                  onPress={() => setShowCustomLimit(false)}
                  className="flex-1 bg-gray-100 py-3 rounded-lg"
                >
                  <Text className="text-gray-700 font-medium text-center">Cancel</Text>
                </Pressable>
                
                <Pressable
                  onPress={handleCustomLimitSave}
                  className="flex-1 bg-blue-600 py-3 rounded-lg"
                >
                  <Text className="text-white font-medium text-center">Save</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
};

export default SettingsScreen;