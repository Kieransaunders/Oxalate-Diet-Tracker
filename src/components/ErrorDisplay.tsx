import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cn } from '../utils/cn';

export interface ErrorAction {
  label: string;
  onPress: () => void;
  style?: 'primary' | 'secondary' | 'danger';
}

export interface ErrorDisplayProps {
  error?: string | null;
  type?: 'error' | 'warning' | 'info';
  actions?: ErrorAction[];
  onDismiss?: () => void;
  className?: string;
  showIcon?: boolean;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  type = 'error',
  actions = [],
  onDismiss,
  className,
  showIcon = true,
}) => {
  if (!error) return null;

  const getConfig = () => {
    switch (type) {
      case 'warning':
        return {
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          textColor: 'text-amber-800',
          iconColor: '#d97706',
          iconName: 'warning-outline' as const,
        };
      case 'info':
        return {
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800',
          iconColor: '#2563eb',
          iconName: 'information-circle-outline' as const,
        };
      default:
        return {
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          iconColor: '#dc2626',
          iconName: 'alert-circle-outline' as const,
        };
    }
  };

  const config = getConfig();

  const getActionButtonStyle = (style: ErrorAction['style'] = 'primary') => {
    switch (style) {
      case 'secondary':
        return 'bg-gray-100 border-gray-300 text-gray-700';
      case 'danger':
        return 'bg-red-100 border-red-300 text-red-700';
      default:
        return type === 'error' 
          ? 'bg-red-100 border-red-300 text-red-700'
          : type === 'warning'
          ? 'bg-amber-100 border-amber-300 text-amber-700'
          : 'bg-blue-100 border-blue-300 text-blue-700';
    }
  };

  return (
    <View className={cn(
      'rounded-lg border p-4 my-2',
      config.bgColor,
      config.borderColor,
      className
    )}>
      <View className="flex-row items-start">
        {showIcon && (
          <Ionicons 
            name={config.iconName} 
            size={20} 
            color={config.iconColor} 
            style={{ marginRight: 8, marginTop: 2 }}
          />
        )}
        
        <View className="flex-1">
          <Text className={cn('text-sm leading-5', config.textColor)}>
            {error}
          </Text>
          
          {actions.length > 0 && (
            <View className="flex-row flex-wrap gap-2 mt-3">
              {actions.map((action, index) => (
                <Pressable
                  key={index}
                  onPress={action.onPress}
                  className={cn(
                    'px-3 py-2 rounded-md border text-sm font-medium',
                    getActionButtonStyle(action.style)
                  )}
                >
                  <Text className={cn(
                    'text-sm font-medium',
                    action.style === 'secondary' ? 'text-gray-700' :
                    action.style === 'danger' ? 'text-red-700' :
                    type === 'error' ? 'text-red-700' :
                    type === 'warning' ? 'text-amber-700' :
                    'text-blue-700'
                  )}>
                    {action.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
        
        {onDismiss && (
          <Pressable 
            onPress={onDismiss}
            className="ml-2 p-1"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons 
              name="close" 
              size={16} 
              color={config.iconColor} 
            />
          </Pressable>
        )}
      </View>
    </View>
  );
};

export default ErrorDisplay;