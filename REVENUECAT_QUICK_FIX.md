# 🚨 URGENT: RevenueCat API Key Fix

## The Problem
Your app is currently using **SECRET API keys** instead of **PUBLIC API keys** for RevenueCat. This causes the errors you're seeing:

```
[RevenueCat] 😿‼️ The specified API Key is not recognized.
[RevenueCat] 😿‼️ Secret API keys should not be used in your app.
```

## The Solution

### Step 1: Get the Correct Public API Keys

1. **Go to RevenueCat Dashboard**: [https://app.revenuecat.com](https://app.revenuecat.com)

2. **Navigate to API Keys**:
   - Click on your project
   - Go to **Project Settings** (gear icon)
   - Click on **API Keys**

3. **Find Public App-specific API Keys** (NOT Secret Keys):
   - Look for section **"Public app-specific API keys"**
   - **iOS Key**: Should start with `appl_` (like `appl_AbCdEfGhIjKlMnOp`)
   - **Android Key**: Should start with `goog_` (like `goog_XyZaBcDeFgHiJkLm`)

### Step 2: Update Your .env File

Replace the current keys in your `.env` file:

```bash
# WRONG - These are secret keys (never use in mobile apps)
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=sk_DYaOwULGnbaakoiLzdzPWqEWcqnsX

# CORRECT - These are public keys (safe for mobile apps)
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=appl_your_actual_ios_key_here
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=goog_your_actual_android_key_here
```

### Step 3: If You Don't Have a RevenueCat Project Yet

If you haven't set up RevenueCat yet:

1. **Create RevenueCat Account**: [https://app.revenuecat.com/signup](https://app.revenuecat.com/signup)

2. **Create New Project**:
   - Project Name: "Oxalate Diet Tracker"
   - Select your platform(s)

3. **Add Your Apps**:
   - **iOS App**: Bundle ID `uk.co.iconnectit.oxolatediettracker`
   - **Android App**: Package Name `uk.co.iconnectit.oxolatediettracker`

4. **Get Your Public API Keys** (as described in Step 1)

### Step 4: Quick Test

After updating your `.env` file with correct public keys:

1. **Restart your development server**:
   ```bash
   # Stop current server (Ctrl+C)
   npx expo start
   ```

2. **Check the console** - You should no longer see RevenueCat errors

## 🔒 Security Note

**NEVER use secret keys in mobile apps!**
- ❌ `sk_` keys = Secret keys (server-side only)
- ✅ `appl_` / `goog_` keys = Public keys (safe for mobile apps)

Secret keys in mobile apps are a **major security vulnerability** because anyone can extract them from your app bundle.

## 🛠️ Temporary Development Workaround

If you want to test the app without RevenueCat for now, you can disable RevenueCat initialization:

1. **Edit the subscription store**:
   ```typescript
   // In src/state/subscriptionStore.ts
   // Comment out the RevenueCat.configure() call temporarily
   ```

2. **Or use the demo mode**: The app will work without premium features

## ❓ Need Help?

If you're having trouble finding your public API keys:

1. **Check RevenueCat Documentation**: [https://docs.revenuecat.com/docs/authentication](https://docs.revenuecat.com/docs/authentication)
2. **RevenueCat Support**: [https://community.revenuecat.com](https://community.revenuecat.com)
3. **Screenshot your RevenueCat API Keys page** (blur out the actual keys) and I can help guide you

## ✅ Quick Checklist

- [ ] Accessed RevenueCat dashboard
- [ ] Found "Public app-specific API keys" section  
- [ ] Copied iOS key (starts with `appl_`)
- [ ] Copied Android key (starts with `goog_`)
- [ ] Updated `.env` file with new keys
- [ ] Restarted development server
- [ ] Verified no more RevenueCat errors in console

The app will work perfectly once you have the correct public API keys! 🎉