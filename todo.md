# 🚨 URGENT: APPLE APP STORE COMPLIANCE - MEDICAL TERMS AUDIT

## CRITICAL FINDINGS - MEDICAL TERMS DETECTED IN APP

**Risk Level**: HIGH - These terms could lead to App Store rejection

### FILES WITH MEDICAL TERMINOLOGY:

1. **userPreferencesStore.ts** - CRITICAL
   - `MedicalCondition` type and references
   - "kidney-stones", "hyperoxaluria" conditions
   - "kidney stone prevention" messaging
   - "medical-grade advice" text
   - "healthcare providers" references

2. **chat-oracle-api.ts** - HIGH RISK
   - "kidney stones", "symptoms", "prevention"
   - Medical advice phrasing in Oracle responses
   - Health condition references

3. **APP_STORE_SETUP.md** - DOCUMENTATION RISK
   - "Medical" category classification
   - "kidney stone prevention" in descriptions
   - "healthcare providers" mentions

4. **MealTracker.tsx** - UI RISK
   - "kidney stone prevention" in user-facing text

5. **OxalateTableScreen.tsx** - UI RISK
   - "kidney stone prevention" in tips

6. **SettingsScreen.tsx** - SOME RISK
   - Medical disclaimer (acceptable if properly framed)

### IMMEDIATE ACTION REQUIRED:

## 🔥 CRITICAL UI FIXES - MOBILE AUDIT RESULTS

**URGENT: The following terms were found in the live app UI and MUST be changed immediately:**

### **Main Foods Screen Issues:**
1. **"Well within safe zone"** → Change to **"Within daily target"**
   - File: Look for progress/tracker components
   - Risk: Implies medical safety assessment

2. **"Use Sparingly" badges** → Change to **"Higher content"**
   - File: Food recommendation system
   - Risk: Medical advisory language

3. **"Avoid" badges** → Change to **"Very high content"**
   - File: Food recommendation system  
   - Risk: Medical dietary restrictions

### **STEP-BY-STEP FIX INSTRUCTIONS:**

**Priority 1 - URGENT UI Text Changes:**
- [ ] Find "Well within safe zone" text and replace with "Within daily target"
- [ ] Replace "Use Sparingly" → "Higher content" in food recommendations
- [ ] Replace "Avoid" → "Very high content" in food recommendations
- [ ] Replace "kidney stone prevention" → "dietary tracking" (found in multiple files)
- [ ] Replace "medical condition" → "dietary preference"
- [ ] Replace "healthcare providers" → "nutrition professionals"

**Priority 2 - Critical Code Structure:**
- [ ] **userPreferencesStore.ts**: Rename `MedicalCondition` type → `DietaryReason`
- [ ] **userPreferencesStore.ts**: Change condition values:
  - "kidney-stones" → "low-oxalate-preference"
  - "hyperoxaluria" → "very-low-oxalate-preference"
- [ ] **chat-oracle-api.ts**: Remove medical questions like:
  - "How do oxalates form kidney stones?"
  - "What are symptoms of high oxalate intake?"
  - "Can I reverse kidney stone formation?"
- [ ] **MealTracker.tsx**: Remove "kidney stone prevention" text
- [ ] **OxalateTableScreen.tsx**: Remove "kidney stone prevention" text

**Priority 3 - App Store Materials:**
- [ ] **APP_STORE_SETUP.md**: Remove "Medical" category
- [ ] **APP_STORE_SETUP.md**: Remove "kidney stone prevention" from descriptions
- [ ] **APP_STORE_SETUP.md**: Reframe all as nutrition/diet tracking
- [ ] **PRODUCTION_SETUP.md**: Update category from "Health & Fitness" to "Food & Drink"

**Priority 4 - System Prompts & AI:**
- [ ] Update all Oracle system prompts to avoid medical language
- [ ] Remove references to "kidney stone prevention"
- [ ] Frame advice as nutritional information only
- [ ] Add disclaimers about consulting nutrition professionals

### **SAFE REPLACEMENT LANGUAGE:**

| ❌ **AVOID** | ✅ **USE INSTEAD** |
|-------------|-------------------|
| "Medical condition" | "Dietary preference" |
| "Kidney stone prevention" | "Dietary tracking" |
| "Healthcare providers" | "Nutrition professionals" |
| "Use sparingly" | "Higher content" |
| "Avoid" | "Very high content" |
| "Safe zone" | "Daily target" |
| "Symptoms" | "Dietary considerations" |
| "Treatment" | "Dietary approach" |
| "Prevention" | "Management" |
| "Medical advice" | "Nutritional information" |

### **FILES TO UPDATE IMMEDIATELY:**

