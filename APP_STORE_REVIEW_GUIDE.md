# App Store Review Guide

## Overview
This guide explains how to prepare builds for Apple App Store review and TestFlight testing, ensuring Apple reviewers can access all premium features without subscription barriers.

## 🍎 Apple App Store Review Process

### Build Configuration for App Store Submission

#### 1. App Store Review Build
Use this build profile when submitting to Apple for App Store review:

```bash
# Build for App Store review (enables premium bypass for Apple reviewers)
eas build --profile app-store-review --platform ios
```

This automatically sets `EXPO_PUBLIC_APP_STORE_REVIEW=true`, which:
- ✅ Unlocks all premium features for Apple reviewers
- ✅ Bypasses subscription limits
- ✅ Allows full app functionality testing
- ✅ Uses production RevenueCat configuration

#### 2. TestFlight Build
Use this build profile for TestFlight beta testing:

```bash
# Build for TestFlight (enables premium bypass for beta testers)
eas build --profile testflight --platform ios
```

This automatically sets `EXPO_PUBLIC_IS_TESTFLIGHT=true`, which:
- ✅ Unlocks all premium features for TestFlight users
- ✅ Bypasses subscription limits during beta testing
- ✅ Allows comprehensive testing by beta testers

#### 3. Production Build
Use this for the final production release:

```bash
# Build for production (enforces subscription limits)
eas build --profile production --platform ios
```

This uses standard production configuration:
- ❌ Enforces subscription limits for regular users
- ✅ Only bypasses for specific tester emails
- ✅ Full RevenueCat subscription enforcement

## 🔑 Reviewer Access Methods

### Method 1: Environment Variables (Recommended)
The app automatically detects Apple review environments:

- **App Store Review**: `EXPO_PUBLIC_APP_STORE_REVIEW=true`
- **TestFlight**: `EXPO_PUBLIC_IS_TESTFLIGHT=true`

### Method 2: Tester Email List
Apple reviewers using common review emails get automatic access:

```typescript
// Pre-configured Apple reviewer emails
const REVIEWER_EMAILS = [
  'reviewer@apple.com',
  'appstorereview@apple.com', 
  'review@apple.com',
  'appreview@apple.com'
];
```

### Method 3: Development Bypass
In development mode (`__DEV__ = true`), all features are unlocked.

## 📱 Feature Access for Reviewers

When in App Store review or TestFlight mode, reviewers get:

### ✅ Unlimited Oracle Questions
- **Free Users**: Normally 10/month → **Unlimited**
- **Premium Users**: Normally 40/day → **Unlimited**

### ✅ Unlimited Recipe Generation
- **Free Users**: Normally 1 total → **Unlimited**
- **Premium Users**: Normally 10/day → **Unlimited**

### ✅ Unlimited Food Tracking
- **Free Users**: Normally 3 days → **Unlimited**
- **Premium Users**: Already unlimited → **Unlimited**

### ✅ Full Food Database Access
- **All Users**: Always unlimited (traffic light system)

## 🛠 Build Commands Summary

| Purpose | Command | Environment | Features |
|---------|---------|-------------|----------|
| **App Store Review** | `eas build --profile app-store-review --platform ios` | `APP_STORE_REVIEW=true` | All premium features unlocked |
| **TestFlight Testing** | `eas build --profile testflight --platform ios` | `IS_TESTFLIGHT=true` | All premium features unlocked |
| **Production Release** | `eas build --profile production --platform ios` | Standard | Subscription limits enforced |

## 📋 App Store Review Checklist

### Before Submitting to Apple:

1. **✅ Build with App Store Review Profile**
   ```bash
   eas build --profile app-store-review --platform ios
   ```

2. **✅ Test All Premium Features**
   - Oracle AI chat (test with multiple questions)
   - Recipe generation (test creating multiple recipes)
   - Food tracking (test tracking for multiple days)
   - Verify no subscription prompts appear

3. **✅ Verify Environment Variables**
   - Check that `EXPO_PUBLIC_APP_STORE_REVIEW=true` is set
   - Confirm bypass logic is working

4. **✅ Submit to App Store Connect**
   - Upload the app-store-review build
   - Include review notes about premium features being unlocked for testing

### Review Notes for Apple:
Include this in your App Store submission notes:

```
REVIEW TESTING NOTES:
This app includes premium subscription features. For App Store review, all premium features are automatically unlocked to allow full functionality testing without requiring an active subscription.

Premium Features to Test:
1. Oracle AI Chat - Ask multiple dietary questions
2. Recipe Generation - Create multiple custom recipes  
3. Extended Food Tracking - Track meals for multiple days
4. Full Food Database - Browse and search all foods (always free)

The app automatically detects the App Store review environment and bypasses subscription limits for reviewers.
```

## 🔄 Post-Approval Process

### After Apple Approval:

1. **Switch to Production Build**
   ```bash
   eas build --profile production --platform ios
   ```

2. **Submit Production Build**
   - This enforces normal subscription limits
   - Only designated testers get bypass access
   - Regular users must subscribe for premium features

3. **Update App Store**
   - Upload the production build as the final release
   - This becomes the version users download

## 🧪 Testing Different Scenarios

### Test as Apple Reviewer:
```bash
# Use app-store-review build
eas build --profile app-store-review --platform ios
# All features unlocked, no subscription required
```

### Test as Regular User:
```bash
# Use production build  
eas build --profile production --platform ios
# Features limited, subscription required for premium access
```

### Test as Beta Tester:
```bash
# Use testflight build
eas build --profile testflight --platform ios  
# All features unlocked for TestFlight testing
```

## 📞 Support

If Apple reviewers report issues accessing premium features:

1. **Verify Build Profile**: Ensure `app-store-review` profile was used
2. **Check Environment Variables**: Confirm `EXPO_PUBLIC_APP_STORE_REVIEW=true` is set
3. **Review Logs**: Check if bypass logic is working correctly
4. **Fallback**: Add specific reviewer email to `TESTER_EMAILS` array

## 🚨 Important Notes

- **Never submit production build for initial review** - Apple reviewers need unlimited access
- **Always use app-store-review profile** for first submission
- **Switch to production build** only after approval  
- **TestFlight builds** automatically unlock features for beta testers
- **Food search remains free** for all users in all builds

This configuration ensures Apple reviewers can fully test your app while maintaining proper subscription enforcement for end users.