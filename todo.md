# Low-Oxalate Diet App - Improvement Todo List

## 🎨 UI Improvements

### Phase 1 - Visual Enhancement (High Priority)
- [ ] **Better Visual Hierarchy**
  - [ ] Increase contrast for traffic-light colors
  - [ ] Add subtle background shading for each row based on oxalate level
  - [ ] Make oxalate amount more prominent (larger font, bold)
  - [ ] Improve color accessibility for colorblind users

- [ ] **Enhanced Food Display**
  - [ ] Add serving size information to each food item
  - [ ] Show alternate food names (e.g., "aubergine/eggplant")
  - [ ] Add nutritional info tooltip with ⓘ icon
  - [ ] Display calories, protein, fiber, vitamins per serving

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
- [ ] **Portion Size Adjustment**
  - [ ] Add serving size selector (10g, 28g, 100g, 1 cup, etc.)
  - [ ] Dynamically recalculate oxalate content
  - [ ] Show oxalate per different serving sizes
  - [ ] Custom portion input

- [ ] **Meal Planning & Tracking**
  - [ ] Build meals from food list
  - [ ] Calculate total daily oxalate intake
  - [ ] Save favorite meals
  - [ ] Daily meal history
  - [ ] Weekly oxalate tracking charts

### Phase 2 - Personalization (Medium Priority)
- [ ] **Personalized Warnings**
  - [ ] Set daily oxalate limit (20mg, 40mg, 100mg, custom)
  - [ ] Color-coded progress bar for daily intake
  - [ ] Alerts when approaching/exceeding limits
  - [ ] Smart portion suggestions to stay within limits

- [ ] **User Customization**
  - [ ] Add custom foods with oxalate values
  - [ ] Edit existing oxalate levels with source citation
  - [ ] Personal notes per food ("triggers symptoms", "available locally")
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

## 🛠 Technical Improvements

### Phase 1 - Performance & UX
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

### Phase 2 - Data & API
- [ ] **API Integration**
  - [ ] Fix API connection with proper headers
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

### Phase 2 - Enhanced AI Features (Future)
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

**🔴 Critical (Week 1-2) - ✅ COMPLETED**
- ✅ Better visual hierarchy
- ✅ Portion size adjustment
- ✅ Basic meal tracking
- ✅ AI Chat Assistant

**🟡 Important (Week 3-4) - ✅ COMPLETED**
- ✅ Category grouping
- ✅ Advanced filtering
- ✅ Personal limits & warnings
- ✅ Contextual AI assistance

**🟢 Nice to Have (Month 2+)**
- Offline mode
- Scientific sources
- Community features
- Advanced AI personalization