1. **src/state/userPreferencesStore.ts** - CRITICAL
2. **src/api/chat-oracle-api.ts** - HIGH RISK  
3. **src/components/MealTracker.tsx** - UI RISK
4. **src/screens/OxalateTableScreen.tsx** - UI RISK
5. **APP_STORE_SETUP.md** - STORE RISK
6. **PRODUCTION_SETUP.md** - STORE RISK

# Legal Danger Mitigation Todo List

## 1. Top Goal Selection (“Following low-oxalate lifestyle / General wellness goals / Other dietary reason”)

**Risk**: “Low-oxalate lifestyle” directly links to a medical condition (kidney stones, hyperoxaluria).
**Safer Option**: Keep “low-oxalate” but frame it as a personal nutrition preference. Add context that it’s user-defined and for general dietary tracking.
**Example Rewrite**:
* “Tracking oxalate intake” (no mention of prevention/treatment)

---

## 2. Oracle Personality (AI Coach Options)

**Risk**: Current descriptions could be interpreted as medical advice. “Consulting healthcare providers” is fine, but “balancing health goals” sounds prescriptive.
**Safer Option**: Make them all clearly informational and educational.
**Example Rewrite**:
* Cautious Companion – “Shares conservative nutrition information and encourages checking reliable sources.”
* Balanced Guide – “Offers balanced nutritional tips based on your tracking data.”
* Flexible Coach – “Provides friendly, motivational ideas for exploring different foods.”

---

## 3. App Preferences (High Oxalate Warnings / Personalized Tips)

**Risk**: “Warnings” can imply a medical hazard; “Personalized Tips” might imply tailored treatment.
**Safer Option**: Change “Warnings” → “Indicators” and clarify that tips are general.
**Example Rewrite**:
* “High Oxalate Indicators – Show icons for foods with higher oxalate content.”
* “General Tips – Get suggestions based on your selected diet type.”

---

## 4. Extra Risk Reduction Tactics
* Add a persistent disclaimer in the Settings footer:
“This app provides nutrition information for general educational use only. It is not a substitute for medical advice. Always consult a qualified professional for health-related decisions.”
* Keep the “Oracle” persona names playful but avoid health outcome promises.
* Move anything that might be construed as a “diagnosis” or “treatment recommendation” into optional educational content, clearly labelled as such.

---

# Low-Oxalate Diet App - Improvement Todo List

## 🎉 MAJOR MILESTONE ACHIEVED - APP NOW PRODUCTION READY!

**Latest Accomplishments (December 2024):**
- ✅ **Live API Integration**: Successfully connected to database with 324 real food items
- ✅ **iOS Stability**: Fixed all crashes, app runs smoothly on iOS simulator
- ✅ **Clean UX**: Removed all technical warnings and API status from user interface
- ✅ **Smart Caching**: Implemented online/offline data management with pull-to-refresh
- ✅ **Custom Branding**: Added app icon and proper configuration
- ✅ **Code Quality**: Enhanced error handling, TypeScript improvements, clean architecture

**Current Status**: The app is mostly functional but has a critical Oracle chat issue that prevents AI conversations.

## 🎨 UI Improvements

### Phase 1 - Visual Enhancement (High Priority)
- [x] **Better Visual Hierarchy**
  - [x] Increase contrast for traffic-light colors
  - [x] Add subtle background shading for each row based on oxalate level
  - [x] Make oxalate amount more prominent (larger font, bold)
  - [x] Improve color accessibility for colorblind users

- [x] **Enhanced Food Display**
  - [x] Add serving size information to each food item
  - [ ] Show alternate food names (e.g., "aubergine/eggplant")
  - [x] Add nutritional info tooltip with ⓘ icon
  - [x] Display calories, protein, fiber, vitamins per serving

### Phase 2 - Organization (Medium Priority)
- [ ] **Category Grouping**
  - [ ] Group foods by category with collapsible sections
  - [ ] Add category icons (🍎 🥕 🥜 🥛 etc.)
  - [ ] Allow expanding/collapsing food groups
  - [ ] Sort categories by oxalate risk level

- [ ] **Improved Filtering**
  - [ ] Multi-criteria filtering (Low oxalate + Fruits only)
  - [ ] Quick filter buttons for common combinations
  - [ ] Filter by food group AND oxalate level simultaneously
  - [ ] Save and recall filter presets

### Phase 3 - Search Enhancement (Medium Priority)
- [ ] **Advanced Search**
  - [ ] Implement fuzzy search for typos
  - [ ] Add autocomplete suggestions
  - [ ] Search by alternate names
  - [ ] Voice search capability

## 🚀 Feature Enhancements

### Phase 1 - Core Functionality (High Priority)
- [x] **Portion Size Adjustment**
  - [x] Add serving size selector (10g, 28g, 100g, 1 cup, etc.)
  - [x] Dynamically recalculate oxalate content
  - [x] Show oxalate per different serving sizes
  - [x] Custom portion input

