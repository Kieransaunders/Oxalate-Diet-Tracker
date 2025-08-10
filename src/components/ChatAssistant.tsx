import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useChatStore } from '../state/chatStore';
import { useMealStore } from '../state/mealStore';
import { quickQuestions, addFoodContext } from '../api/chatbot-api';
import { cn } from '../utils/cn';

interface ChatAssistantProps {
  visible: boolean;
  onClose: () => void;
  contextFood?: string; // Food that user was viewing when opening chat
}

const ChatAssistant: React.FC<ChatAssistantProps> = ({ visible, onClose, contextFood }) => {
  const insets = useSafeAreaInsets();
  const [inputText, setInputText] = useState('');
  const [showQuickQuestions, setShowQuickQuestions] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  
  const { messages, isLoading, sendMessage, clearChat } = useChatStore();
  const { currentDay } = useMealStore();

  useEffect(() => {
    if (visible && scrollViewRef.current) {
      // Scroll to bottom when new messages arrive
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, visible, isLoading]);

  const handleSendMessage = async () => {
    if (inputText.trim()) {
      let messageText = inputText.trim();
      
      // Add context about current meal and viewed food
      const recentFoods = contextFood ? [contextFood] : [];
      messageText = addFoodContext(messageText, currentDay.items, recentFoods);
      
      setInputText('');
      setShowQuickQuestions(false);
      Keyboard.dismiss();
      
      await sendMessage(messageText);
    }
  };

  const handleQuickQuestion = async (question: string) => {
    // Add context to quick questions too
    const recentFoods = contextFood ? [contextFood] : [];
    const contextualQuestion = addFoodContext(question, currentDay.items, recentFoods);
    
    setShowQuickQuestions(false);
    await sendMessage(contextualQuestion);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const renderMessage = (message: any, index: number) => {
    return (
      <View
        key={message.id}
        className={cn(
          "mb-4 px-4",
          message.isUser ? "items-end" : "items-start"
        )}
      >
        <View
          className={cn(
            "max-w-xs p-3 rounded-2xl",
            message.isUser
              ? "bg-blue-500 rounded-br-md"
              : "bg-gray-100 rounded-bl-md"
          )}
        >
          <Text
            className={cn(
              "text-base leading-5",
              message.isUser ? "text-white" : "text-gray-900"
            )}
          >
            {message.text}
          </Text>
        </View>
        <Text className="text-xs text-gray-500 mt-1 px-1">
          {formatTime(message.timestamp)}
        </Text>
      </View>
    );
  };

  const renderTypingIndicator = () => {
    if (!isLoading) return null;
    
    return (
      <View className="mb-4 px-4 items-start">
        <View className="bg-gray-100 p-3 rounded-2xl rounded-bl-md">
          <View className="flex-row items-center">
            <ActivityIndicator size="small" color="#6b7280" />
            <Text className="text-gray-600 ml-2">Oxalate Assistant is typing...</Text>
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
          className="bg-blue-500 px-6 py-4 border-b border-blue-600"
          style={{ paddingTop: insets.top + 16 }}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-xl font-bold text-white">
                Oxalate Assistant
              </Text>
              <Text className="text-blue-100 text-sm">
                {contextFood 
                  ? `Discussing: ${contextFood}`
                  : currentDay.items.length > 0
                    ? `Tracking ${currentDay.items.length} foods today`
                    : "Your AI nutrition guide"
                }
              </Text>
            </View>
            
            <View className="flex-row items-center">
              <Pressable
                onPress={clearChat}
                className="w-8 h-8 items-center justify-center rounded-full bg-blue-400 mr-3"
              >
                <Ionicons name="refresh" size={18} color="white" />
              </Pressable>
              
              <Pressable
                onPress={onClose}
                className="w-8 h-8 items-center justify-center rounded-full bg-blue-400"
              >
                <Ionicons name="close" size={18} color="white" />
              </Pressable>
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
            {messages.map(renderMessage)}
            {renderTypingIndicator()}
          </View>

          {/* Quick Questions */}
          {showQuickQuestions && messages.length <= 1 && (
            <View className="px-4 pb-4">
              <Text className="text-lg font-semibold text-gray-900 mb-3">
                {contextFood ? `Questions about ${contextFood}` : 'Quick Questions'}
              </Text>
              <View className="space-y-2">
                {contextFood ? (
                  // Contextual questions for specific food
                  [
                    `Is ${contextFood} safe for a low-oxalate diet?`,
                    `How much ${contextFood} can I eat per day?`,
                    `What are alternatives to ${contextFood}?`,
                    `How can I prepare ${contextFood} to reduce oxalates?`,
                  ].map((question, index) => (
                    <Pressable
                      key={index}
                      onPress={() => handleQuickQuestion(question)}
                      className="bg-green-50 border border-green-200 rounded-lg p-3"
                    >
                      <Text className="text-green-800 font-medium">{question}</Text>
                    </Pressable>
                  ))
                ) : (
                  // General questions
                  quickQuestions.slice(0, 4).map((question, index) => (
                    <Pressable
                      key={index}
                      onPress={() => handleQuickQuestion(question)}
                      className="bg-blue-50 border border-blue-200 rounded-lg p-3"
                    >
                      <Text className="text-blue-800 font-medium">{question}</Text>
                    </Pressable>
                  ))
                )}
              </View>
              
              <Pressable className="mt-3 items-center">
                <Text className={contextFood ? "text-green-500" : "text-blue-500"}>
                  Or ask your own question below...
                </Text>
              </Pressable>
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <View className="bg-white border-t border-gray-200 px-4 py-3" style={{ paddingBottom: insets.bottom + 12 }}>
          <View className="flex-row items-end">
            <View className="flex-1 bg-gray-100 rounded-2xl px-4 py-2 mr-3">
              <TextInput
                className="text-base text-gray-900 max-h-24"
                placeholder="Ask about oxalates, foods, or diet tips..."
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
                "w-10 h-10 rounded-full items-center justify-center",
                inputText.trim() && !isLoading
                  ? "bg-blue-500"
                  : "bg-gray-300"
              )}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons 
                  name="send" 
                  size={18} 
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

export default ChatAssistant;