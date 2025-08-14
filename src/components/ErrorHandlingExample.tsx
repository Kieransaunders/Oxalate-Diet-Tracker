import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { contextualMessages } from '../utils/contextual-messages';
import ErrorDisplay from './ErrorDisplay';
import { cn } from '../utils/cn';

/**
 * Example component demonstrating the improved error handling UX
 * This can be used for testing or as a reference implementation
 */
const ErrorHandlingExample: React.FC = () => {
  const { error, showError, showToast, clearError, hasError } = useErrorHandler();

  const handleInlineError = () => {
    showError({
      message: 'This is an inline error that stays on screen until dismissed.',
      type: 'error',
      actions: [
        {
          label: 'Retry',
          onPress: () => {
            clearError();
            showToast('Retried successfully!', 'info');
          }
        },
        {
          label: 'Cancel',
          onPress: clearError
        }
      ]
    });
  };

  const handleWarningMessage = () => {
    showError('You are approaching your daily limit. Consider upgrading to Premium.', 'warning');
  };

  const handleInfoMessage = () => {
    showError('Tip: You can save recipes by tapping the bookmark icon.', 'info');
  };

  const handleContextualToast = () => {
    contextualMessages.recipeCreationFailed('limit_reached');
  };

  const handleOracleLimit = () => {
    contextualMessages.oracleMessage('limit_reached', {
      isMonthly: false,
      onUpgrade: () => {
        console.log('Show paywall for upgrade');
      }
    });
  };

  const handleMealAdded = () => {
    contextualMessages.mealTrackingMessage('added', {
      foodName: 'Spinach',
      onViewTracker: () => {
        console.log('Navigate to meal tracker');
      }
    });
  };

  return (
    <View className="p-4 space-y-4">
      <Text className="text-lg font-bold text-gray-900 mb-4">
        Error Handling Examples
      </Text>

      {/* Inline Error Display */}
      {hasError && (
        <ErrorDisplay
          error={error?.message}
          type={error?.type}
          actions={error?.actions}
          onDismiss={clearError}
        />
      )}

      {/* Demo Buttons */}
      <View className="space-y-3">
        <Pressable 
          onPress={handleInlineError}
          className="bg-red-100 border border-red-300 rounded-lg p-3"
        >
          <Text className="text-red-700 font-medium">Show Inline Error</Text>
        </Pressable>

        <Pressable 
          onPress={handleWarningMessage}
          className="bg-amber-100 border border-amber-300 rounded-lg p-3"
        >
          <Text className="text-amber-700 font-medium">Show Warning</Text>
        </Pressable>

        <Pressable 
          onPress={handleInfoMessage}
          className="bg-blue-100 border border-blue-300 rounded-lg p-3"
        >
          <Text className="text-blue-700 font-medium">Show Info Message</Text>
        </Pressable>

        <View className="border-t border-gray-200 pt-4">
          <Text className="text-md font-semibold text-gray-800 mb-3">
            Contextual Toast Examples
          </Text>
          
          <Pressable 
            onPress={handleContextualToast}
            className="bg-purple-100 border border-purple-300 rounded-lg p-3 mb-2"
          >
            <Text className="text-purple-700 font-medium">Recipe Limit Reached</Text>
          </Pressable>

          <Pressable 
            onPress={handleOracleLimit}
            className="bg-indigo-100 border border-indigo-300 rounded-lg p-3 mb-2"
          >
            <Text className="text-indigo-700 font-medium">Oracle Questions Limit</Text>
          </Pressable>

          <Pressable 
            onPress={handleMealAdded}
            className="bg-green-100 border border-green-300 rounded-lg p-3"
          >
            <Text className="text-green-700 font-medium">Meal Added Success</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

export default ErrorHandlingExample;