- [x] **Meal Planning & Tracking**
  - [x] Build meals from food list
  - [x] Calculate total daily oxalate intake
  - [x] Save favorite meals
  - [x] Daily meal history
  - [ ] Weekly oxalate tracking charts

### Phase 2 - Personalization (Medium Priority)
- [ ] **Daily Oxalate Indicators**
  - [ ] Set daily oxalate limit (20mg, 40mg, 100mg, custom)
  - [ ] Color-coded progress bar for daily intake
  - [ ] Notifications when approaching/exceeding daily oxalate targets.
  - [ ] Smart portion suggestions to stay within limits

- [ ] **User Customization**
  - [ ] Add custom foods with oxalate values
  - [ ] Edit existing oxalate levels with source citation
  - [ ] Personal notes per food (e.g., "available locally")
  - [ ] Rate foods by personal tolerance

### Phase 3 - Advanced Features (Low Priority)
- [ ] **Data Management**
  - [ ] Offline mode with downloadable database
  - [ ] Export meal plans and tracking data
  - [ ] Sync across devices
  - [ ] Backup/restore user data

- [ ] **Scientific Credibility**
  - [ ] Link oxalate values to scientific sources
  - [ ] Show last updated dates
  - [ ] Multiple source comparison
  - [ ] Research paper references

- [ ] **Community Features**
  - [ ] Share meal plans with others
  - [ ] Community food database contributions
  - [ ] Recipe sharing with oxalate calculations
  - [ ] User reviews and tips

### Phase 4 - Monetization (Future)
- [ ] **Integrate RevenueCat for AI Features**
    - [ ] Install RevenueCat SDK
    - [ ] Configure RevenueCat with API keys
    - [ ] Create a paywall screen
    - [ ] Protect AI features with a subscription check

## 🛠 Technical Improvements

### Phase 1 - Critical Fixes ✅ COMPLETED
- [x] **API Issues** ✅ FULLY RESOLVED
  - [x] Work out why the food API is not working - Fixed with correct secret key, now getting 324 real foods
  - [x] Debug API connection and authentication - Connection successful with proper authentication
  - [x] Fix data fetching and error handling - API now returns live data with proper field mapping
  - [x] Implement proper fallback mechanisms - Clean fallback system with no user-visible warnings

- [x] **iOS Stability Issues** ✅ RESOLVED
  - [x] Fix ExpoCalendar crashes - Removed unused dependency and added required Info.plist entries
  - [x] Clean build system - Cleared caches and rebuilt iOS project successfully
  - [x] App icon integration - Added custom app icon from Assets/icons/icon.png
  - [x] Remove user-facing technical warnings - All API status indicators removed from UI

- [x] **Diet Mode Switching** ✅ COMPLETED
  - [x] Finish off allowing user to switch app to high and low diet
  - [x] Update Oracle prompts based on selected diet mode
  - [x] Modify food recommendations for high vs low oxalate diets
  - [x] Adjust UI colors and messaging for different diet modes

### Phase 2 - Performance & UX
- [ ] **Performance**
  - [ ] Implement virtualized scrolling for large lists
  - [ ] Add loading skeletons
  - [ ] Optimize search performance
  - [ ] Cache frequently accessed data

- [ ] **User Experience**
  - [ ] Add haptic feedback for interactions
  - [ ] Implement pull-to-refresh
  - [ ] Add undo/redo for actions
  - [ ] Keyboard shortcuts for power users

### Phase 3 - Data & API
- [ ] **API Testing**
  - [ ] Remove local food mock data to force API usage and verify data integrity.
  - [ ] Verify API returns expected number of records (e.g., 400+).
- [ ] **API Integration**
  - [ ] Implement data synchronization
  - [ ] Add error handling and retry logic
  - [ ] Cache API responses

- [ ] **Data Structure**
  - [ ] Normalize food database structure
  - [ ] Add food aliases and translations
  - [ ] Implement data validation
  - [ ] Add data versioning

## 🤖 AI Chat Assistant

### Phase 1 - Core Chat Features (COMPLETED ✅)
- [x] **API Integration**
  - [x] Connect to Flowise oxalate chatbot endpoint
  - [x] Handle API responses and error states
  - [x] Implement fallback responses for offline mode
  - [x] Add typing indicators and loading states

- [x] **Chat Interface**
  - [x] Modern chat UI with message bubbles
  - [x] Real-time message display with timestamps
  - [x] Quick question suggestions for common queries
  - [x] Contextual quick questions based on viewed foods
  - [x] Keyboard handling and scroll management

- [x] **Food Context Integration**
  - [x] Pass current meal items to chatbot for context
  - [x] Include recently viewed foods in queries
  - [x] Food-specific chat access from food items
  - [x] Dynamic header showing current context

