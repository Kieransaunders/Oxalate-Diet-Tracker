import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useOracleStore } from '../state/oracleStore';
import { useMealStore } from '../state/mealStore';
import { useUserPreferencesStore } from '../state/userPreferencesStore';
import { useSubscriptionStore } from '../state/subscriptionStore';
import { enhanceQuestionWithContext, quickOracleQuestions, popularOracleQuestions } from '../api/chat-oracle-api';
// import PremiumGate from '../components/PremiumGate'; // Not currently used
import ConsistentHeader from '../components/ConsistentHeader';
import { cn } from '../utils/cn';

interface OracleScreenProps {
  visible?: boolean;
  onClose?: () => void;
  contextFood?: string;
  isTabScreen?: boolean;
}

const OracleScreen: React.FC<OracleScreenProps> = ({ visible = true, onClose, contextFood, isTabScreen = false }) => {
  const insets = useSafeAreaInsets();
  const [inputText, setInputText] = useState('');
  const [showQuickQuestions, setShowQuickQuestions] = useState(true);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  
  const { messages, isLoading, streamingMessageId, sendMessageStreaming, clearChat } = useOracleStore();
  const { currentDay } = useMealStore();
  const { userPreferences, getOracleSystemPrompt } = useUserPreferencesStore();
  const { 
    status: subscriptionStatus, 
    canAskOracleQuestion, 
    incrementOracleQuestions 
    // getRemainingOracleQuestions // Not currently used
  } = useSubscriptionStore();

  // Dynamic Oracle title based on user's diet type
  const getOracleTitle = () => {
    switch (userPreferences.dietType) {
      case 'low-oxalate':
        return 'Oxalate Oracle - Your Diet Guide';
      case 'moderate-oxalate':
        return 'Oxalate Oracle - Your Diet Guide';
      case 'high-oxalate':
        return 'Oxalate Oracle - Your Nutrition Guide';
      case 'unrestricted':
        return 'Oxalate Oracle - Your Wellness Guide';
      default:
        return 'Oxalate Oracle';
    }
  };

  // Diet-aware quick questions with more comprehensive options
  const getDietAwareQuickQuestions = () => {
    const { dietType } = userPreferences;
    
    switch (dietType) {
      case 'low-oxalate':
        return [
          "What are the best low-oxalate breakfast options?",
          "Which cooking methods reduce oxalate content?",
          "What are safe daily oxalate limits for dietary tracking?",
          "Can I eat spinach on a low-oxalate diet?",
          "What are good substitutes for high-oxalate foods?",
          "How do I calculate oxalate in homemade meals?",
        ];
      case 'moderate-oxalate':
        return [
          "How do I balance nutrition with oxalate restrictions?",
          "What foods can I eat occasionally on a moderate approach?",
          "How do I plan balanced meals with oxalate awareness?",
          "What portion sizes work for moderate oxalate foods?",
          "Are nuts and seeds okay in moderation?",
          "How do I meal prep for balanced oxalate eating?",
        ];
      case 'high-oxalate':
        return [
          "Which high-oxalate foods provide the most nutrients?",
          "How should I pair oxalate-rich foods with calcium?",
          "What are the best preparation methods for nutrient absorption?",
          "How do I optimize nutrition from oxalate-rich vegetables?",
          "Can I still enjoy chocolate and tea?",
          "What are the best food combinations for balanced nutrition?",
        ];
      case 'unrestricted':
        return [
          "What are oxalates and why might I want to know about them?",
          "How do oxalates affect different people?",
          "What's the science behind oxalate metabolism?",
          "Are there any benefits to tracking oxalate intake?",
          "Should I be concerned about oxalates in my diet?",
          "How do I track my daily dietary intake effectively?",
        ];
      default:
        return popularOracleQuestions.slice(0, 6);
    }
  };

  useEffect(() => {
    if (visible && scrollViewRef.current) {
      // Scroll to bottom when new messages arrive
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, visible, isLoading]);

  // Auto-ask question when opened with contextFood
  useEffect(() => {
    if (visible && contextFood && !isLoading && messages.length <= 1) {
      // Only auto-ask if we haven't already asked about this food
      const hasAskedAboutFood = messages.some(msg => 
        msg.isUser && msg.text.toLowerCase().includes(contextFood.toLowerCase())
      );
      
      if (!hasAskedAboutFood) {
        const question = `Tell me about ${contextFood} - is it suitable for my ${userPreferences.dietType.replace('-', ' ')} approach?`;
        handleQuickQuestion(question);
      }
    }
  }, [visible, contextFood, isLoading, messages.length]);

  const handleSendMessage = async () => {
    if (inputText.trim() && !isLoading) {
      // Check if user can ask questions (for free users)
      if (!canAskOracleQuestion()) {
        return; // PremiumGate will handle showing upgrade prompt
      }

      // Increment usage counter for free users
      if (subscriptionStatus === 'free') {
        const canProceed = incrementOracleQuestions();
        if (!canProceed) {
          return; // This shouldn't happen as we check canAskOracleQuestion above
        }
      }

      let messageText = inputText.trim();
      
      // Keep original question for speed - context is handled by system prompt
      // messageText = enhanceQuestionWithContext(messageText, currentDay.items, contextFood);
      
      setInputText('');
      setShowQuickQuestions(false);
      
      // Use streaming for better user experience
      await sendMessageStreaming(messageText);
    }
  };

  const handleQuickQuestion = async (question: string) => {
    if (isLoading) return;
    
    // Check if user can ask questions (for free users)
    if (!canAskOracleQuestion()) {
      return; // PremiumGate will handle showing upgrade prompt
    }

    // Increment usage counter for free users
    if (subscriptionStatus === 'free') {
      const canProceed = incrementOracleQuestions();
      if (!canProceed) {
        return; // This shouldn't happen as we check canAskOracleQuestion above
      }
    }
    
    // Use question directly for speed - context handled by system prompt
    const contextualQuestion = question;
    
    setShowQuickQuestions(false);
    // Use streaming for better user experience
    await sendMessageStreaming(contextualQuestion);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const renderMessage = (message: any, index: number) => {
    const isStreaming = streamingMessageId === message.id;
    
    return (
      <View
        key={`${message.id}-${index}`}
        className={cn(
          "mb-4 px-4",
          message.isUser ? "items-end" : "items-start"
        )}
      >
        <View
          className={cn(
            "max-w-xs p-4 rounded-2xl",
            message.isUser
              ? "bg-purple-500 rounded-br-md"
              : "bg-gradient-to-r from-purple-100 to-blue-100 rounded-bl-md",
            isStreaming && "border-2 border-purple-300"
          )}
        >
          {!message.isUser && (
            <View className="flex-row items-center mb-2">
              <Text className="text-2xl mr-2">🔮</Text>
              <Text className="font-bold text-purple-800 text-sm">Oracle</Text>
            </View>
          )}
          
          <Text
            className={cn(
              "text-base leading-6",
              message.isUser ? "text-white" : "text-gray-900"
            )}
          >
            {message.text}
            {isStreaming && (
              <Text className="text-purple-600 animate-pulse ml-1">▋</Text>
            )}
          </Text>
        </View>
        
        <View className="flex-row items-center mt-1 px-1">
          <Text className="text-xs text-gray-500">
            {formatTime(message.timestamp)}
          </Text>
          {isStreaming && (
            <View className="flex-row items-center ml-2">
              <ActivityIndicator size="small" color="#8b5cf6" />
              <Text className="text-xs text-purple-600 ml-1">Oracle speaks...</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderTypingIndicator = () => {
    // Only show typing indicator if loading and not streaming
    if (!isLoading || streamingMessageId) return null;
    
    return (
      <View className="mb-4 px-4 items-start">
        <View className="bg-gradient-to-r from-purple-100 to-blue-100 p-4 rounded-2xl rounded-bl-md">
          <View className="flex-row items-center">
            <Text className="text-2xl mr-2">🔮</Text>
            <ActivityIndicator size="small" color="#8b5cf6" />
            <Text className="text-purple-600 ml-2">Oracle is consulting the wisdom...</Text>
          </View>
        </View>
      </View>
    );
  };

  const ScreenWrapper = isTabScreen ? React.Fragment : Modal;
  const screenWrapperProps = isTabScreen ? {} : {
    visible,
    animationType: "slide" as const,
    presentationStyle: "pageSheet" as const,
    onRequestClose: onClose,
  };

  const headerActions = [
    {
      icon: 'refresh-outline' as const,
      onPress: clearChat,
      testID: 'clear-chat-button',
    },
  ];

  return (
    <ScreenWrapper {...screenWrapperProps}>
      <KeyboardAvoidingView 
        className="flex-1 bg-white"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ConsistentHeader
          title={getOracleTitle()}
          emoji="🔮"
          showBackButton={!isTabScreen}
          onBackPress={onClose}
          rightActions={headerActions}
          centerTitle={true}
          backgroundColor="#ffffff"
        />

        {/* Tracking Info Banner */}
        <View className="bg-purple-50 border-b border-purple-200 px-4 py-3">
          <View className="flex-row items-start">
            <Ionicons name="sparkles" size={18} color="#8b5cf6" />
            <View className="flex-1 ml-3">
              <Text className="text-purple-900 font-medium text-sm">
                {contextFood 
                  ? `Consulting about: ${contextFood}`
                  : currentDay.items.length > 0
                    ? `${currentDay.items.length} foods tracked • ${currentDay.totalOxalate.toFixed(1)}mg oxalate • ${userPreferences.dietType.replace('-', ' ')} diet`
                    : `${userPreferences.dietType.replace('-', ' ')} diet • Ask the Oracle about oxalates, foods, and nutrition wisdom`
                }
              </Text>
            </View>
          </View>
        </View>

        {/* Nutritional Disclaimer */}
        {showDisclaimer && (
          <View className="bg-amber-50 border-b border-amber-200 px-4 py-3">
            <View className="flex-row items-start">
              <Ionicons name="warning" size={16} color="#f59e0b" />
              <View className="flex-1 ml-3">
                <Text className="text-amber-800 text-xs leading-4">
                  <Text className="font-semibold">Disclaimer:</Text> For informational purposes only. Consult your nutrition professional for dietary advice.
                </Text>
              </View>
              <Pressable
                onPress={() => setShowDisclaimer(false)}
                style={{
                  width: 20,
                  height: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: 8
                }}
              >
                <Ionicons name="close" size={14} color="#f59e0b" />
              </Pressable>
            </View>
          </View>
        )}

        {/* Chat Messages */}
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 bg-white"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="py-4">
            {messages.map((message, index) => renderMessage(message, index))}
            {renderTypingIndicator()}
          </View>

          {/* Quick Questions */}
          {showQuickQuestions && messages.length <= 1 && (
            <View className="px-4 pb-4">
              <Text className="text-lg font-semibold text-gray-900 mb-3">
                {contextFood ? `Oracle Wisdom about ${contextFood}` : '🔮 Ask the Oxalate Oracle'}
              </Text>
              {!contextFood && (
                <Text className="text-sm text-gray-600 mb-4">
                  Get instant answers about oxalates, foods, and dietary guidance. Choose a question below or ask your own!
                </Text>
              )}
              <View className="space-y-2">
                {(contextFood ? [
                  `Is ${contextFood} safe for my ${userPreferences.dietType.replace('-', ' ')} diet?`,
                  `How much ${contextFood} can I safely eat on my ${userPreferences.dietType.replace('-', ' ')} approach?`,
                  userPreferences.dietType === 'high-oxalate' 
                    ? `What nutrients does ${contextFood} provide?`
                    : `What are better alternatives to ${contextFood}?`,
                  userPreferences.dietType === 'high-oxalate'
                    ? `How should I prepare ${contextFood} for optimal nutrient absorption?`
                    : `How should I prepare ${contextFood} to reduce oxalates?`,
                ] : getDietAwareQuickQuestions()).map((question, index) => (
                  <Pressable
                    key={index}
                    onPress={() => handleQuickQuestion(question)}
                    style={{
                      backgroundColor: '#faf5ff',
                      borderWidth: 1,
                      borderColor: '#e9d5ff',
                      borderRadius: 8,
                      padding: 12
                    }}
                  >
                    <Text className="text-purple-800 font-medium">{question}</Text>
                  </Pressable>
                ))}
              </View>
              
              <Pressable 
                style={{ 
                  marginTop: 12, 
                  alignItems: 'center' 
                }}
              >
                <Text className="text-purple-500 text-sm">
                  Or ask your own question to the Oracle...
                </Text>
              </Pressable>
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <View className="bg-white border-t border-gray-200 px-4 py-3" style={{ paddingBottom: insets.bottom + 12 }}>
          {canAskOracleQuestion() ? (
            <View className="flex-row items-end">
              <View className="flex-1 bg-purple-50 rounded-2xl px-4 py-3 mr-3 border border-purple-200">
                <TextInput
                  className="text-base text-gray-900 max-h-24"
                  placeholder="Ask the Oracle about oxalates, foods, or diet wisdom..."
                  placeholderTextColor="#9ca3af"
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                  maxLength={500}
                  onSubmitEditing={handleSendMessage}
                  blurOnSubmit={false}
                />
              </View>
              
              <Pressable
                onPress={handleSendMessage}
                disabled={!inputText.trim() || isLoading}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: inputText.trim() && !isLoading ? '#8b5cf6' : '#d1d5db',
                }}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Ionicons 
                    name="send" 
                    size={20} 
                    color={inputText.trim() ? "white" : "#9ca3af"} 
                  />
                )}
              </Pressable>
            </View>
          ) : (
            <View className="flex-row items-end opacity-50">
              <View className="flex-1 bg-gray-100 rounded-2xl px-4 py-3 mr-3 border border-gray-200">
                <Text className="text-base text-gray-500">
                  You've reached your daily limit. Upgrade to Premium for unlimited access!
                </Text>
              </View>
              
              <View className="w-12 h-12 rounded-full items-center justify-center bg-gray-300">
                <Ionicons name="lock-closed" size={20} color="#9ca3af" />
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

export default OracleScreen;