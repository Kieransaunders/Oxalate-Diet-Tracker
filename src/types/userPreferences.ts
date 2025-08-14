export type DietType = 'low-oxalate' | 'moderate-oxalate' | 'high-oxalate' | 'unrestricted';
export type DietaryReason = 'low-oxalate-preference' | 'very-low-oxalate-preference' | 'general-wellness' | 'other' | null;
export type OraclePersonality = 'cautious' | 'balanced' | 'permissive';
export type OxalateLevel = 'low' | 'medium' | 'high';

export interface UserPreferences {
  dietType: DietType;
  targetDailyLimit: number; // mg per day
  dietaryReason?: DietaryReason;
  preferences: {
    showHighOxalateWarnings: boolean;
    defaultRecipeType: OxalateLevel;
    oraclePersonality: OraclePersonality;
    enablePersonalizedTips: boolean;
  };
  profile?: {
    name?: string;
    setupCompleted?: boolean;
    createdAt?: number;
    lastUpdated?: number;
  };
}

export interface UserPreferencesStore {
  userPreferences: UserPreferences;
  
  // Actions
  setDietType: (dietType: DietType) => void;
  setTargetDailyLimit: (limit: number) => void;
  setDietaryReason: (reason: DietaryReason | undefined) => void;
  updatePreferences: (preferences: Partial<UserPreferences['preferences']>) => void;
  updateProfile: (profile: Partial<UserPreferences['profile']>) => void;
  resetToDefaults: () => void;
  
  // Getters
  getOracleSystemPrompt: () => string;
  getDefaultRecipeType: () => OxalateLevel;
  shouldShowWarnings: () => boolean;
}

// Default preferences for new users
export const defaultUserPreferences: UserPreferences = {
  dietType: 'low-oxalate',
  targetDailyLimit: 50,
  dietaryReason: null,
  preferences: {
    showHighOxalateWarnings: true,
    defaultRecipeType: 'low',
    oraclePersonality: 'balanced',
    enablePersonalizedTips: true,
  },
  profile: {
    setupCompleted: false,
    createdAt: Date.now(),
    lastUpdated: Date.now(),
  },
};

// Preset daily limits based on diet type
export const dietTypePresets = {
  'low-oxalate': { limit: 40, description: 'Low-oxalate lifestyle (strict tracking)' },
  'moderate-oxalate': { limit: 80, description: 'Balanced low-oxalate approach' },
  'high-oxalate': { limit: 150, description: 'Focus on nutrient density' },
  'unrestricted': { limit: 300, description: 'No oxalate restrictions' },
} as const;

// Oracle personality configurations
export const oraclePersonalities = {
  cautious: {
    name: 'Cautious Guardian',
    description: 'Shares conservative nutrition information and encourages checking reliable sources.',
    icon: '🛡️',
  },
  balanced: {
    name: 'Balanced Guide',
    description: 'Offers balanced nutritional tips based on your tracking data.',
    icon: '⚖️',
  },
  permissive: {
    name: 'Flexible Coach',
    description: 'Provides friendly, motivational ideas for exploring different foods.',
    icon: '🌟',
  },
} as const;