import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSubscriptionStore } from '../state/subscriptionStore';
import { PRODUCT_IDS } from '../config/revenuecat';
import { cn } from '../utils/cn';

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  feature?: 'oracle' | 'recipes' | 'tracking'; // What feature triggered the paywall
}

const PaywallModal: React.FC<PaywallModalProps> = ({ visible, onClose, feature }) => {
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>(PRODUCT_IDS.MONTHLY_PREMIUM);
  
  const { 
    status, 
    offerings, 
    purchaseProduct, 
    restorePurchases,
    usageLimits,
    getRemainingOracleQuestions,
    getRemainingRecipes,
    getRemainingTrackingDays,
    isLoading: storeLoading,
    clearError,
  } = useSubscriptionStore();

  // Use store loading state or local loading state
  const effectiveLoading = isLoading || storeLoading;

  // Clear any previous errors when modal opens
  useEffect(() => {
    if (visible) {
      clearError();
    }
  }, [visible, clearError]);

  // Feature-specific content
  const getFeatureContent = () => {
    switch (feature) {
      case 'oracle':
        const remainingQuestions = getRemainingOracleQuestions();
        return {
          title: 'Unlock Unlimited Oracle Wisdom',
          subtitle: `You've used ${5 - remainingQuestions} of your 5 daily questions`,
          icon: 'chatbubble-ellipses',
          color: 'purple',
        };
      case 'recipes':
        return {
          title: 'Create Unlimited Recipes',
          subtitle: 'You\'ve created your 1 free recipe',
          icon: 'restaurant',
          color: 'orange',
        };
      case 'tracking':
        const remainingDays = getRemainingTrackingDays();
        return {
          title: 'Track Your Progress Forever',
          subtitle: `You've used ${7 - remainingDays} of your 7 free tracking days`,
          icon: 'analytics',
          color: 'green',
        };
      default:
        return {
          title: 'Upgrade to Premium',
          subtitle: 'Unlock all features and unlimited access',
          icon: 'star',
          color: 'purple',
        };
    }
  };

  const featureContent = getFeatureContent();

  const handlePurchase = async (productId: string) => {
    setIsLoading(true);
    try {
      const success = await purchaseProduct(productId);
      if (success) {
        // Success toast is handled by the store
        onClose();
      }
      // Error handling is now managed by the store
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async () => {
    setIsLoading(true);
    try {
      const success = await restorePurchases();
      if (success) {
        // Success toast is handled by the store
        onClose();
      }
      // Error handling and info messages are now managed by the store
    } finally {
      setIsLoading(false);
    }
  };

  const openPrivacyPolicy = () => {
    Linking.openURL('https://your-privacy-policy-url.com');
  };

  const openTermsOfService = () => {
    Linking.openURL('https://your-terms-of-service-url.com');
  };

  const features = [
    {
      icon: 'chatbubble-ellipses-outline',
      title: 'Unlimited Oracle Questions',
      description: 'Ask as many questions as you want, whenever you need guidance',
      free: '5 questions/day',
      premium: 'Unlimited',
    },
    {
      icon: 'restaurant-outline',
      title: 'Unlimited Recipe Storage',
      description: 'Create, save, and organize as many recipes as you need',
      free: '1 recipe only',
      premium: 'Unlimited recipes',
    },
    {
      icon: 'analytics-outline',
      title: 'Unlimited Meal Tracking',
      description: 'Track your progress forever with detailed analytics',
      free: '7 days only',
      premium: 'Forever + analytics',
    },
    {
      icon: 'download-outline',
      title: 'Export Your Data',
      description: 'Export your tracking data and recipes for backup',
      free: '✗',
      premium: '✓',
    },
    {
      icon: 'headset-outline',
      title: 'Priority Support',
      description: 'Get help faster with premium customer support',
      free: '✗',
      premium: '✓',
    },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-white">
        {/* Header */}
        <View 
          className={cn(
            "px-6 py-4 border-b border-gray-200",
            featureContent.color === 'purple' && "bg-gradient-to-r from-purple-600 to-blue-600",
            featureContent.color === 'orange' && "bg-gradient-to-r from-orange-500 to-red-500",
            featureContent.color === 'green' && "bg-gradient-to-r from-green-500 to-teal-500"
          )}
          style={{ paddingTop: insets.top + 16 }}
        >
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-1">
              <View className="flex-row items-center">
                <Ionicons name={featureContent.icon as any} size={28} color="white" />
                <Text className="text-xl font-bold text-white ml-3">
                  Premium
                </Text>
              </View>
            </View>
            
            <Pressable
              onPress={onClose}
              className="w-8 h-8 items-center justify-center rounded-full bg-white/20"
            >
              <Ionicons name="close" size={18} color="white" />
            </Pressable>
          </View>
          
          <Text className="text-2xl font-bold text-white mb-2">
            {featureContent.title}
          </Text>
          <Text className="text-white/90">
            {featureContent.subtitle}
          </Text>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Features List */}
          <View className="px-6 py-6">
            <Text className="text-xl font-bold text-gray-900 mb-4">
              Free vs Premium Features
            </Text>
            
            {features.map((item, index) => (
              <View key={index} className="mb-6">
                <View className="flex-row items-start mb-2">
                  <Ionicons name={item.icon as any} size={24} color="#8b5cf6" />
                  <View className="flex-1 ml-3">
                    <Text className="text-lg font-semibold text-gray-900">
                      {item.title}
                    </Text>
                    <Text className="text-gray-600 text-sm leading-5">
                      {item.description}
                    </Text>
                  </View>
                </View>
                
                <View className="flex-row justify-between pl-9">
                  <View className="flex-1">
                    <Text className="text-xs text-gray-500 mb-1">FREE</Text>
                    <Text className="text-sm text-gray-700">{item.free}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-purple-600 mb-1">PREMIUM</Text>
                    <Text className="text-sm font-semibold text-purple-700">{item.premium}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Pricing */}
          <View className="px-6 pb-6">
            <Text className="text-xl font-bold text-gray-900 mb-4">
              Choose Your Plan
            </Text>
            
            {/* Monthly Option */}
            <Pressable
              onPress={() => setSelectedProduct(PRODUCT_IDS.MONTHLY_PREMIUM)}
              className={cn(
                "border-2 rounded-xl p-4 mb-3",
                selectedProduct === PRODUCT_IDS.MONTHLY_PREMIUM
                  ? "border-purple-500 bg-purple-50"
                  : "border-gray-200"
              )}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-gray-900">
                    Monthly Premium
                  </Text>
                  <Text className="text-gray-600">
                    Full access to all features
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-xl font-bold text-gray-900">
                    $4.99
                  </Text>
                  <Text className="text-sm text-gray-500">
                    per month
                  </Text>
                </View>
              </View>
            </Pressable>

            {/* Yearly Option */}
            <Pressable
              onPress={() => setSelectedProduct(PRODUCT_IDS.YEARLY_PREMIUM)}
              className={cn(
                "border-2 rounded-xl p-4 mb-6 relative",
                selectedProduct === PRODUCT_IDS.YEARLY_PREMIUM
                  ? "border-purple-500 bg-purple-50"
                  : "border-gray-200"
              )}
            >
              {/* Best Value Badge */}
              <View className="absolute -top-2 right-4 bg-green-500 px-3 py-1 rounded-full">
                <Text className="text-xs font-bold text-white">
                  BEST VALUE
                </Text>
              </View>
              
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-gray-900">
                    Yearly Premium
                  </Text>
                  <Text className="text-gray-600">
                    Save 33% with annual billing
                  </Text>
                  <Text className="text-sm text-green-600 font-medium">
                    Just $3.33/month
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-xl font-bold text-gray-900">
                    $39.99
                  </Text>
                  <Text className="text-sm text-gray-500">
                    per year
                  </Text>
                </View>
              </View>
            </Pressable>

            {/* Purchase Button */}
            <Pressable
              onPress={() => handlePurchase(selectedProduct)}
              disabled={effectiveLoading}
              className={cn(
                "bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl py-4 mb-4",
                effectiveLoading && "opacity-50"
              )}
            >
              {effectiveLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-white font-bold text-center text-lg">
                  Start Premium Now
                </Text>
              )}
            </Pressable>

            {/* Restore Purchases */}
            <Pressable
              onPress={handleRestore}
              disabled={effectiveLoading}
              className="py-3"
            >
              <Text className={cn(
                "text-center font-medium",
                effectiveLoading ? "text-gray-400" : "text-purple-600"
              )}>
                Restore Purchases
              </Text>
            </Pressable>
          </View>
        </ScrollView>

        {/* Footer */}
        <View className="px-6 py-4 border-t border-gray-200" style={{ paddingBottom: insets.bottom + 16 }}>
          <View className="flex-row justify-center space-x-6">
            <Pressable onPress={openPrivacyPolicy}>
              <Text className="text-gray-500 text-sm">Privacy Policy</Text>
            </Pressable>
            <Pressable onPress={openTermsOfService}>
              <Text className="text-gray-500 text-sm">Terms of Service</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default PaywallModal;