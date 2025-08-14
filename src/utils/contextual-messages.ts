import { toast } from './toast';

export interface ContextualMessage {
  title: string;
  message: string;
  type: 'error' | 'warning' | 'info' | 'success';
  context?: string;
  actions?: Array<{
    label: string;
    onPress: () => void;
  }>;
}

export class ContextualMessageManager {
  
  // Recipe-related messages
  static recipeCreationFailed(reason: 'limit_reached' | 'validation_error' | 'save_error', retryAction?: () => void) {
    switch (reason) {
      case 'limit_reached':
        return toast.warning(
          'Recipe Limit Reached',
          'You\'ve reached your free recipe limit. Upgrade to Premium to create unlimited recipes and unlock all features.',
          {
            label: 'Upgrade to Premium',
            onPress: () => {
              // This will be handled by the calling component to show paywall
            }
          }
        );
      
      case 'validation_error':
        return toast.warning(
          'Recipe Information Missing',
          'Please fill in all required fields: recipe name, ingredients, and servings.'
        );
      
      case 'save_error':
        return toast.error(
          'Save Failed',
          'Unable to save your recipe. Please check your connection and try again.',
          retryAction ? {
            label: 'Try Again',
            onPress: retryAction
          } : undefined
        );
    }
  }

  // Meal tracking messages  
  static mealTrackingMessage(type: 'added' | 'limit_reached' | 'network_error', data?: any) {
    switch (type) {
      case 'added':
        return toast.success(
          'Added to Tracker',
          data?.foodName ? `${data.foodName} has been added to your daily meal tracker.` : 'Food item added to your daily tracker.',
          {
            label: 'View Progress',
            onPress: data?.onViewTracker || (() => {})
          }
        );
      
      case 'limit_reached':
        return toast.warning(
          'Tracking Limit Reached',
          `You've used ${data?.daysUsed || 3} of your ${data?.totalDays || 3} free tracking days. Upgrade to Premium for unlimited tracking.`,
          {
            label: 'Upgrade Now',
            onPress: data?.onUpgrade || (() => {})
          }
        );
      
      case 'network_error':
        return toast.error(
          'Connection Issue',
          'Unable to sync your meal data. Your changes are saved locally and will sync when connection is restored.'
        );
    }
  }

  // Oracle chat messages
  static oracleMessage(type: 'limit_reached' | 'api_error' | 'helpful_tip', data?: any) {
    switch (type) {
      case 'limit_reached': {
        const isMonthly = data?.isMonthly || false;
        const resetTime = isMonthly ? 'next month' : 'tomorrow';
        
        return toast.warning(
          'Oracle Questions Limit',
          `You've used all your ${isMonthly ? 'monthly' : 'daily'} Oracle questions. Upgrade to Premium for unlimited questions or wait until ${resetTime}.`,
          {
            label: 'Upgrade to Premium',
            onPress: data?.onUpgrade || (() => {})
          }
        );
      }
      
      case 'api_error':
        return toast.error(
          'Oracle Temporarily Unavailable',
          'The Oracle service is experiencing issues. Please try again in a few moments.',
          {
            label: 'Retry',
            onPress: data?.onRetry || (() => {})
          }
        );
      
      case 'helpful_tip':
        return toast.info(
          'Oracle Tip',
          data?.message || 'Ask the Oracle specific questions about foods for personalized oxalate guidance.'
        );
    }
  }

  // Subscription messages
  static subscriptionMessage(type: 'purchase_success' | 'restore_success' | 'network_error' | 'welcome_premium', data?: any) {
    switch (type) {
      case 'purchase_success':
        return toast.success(
          'Welcome to Premium! 🎉',
          'Thank you for upgrading! You now have unlimited access to all features including unlimited Oracle questions, recipes, and tracking.',
          {
            label: 'Explore Features',
            onPress: data?.onExplore || (() => {})
          }
        );
      
      case 'restore_success':
        return toast.success(
          'Premium Restored',
          'Your Premium subscription has been successfully restored. All Premium features are now available.',
          {
            label: 'Continue',
            onPress: data?.onContinue || (() => {})
          }
        );
      
      case 'network_error':
        return toast.error(
          'Purchase Issue',
          'Unable to complete the purchase due to network issues. Please check your connection and try again.',
          {
            label: 'Retry',
            onPress: data?.onRetry || (() => {})
          }
        );
      
      case 'welcome_premium':
        return toast.info(
          'Premium Features Available',
          'As a Premium user, you have unlimited access to Oracle questions, recipe creation, and meal tracking. Enjoy!'
        );
    }
  }

  // General app messages
  static appMessage(type: 'offline' | 'data_synced' | 'feature_tip' | 'update_available', data?: any) {
    switch (type) {
      case 'offline':
        return toast.warning(
          'Offline Mode',
          'You\'re currently offline. The app will continue to work with cached data, and changes will sync when you\'re back online.'
        );
      
      case 'data_synced':
        return toast.success(
          'Data Synced',
          'Your local changes have been successfully synced to the cloud.'
        );
      
      case 'feature_tip':
        return toast.info(
          'Did You Know?',
          data?.message || 'Tap and hold on any food item to quickly add it to your meal tracker.'
        );
      
      case 'update_available':
        return toast.info(
          'Update Available',
          'A new version of the app is available with improvements and new features.',
          {
            label: 'Update Now',
            onPress: data?.onUpdate || (() => {})
          }
        );
    }
  }
}

export const contextualMessages = ContextualMessageManager;