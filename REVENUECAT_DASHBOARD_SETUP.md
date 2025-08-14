# RevenueCat Dashboard Configuration Guide

This guide provides step-by-step instructions for configuring the RevenueCat dashboard for the Oxalate Diet Tracker app.

## Overview

We need to configure:
1. **Premium entitlement** - Controls access to premium features
2. **Product attachments** - Link store products to the entitlement
3. **Default offering** - Present products to users
4. **API keys** - Enable app integration
5. **Testing configuration** - Validate setup with sandbox accounts

## Prerequisites

Before starting, ensure you have:
- Completed App Store Connect and Google Play Console configuration
- Created subscription products with IDs:
  - `oxalate_premium_monthly` ($4.99/month)
  - `oxalate_premium_yearly` ($39.99/year)
- Access to RevenueCat dashboard with appropriate permissions

## Step 1: Access RevenueCat Dashboard

1. Go to [RevenueCat Dashboard](https://app.revenuecat.com/)
2. Sign in with your RevenueCat account
3. Select your Oxalate Diet Tracker project
4. If you don't have a project yet, create one:
   - Click **Create New Project**
   - **Project Name**: `Oxalate Diet Tracker`
   - **Bundle ID (iOS)**: Your iOS bundle identifier
   - **Package Name (Android)**: Your Android package name

## Step 2: Configure App Settings

### iOS App Configuration
1. Navigate to **Project Settings** → **Apps**
2. Click on your iOS app or **Add App** if not configured
3. Configure iOS app:
   - **App Name**: `Oxalate Diet Tracker (iOS)`
   - **Bundle ID**: Your iOS bundle identifier
   - **App Store Connect**: Link your App Store Connect account
   - **Shared Secret**: Add your App Store Connect shared secret

### Android App Configuration
1. In **Project Settings** → **Apps**
2. Click on your Android app or **Add App** if not configured
3. Configure Android app:
   - **App Name**: `Oxalate Diet Tracker (Android)`
   - **Package Name**: Your Android package name
   - **Google Play Console**: Link your Google Play Console account
   - **Service Account**: Upload Google Play service account JSON

## Step 3: Create Premium Entitlement

1. Navigate to **Entitlements** in the left sidebar
2. Click **+ New Entitlement**
3. Configure the entitlement:
   - **Identifier**: `premium`
   - **Display Name**: `Premium Access`
   - **Description**: `Provides unlimited access to all premium features including Oracle questions, recipe storage, and meal tracking analytics`

4. Save the entitlement

## Step 4: Configure Products

### Add Monthly Premium Product
1. Navigate to **Products** in the left sidebar
2. Click **+ New Product**
3. Configure the product:
   - **Identifier**: `oxalate_premium_monthly`
   - **Display Name**: `Monthly Premium`
   - **Type**: `Subscription`
   - **Duration**: `1 month`

4. **Store Configuration**:
   - **iOS**: Link to App Store Connect product `oxalate_premium_monthly`
   - **Android**: Link to Google Play Console product `oxalate_premium_monthly`

5. **Entitlement Attachment**:
   - Attach to `premium` entitlement
   - Save the product

### Add Yearly Premium Product
1. Click **+ New Product** again
2. Configure the product:
   - **Identifier**: `oxalate_premium_yearly`
   - **Display Name**: `Yearly Premium`
   - **Type**: `Subscription`
   - **Duration**: `1 year`

3. **Store Configuration**:
   - **iOS**: Link to App Store Connect product `oxalate_premium_yearly`
   - **Android**: Link to Google Play Console product `oxalate_premium_yearly`

4. **Entitlement Attachment**:
   - Attach to `premium` entitlement
   - Save the product

## Step 5: Create Default Offering

1. Navigate to **Offerings** in the left sidebar
2. Click **+ New Offering**
3. Configure the offering:
   - **Identifier**: `default`
   - **Display Name**: `Default Offering`
   - **Description**: `Default subscription offering for premium access`

4. **Add Products to Offering**:
   - Click **+ Add Product**
   - Add `oxalate_premium_monthly`
   - Add `oxalate_premium_yearly`
   - Set `oxalate_premium_yearly` as **Featured** (recommended)

5. **Configure Product Display**:
   - **Monthly Premium**:
     - Display Name: `Monthly Premium`
     - Description: `$4.99/month - Full access to all features`
   - **Yearly Premium**:
     - Display Name: `Yearly Premium - Best Value`
     - Description: `$39.99/year - Save 33% with annual billing`

6. Save the offering

## Step 6: Configure API Keys

### Get API Keys
1. Navigate to **Project Settings** → **API Keys**
2. Copy the API keys:
   - **iOS API Key**: Starts with `appl_`
   - **Android API Key**: Starts with `goog_`
   - **Public API Key**: For server-side integration (if needed)

### Update Environment Variables
Add the API keys to your `.env` file:

```bash
# RevenueCat API Keys
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=appl_your_actual_ios_api_key_here
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=goog_your_actual_android_api_key_here
```

**Important**: Replace the placeholder values in your actual `.env` file with the real API keys from RevenueCat.

## Step 7: Configure Webhooks (Optional but Recommended)

1. Navigate to **Project Settings** → **Webhooks**
2. Click **+ Add Webhook**
3. Configure webhook:
   - **URL**: Your server endpoint (if you have backend integration)
   - **Events**: Select relevant events (subscription started, renewed, cancelled)
   - **Authorization**: Add authorization header if required

## Step 8: Testing Configuration

### Create Test Customer
1. Navigate to **Customers** in the left sidebar
2. Click **+ Create Customer**
3. Configure test customer:
   - **App User ID**: `test-user-001`
   - **Email**: Your test email address
   - **Platform**: Select iOS or Android

### Test with Sandbox Accounts

#### iOS Testing
1. Create iOS sandbox tester in App Store Connect
2. Use sandbox account to test subscription flow
3. Verify purchases appear in RevenueCat **Customers** section
4. Check that `premium` entitlement is granted

#### Android Testing
1. Add test account to Google Play Console license testing
2. Use test account to test subscription flow
3. Verify purchases appear in RevenueCat **Customers** section
4. Check that `premium` entitlement is granted

### Validate Configuration
1. Check **Overview** dashboard for test transactions
2. Verify entitlements are granted correctly
3. Test subscription management (cancellation, renewal)
4. Validate webhook delivery (if configured)

## Step 9: Production Readiness Checklist

### Pre-Launch Validation
- [ ] All products are approved in App Store Connect
- [ ] All products are active in Google Play Console
- [ ] RevenueCat entitlements are properly configured
- [ ] API keys are correctly set in environment variables
- [ ] Test purchases work with sandbox accounts
- [ ] Subscription management flows are tested
- [ ] Webhook integration is tested (if applicable)

### Launch Configuration
- [ ] Switch from sandbox to production API keys
- [ ] Verify production store products are live
- [ ] Test with real payment methods (small amounts)
- [ ] Monitor RevenueCat dashboard for real transactions
- [ ] Set up alerts for subscription events

## Configuration Summary

After completing this setup, you should have:

### Entitlements
- `premium` - Controls access to all premium features

### Products
- `oxalate_premium_monthly` - $4.99/month subscription
- `oxalate_premium_yearly` - $39.99/year subscription

### Offerings
- `default` - Contains both subscription products

### Integration
- iOS and Android API keys configured
- Environment variables set correctly
- Store products linked to RevenueCat products
- Testing validated with sandbox accounts

## Troubleshooting

### Common Issues

#### Products Not Appearing
- Verify product IDs match exactly across all platforms
- Check that products are approved in App Store Connect
- Ensure products are active in Google Play Console
- Confirm products are attached to the correct entitlement

#### API Key Issues
- Verify API keys are copied correctly (no extra spaces)
- Check environment variable names match exactly
- Ensure API keys are for the correct project
- Validate API key permissions in RevenueCat

#### Entitlement Not Granted
- Check product-to-entitlement attachment
- Verify subscription is active in store
- Confirm customer info is syncing correctly
- Review RevenueCat customer timeline

#### Testing Problems
- Use correct sandbox accounts for each platform
- Clear app data between tests
- Check RevenueCat logs for error details
- Verify store configuration is complete

### Support Resources
- [RevenueCat Documentation](https://docs.revenuecat.com/)
- [RevenueCat Community](https://community.revenuecat.com/)
- [RevenueCat Support](https://app.revenuecat.com/support)

## Next Steps

After completing RevenueCat configuration:
1. Test the complete subscription flow in your app
2. Validate API key integration works correctly
3. Test premium feature unlocking
4. Prepare for production deployment
5. Set up monitoring and analytics

## Security Notes

- **Never commit API keys to version control**
- **Use environment variables for all sensitive data**
- **Regularly rotate API keys for security**
- **Monitor API key usage and set up alerts**
- **Use webhook signatures to verify authenticity**