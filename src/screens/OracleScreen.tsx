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
import { enhanceQuestionWithContext, quickOracleQuestions } from '../api/chat-oracle-api';
import { cn } from '../utils/cn';

interface OracleScreenProps {
  visible: boolean;
  onClose: () => void;
  contextFood?: string;
}

const OracleScreen: React.FC<OracleScreenProps> = ({ visible, onClose, contextFood }) => {
  const insets = useSafeAreaInsets();
  const [inputText, setInputText] = useState('');
  const [showQuickQuestions, setShowQuickQuestions] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  
  const { messages, isLoading, streamingMessageId, sendMessageStreaming, clearChat } = useOracleStore();
  const { currentDay } = useMealStore();
  const { userPreferences, getOracleSystemPrompt } = useUserPreferencesStore();

  // Dynamic Oracle title based on user's diet type
  const getOracleTitle = () => {
    switch (userPreferences.dietType) {
      case 'low-oxalate':
        return 'Oxalate Oracle - Your Low-Oxalate Guide';
      case 'moderate-oxalate':
        return 'Oxalate Oracle - Your Balanced Guide';
      case 'high-oxalate':
        return 'Oxalate Oracle - Your Nutrition Guide';
      case 'unrestricted':
        return 'Oxalate Oracle - Your Wellness Guide';
      default:
        return 'Oxalate Oracle';
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
        const question = `Tell me about ${contextFood} - is it safe for my low-oxalate diet?`;
        handleQuickQuestion(question);
      }
    }
  }, [visible, contextFood, isLoading, messages.length]);

  const handleSendMessage = async () => {
    if (inputText.trim() && !isLoading) {
      let messageText = inputText.trim();
      
      // Add context about current meal and viewed food
      messageText = enhanceQuestionWithContext(messageText, currentDay.items, contextFood);
      
      setInputText('');
      setShowQuickQuestions(false);
      
      await sendMessageStreaming(messageText);
    }
  };

  const handleQuickQuestion = async (question: string) => {
    if (isLoading) return;
    
    // Add context to quick questions
    const contextualQuestion = enhanceQuestionWithContext(question, currentDay.items, contextFood);
    
    setShowQuickQuestions(false);
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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        className="flex-1 bg-white"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View 
          className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4 border-b border-purple-700"
          style={{ paddingTop: insets.top + 16 }}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <View className="flex-row items-center">
                <Text className="text-3xl mr-3">🔮</Text>
                <View>
                  <Text className="text-xl font-bold text-white">
                    {getOracleTitle()}
                  </Text>
                  <Text className="text-purple-100 text-sm">
                    {contextFood 
                      ? `Consulting about: ${contextFood}`
                      : currentDay.items.length > 0
                        ? `Tracking ${currentDay.items.length} foods today`
                        : "Your mystical nutrition guide"
                    }
                  </Text>
                </View>
              </View>
            </View>
            
            <View className="flex-row items-center space-x-3">
              <Pressable
                onPress={clearChat}
                className="w-8 h-8 items-center justify-center rounded-full bg-purple-500"
              >
                <Ionicons name="refresh" size={16} color="white" />
              </Pressable>
              
              <Pressable
                onPress={onClose}
                className="w-8 h-8 items-center justify-center rounded-full bg-purple-500"
              >
                <Ionicons name="close" size={18} color="white" />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Help Banner */}
        <View className="bg-purple-50 border-b border-purple-200 px-4 py-3">
          <View className="flex-row items-start">
            <Ionicons name="sparkles" size={18} color="#8b5cf6" />
            <View className="flex-1 ml-3">
              <Text className="text-purple-900 font-medium text-sm">
                🧙‍♂️ Ask the Oracle about oxalates, foods, and nutrition wisdom
              </Text>
              <Text className="text-purple-700 text-xs mt-1">
                Direct API connection for faster, more reliable responses
              </Text>
            </View>
          </View>
        </View>

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
                {contextFood ? `Oracle Wisdom about ${contextFood}` : 'Consult the Oracle'}
              </Text>
              <View className="space-y-2">
                {(contextFood ? [
                  `Is ${contextFood} safe for my low-oxalate diet?`,
                  `How much ${contextFood} can I safely eat?`,
                  `What are better alternatives to ${contextFood}?`,
                  `How should I prepare ${contextFood} to reduce oxalates?`,
                ] : quickOracleQuestions.slice(0, 4)).map((question, index) => (
                  <Pressable
                    key={index}
                    onPress={() => handleQuickQuestion(question)}
                    className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-3"
                  >
                    <Text className="text-purple-800 font-medium">{question}</Text>
                  </Pressable>
                ))}
              </View>
              
              <Pressable className="mt-3 items-center">
                <Text className="text-purple-500 text-sm">
                  Or ask your own question to the Oracle...
                </Text>
              </Pressable>
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <View className="bg-white border-t border-gray-200 px-4 py-3" style={{ paddingBottom: insets.bottom + 12 }}>
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
              className={cn(
                "w-12 h-12 rounded-full items-center justify-center",
                inputText.trim() && !isLoading
                  ? "bg-gradient-to-r from-purple-500 to-blue-500"
                  : "bg-gray-300"
              )}
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
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default OracleScreen;