# Testing Guide for Oxalate Diet Tracker

This document provides comprehensive guidelines for testing the Oxalate Diet Tracker React Native/Expo application.

## Table of Contents

1. [Testing Setup](#testing-setup)
2. [Test Structure](#test-structure)
3. [Running Tests](#running-tests)
4. [Testing Patterns](#testing-patterns)
5. [Mocking Strategies](#mocking-strategies)
6. [Coverage Guidelines](#coverage-guidelines)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

## Testing Setup

### Dependencies

Our testing stack includes:

- **Jest**: JavaScript testing framework
- **React Native Testing Library**: Testing utilities for React Native components
- **@testing-library/jest-native**: Additional matchers for React Native
- **React Test Renderer**: Required by React Native Testing Library

### Configuration Files

- `jest.config.js`: Main Jest configuration
- `jest-setup.ts`: Test environment setup and global mocks
- `jest-polyfills.js`: Polyfills for React Native environment
- `src/test-utils/index.ts`: Custom testing utilities and helpers

## Test Structure

### Directory Structure

```
src/
├── __tests__/                    # Integration tests
│   └── premium-integration.test.ts
├── api/
│   └── __tests__/                # API layer tests
│       └── oxalate-api.test.ts
├── components/
│   └── __tests__/                # Component tests
│       ├── BottomNavigation.test.tsx
│       └── PremiumGate.test.tsx
├── screens/
│   └── __tests__/                # Screen tests
│       └── OxalateTableScreen.test.tsx
├── state/
│   └── __tests__/                # State management tests
│       ├── mealStore.test.ts
│       ├── oxalateStore.test.ts
│       └── subscriptionStore.test.ts
├── utils/
│   └── __tests__/                # Utility function tests
│       └── cn.test.ts
└── test-utils/
    └── index.ts                  # Testing utilities
```

### Test Categories

1. **Unit Tests**: Individual functions, utilities, and store logic
2. **Component Tests**: React components in isolation
3. **Integration Tests**: Cross-feature functionality and user workflows
4. **Screen Tests**: Full screen components with mocked dependencies

## Running Tests

### Available Scripts

```bash
# Run all tests once
npm test

# Run tests in watch mode (development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests in CI mode (no watch, coverage)
npm run test:ci

# Update test snapshots
npm run test:update-snapshots
```

### Running Specific Tests

```bash
# Run tests for specific file
npm test -- mealStore.test.ts

# Run tests matching pattern
npm test -- --testPathPattern="components"

# Run tests with specific name pattern
npm test -- --testNamePattern="premium"
```

## Testing Patterns

### Store Testing Pattern

```typescript
import { act, renderHook } from '@testing-library/react-native';
import { useMealStore } from '../mealStore';

describe('mealStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    act(() => {
      useMealStore.getState().clearDay();
    });
  });

  it('should add meal item correctly', () => {
    const { result } = renderHook(() => useMealStore());
    const mockFood = createMockFood();

    act(() => {
      result.current.addMealItem(mockFood, 1, 10);
    });

    expect(result.current.currentDay.items).toHaveLength(1);
  });
});
```

### Component Testing Pattern

```typescript
import { render, fireEvent, screen } from '../../test-utils';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  const defaultProps = {
    onPress: jest.fn(),
    title: 'Test Title',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    render(<MyComponent {...defaultProps} />);
    
    expect(screen.getByText('Test Title')).toBeTruthy();
  });

  it('should handle press events', () => {
    render(<MyComponent {...defaultProps} />);
    
    fireEvent.press(screen.getByText('Test Title'));
    expect(defaultProps.onPress).toHaveBeenCalled();
  });
});
```

### Async Testing Pattern

```typescript
it('should fetch data correctly', async () => {
  const { result } = renderHook(() => useOxalateStore());

  await act(async () => {
    await result.current.fetchFoods();
  });

  expect(result.current.foods).toHaveLength(3);
  expect(result.current.isLoading).toBe(false);
});
```

## Mocking Strategies

### Store Mocking

```typescript
jest.mock('../../state/subscriptionStore');
const mockUseSubscriptionStore = useSubscriptionStore as jest.MockedFunction<typeof useSubscriptionStore>;

mockUseSubscriptionStore.mockReturnValue({
  status: 'premium',
  canAskOracleQuestion: () => true,
  // ... other store methods
} as any);
```

### API Mocking

```typescript
// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

beforeEach(() => {
  mockFetch.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ data: mockApiResponse }),
  } as any);
});
```

### Navigation Mocking

Navigation mocking is handled globally in `jest-setup.ts`:

```typescript
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
  // ... other navigation mocks
}));
```

### RevenueCat Mocking

```typescript
jest.mock('react-native-purchases', () => ({
  configure: jest.fn(),
  getCustomerInfo: jest.fn(),
  purchasePackage: jest.fn(),
  restorePurchases: jest.fn(),
}));
```

## Coverage Guidelines

### Coverage Targets

- **Overall Coverage**: > 80%
- **Functions**: > 85%
- **Branches**: > 75%
- **Lines**: > 80%

### Coverage Exclusions

The following are excluded from coverage requirements:

- Type definition files (`*.d.ts`)
- Configuration files (`src/config/**/*`)
- Stories and examples (`*.stories.*`)

### Viewing Coverage

```bash
# Generate coverage report
npm run test:coverage

# Open HTML coverage report
open coverage/lcov-report/index.html
```

## Best Practices

### Test Organization

1. **Descriptive Test Names**: Use clear, descriptive test names that explain what is being tested
2. **Arrange-Act-Assert**: Structure tests with clear setup, action, and assertion phases
3. **Single Responsibility**: Each test should focus on one specific behavior
4. **Independent Tests**: Tests should not depend on each other

### Mock Management

1. **Reset Mocks**: Always clear mocks between tests using `jest.clearAllMocks()`
2. **Minimal Mocking**: Only mock what's necessary for the test
3. **Realistic Mocks**: Ensure mocks behave similarly to real implementations
4. **Mock Verification**: Verify that mocks are called correctly

### Data Management

1. **Factory Functions**: Use factory functions for creating test data
2. **Consistent State**: Reset application state between tests
3. **Isolated Data**: Each test should use its own data instances

### Async Testing

1. **Proper Awaiting**: Always await async operations in tests
2. **Act Wrapper**: Use `act()` wrapper for state updates
3. **waitFor Utility**: Use `waitFor()` for testing async UI updates

### Component Testing

1. **User-Centric**: Test components from a user's perspective
2. **Accessibility**: Test that components are accessible
3. **Error States**: Test error conditions and edge cases
4. **Props Validation**: Test component behavior with different props

## Test Utilities

### Custom Render Function

Our custom render function includes necessary providers:

```typescript
import { render } from '../../test-utils';

// Automatically includes SafeAreaProvider and other context providers
render(<MyComponent />);
```

### Mock Data Factories

```typescript
import { createMockFood, createMockMealItem, createMockCustomerInfo } from '../../test-utils';

const mockFood = createMockFood({ 
  name: 'Custom Food', 
  oxalate_mg: 100 
});
```

### Test Utilities Available

- `createMockFood()`: Creates mock food items
- `createMockMealItem()`: Creates mock meal tracker items
- `createMockCustomerInfo()`: Creates mock RevenueCat customer info
- `createMockRecipe()`: Creates mock recipe data
- `createMockAsyncStorage()`: Creates mock AsyncStorage implementation
- `createMockMMKV()`: Creates mock MMKV storage
- `waitForStoreUpdate()`: Waits for Zustand store updates
- `flushPromises()`: Flushes pending promises

## Troubleshooting

### Common Issues

#### Test Timeouts

If tests are timing out:

```typescript
// Increase timeout for specific test
it('should handle slow operation', async () => {
  // test code
}, 10000); // 10 second timeout
```

#### Mock Not Working

Ensure mocks are properly hoisted:

```typescript
// Mock at the top of the file, before imports
jest.mock('../../api/some-api');

import { someFunction } from '../../api/some-api';
const mockSomeFunction = someFunction as jest.MockedFunction<typeof someFunction>;
```

#### State Not Resetting

Ensure proper state cleanup:

```typescript
beforeEach(() => {
  act(() => {
    // Reset store to initial state
    useMyStore.setState(initialState);
  });
});
```

#### React Navigation Errors

If seeing navigation-related errors, ensure navigation mocks are working:

```typescript
// Check that jest-setup.ts contains proper navigation mocks
import { NavigationContainer } from '@react-navigation/native';
// Should be mocked
```

### Debugging Tests

1. **Console Logging**: Use `console.log` to debug test values
2. **Screen Debug**: Use `screen.debug()` to see rendered component tree
3. **Queries**: Use `screen.getBy*` queries to understand what's rendered
4. **Async Debugging**: Add `await waitFor()` to debug timing issues

### Performance

1. **Parallel Tests**: Jest runs tests in parallel by default
2. **Selective Testing**: Use `test.only()` or `describe.only()` during development
3. **Mock Optimization**: Keep mocks lightweight and focused

## Continuous Integration

### GitHub Actions / CI Setup

```yaml
- name: Run Tests
  run: npm run test:ci

- name: Upload Coverage
  uses: codecov/codecov-action@v1
  with:
    file: ./coverage/lcov.info
```

### Pre-commit Hooks

Consider adding pre-commit hooks to run tests:

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run test:ci"
    }
  }
}
```

## Writing New Tests

### Checklist for New Tests

- [ ] Test file is in the correct `__tests__` directory
- [ ] Test file follows naming convention (`*.test.ts` or `*.test.tsx`)
- [ ] All necessary mocks are set up in `beforeEach`
- [ ] Tests cover happy path, error cases, and edge cases
- [ ] Async operations are properly awaited
- [ ] State is properly reset between tests
- [ ] Test names are descriptive and clear
- [ ] Coverage meets or exceeds targets

### Test Template

```typescript
import { render, fireEvent, screen, act, renderHook } from '../../test-utils';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  const defaultProps = {
    // Define default props
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset any state or mocks
  });

  describe('rendering', () => {
    it('should render correctly with default props', () => {
      render(<MyComponent {...defaultProps} />);
      
      expect(screen.getByText('Expected Text')).toBeTruthy();
    });
  });

  describe('interactions', () => {
    it('should handle user interactions', () => {
      render(<MyComponent {...defaultProps} />);
      
      fireEvent.press(screen.getByText('Button'));
      
      expect(/* assertion */).toBeTruthy();
    });
  });

  describe('edge cases', () => {
    it('should handle error conditions', () => {
      // Test error scenarios
    });
  });
});
```

This testing guide provides the foundation for maintaining high-quality, reliable tests for the Oxalate Diet Tracker application. Follow these patterns and guidelines to ensure comprehensive test coverage and maintainable test code.