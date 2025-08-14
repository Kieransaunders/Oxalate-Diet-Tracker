// Navigation type definitions for the stack-based navigation system

// Root stack navigation - handles all screens
export type RootStackParamList = {
  Home: undefined;
  Foods: undefined;
  Tracker: undefined;
  Oracle: { contextFood?: string };
  Recipes: undefined;
  Settings: undefined;
};

// Legacy type for compatibility (can be removed in future updates)
export type MainTabParamList = {
  Home: undefined;
  Foods: undefined;
  Tracker: undefined;
  Oracle: { contextFood?: string };
  Recipes: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
