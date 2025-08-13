# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Oxalate Diet Tracker App

## Development Commands

### Core Development
- `expo start` - Start the development server with Metro bundler
- `expo run:ios` - Build and run on iOS simulator/device  
- `expo run:android` - Build and run on Android emulator/device
- `expo start --web` - Run web version for quick testing

### Testing
- `npx jest` - Run all unit tests
- `npx jest --watch` - Run tests in watch mode during development
- `npx jest src/state/__tests__/mealStore.test.ts` - Run specific test file
- `npx jest --coverage` - Generate test coverage reports

### Code Quality
- `npx eslint .` - Run ESLint on entire codebase
- `npx eslint src/components/` - Lint specific directory
- `npx prettier --write .` - Format all code with Prettier

## Overview
A comprehensive React Native/Expo mobile application designed to help users manage a low-oxalate diet. The app combines a robust food database, meal tracking, AI-powered dietary guidance, and recipe management to support individuals with kidney stones or other conditions requiring oxalate monitoring.

## Core Features

### 🍎 Food Database & Search
- **Comprehensive Database**: Extensive collection of foods with precise oxalate content (mg per serving)
- **Traffic Light System**: Visual categorization using color-coded indicators
  - 🟢 Low: Safe for regular consumption
  - 🟡 Medium: Moderate consumption recommended
  - 🟠 High: Limited consumption advised
  - 🔴 Very High: Avoid or consume sparingly
- **Advanced Search**: Real-time search across food names and categories
- **Smart Filtering**: Filter by oxalate categories and food groups
- **Detailed Nutrition**: Complete nutritional information including calories, protein, fiber
- **Food Groups**: Organized by categories (Fruits, Vegetables, Nuts & Seeds, etc.)

### 📊 Meal Tracking
- **Daily Tracker**: Log meals with portion sizes and calculated oxalate amounts
- **Running Totals**: Real-time tracking of daily oxalate intake
- **Portion Control**: Adjustable serving sizes with automatic oxalate recalculation
- **Historical Data**: Track progress over time

### 🤖 AI-Powered Oracle
- **Multi-Model Support**: Integrated with OpenAI, Anthropic Claude, and Grok APIs
- **Contextual Advice**: Get personalized recommendations for specific foods
- **Dietary Guidance**: Ask questions about oxalate content and meal planning
- **Smart Suggestions**: AI-driven recommendations based on your dietary needs

### 👨‍🍳 Recipe Management
- **Recipe Storage**: Save and organize low-oxalate recipes
- **Smart Modifications**: AI-powered recipe adaptations for lower oxalate content
- **Nutritional Analysis**: Calculate oxalate content for custom recipes

## Technical Architecture

### State Management with Zustand
The app uses Zustand for state management with these key stores:

- **`oxalateStore`**: Central food database state with smart caching
  - Handles online/offline data syncing with 24-hour cache expiration
  - Supports live API data (324+ foods) and demo fallback
  - Real-time filtering, searching, and sorting with traffic light categorization
  - Auto-detects network status and data source type

- **`mealStore`**: Daily meal tracking with persistent storage
  - Tracks daily oxalate intake with portion calculations
  - Supports recipe ingredient bulk addition with smart food matching
  - Provides food lookup by name/aliases with fuzzy matching
  - Maintains historical meal data

- **`oracleStore`**: AI chat history and context management
- **`subscriptionStore`**: Premium tier features and usage limits
- **`recipeStore`**: Recipe storage and management

### Data Flow Patterns
1. **API Integration**: Primary live API with fallback to comprehensive demo data
2. **Caching Strategy**: 24-hour cache with offline support using AsyncStorage + MMKV
3. **Real-time Updates**: Zustand subscriptions trigger UI updates across components
4. **Error Boundaries**: Graceful degradation with user-friendly fallbacks

### Frontend Stack
- **Framework**: React Native 0.79.5 with Expo 53.0.20
- **Navigation**: React Navigation v7 with bottom tabs and stack navigation
- **Styling**: NativeWind (Tailwind CSS for React Native) with `cn()` utility for class merging
- **Testing**: Jest with React Native Testing Library, custom test utilities and mocks
- **Storage**: MMKV for performance-critical data, AsyncStorage for persistence

### AI Integration Architecture
- **Multi-Model Support**: OpenAI GPT-4, Anthropic Claude, and Grok APIs
- **Context Management**: Food-specific conversations with chat history persistence
- **Usage Tracking**: Premium tier limits with RevenueCat integration

## Testing Architecture

### Test Structure
- **Unit Tests**: Comprehensive coverage for stores, API, utilities, and components
- **Mock System**: Custom test utilities in `src/test-utils/` for consistent mocking
- **Test Environment**: Jest with jsdom environment, React Native Testing Library

