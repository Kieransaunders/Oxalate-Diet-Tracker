import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
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

export default function App() {
  const { initializePurchases } = useSubscriptionStore();

  useEffect(() => {
    const setupRevenueCat = async () => {
      try {
        await configureRevenueCat();
        await initializePurchases();
      } catch (error) {
        console.warn('RevenueCat setup failed:', error);
        // App continues to work without premium features
      }
    };

    setupRevenueCat();
  }, [initializePurchases]);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <OxalateTableScreen />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
