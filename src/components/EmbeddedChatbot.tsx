import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useMealStore } from '../state/mealStore';

interface EmbeddedChatbotProps {
  visible: boolean;
  onClose: () => void;
  contextFood?: string;
}

const EmbeddedChatbot: React.FC<EmbeddedChatbotProps> = ({ 
  visible, 
  onClose, 
  contextFood 
}) => {
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const webViewRef = useRef<WebView>(null);
  const { currentDay } = useMealStore();

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

  const injectContextScript = () => {
    if (!contextFood && currentDay.items.length === 0) return '';

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
                    : "Ask about oxalates, foods, and diet tips"
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
      </View>
    </Modal>
  );
};

export default EmbeddedChatbot;