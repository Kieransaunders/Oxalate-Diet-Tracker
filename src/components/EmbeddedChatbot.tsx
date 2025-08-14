import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useMealStore } from '../state/mealStore';
import { useRecipeStore } from '../state/recipeStore';
import { toast } from '../utils/toast';
import type { Recipe } from '../types/recipe';

interface EmbeddedChatbotProps {
  visible: boolean;
  onClose: () => void;
  contextFood?: string;
  onRecipeSaved?: () => void;
}

const EmbeddedChatbot: React.FC<EmbeddedChatbotProps> = ({ 
  visible, 
  onClose, 
  contextFood,
  onRecipeSaved 
}) => {
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showRecipeCapture, setShowRecipeCapture] = useState(false);
  const webViewRef = useRef<WebView>(null);
  const { currentDay } = useMealStore();
  const { addRecipe, parseRecipeFromText } = useRecipeStore();

  // Construct URL with context parameters
  const getChatbotUrl = () => {
    const baseUrl = 'https://flowise.iconnectit.co.uk/chatbot/df2d3204-ca40-445e-9eda-e626ab246a31';
    
    // Add context as URL parameters (as fallback if injection doesn't work)
    const params = new URLSearchParams();
    
    if (contextFood) {
      params.append('food', contextFood);
    }
    
    if (currentDay.items.length > 0) {
      params.append('totalOxalate', currentDay.totalOxalate.toFixed(1));
      params.append('foodCount', currentDay.items.length.toString());
    }
    
    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  };

  const chatbotUrl = getChatbotUrl();

  const handleLoadStart = () => {
    setIsLoading(true);
    setHasError(false);
  };

  const handleLoadEnd = () => {
    setIsLoading(false);
  };

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('WebView error: ', nativeEvent);
    setIsLoading(false);
    setHasError(true);
  };

  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    // Optional: Handle navigation changes if needed
    console.log('Navigation state changed:', navState.url);
  };

  const handleRecipeCapture = () => {
    // JavaScript to extract chat content for recipe parsing
    const extractScript = `
      (function() {
        try {
          // Try to find the last bot message or recent messages
          const messageSelectors = [
            '.message-content',
            '.chat-message',
            '.bot-message',
            '.assistant-message',
            '[class*="message"]',
            'p', 'div'
          ];
          
          let lastBotMessage = '';
          
          // Try to find recent messages
          for (const selector of messageSelectors) {
            const messages = document.querySelectorAll(selector);
            if (messages.length > 0) {
              // Get the last few messages
              const recentMessages = Array.from(messages).slice(-3);
              lastBotMessage = recentMessages.map(msg => msg.textContent || msg.innerText).join('\\n\\n');
              if (lastBotMessage.length > 50) break; // If we found substantial content
            }
          }
          
          // If no specific messages found, try to get all visible text
          if (!lastBotMessage) {
            const bodyText = document.body.innerText || document.body.textContent;
            const lines = bodyText.split('\\n').filter(line => line.trim().length > 0);
            lastBotMessage = lines.slice(-20).join('\\n'); // Get last 20 lines
          }
          
          // Send the content back to React Native
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'recipeContent',
            content: lastBotMessage
          }));
          
        } catch (e) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'error',
            message: 'Could not extract recipe content: ' + e.message
          }));
        }
      })();
    `;
    
    webViewRef.current?.injectJavaScript(extractScript);
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'recipeContent') {
        const parsedRecipe = parseRecipeFromText(data.content);
        
        if (parsedRecipe && parsedRecipe.title && parsedRecipe.category) {
          toast.success(
            'Recipe Found!',
            `Found a recipe: "${parsedRecipe.title}". Would you like to save it?`,
            {
              label: 'Save Recipe',
              onPress: () => {
                addRecipe(parsedRecipe as Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>);
                toast.success('Success', 'Recipe saved to your collection!');
                onRecipeSaved?.();
              },
            }
          );
        } else {
          toast.info(
            'No Recipe Found',
            'Could not detect a recipe in the current chat. Make sure the AI has provided a complete recipe with ingredients and instructions.'
          );
        }
      } else if (data.type === 'error') {
        console.error('WebView error:', data.message);
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  const injectContextScript = () => {
    let contextMessage = '';
    
    if (contextFood) {
      contextMessage += `I'm currently looking at ${contextFood}. `;
    }
    
    if (currentDay.items.length > 0) {
      const mealItems = currentDay.items.map(item => 
        `${item.food.name} (${item.oxalateAmount.toFixed(1)}mg oxalate)`
      ).join(', ');
      contextMessage += `Today I've tracked: ${mealItems}. Total: ${currentDay.totalOxalate.toFixed(1)}mg oxalate. `;
    }

    if (contextMessage) {
      // JavaScript to automatically populate the chat input with context
      // Escape quotes and newlines to prevent JS injection issues
      const escapedMessage = contextMessage.replace(/"/g, '\\"').replace(/\n/g, '\\n');
      
      return `
        (function() {
          let attempts = 0;
          const maxAttempts = 10;
          
          function tryInjectContext() {
            try {
              attempts++;
              
              // Try multiple selectors for different chat interfaces
              const selectors = [
                'input[type="text"]',
                'textarea',
                '[contenteditable="true"]',
                '.message-input',
                '#chat-input',
                '[placeholder*="message"]',
                '[placeholder*="Message"]',
                '[placeholder*="type"]',
                '[placeholder*="Type"]'
              ];
              
              let chatInput = null;
              for (const selector of selectors) {
                chatInput = document.querySelector(selector);
                if (chatInput) break;
              }
              
              if (chatInput && (!chatInput.value || chatInput.value.trim() === '')) {
                chatInput.value = "${escapedMessage}";
                chatInput.focus();
                
                // Trigger multiple events to ensure compatibility
                ['input', 'change', 'keyup'].forEach(eventType => {
                  const event = new Event(eventType, { bubbles: true });
                  chatInput.dispatchEvent(event);
                });
                
                console.log('Context injected successfully');
                return true;
              }
              
              if (attempts < maxAttempts) {
                setTimeout(tryInjectContext, 1000);
              }
              
            } catch (e) {
              console.log('Context injection attempt failed:', e);
              if (attempts < maxAttempts) {
                setTimeout(tryInjectContext, 1000);
              }
            }
          }
          
          // Start trying after initial load
          setTimeout(tryInjectContext, 2000);
        })();
      `;
    }
    
    return '';
  };

  const retry = () => {
    setHasError(false);
    setIsLoading(true);
    webViewRef.current?.reload();
  };

  if (hasError) {
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
            className="bg-blue-500 px-6 py-4 border-b border-blue-600 flex-row items-center justify-between"
            style={{ paddingTop: insets.top + 16 }}
          >
            <Text className="text-xl font-bold text-white">
              Oxalate Assistant
            </Text>
            <Pressable
              onPress={onClose}
              className="w-8 h-8 items-center justify-center rounded-full bg-blue-400"
            >
              <Ionicons name="close" size={18} color="white" />
            </Pressable>
          </View>

          {/* Error State */}
          <View className="flex-1 items-center justify-center px-6">
            <Ionicons name="cloud-offline" size={64} color="#d1d5db" />
            <Text className="text-xl font-semibold text-gray-900 mt-4 text-center">
              Connection Error
            </Text>
            <Text className="text-gray-600 mt-2 text-center">
              Unable to load the chatbot. Please check your internet connection.
            </Text>
            
            <View className="flex-row space-x-3 mt-6">
              <Pressable
                onPress={onClose}
                className="bg-gray-200 px-6 py-3 rounded-lg"
              >
                <Text className="font-semibold text-gray-700">Cancel</Text>
              </Pressable>
              
              <Pressable
                onPress={retry}
                className="bg-blue-500 px-6 py-3 rounded-lg"
              >
                <Text className="font-semibold text-white">Try Again</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

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
                    : "Ask for recipes and tap 🍽️ to save them"
                }
              </Text>
            </View>
            
            <View className="flex-row items-center space-x-3">
              <Pressable
                onPress={() => webViewRef.current?.reload()}
                className="w-8 h-8 items-center justify-center rounded-full bg-blue-400"
              >
                <Ionicons name="refresh" size={16} color="white" />
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

        {/* Help Banner */}
        {!isLoading && !hasError && (
          <View className="bg-blue-50 border-b border-blue-200 px-4 py-3">
            <View className="flex-row items-start">
              <Ionicons name="information-circle" size={20} color="#3b82f6" />
              <View className="flex-1 ml-3">
                <Text className="text-blue-900 font-medium text-sm">
                  💬 Ask questions about oxalates, foods, and diet tips
                </Text>
                <Text className="text-blue-700 text-xs mt-1">
                  🍽️ For recipes, use the dedicated Recipe Generator in the Recipes tab
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <View className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
            <View className="bg-white rounded-lg p-4 shadow-lg items-center" style={{ elevation: 5 }}>
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text className="text-gray-600 mt-2">Loading Assistant...</Text>
            </View>
          </View>
        )}

        {/* WebView */}
        <WebView
          ref={webViewRef}
          source={{ uri: chatbotUrl }}
          style={{ flex: 1 }}
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          onError={handleError}
          onNavigationStateChange={handleNavigationStateChange}
          onMessage={handleWebViewMessage}
          injectedJavaScript={injectContextScript()}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          // Allow mixed content for HTTPS chatbot
          mixedContentMode="compatibility"
          // Security settings
          allowsBackForwardNavigationGestures={false}
          // Performance optimizations
          cacheEnabled={true}
          incognito={false}
          // Mobile-optimized user agent
          userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
          // Additional WebView optimizations
          thirdPartyCookiesEnabled={true}
          sharedCookiesEnabled={true}
          // Handle HTTP errors
          onHttpError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.warn('HTTP error:', nativeEvent.statusCode);
            if (nativeEvent.statusCode >= 400) {
              setHasError(true);
              setIsLoading(false);
            }
          }}
        />

        {/* Floating Recipe Capture Button */}
        {!isLoading && !hasError && (
          <Pressable
            onPress={handleRecipeCapture}
            className="absolute bottom-6 right-6 w-14 h-14 bg-green-500 rounded-full items-center justify-center shadow-lg"
            style={{ elevation: 5 }}
          >
            <Ionicons name="restaurant" size={24} color="white" />
          </Pressable>
        )}
      </View>
    </Modal>
  );
};

export default EmbeddedChatbot;