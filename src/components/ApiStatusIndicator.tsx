import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { testApiConnection } from '../api/oxalate-api';

interface ApiStatusIndicatorProps {
  showDetails?: boolean;
}

const ApiStatusIndicator: React.FC<ApiStatusIndicatorProps> = ({ showDetails = false }) => {
  const [status, setStatus] = useState<{
    success: boolean;
    message: string;
    recordCount?: number;
  } | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkStatus = async () => {
    setIsChecking(true);
    try {
      const result = await testApiConnection();
      setStatus(result);
    } catch (error) {
      setStatus({
        success: false,
        message: 'Failed to check API status',
        recordCount: 0
      });
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  if (!status && !isChecking) {
    return null;
  }

  const getStatusColor = () => {
    if (isChecking) return '#6b7280';
    if (!status) return '#ef4444';
    return status.success ? '#10b981' : '#ef4444';
  };

  const getStatusIcon = () => {
    if (isChecking) return 'refresh';
    if (!status) return 'alert-circle';
    return status.success ? 'checkmark-circle' : 'close-circle';
  };

  return (
    <View className="bg-gray-50 rounded-lg p-3 border border-gray-200">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          {isChecking ? (
            <ActivityIndicator size="small" color={getStatusColor()} />
          ) : (
            <Ionicons 
              name={getStatusIcon()} 
              size={20} 
              color={getStatusColor()} 
            />
          )}
          <Text className="ml-2 font-medium text-gray-900">
            {isChecking ? 'Checking API...' : 'API Status'}
          </Text>
        </View>
        
        <Pressable
          onPress={checkStatus}
          disabled={isChecking}
          className="p-1"
        >
          <Ionicons 
            name="refresh" 
            size={16} 
            color="#6b7280" 
          />
        </Pressable>
      </View>

      {status && showDetails && (
        <View className="mt-2 pt-2 border-t border-gray-200">
          <Text className="text-sm text-gray-600">
            {status.message}
          </Text>
          {status.recordCount !== undefined && (
            <Text className="text-xs text-gray-500 mt-1">
              Records available: {status.recordCount}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

export default ApiStatusIndicator;