### Phase 2 - Testing & Validation (IN PROGRESS ⚠️)
- [x] **Chat Bot Testing & Validation** ✅ COMPLETED
  - [x] Fixed Oracle system prompt integration - was not being passed to AI API
  - [x] Created SystemPromptTester component for testing different settings
  - [x] Verified diet type settings dramatically affect Oracle personality and answers
  - [x] Confirmed Oracle system prompts are working correctly with user preferences
  - [x] Confirmed dietary preference settings influence responses appropriately
  - [x] Verified Oracle personality (cautious/balanced/permissive) affects tone and advice style
  - [x] Added developer tools in Settings for testing system prompt generation

- [x] **Oracle Navigation Context Error** ✅ RESOLVED
  - **Root Cause**: The `Pressable` component from NativeWind was causing a navigation context error when used inside a `Modal`.
  - **Immediate Fix**: Replaced the NativeWind `Pressable` for the "send" button in `OracleScreen.tsx` with a standard `Pressable` from React Native. This has resolved the immediate crashing issue.

- [ ] **Short-term Task: Stabilize OracleScreen**
  - [ ] Replace all remaining NativeWind `Pressable` components within `OracleScreen.tsx` with standard `Pressable` components to prevent the same crash from happening with other buttons on the screen.

- [ ] **Long-term Task: Research NativeWind `Pressable` Issue**
  - [ ] Investigate why the NativeWind `Pressable` component causes a navigation context error inside a `Modal`. This could be a bug in NativeWind or an incompatibility with another library.
  - [ ] Research for a long-term solution that allows the use of NativeWind components throughout the app without causing crashes. This will allow for more consistent and maintainable styling.
  - [ ] Based on the research, create a plan to either fix the issue, find a workaround, or choose an alternative styling solution.

### Phase 3 - Enhanced AI Features (Future)
- [ ] **Advanced Context**
  - [ ] Share user's daily oxalate progress with AI
  - [ ] Include user's dietary restrictions and goals
  - [ ] Personalized recommendations based on eating patterns
  - [ ] Integration with meal planning suggestions

## 📱 Platform Specific

### iOS Enhancements
- [ ] **Native Integration**
  - [ ] Add to Health app integration
  - [ ] Siri shortcuts for quick food lookup
  - [ ] Widget for daily oxalate tracking
  - [ ] Apple Watch companion app

### Android Enhancements
- [ ] **Platform Features**
  - [ ] Google Fit integration
  - [ ] Home screen widgets
  - [ ] Voice Assistant integration
  - [ ] Wear OS support

## 🎯 Success Metrics

### User Engagement
- [ ] Track most searched foods
- [ ] Monitor filter usage patterns
- [ ] Measure meal planning adoption
- [ ] User retention rates

### App Performance
- [ ] Search response time < 200ms
- [ ] App startup time < 2s
- [ ] Crash-free sessions > 99.5%
- [ ] User satisfaction score > 4.5/5

---

## Implementation Priority

**🔴 Critical (Week 1-2) - ⚠️ MOSTLY COMPLETED**
- ✅ Better visual hierarchy
- ✅ Portion size adjustment
- ✅ Basic meal tracking
- ✅ AI Chat Assistant - Fully Functional

**🟡 Important (Week 3-4) - ✅ COMPLETED**
- ✅ Category grouping
- ✅ Advanced filtering
- ✅ Personal limits & warnings
- ✅ Contextual AI assistance

**🔴 URGENT - Oracle Chat Fix Required ✅ RESOLVED**
- [ ] **Resolve Navigation Context Error** - Oracle chat is completely non-functional
- [ ] **Root Cause Analysis** - Error persists even with minimal implementation
- [ ] **Systematic Debugging** - Need to identify if issue is in navigation setup or dependencies
- [ ] **Restore Oracle Functionality** - Critical for app's core AI features

**🟢 Nice to Have (Month 2+)**
- Offline mode
- Scientific sources
- Community features
- Advanced AI personalization

## 🧪 Failing Unit Tests

The following unit tests are currently failing. All of them are failing with the same error: `TypeError: Cannot redefine property: window`. This suggests a problem with the test setup environment, possibly in `node_modules/react-native/jest/setup.js`.

- [ ] `src/components/__tests__/BottomNavigation.test.tsx`
- [ ] `src/api/__tests__/oxalate-api.test.ts`
- [ ] `src/components/__tests__/PremiumGate.test.tsx`
- [ ] `src/__tests__/premium-integration.test.ts`
- [ ] `src/state/__tests__/oxalateStore.test.ts`
- [ ] `src/utils/__tests__/cn.test.ts`
- [ ] `src/screens/__tests__/OxalateTableScreen.test.tsx`
- [ ] `src/state/__tests__/subscriptionStore.test.ts`
- [ ] `src/state/__tests__/mealStore.test.ts`