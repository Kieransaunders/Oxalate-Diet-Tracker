# RevenueCat Setup Guide

This guide walks you through setting up RevenueCat for the Oxalate Diet Tracker app with premium subscription features.

## 1. Create RevenueCat Account

1. Go to [https://app.revenuecat.com](https://app.revenuecat.com)
2. Sign up for a free account
3. Create a new project named "Oxalate Diet Tracker"

## 2. Configure App Information

### iOS Configuration
1. In RevenueCat dashboard, go to **Project Settings** > **Apps**
2. Click **+ New** to add iOS app
3. Enter the following details:
   - **App Name**: Oxalate Diet Tracker iOS
   - **Bundle ID**: `uk.co.iconnectit.oxolatediettracker`
   - **Store**: App Store
4. Save the configuration

### Android Configuration
1. Click **+ New** to add Android app
2. Enter the following details:
   - **App Name**: Oxalate Diet Tracker Android
   - **Package Name**: `uk.co.iconnectit.oxolatediettracker`
   - **Store**: Google Play
3. Save the configuration

## 3. Get API Keys

1. Go to **Project Settings** > **API Keys**
2. Copy the **iOS API Key** and **Android API Key**
3. Add these to your `.env` file:
   ```
   EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=your_ios_api_key_here
   EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=your_android_api_key_here
   ```

## 4. Create Products

### In App Store Connect (iOS)
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Navigate to your app > **Features** > **In-App Purchases**
3. Create two Auto-Renewable Subscriptions:

   **Monthly Premium**
   - Product ID: `oxalate_premium_monthly`
   - Reference Name: `Oxalate Premium Monthly`
   - Price: $4.99 USD
   - Subscription Duration: 1 Month

   **Yearly Premium**
   - Product ID: `oxalate_premium_yearly`
   - Reference Name: `Oxalate Premium Yearly`
   - Price: $39.99 USD
   - Subscription Duration: 1 Year

### In Google Play Console (Android)
1. Go to [Google Play Console](https://play.google.com/console)
2. Navigate to your app > **Monetize** > **Products** > **Subscriptions**
3. Create the same two subscriptions with matching product IDs

## 5. Configure Products in RevenueCat

1. In RevenueCat dashboard, go to **Products**
2. Click **+ New** to add each product:

   **Monthly Premium**
   - Identifier: `oxalate_premium_monthly`
   - Type: Subscription
   - Store Product Identifier: `oxalate_premium_monthly` (same for both stores)

   **Yearly Premium**
   - Identifier: `oxalate_premium_yearly`
   - Type: Subscription
   - Store Product Identifier: `oxalate_premium_yearly` (same for both stores)

## 6. Create Entitlement

1. Go to **Entitlements** in RevenueCat dashboard
2. Click **+ New** to create entitlement:
   - **Identifier**: `premium`
   - **Description**: Premium access to all features
3. Attach both products to this entitlement

## 7. Create Offering

1. Go to **Offerings** in RevenueCat dashboard
2. Click **+ New** to create offering:
   - **Identifier**: `default`
   - **Description**: Default Premium Offering
3. Add both products to the offering:
   - Monthly Premium (mark as default)
   - Yearly Premium

## 8. Test Configuration

### Sandbox Testing (iOS)
1. In App Store Connect, go to **Users and Access** > **Sandbox Testers**
2. Create test accounts for subscription testing
3. Use these accounts on your iOS device/simulator

### Google Play Testing (Android)
1. In Google Play Console, set up test tracks
2. Add test users for subscription testing

## 9. App Store Connect Configuration

### Subscription Groups
1. Create a subscription group named "Premium Access"
2. Add both subscription products to this group
3. Configure family sharing if desired

### Review Information
- Provide screenshots and descriptions for subscription review
- Include privacy policy and terms of service URLs

## 10. Environment Variables

Update your `.env` file with the actual API keys:

```bash
# Production API Keys
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=appl_xxxxxxxxxxxx
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=goog_xxxxxxxxxxxx
```

## 11. Testing Checklist

- [ ] iOS subscriptions work in sandbox
- [ ] Android subscriptions work in testing
- [ ] Purchase restoration works
- [ ] Subscription status updates correctly
- [ ] Premium features unlock/lock appropriately
- [ ] Subscription cancellation works
- [ ] Family sharing works (if enabled)

## 12. Webhook Configuration (Optional)

1. In RevenueCat dashboard, go to **Integrations** > **Webhooks**
2. Set up webhooks for server-side subscription management
3. Configure events: `INITIAL_PURCHASE`, `RENEWAL`, `CANCELLATION`, etc.

## 13. Analytics Setup

1. Enable RevenueCat Charts for subscription analytics
2. Set up conversion tracking
3. Monitor key metrics:
   - Trial conversion rate
   - Monthly recurring revenue (MRR)
   - Customer lifetime value (LTV)
   - Churn rate

## 14. Production Deployment

1. Update `eas.json` with production API keys
2. Build production versions using EAS:
   ```bash
   eas build --platform ios --profile production
   eas build --platform android --profile production
   ```
3. Submit to app stores with subscription features enabled

## Subscription Features Implemented

### Free Tier Limits
- **Oracle**: 5 questions per day
- **Recipes**: 1 recipe storage
- **Tracking**: 7 consecutive days

### Premium Benefits
- **Oracle**: Unlimited questions
- **Recipes**: Unlimited storage + AI generation
- **Tracking**: Unlimited history + analytics
- **Export**: Data export capabilities
- **Support**: Priority customer support

## Support and Documentation

- [RevenueCat Documentation](https://docs.revenuecat.com/)
- [RevenueCat React Native Guide](https://docs.revenuecat.com/docs/reactnative)
- [Expo In-App Purchases](https://docs.expo.dev/guides/in-app-purchases/)

## Troubleshooting

### Common Issues
1. **"No products available"**: Check product IDs match exactly
2. **"Purchase failed"**: Verify sandbox/test accounts are set up
3. **"Restore failed"**: Ensure user is logged into test account
4. **API errors**: Verify API keys are correctly configured

### Debug Mode
Set `LOG_LEVEL.DEBUG` in development builds to see detailed RevenueCat logs.