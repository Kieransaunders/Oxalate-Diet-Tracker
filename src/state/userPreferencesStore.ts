import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  UserPreferencesStore, 
  defaultUserPreferences,
  DietType,
  MedicalCondition,
  OxalateLevel
} from '../types/userPreferences';

export const useUserPreferencesStore = create<UserPreferencesStore>()(
  persist(
    (set, get) => ({
      userPreferences: defaultUserPreferences,

      setDietType: (dietType: DietType) => {
        set((state) => ({
          userPreferences: {
            ...state.userPreferences,
            dietType,
            // Auto-update daily limit based on diet type
            targetDailyLimit: dietType === 'low-oxalate' ? 40 :
                              dietType === 'moderate-oxalate' ? 80 :
                              dietType === 'high-oxalate' ? 150 : 300,
            // Auto-update default recipe type
            preferences: {
              ...state.userPreferences.preferences,
              defaultRecipeType: dietType === 'low-oxalate' ? 'low' :
                                 dietType === 'moderate-oxalate' ? 'medium' :
                                 dietType === 'high-oxalate' ? 'high' : 'medium',
              // Enable warnings for low-oxalate diets
              showHighOxalateWarnings: dietType === 'low-oxalate' || dietType === 'moderate-oxalate',
            },
            profile: {
              ...state.userPreferences.profile,
              lastUpdated: Date.now(),
            },
          },
        }));
      },

      setTargetDailyLimit: (limit: number) => {
        set((state) => ({
          userPreferences: {
            ...state.userPreferences,
            targetDailyLimit: limit,
            profile: {
              ...state.userPreferences.profile,
              lastUpdated: Date.now(),
            },
          },
        }));
      },

      setMedicalCondition: (condition: MedicalCondition | undefined) => {
        set((state) => ({
          userPreferences: {
            ...state.userPreferences,
            medicalCondition: condition,
            // Auto-adjust settings for medical conditions
            ...(condition === 'kidney-stones' && {
              dietType: 'low-oxalate' as DietType,
              targetDailyLimit: 40,
              preferences: {
                ...state.userPreferences.preferences,
                showHighOxalateWarnings: true,
                defaultRecipeType: 'low' as OxalateLevel,
                oraclePersonality: 'cautious' as any,
              },
            }),
            profile: {
              ...state.userPreferences.profile,
              lastUpdated: Date.now(),
            },
          },
        }));
      },

      updatePreferences: (preferences) => {
        set((state) => ({
          userPreferences: {
            ...state.userPreferences,
            preferences: {
              ...state.userPreferences.preferences,
              ...preferences,
            },
            profile: {
              ...state.userPreferences.profile,
              lastUpdated: Date.now(),
            },
          },
        }));
      },

      updateProfile: (profile) => {
        set((state) => ({
          userPreferences: {
            ...state.userPreferences,
            profile: {
              ...state.userPreferences.profile,
              ...profile,
              lastUpdated: Date.now(),
            },
          },
        }));
      },

      resetToDefaults: () => {
        set({
          userPreferences: {
            ...defaultUserPreferences,
            profile: {
              ...defaultUserPreferences.profile,
              createdAt: Date.now(),
              lastUpdated: Date.now(),
            },
          },
        });
      },

      // Getters
      getOracleSystemPrompt: () => {
        try {
          const { dietType, medicalCondition, preferences } = get().userPreferences;
          const personality = preferences?.oraclePersonality || 'balanced';

        let basePrompt = "You are the Oxalate Oracle, a knowledgeable and helpful nutrition assistant specializing in oxalate content and dietary guidance.";

        // Add diet type context
        switch (dietType) {
          case 'low-oxalate':
            basePrompt += " The user follows a low-oxalate diet (under 40-50mg daily) and needs guidance on avoiding high-oxalate foods. Focus on kidney stone prevention, low-oxalate alternatives, and safe food preparation methods.";
            break;
          case 'moderate-oxalate':
            basePrompt += " The user follows a moderate oxalate approach (50-100mg daily) and wants balanced nutrition while being mindful of oxalate content. Provide practical advice that balances health goals with lifestyle flexibility.";
            break;
          case 'high-oxalate':
            basePrompt += " The user is interested in nutrient-dense foods including high-oxalate options. Focus on nutritional benefits, proper preparation methods to reduce oxalate absorption, and overall balanced nutrition.";
            break;
          case 'unrestricted':
            basePrompt += " The user has no oxalate restrictions and is primarily interested in general nutrition information. Provide educational content about oxalates while focusing on overall healthy eating.";
            break;
        }

        // Add medical condition context
        if (medicalCondition) {
          switch (medicalCondition) {
            case 'kidney-stones':
              basePrompt += " IMPORTANT: The user has a history of kidney stones. Always prioritize kidney stone prevention advice, emphasize hydration, and be conservative with oxalate recommendations.";
              break;
            case 'hyperoxaluria':
              basePrompt += " IMPORTANT: The user has hyperoxaluria and requires very strict oxalate management. Provide medical-grade advice and always recommend consulting healthcare providers for major dietary changes.";
              break;
            case 'other':
              basePrompt += " The user has other medical considerations. Be conservative with advice and frequently suggest consulting with healthcare providers.";
              break;
          }
        }

        // Add personality context
        switch (personality) {
          case 'cautious':
            basePrompt += " Adopt a cautious, safety-first approach. Always err on the side of caution, provide conservative recommendations, and frequently suggest consulting healthcare providers.";
            break;
          case 'balanced':
            basePrompt += " Provide balanced, practical advice that considers both health goals and lifestyle factors. Be informative but not overly restrictive.";
            break;
          case 'permissive':
            basePrompt += " Take an encouraging, flexible approach. Focus on overall nutrition and lifestyle sustainability while providing oxalate information as guidance rather than strict rules.";
            break;
        }

        basePrompt += " Always provide specific, actionable advice with oxalate content numbers when possible. Be encouraging and supportive in your responses.";

        return basePrompt;
        } catch (error) {
          console.error('Error generating Oracle system prompt:', error);
          // Return a safe default prompt
          return "You are the Oxalate Oracle, a knowledgeable and helpful nutrition assistant specializing in oxalate content and dietary guidance. Provide balanced, practical advice about oxalate management and nutrition.";
        }
      },

      getDefaultRecipeType: () => {
        return get().userPreferences.preferences.defaultRecipeType;
      },

      shouldShowWarnings: () => {
        return get().userPreferences.preferences.showHighOxalateWarnings;
      },
    }),
    {
      name: 'user-preferences-store',
      storage: {
        getItem: async (name) => {
          const value = await AsyncStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: async (name, value) => {
          await AsyncStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: async (name) => {
          await AsyncStorage.removeItem(name);
        },
      },
    }
  )
);