import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import * as SplashScreen from 'expo-splash-screen';
import * as Sentry from "@sentry/react-native";
import { Platform } from 'react-native';
import { useSubscriptionStore } from "./src/state/subscriptionStore";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { configureRevenueCat } from "./src/config/revenuecat";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

/*
IMPORTANT NOTICE: DO NOT REMOVE
There are already environment keys in the project. 
Before telling the user to add them, check if you already have access to the required keys through bash.
Directly access them with process.env.${key}

Correct usage:
process.env.EXPO_PUBLIC_VIBECODE_{key}
//directly access the key

Incorrect usage:
import { OPENAI_API_KEY } from '@env';
//don't use @env, its depreicated

Incorrect usage:
import Constants from 'expo-constants';
const openai_api_key = Constants.expoConfig.extra.apikey;
//don't use expo-constants, its depreicated

*/

// Initialize Sentry
Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  environment: __DEV__ ? "development" : "production",
  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/manual-setup/
  sendDefaultPii: true,
  beforeSend(event) {
    // Don't send events in development unless explicitly needed
    if (__DEV__ && !process.env.EXPO_PUBLIC_SENTRY_DEBUG) {
      return null;
    }
    return event;
  },
});

function App() {
  const { initializePurchases, updateCustomerInfo } = useSubscriptionStore();

  useEffect(() => {
    async function initializeApp() {
      try {
        // Configure RevenueCat SDK first
        const isConfigured = await configureRevenueCat();
        
        if (isConfigured) {
          // Set up customer info update listener
          let Purchases: any = null;
          try {
            if (Platform.OS === 'ios' || Platform.OS === 'android') {
              const PurchasesModule = require('react-native-purchases');
              Purchases = PurchasesModule.default;
              
              // Add listener for automatic customer info updates
              Purchases.addCustomerInfoUpdateListener((customerInfo: any) => {
                console.log('Customer info updated:', customerInfo);
                updateCustomerInfo(customerInfo);
              });
            }
          } catch (error) {
            console.warn('Failed to set up customer info listener:', error);
          }
        }
        
        // Initialize purchases store
        await initializePurchases();
      } catch (error) {
        console.warn('Failed to initialize purchases:', error);
      } finally {
        // Hide splash screen
        await SplashScreen.hideAsync();
      }
    }

    initializeApp();
  }, [initializePurchases, updateCustomerInfo]);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default Sentry.wrap(App);
