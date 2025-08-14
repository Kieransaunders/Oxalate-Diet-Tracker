import { Alert } from 'react-native';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastConfig {
  title: string;
  message?: string;
  type: ToastType;
  duration?: number;
  priority?: 'low' | 'normal' | 'high';
  action?: {
    label: string;
    onPress: () => void;
  };
  dismissible?: boolean;
}

// For now, we'll use a simple Alert replacement with better UX
// This can later be replaced with a proper toast library like react-native-toast-message
class ToastManager {
  private toastQueue: ToastConfig[] = [];
  private isShowing = false;

  show(config: ToastConfig) {
    // Set defaults
    const toastConfig = {
      priority: 'normal' as const,
      dismissible: true,
      ...config,
    };

    // Insert based on priority
    if (toastConfig.priority === 'high') {
      this.toastQueue.unshift(toastConfig);
    } else {
      this.toastQueue.push(toastConfig);
    }
    
    if (!this.isShowing) {
      this.processQueue();
    }
  }

  private async processQueue() {
    if (this.toastQueue.length === 0) {
      this.isShowing = false;
      return;
    }

    this.isShowing = true;
    const toast = this.toastQueue.shift()!;
    
    const buttons: any[] = [
      { text: 'OK', style: 'default' as const }
    ];

    if (toast.action) {
      buttons.unshift({
        text: toast.action.label,
        onPress: toast.action.onPress,
      });
    }

    Alert.alert(toast.title, toast.message, buttons, {
      cancelable: true,
      onDismiss: () => {
        // Process next toast after a short delay
        setTimeout(() => this.processQueue(), 300);
      }
    });
  }

  success(title: string, message?: string, action?: ToastConfig['action']) {
    this.show({ title, message, type: 'success', action });
  }

  error(title: string, message?: string, action?: ToastConfig['action']) {
    this.show({ title, message, type: 'error', action });
  }

  warning(title: string, message?: string, action?: ToastConfig['action']) {
    this.show({ title, message, type: 'warning', action });
  }

  info(title: string, message?: string, action?: ToastConfig['action']) {
    this.show({ title, message, type: 'info', action });
  }
}

export const toast = new ToastManager();