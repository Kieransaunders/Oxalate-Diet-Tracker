# Design Document

## Overview

This design consolidates the app's navigation system by implementing a single, consistent navigation architecture using React Navigation's Tab Navigator as the primary navigation method, with proper modal handling for secondary screens. The design eliminates duplicate navigation implementations and ensures all screens work correctly within the unified system.

## Architecture

### Navigation Structure

The app will use a **hybrid navigation architecture**:

1. **Primary Navigation**: Bottom Tab Navigator for main app sections
2. **Modal Navigation**: Stack-based modals for secondary screens (Settings, detailed views)
3. **Component Integration**: Proper handling of components that can work both as modals and full screens

### Navigation Flow

```
App.tsx
├── NavigationContainer
└── MainTabNavigator (Primary)
    ├── Home Tab → HomeScreen
    ├── Foods Tab → OxalateTableScreen  
    ├── Tracker Tab → MealTrackerScreen (new wrapper)
    ├── Oracle Tab → OracleScreen (tab-compatible wrapper)
    └── Recipes Tab → RecipesScreen (tab-compatible wrapper)
    
Modal Stack (Secondary)
├── SettingsModal
└── Other modals as needed
```

## Components and Interfaces

### 1. Navigation Type Definitions

**File**: `src/navigation/types.ts`

```typescript
export type MainTabParamList = {
  Home: undefined;
  Foods: undefined;
  Tracker: undefined;
  Oracle: { contextFood?: string };
  Recipes: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  Settings: undefined;
};
```

### 2. Main Tab Navigator

**File**: `src/navigation/MainTabNavigator.tsx`

- Implements bottom tab navigation for 5 main screens
- Uses consistent tab icons and styling
- Handles proper screen wrapping for components that need navigation context
- Manages tab-specific behavior and state preservation

### 3. Root Navigator

**File**: `src/navigation/RootNavigator.tsx` (new)

- Wraps MainTabNavigator in a Stack Navigator
- Handles modal screens (Settings, etc.)
- Manages global navigation state

### 4. Screen Wrappers

**Purpose**: Convert modal-designed components to work as full screens in tabs

#### MealTrackerScreen Wrapper
- Wraps the MealTracker component
- Removes modal behavior when used as a tab screen
- Provides proper navigation context

#### Oracle/Recipes Tab Wrappers  
- Adapt modal-designed screens for tab usage
- Handle close button behavior (navigate to Home instead of modal close)
- Maintain screen functionality while fitting tab paradigm

### 5. Modal Management

**Implementation**: Use React Navigation's modal presentation
- Settings screen as a modal from any tab
- Maintain proper modal behavior for appropriate screens
- Handle modal-specific navigation patterns

## Data Models

### Navigation State Management

The navigation system will maintain:

1. **Tab State**: Current active tab and tab history
2. **Modal State**: Currently open modals and their context
3. **Screen Parameters**: Proper parameter passing between screens
4. **Navigation Context**: Available throughout the component tree

### Screen Component Props

Standardized props interface for all screens:

```typescript
interface ScreenProps {
  navigation: NavigationProp<any>;
  route: RouteProp<any>;
}

interface TabScreenProps extends ScreenProps {
  // Tab-specific props
}

interface ModalScreenProps extends ScreenProps {
  // Modal-specific props  
}
```

## Error Handling

### Navigation Error Recovery

1. **Invalid Route Handling**: Fallback to Home screen for invalid routes
2. **Missing Screen Protection**: Type-safe navigation with proper error boundaries
3. **State Recovery**: Restore navigation state on app restart
4. **Deep Link Handling**: Proper handling of external navigation requests

### Component Error Boundaries

- Wrap each major screen in error boundaries
- Provide fallback UI for navigation failures
- Log navigation errors for debugging

## Testing Strategy

### Navigation Testing

1. **Unit Tests**: Test navigation functions and route handling
2. **Integration Tests**: Test screen transitions and state management
3. **E2E Tests**: Test complete user navigation flows

### Screen Component Testing

1. **Render Tests**: Ensure all screens render correctly in both tab and modal contexts
2. **Navigation Tests**: Test navigation prop handling and screen transitions
3. **State Tests**: Verify proper state management across navigation changes

### Test Scenarios

1. **Tab Navigation**: Test switching between all tabs
2. **Modal Presentation**: Test opening/closing modals from different contexts
3. **Deep Linking**: Test navigation from external sources
4. **State Persistence**: Test navigation state across app lifecycle
5. **Error Recovery**: Test navigation error handling and recovery

### Component Compatibility Testing

1. **MealTracker**: Test both modal and full-screen usage
2. **Oracle/Recipes**: Test adaptation from modal to tab usage
3. **Settings**: Test modal behavior from different entry points

## Implementation Approach

### Phase 1: Navigation Structure
- Create new RootNavigator with tab + modal stack
- Update navigation types
- Implement MainTabNavigator

### Phase 2: Screen Adaptation  
- Create MealTrackerScreen wrapper
- Adapt Oracle/Recipes for tab usage
- Update Settings for proper modal behavior

### Phase 3: Integration & Cleanup
- Update App.tsx to use new navigation
- Remove old AppNavigator
- Clean up unused navigation code
- Update all navigation references

### Phase 4: Testing & Polish
- Implement comprehensive navigation tests
- Polish transitions and user experience
- Verify all navigation flows work correctly