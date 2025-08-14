import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';

interface ConsistentHeaderProps {
  // Main content
  title: string;
  subtitle?: string;
  emoji?: string;
  
  // Navigation
  showBackButton?: boolean;
  onBackPress?: () => void;
  
  // Right side actions (max 2-3 buttons)
  rightActions?: Array<{
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    color?: string;
    testID?: string;
  }>;
  
  // Styling
  backgroundColor?: string;
  titleColor?: string;
  subtitleColor?: string;
  
  // Special layouts
  centerTitle?: boolean;
  showBorder?: boolean;
}

const ConsistentHeader: React.FC<ConsistentHeaderProps> = ({
  title,
  subtitle,
  emoji,
  showBackButton = false,
  onBackPress,
  rightActions = [],
  backgroundColor = '#ffffff',
  titleColor = '#111827',
  subtitleColor = '#6b7280',
  centerTitle = false,
  showBorder = true,
}) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  return (
    <View 
      style={{ 
        paddingTop: insets.top,
        backgroundColor,
        borderBottomWidth: showBorder ? 1 : 0,
        borderBottomColor: '#f3f4f6',
      }}
    >
      <View className="px-6 py-4">
        <View className="flex-row items-center justify-between min-h-[44px]">
          {/* Left Section */}
          <View className="flex-row items-center flex-1">
            {showBackButton && (
              <Pressable
                onPress={handleBackPress}
                className="w-10 h-10 mr-3 items-center justify-center rounded-full bg-gray-100"
                testID="header-back-button"
              >
                <Ionicons name="arrow-back" size={20} color="#374151" />
              </Pressable>
            )}
            
            {/* Title Section */}
            <View className={`flex-1 ${centerTitle ? 'items-center' : ''}`}>
              <View className="flex-row items-center">
                {emoji && (
                  <Text className="text-2xl mr-2">{emoji}</Text>
                )}
                <Text 
                  className={`font-bold ${centerTitle ? 'text-center' : ''}`}
                  style={{ 
                    color: titleColor,
                    fontSize: 20,
                    lineHeight: 28,
                  }}
                  numberOfLines={1}
                >
                  {title}
                </Text>
              </View>
              
              {subtitle && (
                <Text 
                  className={`text-sm mt-1 ${centerTitle ? 'text-center' : ''}`}
                  style={{ color: subtitleColor }}
                  numberOfLines={2}
                >
                  {subtitle}
                </Text>
              )}
            </View>
          </View>

          {/* Right Actions */}
          {rightActions.length > 0 && (
            <View className="flex-row items-center ml-4">
              {rightActions.map((action, index) => (
                <Pressable
                  key={index}
                  onPress={action.onPress}
                  className="w-10 h-10 ml-2 items-center justify-center rounded-full bg-gray-100"
                  testID={action.testID}
                >
                  <Ionicons 
                    name={action.icon} 
                    size={20} 
                    color={action.color || "#6b7280"} 
                  />
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

export default ConsistentHeader;
