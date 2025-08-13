# 🍎 App Store Connect Setup Guide

## App Information for Oxalate Diet Tracker

### Basic App Details

**App Name**: `Oxalate Diet Tracker`
**Bundle ID**: `uk.co.iconnectit.oxolatediettracker`
**SKU**: `oxalate-diet-tracker-ios` (or any unique identifier you prefer)

### App Store Connect Configuration

#### 1. App Information Tab

**Name**: Oxalate Diet Tracker

**Subtitle**: Smart Oxalate Management & Diet Tracking

**Category**: 
- **Primary**: Health & Fitness
- **Secondary**: Medical

**Content Rights**: 
- [ ] Does Not Use Third-Party Content

**Age Rating**: 
- **Rating**: 4+ (Safe for all ages)
- **Medical/Treatment Information**: Yes (the app provides dietary guidance)

#### 2. Pricing and Availability

**Price**: Free (with in-app purchases)

**Availability**: All territories (or select specific countries)

**App Store Distribution**: Available on the App Store

#### 3. App Privacy

You'll need to fill out privacy details. Here's what the app collects:

**Data Types Collected**:
- **Health and Fitness**: 
  - Dietary information (food tracking, oxalate intake)
  - Health conditions (if user chooses to provide)
- **Usage Data**: 
  - App interactions for improving user experience
- **Diagnostics**: 
  - Crash logs and performance data (if Sentry is enabled)

**Data Usage**:
- **Not Linked to Identity**: Health data stays on device
- **Used for Tracking**: No
- **Third Party Data**: Only anonymized analytics

#### 4. App Store Listing

**App Description** (Example):
```
Take control of your low-oxalate diet with the most comprehensive oxalate tracking app available.

🌟 FEATURES
• Extensive food database with precise oxalate content
• Smart meal tracking with portion control
• AI-powered Oracle for personalized dietary guidance
• Recipe management with oxalate calculations
• Visual traffic light system for quick food assessment
• Offline support for reliable tracking anywhere

🎯 PERFECT FOR
• Kidney stone prevention
• Hyperoxaluria management  
• Low-oxalate diet followers
• Healthcare providers and nutritionists

📊 SMART TRACKING
Color-coded system makes it easy to identify:
🟢 Low oxalate foods (safe daily)
🟡 Medium oxalate foods (moderate consumption)
🟠 High oxalate foods (limited amounts)
🔴 Very high oxalate foods (avoid or minimal)

🤖 AI ORACLE
Get instant answers about:
• Food oxalate content
• Meal planning advice
• Recipe modifications
• Dietary substitutions

💎 PREMIUM FEATURES
• Unlimited AI Oracle questions
• Advanced recipe management
• Detailed analytics and trends
• Data export capabilities

⚕️ MEDICAL DISCLAIMER
This app is for informational purposes only and should not replace professional medical advice. Always consult your healthcare provider for personalized dietary recommendations.

Start your journey to better kidney health today!
```

**Keywords**: 
`oxalate, kidney stones, diet, nutrition, health, tracking, low oxalate, calcium oxalate, food database, meal planning`

**Support URL**: `https://your-website.com/support` (you'll need to create this)
**Marketing URL**: `https://your-website.com` (optional)

#### 5. App Store Screenshots Required

You'll need screenshots for different device sizes:

**iPhone 6.9" Display** (iPhone 16 Pro Max):
- 1320 x 2868 pixels
- Need 3-10 screenshots

**iPhone 6.7" Display** (iPhone 14 Pro Max, iPhone 15 Pro Max):  
- 1290 x 2796 pixels
- Need 3-10 screenshots

**iPhone 6.1" Display** (iPhone 14, iPhone 15):
- 1179 x 2556 pixels  
- Need 3-10 screenshots

**iPad Pro (6th Gen) 12.9"**:
- 2048 x 2732 pixels
- Need 3-10 screenshots

#### 6. App Review Information

**Contact Information**:
- **First Name**: [Your First Name]
- **Last Name**: [Your Last Name]  
- **Phone Number**: [Your Phone Number]
- **Email**: [Your Email Address]

**Notes for Review**:
```
This is a health and nutrition tracking app focused on oxalate content in foods. 

The app helps users track their daily oxalate intake for kidney stone prevention and management. All dietary recommendations are clearly marked as informational only and include disclaimers to consult healthcare providers.

Key features to test:
1. Food database search and filtering
2. Meal tracking with oxalate calculations  
3. AI Oracle for dietary guidance (requires API keys)
4. Recipe management
5. Premium subscription flow (in-app purchases)

The app works offline for core functionality, with online features for AI assistance.

No demo account needed - the app works immediately upon installation with full functionality in free mode.
```

### 7. Version Information

**Version**: 1.0.0
**Copyright**: © 2024 [Your Company Name]. All rights reserved.

**What's New in This Version**:
```
🎉 Initial release of Oxalate Diet Tracker!

• Comprehensive food database with 300+ foods
• Intelligent meal tracking and portion control
• AI-powered dietary guidance and recommendations
• Recipe management with automatic oxalate calculations
• Beautiful, intuitive interface with traffic light system
• Offline support for reliable tracking anywhere
• Premium subscription with advanced features

Start managing your oxalate intake today for better kidney health!
```

## 🔧 Technical Configuration

### Build Configuration (Already Set Up)

Your `app.json` is configured with:
```json
{
  "ios": {
    "bundleIdentifier": "uk.co.iconnectit.oxolatediettracker",
    "supportsTablet": true,
    "requireFullScreen": true
  }
}
```

### In-App Purchases Setup

You'll need to create these subscription products in App Store Connect:

1. **Monthly Premium** (`oxalate_premium_monthly`)
   - Price: $4.99/month
   - Description: "Premium access to unlimited AI questions, advanced recipes, and analytics"

2. **Yearly Premium** (`oxalate_premium_yearly`) 
   - Price: $39.99/year (20% discount)
   - Description: "Premium access with full features - Best Value!"

## ✅ Setup Checklist

**App Store Connect Setup**:
- [ ] Create App Store Connect record
- [ ] Fill in app information
- [ ] Set pricing and availability  
- [ ] Complete privacy policy
- [ ] Write app description and keywords
- [ ] Upload app icon (1024x1024px)
- [ ] Create screenshots for all device sizes
- [ ] Set up in-app purchase products
- [ ] Fill in app review information
- [ ] Submit app metadata for review

**Build and Submit**:
- [ ] Build production version: `eas build --profile production --platform ios`
- [ ] Upload build to App Store Connect
- [ ] Submit for review

## 🔗 Important URLs

- **App Store Connect**: https://appstoreconnect.apple.com/
- **Developer Account**: https://developer.apple.com/account/
- **App Store Review Guidelines**: https://developer.apple.com/app-store/review/guidelines/
- **Human Interface Guidelines**: https://developer.apple.com/design/human-interface-guidelines/

## 🆘 Need Help?

If you need assistance with any of these steps:
1. **Screenshot Creation**: I can help you design promotional screenshots
2. **App Description**: We can refine the marketing copy
3. **Privacy Policy**: I can help you create a comprehensive privacy policy
4. **Technical Issues**: Debug any build or submission problems

Let me know which step you'd like help with first!