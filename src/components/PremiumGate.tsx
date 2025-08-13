import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSubscriptionStore } from '../state/subscriptionStore';
import PaywallModal from './PaywallModal';
import { cn } from '../utils/cn';

interface PremiumGateProps {
  children: React.ReactNode;
  feature: 'oracle' | 'recipes' | 'tracking';
  action?: 'view' | 'create' | 'use'; // What action is being gated
  showUpgradePrompt?: boolean; // Whether to show upgrade prompt instead of blocking
  customMessage?: string; // Custom message for the gate
}

const PremiumGate: React.FC<PremiumGateProps> = ({
  children,
  feature,
  action = 'use',
  showUpgradePrompt = false,
  customMessage,
}) => {
  const [showPaywall, setShowPaywall] = useState(false);
  
  const {
    status,
    canAskOracleQuestion,
    canCreateRecipe,
    canTrack,
    getRemainingOracleQuestions,
    getRemainingRecipes,
    getRemainingTrackingDays,
  } = useSubscriptionStore();

  // If user is premium, always show content
  if (status === 'premium') {
    return <>{children}</>;
  }

  // Check if user can access the feature
  const canAccess = () => {
    switch (feature) {
      case 'oracle':
        return canAskOracleQuestion();
      case 'recipes':
        return canCreateRecipe();
      case 'tracking':
        return canTrack();
      default:
        return false;
    }
  };

  // Get remaining usage
  const getRemainingUsage = () => {
    switch (feature) {
      case 'oracle':
        return getRemainingOracleQuestions();
      case 'recipes':
        return getRemainingRecipes();
      case 'tracking':
        return getRemainingTrackingDays();
      default:
        return 0;
    }
  };

  // Get feature-specific content
  const getFeatureContent = () => {
    const remaining = getRemainingUsage();
    
    switch (feature) {
      case 'oracle':
        return {
          icon: 'chatbubble-ellipses',
          title: remaining > 0 ? `${remaining} Questions Remaining` : 'Daily Question Limit Reached',
          subtitle: remaining > 0 
            ? `You have ${remaining} Oracle questions left today`
            : 'Upgrade to Premium for unlimited questions',
          color: 'purple',
          upgradeText: 'Get Unlimited Questions',
        };
      case 'recipes':
        return {
          icon: 'restaurant',
          title: remaining > 0 ? 'Recipe Limit Available' : 'Recipe Limit Reached',
          subtitle: remaining > 0
            ? `You can create ${remaining} more recipe`
            : 'Upgrade to Premium for unlimited recipes',
          color: 'orange',
          upgradeText: 'Get Unlimited Recipes',
        };
      case 'tracking':
        return {
          icon: 'analytics',
          title: remaining > 0 ? `${remaining} Days Remaining` : 'Tracking Trial Ended',
          subtitle: remaining > 0
            ? `You have ${remaining} days left in your free trial`
            : 'Upgrade to Premium for unlimited tracking',
          color: 'green',
          upgradeText: 'Get Unlimited Tracking',
        };
      default:
        return {
          icon: 'star',
          title: 'Premium Feature',
          subtitle: 'This feature requires Premium access',
          color: 'purple',
          upgradeText: 'Upgrade to Premium',
        };
    }
  };

  const featureContent = getFeatureContent();
  const hasAccess = canAccess();

  // If showing upgrade prompt instead of blocking
  if (showUpgradePrompt && !hasAccess) {
    return (
      <View>
        {children}
        
        {/* Upgrade Prompt Overlay */}
        <View className="bg-white border border-purple-200 rounded-lg p-4 mt-4">
          <View className="flex-row items-center mb-3">
            <Ionicons name={featureContent.icon as any} size={24} color="#8b5cf6" />
            <Text className="text-lg font-semibold text-gray-900 ml-3">
              {featureContent.title}
            </Text>
          </View>
          
          <Text className="text-gray-600 mb-4">
            {customMessage || featureContent.subtitle}
          </Text>
          
          <Pressable
            onPress={() => setShowPaywall(true)}
            className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg py-3"
          >
            <Text className="text-white font-semibold text-center">
              {featureContent.upgradeText}
            </Text>
          </Pressable>
        </View>
        
        <PaywallModal
          visible={showPaywall}
          onClose={() => setShowPaywall(false)}
          feature={feature}
        />
      </View>
    );
  }

  // If user has access, show content
  if (hasAccess) {
    return <>{children}</>;
  }

  // Otherwise, show the gate
  return (
    <View className="flex-1 justify-center items-center px-6">
      <View className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 max-w-sm w-full">
        {/* Icon */}
        <View className={cn(
          "w-16 h-16 rounded-full items-center justify-center mb-6 mx-auto",
          featureContent.color === 'purple' && "bg-purple-100",
          featureContent.color === 'orange' && "bg-orange-100",
          featureContent.color === 'green' && "bg-green-100"
        )}>
          <Ionicons 
            name={featureContent.icon as any} 
            size={32} 
            color={
              featureContent.color === 'purple' ? '#8b5cf6' :
              featureContent.color === 'orange' ? '#f97316' :
              '#10b981'
            }
          />
        </View>
        
        {/* Title */}
        <Text className="text-xl font-bold text-gray-900 text-center mb-3">
          {featureContent.title}
        </Text>
        
        {/* Subtitle */}
        <Text className="text-gray-600 text-center mb-6 leading-6">
          {customMessage || featureContent.subtitle}
        </Text>
        
        {/* Features Preview */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-900 mb-3">
            Premium includes:
          </Text>
          {feature === 'oracle' && (
            <View>
              <View className="flex-row items-center mb-2">
                <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                <Text className="text-sm text-gray-700 ml-2">Unlimited daily questions</Text>
              </View>
              <View className="flex-row items-center mb-2">
                <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                <Text className="text-sm text-gray-700 ml-2">Enhanced AI responses</Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                <Text className="text-sm text-gray-700 ml-2">Chat history saved forever</Text>
              </View>
            </View>
          )}
          {feature === 'recipes' && (
            <View>
              <View className="flex-row items-center mb-2">
                <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                <Text className="text-sm text-gray-700 ml-2">Unlimited recipe storage</Text>
              </View>
              <View className="flex-row items-center mb-2">
                <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                <Text className="text-sm text-gray-700 ml-2">AI recipe generation</Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                <Text className="text-sm text-gray-700 ml-2">Recipe collections & sharing</Text>
              </View>
            </View>
          )}
          {feature === 'tracking' && (
            <View>
              <View className="flex-row items-center mb-2">
                <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                <Text className="text-sm text-gray-700 ml-2">Unlimited tracking history</Text>
              </View>
              <View className="flex-row items-center mb-2">
                <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                <Text className="text-sm text-gray-700 ml-2">Progress analytics & charts</Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                <Text className="text-sm text-gray-700 ml-2">Export your data</Text>
              </View>
            </View>
          )}
        </View>
        
        {/* Upgrade Button */}
        <Pressable
          onPress={() => setShowPaywall(true)}
          className={cn(
            "rounded-lg py-4 mb-3",
            featureContent.color === 'purple' && "bg-gradient-to-r from-purple-500 to-blue-500",
            featureContent.color === 'orange' && "bg-gradient-to-r from-orange-500 to-red-500",
            featureContent.color === 'green' && "bg-gradient-to-r from-green-500 to-teal-500"
          )}
        >
          <Text className="text-white font-bold text-center text-lg">
            {featureContent.upgradeText}
          </Text>
        </Pressable>
        
        {/* Pricing hint */}
        <Text className="text-xs text-gray-500 text-center">
          Starting at $3.33/month • Cancel anytime
        </Text>
      </View>
      
      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        feature={feature}
      />
    </View>
  );
};

export default PremiumGate;