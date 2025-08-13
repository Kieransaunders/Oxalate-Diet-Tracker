import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import * as Sentry from "@sentry/react-native";
import OxalateTableScreen from "./src/screens/OxalateTableScreen";
import { useSubscriptionStore } from "./src/state/subscriptionStore";
import { configureRevenueCat } from "./src/config/revenuecat";

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
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
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
  const { initializePurchases } = useSubscriptionStore();

  useEffect(() => {
    // RevenueCat disabled for development - Oracle is unlocked
    console.log('RevenueCat disabled - running in unlimited mode');
    // Skip RevenueCat initialization to avoid API key errors
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <OxalateTableScreen />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default Sentry.wrap(App);