### Key Testing Patterns
- **Store Testing**: Uses `renderHook` and `act` for Zustand store testing
- **Component Testing**: Custom render function with SafeAreaProvider wrapper
- **API Mocking**: Global fetch mocking with realistic response patterns
- **Mock Factories**: Pre-built mock objects for foods, meals, recipes, user data

### Critical Testing Areas
- Online/offline behavior and caching strategies
- Real-time filtering and search functionality  
- Premium tier limitations and subscription logic
- AI integration error handling and fallbacks

## File Structure

```
src/
├── components/
│   ├── BottomNavigation.tsx    # Main navigation component
│   ├── NutritionModal.tsx      # Food details modal
│   └── MealTracker.tsx         # Daily meal tracking interface
├── screens/
│   ├── OxalateTableScreen.tsx  # Main food database screen
│   ├── OracleScreen.tsx        # AI chat interface
│   ├── RecipesScreen.tsx       # Recipe management
│   └── SettingsScreen.tsx      # App configuration
├── state/
│   ├── oxalateStore.ts         # Food database state
│   ├── mealStore.ts            # Meal tracking state
│   └── oracleStore.ts          # AI chat state
├── api/
│   ├── oxalate-api.ts          # Food database API
│   ├── chat-service.ts         # AI service integration
│   ├── openai.ts               # OpenAI client
│   ├── anthropic.ts            # Anthropic client
│   └── grok.ts                 # Grok client
├── types/
│   └── oxalate.ts              # TypeScript definitions
└── utils/
    └── cn.ts                   # Tailwind class merging utility
```

## Key Features Implementation

### Traffic Light System
```typescript
const getCategoryColor = (category: OxalateCategory) => {
  switch (category) {
    case 'Low': return '#10b981';      // Green
    case 'Medium': return '#f59e0b';   // Yellow
    case 'High': return '#f97316';     // Orange
    case 'Very High': return '#ef4444'; // Red
  }
};
```

### Smart Search & Filtering
- Real-time search across food names and groups
- Multi-category filtering with visual indicators
- Sorting by name, oxalate content, or category
- Group view for organized browsing

### AI Integration
- Context-aware conversations about specific foods
- Multi-model support for diverse AI perspectives
- Chat history persistence
- Food-specific recommendations

## User Experience

### Navigation Flow
1. **Main Screen**: Food database with search and filtering
2. **Food Details**: Tap any food for detailed nutrition information
3. **Meal Tracking**: Add foods to daily tracker with portion control
4. **AI Oracle**: Get personalized dietary advice
5. **Recipes**: Manage and create low-oxalate recipes

### Visual Design
- Clean, medical-grade interface with accessibility in mind
- Color-coded system for quick oxalate level identification
- Intuitive icons and clear typography
- Responsive design for various screen sizes

## Data Sources
- Comprehensive oxalate database with serving sizes
- Nutritional information including calories, protein, fiber
- Food categorization by groups and oxalate levels
- Fallback to demo data for offline functionality

## Security & Privacy
- Local data storage for privacy
- Secure API key management
- No personal health data transmitted to third parties
- Environment-based configuration for API keys

## Development Features
- TypeScript for type safety
- ESLint and Prettier for code quality
- Hot reloading for rapid development
- Comprehensive error handling and fallbacks

## Target Users
- Individuals with kidney stones
- People following low-oxalate diets
- Healthcare providers and nutritionists
- Anyone monitoring oxalate intake for health reasons

## Future Enhancements
- Barcode scanning for packaged foods
- Integration with health apps
- Meal planning and shopping lists
- Community recipe sharing
- Healthcare provider integration

This app represents a comprehensive solution for oxalate diet management, combining modern mobile development practices with AI-powered guidance to create a valuable health management tool.

## Current Status
✅ **PRODUCTION READY** - The app is now fully functional with all major issues resolved:

### ✅ Completed Features
- **Live API Integration**: Successfully connected to live database with 324 real food items
- **Smart Caching**: Online/offline data management with automatic sync
- **Clean User Experience**: All technical warnings and API details removed from UI
- **Crash-Free Operation**: Calendar permission issues resolved, stable iOS build
- **Custom Branding**: App icon properly configured and displaying
- **Complete Feature Set**: 
  - Food database with search and filtering
  - Meal tracking with portion control
  - AI Oracle for dietary guidance
  - Recipe management system
  - Pull-to-refresh functionality

### 🔧 Technical Achievements
- **API Resolution**: Fixed authentication and data mapping for live 324-food database
- **iOS Stability**: Resolved ExpoCalendar crashes and build issues
- **Performance**: Implemented efficient caching and offline capabilities
- **Code Quality**: Clean architecture with TypeScript, proper error handling
- **User Privacy**: No technical implementation details exposed to users

The app now provides a seamless, professional experience for users managing low-oxalate diets with real-time data, intelligent fallbacks, and comprehensive health management tools.