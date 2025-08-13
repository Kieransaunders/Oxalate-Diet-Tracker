# Production Setup Guide

This guide walks you through setting up the Oxalate Diet Tracker app for production deployment.

## 🔐 1. API Keys Setup

### Required API Keys

#### OpenAI API Key (Required for Oracle)
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Set usage limits and restrictions
4. Update `EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY` in your environment

#### Anthropic API Key (Required for Oracle)
1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Create a new API key
3. Set usage limits
4. Update `EXPO_PUBLIC_VIBECODE_ANTHROPIC_API_KEY` in your environment

#### RevenueCat API Keys (Required for Subscriptions)
1. Follow the detailed setup in [REVENUECAT_SETUP.md](./REVENUECAT_SETUP.md)
2. Get iOS API key from RevenueCat dashboard
3. Get Android API key from RevenueCat dashboard
4. Update both `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` and `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`

### Optional API Keys

#### Grok API Key (Optional alternative AI)
1. Go to [Groq Console](https://console.groq.com/)
2. Create API key
3. Update `EXPO_PUBLIC_VIBECODE_GROK_API_KEY`

#### Google API Key (Optional features)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create API key
3. Update `EXPO_PUBLIC_VIBECODE_GOOGLE_API_KEY`

## 🏗️ 2. Build Configuration

### Environment Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in all required API keys in `.env`

3. **NEVER commit the `.env` file to version control**

### EAS Build Profiles

The app is configured with three build profiles:

#### Development
```bash
eas build --profile development --platform ios
eas build --profile development --platform android
```

#### Preview (Internal Testing)  
```bash
eas build --profile preview --platform ios
eas build --profile preview --platform android
```

#### Production (App Store Release)
```bash
eas build --profile production --platform ios
eas build --profile production --platform android
```

## 📱 3. App Store Configuration

### iOS App Store Connect

1. **App Information**
   - Bundle ID: `uk.co.iconnectit.oxolatediettracker`
   - App Name: "Oxalate Diet Tracker"
   - Category: Health & Fitness
   - Age Rating: 4+ (Safe for all ages)

2. **In-App Purchases**
   - Set up subscription groups
   - Create monthly and yearly premium subscriptions
   - Configure subscription pricing and territories

3. **App Review Information**
   - Demo account for reviewers
   - Notes about health disclaimer
   - Privacy policy URL

### Google Play Console

1. **App Information**
   - Package: `uk.co.iconnectit.oxolatediettracker`
   - App Name: "Oxalate Diet Tracker"
   - Category: Health & Fitness
   - Content Rating: Everyone

2. **In-App Products**
   - Create subscription products matching iOS
   - Configure pricing and availability

3. **Store Listing**
   - Screenshots for different device sizes
   - Feature graphic
   - App description emphasizing health benefits

## 🔒 4. Security Checklist

### API Key Security
- [ ] All production API keys are set in environment
- [ ] API keys have usage limits configured
- [ ] API keys have IP restrictions where possible
- [ ] Billing alerts are set up for all services

### App Security
- [ ] No hardcoded secrets in source code
- [ ] All HTTP requests use HTTPS
- [ ] Sensitive data uses encrypted storage
- [ ] App doesn't log sensitive information

### Privacy Compliance
- [ ] Privacy policy published and linked
- [ ] Terms of service published and linked
- [ ] GDPR compliance for EU users
- [ ] Health data disclaimer included

## 📊 5. Monitoring Setup

### Error Tracking
Consider integrating crash reporting:
```bash
npx expo install @sentry/react-native
```

### Analytics
Set up usage analytics (respecting privacy):
```bash
npx expo install expo-analytics-amplitude
```

### Performance Monitoring
Monitor app performance and API response times

## 🧪 6. Testing Checklist

### Pre-Release Testing
- [ ] All API integrations working with production keys
- [ ] Subscription flow works end-to-end
- [ ] Offline functionality works properly
- [ ] Food database loads correctly
- [ ] Oracle AI responses are appropriate
- [ ] App doesn't crash on low-memory devices

### Device Testing
- [ ] iPhone SE (small screen)
- [ ] iPhone Pro Max (large screen)
- [ ] iPad (tablet layout)
- [ ] Android phones (various screen sizes)
- [ ] Android tablets

### Edge Cases
- [ ] Network connectivity issues
- [ ] API rate limiting
- [ ] Subscription expiration/cancellation
- [ ] Large food database loading
- [ ] Long AI conversation history

## 🚀 7. Deployment Steps

### Initial Release
1. Complete all setup steps above
2. Build production versions:
   ```bash
   eas build --profile production --platform all
   ```
3. Submit to app stores:
   ```bash
   eas submit --profile production --platform all
   ```
4. Monitor for crashes and issues
5. Respond to app store review feedback

### Updates
1. Increment version in `app.json`
2. Build and test thoroughly
3. Submit updates
4. Monitor rollout metrics

## ⚡ 8. Performance Optimization

### Bundle Size
```bash
npx expo bundle-analyzer
```

### Memory Usage
- Monitor memory usage in production
- Optimize image loading and caching
- Clean up unused dependencies

### API Performance
- Implement request caching
- Add loading states
- Handle API errors gracefully

## 📞 9. Support Setup

### User Support
- Set up customer support email
- Create FAQ documentation
- Monitor app store reviews
- Set up user feedback collection

### Developer Support  
- Document common issues
- Create troubleshooting guides
- Set up developer notifications

## 🔄 10. Maintenance Plan

### Regular Tasks
- [ ] Monitor API usage and costs
- [ ] Update dependencies monthly
- [ ] Review crash reports weekly
- [ ] Check app store reviews daily
- [ ] Update food database quarterly

### Security Updates
- [ ] Rotate API keys every 6 months
- [ ] Update privacy policy as needed
- [ ] Monitor for security vulnerabilities
- [ ] Keep dependencies up to date

---

## Need Help?

If you encounter issues during production setup:

1. Check the [troubleshooting section](./TESTING.md#troubleshooting)
2. Review [RevenueCat setup guide](./REVENUECAT_SETUP.md)
3. Consult [Expo documentation](https://docs.expo.dev/)
4. Check API provider documentation for specific services

Remember: Production deployment requires careful testing and monitoring. Take time to validate each step before proceeding to the next.