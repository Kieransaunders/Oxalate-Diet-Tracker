# Testing Guide for Oxalate Diet Tracker

## Overview
This guide explains how to test the app with proper premium feature access controls for different testing scenarios.

## Testing Modes

### 1. Development Mode
- **Automatic**: Enabled when `__DEV__ = true`
- **Behavior**: All premium features are unlocked
- **Use**: Local development and debugging

### 2. TestFlight Mode
- **Setup**: Set environment variable `EXPO_PUBLIC_IS_TESTFLIGHT=true` in build
- **Behavior**: All premium features are unlocked for TestFlight builds
- **Use**: Apple TestFlight beta testing

### 3. Manual Testing Mode
- **Setup**: Set environment variable `EXPO_PUBLIC_TESTING_MODE=true`
- **Behavior**: All premium features are unlocked
- **Use**: Internal testing builds

### 4. Tester Email Bypass
- **Setup**: Add tester emails to `TESTER_EMAILS` array in `src/config/revenuecat.ts`
- **Behavior**: Specific users get premium access without payment
- **Use**: Designated beta testers

## Premium Feature Controls

### Oracle Questions
- **Free**: 10 questions per month
- **Premium**: 40 questions per day
- **Testing Mode**: Unlimited questions
- **Reset**: Monthly counter resets on 1st of month for free users, daily counter resets at midnight for premium users

### Recipe Creation
- **Free**: 1 recipe total (lifetime limit)
- **Premium**: 10 recipes per day
- **Testing Mode**: Unlimited recipes
- **Reset**: Daily counter resets at midnight for premium users
- **Storage**: Persistent across app sessions

### Meal Tracking
- **Free**: 3 days of tracking
- **Premium**: Unlimited tracking
- **Testing Mode**: Unlimited tracking
- **Analytics**: Full history and charts for premium

### Food Search (Traffic Light System)
- **Free**: Unlimited access to food database and search
- **Premium**: Unlimited access to food database and search
- **Testing Mode**: Unlimited access to food database and search
- **Note**: Food search and browsing is always available to all users

## Testing Premium Features

### For Apple TestFlight
1. Set `EXPO_PUBLIC_IS_TESTFLIGHT=true` in your build environment
2. Build and upload to TestFlight
3. Testers automatically get premium access
4. No need to configure individual accounts

### For Internal Testing
1. Set `EXPO_PUBLIC_TESTING_MODE=true` in environment
2. Build the app
3. All users get premium access automatically

### For Specific Testers
1. Add tester emails to `TESTER_EMAILS` in `src/config/revenuecat.ts`:
   ```typescript
   const TESTER_EMAILS = [
     'tester1@example.com',
     'tester2@example.com',
     'your-tester@gmail.com',
   ];
   ```
2. Rebuild and distribute
3. Those specific users get premium access

## Environment Variables

Add these to your build configuration:

```bash
# For TestFlight builds
EXPO_PUBLIC_IS_TESTFLIGHT=true

# For general testing
EXPO_PUBLIC_TESTING_MODE=true

# RevenueCat keys (if using real subscriptions)
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=your_ios_key
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=your_android_key
```

## Paywall Testing

### Testing Purchase Flow
- Paywalls still appear in testing mode for UI testing
- Purchase buttons can be tested but won't charge
- Use RevenueCat sandbox mode for purchase testing

### Testing Feature Gates
- PremiumGate components respect testing modes
- Features are unlocked but UI flows can still be tested
- Upgrade prompts still show for UX testing

## Production vs Testing

### Production Build
- Set all testing environment variables to `false` or remove them
- Only real RevenueCat subscriptions work
- Full premium feature restrictions apply

### Testing Build
- Enable appropriate testing mode
- Premium features unlocked for designated users
- Purchase flows work in sandbox mode

## Common Testing Scenarios

### 1. Free User Experience
```typescript
// Temporarily disable testing mode
const isTestingMode = () => false;
```

### 2. Premium User Experience
```typescript
// Enable testing mode or add to TESTER_EMAILS
```

### 3. Purchase Flow Testing
```typescript
// Use RevenueCat sandbox with test products
```

### 4. Feature Limit Testing
```typescript
// Current limits in subscriptionStore.ts
const limits = {
  oracleQuestions: { 
    monthlyLimit: 10, // Free users: 10 per month
    dailyLimit: 40     // Premium users: 40 per day
  },
  recipes: { 
    freeLimit: 1,      // Free users: 1 total
    dailyLimit: 10     // Premium users: 10 per day
  },
  tracking: { 
    freeDays: 3        // Free users: 3 days only
  },
};
```

## Troubleshooting

### Features Not Unlocked
1. Check `__DEV__` is true for development
2. Verify environment variables are set correctly
3. Confirm email is in `TESTER_EMAILS` array
4. Check `shouldBypassPremium()` returns true

### Purchase Flow Issues
1. Ensure RevenueCat is configured correctly
2. Check API keys are set
3. Verify sandbox mode for testing
4. Test with valid Apple/Google test accounts

### Build Issues
1. Clear caches and rebuild
2. Verify environment variables in build
3. Check expo/EAS configuration
4. Test in both development and production modes

## Support

For testing issues:
1. Check console logs for testing mode status
2. Verify subscription store state
3. Test with different user scenarios
4. Contact development team for assistance