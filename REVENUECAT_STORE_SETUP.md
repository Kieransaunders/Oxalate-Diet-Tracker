# RevenueCat Store Configuration Guide

This guide provides step-by-step instructions for setting up subscription products in App Store Connect and Google Play Console for the Oxalate Diet Tracker app.

## Overview

We need to create two subscription products:
- **Monthly Premium**: $4.99/month
- **Yearly Premium**: $39.99/year (Best Value)

Both products will be part of a "Premium Access" subscription group.

## App Store Connect Configuration

### 1. Access App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com/)
2. Sign in with your Apple Developer account
3. Navigate to "My Apps" and select your Oxalate Diet Tracker app

### 2. Create Subscription Group

1. In your app, go to **Features** → **In-App Purchases**
2. Click the **+** button next to "Subscription Groups"
3. Create a new subscription group:
   - **Reference Name**: `Premium Access`
   - **Display Name**: `Premium Access`
   - **Localization**: Add localizations as needed

### 3. Create Monthly Premium Subscription

1. In the "Premium Access" subscription group, click **+** to add a subscription
2. Configure the subscription:
   - **Reference Name**: `Monthly Premium`
   - **Product ID**: `oxalate_premium_monthly`
   - **Subscription Duration**: `1 Month`
   - **Price**: `$4.99` (Tier 5)

3. Add subscription information:
   - **Display Name**: `Monthly Premium`
   - **Description**: `Unlimited access to all premium features including unlimited Oracle questions, unlimited recipe storage, and unlimited meal tracking with analytics.`

4. Configure subscription details:
   - **Subscription Group**: `Premium Access`
   - **Subscription Level**: `1` (Base level)
   - **Family Sharing**: `Enabled` (recommended)

### 4. Create Yearly Premium Subscription

1. In the "Premium Access" subscription group, click **+** to add another subscription
2. Configure the subscription:
   - **Reference Name**: `Yearly Premium`
   - **Product ID**: `oxalate_premium_yearly`
   - **Subscription Duration**: `1 Year`
   - **Price**: `$39.99` (Tier 40)

3. Add subscription information:
   - **Display Name**: `Yearly Premium - Best Value`
   - **Description**: `Unlimited access to all premium features with significant savings. Includes unlimited Oracle questions, unlimited recipe storage, and unlimited meal tracking with analytics.`

4. Configure subscription details:
   - **Subscription Group**: `Premium Access`
   - **Subscription Level**: `1` (Same level as monthly for easy switching)
   - **Family Sharing**: `Enabled` (recommended)

### 5. Configure Subscription Group Settings

1. Select the "Premium Access" subscription group
2. Configure group settings:
   - **Subscription Group Display Name**: `Premium Access`
   - **App Store Localization**: Add descriptions for different markets
   - **Subscription Management**: Enable subscription management features

### 6. Review and Submit

1. Review all subscription details
2. Add any required metadata (screenshots, descriptions)
3. Submit for review (this can take 24-48 hours)

## Google Play Console Configuration

### 1. Access Google Play Console

1. Go to [Google Play Console](https://play.google.com/console/)
2. Sign in with your Google Developer account
3. Select your Oxalate Diet Tracker app

### 2. Create Subscription Products

1. Navigate to **Monetize** → **Products** → **Subscriptions**
2. Click **Create subscription**

### 3. Create Monthly Premium Subscription

1. Configure basic details:
   - **Product ID**: `oxalate_premium_monthly`
   - **Name**: `Monthly Premium`
   - **Description**: `Unlimited access to all premium features including unlimited Oracle questions, unlimited recipe storage, and unlimited meal tracking with analytics.`

2. Set pricing:
   - **Base plan**: Create a new base plan
   - **Billing period**: `Monthly`
   - **Price**: `$4.99 USD`
   - **Renewal type**: `Auto-renewing`

3. Configure additional settings:
   - **Grace period**: `3 days` (recommended)
   - **Account hold**: `30 days` (recommended)
   - **Proration mode**: `Immediate with time proration`

### 4. Create Yearly Premium Subscription

1. Configure basic details:
   - **Product ID**: `oxalate_premium_yearly`
   - **Name**: `Yearly Premium - Best Value`
   - **Description**: `Unlimited access to all premium features with significant savings. Includes unlimited Oracle questions, unlimited recipe storage, and unlimited meal tracking with analytics.`

2. Set pricing:
   - **Base plan**: Create a new base plan
   - **Billing period**: `Yearly`
   - **Price**: `$39.99 USD`
   - **Renewal type**: `Auto-renewing`

3. Configure additional settings:
   - **Grace period**: `3 days` (recommended)
   - **Account hold**: `30 days` (recommended)
   - **Proration mode**: `Immediate with time proration`

### 5. Configure Subscription Settings

1. Go to **Monetize** → **Subscriptions** → **Settings**
2. Configure global subscription settings:
   - **Deep links**: Enable for subscription management
   - **Real-time developer notifications**: Enable for RevenueCat integration
   - **Subscription cancellation survey**: Enable to understand churn

### 6. Test with License Testers

1. Add test accounts in **Setup** → **License testing**
2. Add email addresses for testing subscription flows
3. Test both subscription products with test accounts

## Product ID Verification

Ensure these product IDs match exactly in all configurations:

### App Store Connect
- Monthly: `oxalate_premium_monthly`
- Yearly: `oxalate_premium_yearly`

### Google Play Console
- Monthly: `oxalate_premium_monthly`
- Yearly: `oxalate_premium_yearly`

### RevenueCat Configuration (src/config/revenuecat.ts)
```typescript
export const PRODUCT_IDS = {
  MONTHLY_PREMIUM: 'oxalate_premium_monthly',
  YEARLY_PREMIUM: 'oxalate_premium_yearly',
} as const;
```

## Testing Configuration

### App Store Connect Testing
1. Create sandbox test accounts in **Users and Access** → **Sandbox Testers**
2. Test subscription flows with sandbox accounts
3. Verify subscription management and cancellation flows

### Google Play Console Testing
1. Add test accounts to **Setup** → **License testing**
2. Use test accounts to verify subscription functionality
3. Test subscription upgrades, downgrades, and cancellations

## Important Notes

1. **Product ID Consistency**: Ensure product IDs are identical across all platforms
2. **Pricing Consistency**: Verify pricing is equivalent across platforms
3. **Review Process**: App Store subscriptions require review and approval
4. **Testing**: Always test with sandbox/test accounts before production
5. **Family Sharing**: Consider enabling family sharing for better user experience
6. **Localization**: Add localizations for target markets
7. **Compliance**: Ensure subscription terms comply with platform policies

## Troubleshooting

### Common Issues
- **Product ID Mismatch**: Verify IDs match exactly in all configurations
- **Pricing Discrepancies**: Ensure equivalent pricing across platforms
- **Review Rejection**: Check App Store Review Guidelines for subscription apps
- **Testing Issues**: Verify test accounts are properly configured

### Support Resources
- [App Store Connect Help](https://help.apple.com/app-store-connect/)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer/)
- [RevenueCat Documentation](https://docs.revenuecat.com/)

## Next Steps

After completing store configuration:
1. Configure RevenueCat dashboard with these products
2. Test subscription flows with sandbox accounts
3. Validate API key integration
4. Submit app for review with subscription features