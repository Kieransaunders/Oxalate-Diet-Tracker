# RevenueCat Production Shipping Checklist

## Current Status
✅ **RevenueCat SDK**: Already installed (`react-native-purchases` v9.2.0)  
✅ **API Keys**: Configured in `.env` file  
✅ **Subscription Store**: Implemented in `src/state/subscriptionStore.ts`  
✅ **Usage Tracking**: Oracle questions (5/day), recipes (1 free), tracking (7 days free)  

## Missing Production Requirements

### 1. Store Configuration 🔴 REQUIRED
- [ ] **iOS App Store Connect Setup**
  - [ ] Enable In-App Purchase capability in Apple Developer Portal
  - [ ] Configure subscription products in App Store Connect
  - [ ] Create subscription groups and add products to them
  - [ ] Complete all profiles and agreements
  - [ ] Ensure all localizations have required language fields

- [ ] **Android Play Store Setup**
  - [ ] Upload app to Play Console (internal/closed testing minimum)
  - [ ] Create subscription products in Play Store
  - [ ] Mark products as active
  - [ ] Add test accounts to closed testing

### 2. RevenueCat Dashboard Configuration 🟡 SETUP NEEDED
- [ ] **RevenueCat Account**
  - [x] Create account (free until $2500/month)
  - [ ] Set up app project in dashboard
  - [ ] Configure entitlements (e.g., "premium")

- [ ] **Product Mapping**
  - [ ] Map store product IDs to RevenueCat entitlements
  - [ ] Configure product pricing and billing cycles
  - [ ] Set up subscription groups

### 3. App Configuration Updates 🟡 PARTIAL
- [x] **Environment Variables** (Already configured)
  ```
  EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=sk_DYaOwULGnbaakoiLzdzPWqEWcqnsX
  EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=sk_DYaOwULGnbaakoiLzdzPWqEWcqnsX
  ```

- [ ] **App.json Updates**
  - [ ] Add iOS in-app purchase configuration
  - [ ] Configure Android billing permissions

### 4. Subscription Store Enhancements 🟡 NEEDS WORK
- [x] **Basic Implementation** (Already done)
- [ ] **Production Configuration**
  - [ ] Add actual RevenueCat SDK initialization in App.tsx
  - [ ] Configure proper error handling for purchase failures
  - [ ] Add analytics/logging for purchase events
  - [ ] Test restore purchases functionality

### 5. UI Components 🟡 PARTIAL
- [x] **Usage Limits**: Implemented in subscription store
- [ ] **Paywall Screen**: Need to create subscription purchase UI
- [ ] **Premium Features**: Already gated behind subscription checks
- [ ] **Restore Purchases**: Need UI button and implementation

### 6. Testing Requirements 🔴 CRITICAL
- [ ] **Physical Device Testing** (Simulators don't support purchases)
- [ ] **Test Accounts**: Set up iOS sandbox and Android test accounts
- [ ] **Purchase Flow**: Test complete purchase → unlock → restore cycle
- [ ] **Edge Cases**: Test network failures, cancellations, refunds

### 7. Production Deployment 🔴 REQUIRED
- [ ] **Build Process**
  - [ ] Configure EAS Build for production
  - [ ] Set up proper signing certificates
  - [ ] Test production builds before submission

- [ ] **Store Submission**
  - [ ] Update privacy policy to mention subscription data
  - [ ] Complete App Store Connect metadata
  - [ ] Submit for review with in-app purchases enabled

### 8. Post-Launch Monitoring 🟡 RECOMMENDED
- [ ] **Analytics**: Track subscription conversions
- [ ] **User Support**: Handle subscription issues
- [ ] **Revenue Tracking**: Monitor RevenueCat dashboard

## Implementation Priority

### 🔴 Critical (Required for launch)
1. **Store Configuration**: Set up products in App Store Connect and Play Console
2. **RevenueCat Dashboard**: Create project and map products
3. **App Configuration**: Initialize RevenueCat SDK in App.tsx
4. **Paywall UI**: Create subscription purchase screen

### 🟡 Important (Should do before launch)
1. **Testing**: Test on physical devices with real purchases
2. **Error Handling**: Robust purchase failure handling
3. **Analytics**: Track conversion metrics

### 🟢 Nice to have (Can do after launch)
1. **Advanced Features**: Promo codes, family sharing
2. **Localization**: Multiple currency support
3. **A/B Testing**: Paywall variants

## Next Steps
1. Set up products in App Store Connect and Play Console
2. Configure RevenueCat dashboard with entitlements
3. Initialize RevenueCat SDK in App.tsx
4. Create paywall UI component
5. Test purchase flow on physical devices