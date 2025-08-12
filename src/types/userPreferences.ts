export type DietType = 'low-oxalate' | 'moderate-oxalate' | 'high-oxalate' | 'unrestricted';
export type MedicalCondition = 'kidney-stones' | 'hyperoxaluria' | 'other' | null;
export type OraclePersonality = 'cautious' | 'balanced' | 'permissive';
export type OxalateLevel = 'low' | 'medium' | 'high';

export interface UserPreferences {
  dietType: DietType;
  targetDailyLimit: number; // mg per day
  medicalCondition?: MedicalCondition;
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
  setMedicalCondition: (condition: MedicalCondition) => void;
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
  medicalCondition: null,
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
  'low-oxalate': { limit: 40, description: 'Kidney stone prevention (strict)' },
  'moderate-oxalate': { limit: 80, description: 'Balanced low-oxalate approach' },
  'high-oxalate': { limit: 150, description: 'Focus on nutrient density' },
  'unrestricted': { limit: 300, description: 'No oxalate restrictions' },
} as const;

// Oracle personality configurations
export const oraclePersonalities = {
  cautious: {
    name: 'Cautious Guardian',
    description: 'Conservative advice, emphasizes safety and medical guidance',
    icon: '🛡️',
  },
  balanced: {
    name: 'Balanced Guide',
    description: 'Practical advice balancing health goals with lifestyle',
    icon: '⚖️',
  },
  permissive: {
    name: 'Flexible Coach',
    description: 'Encouraging approach, focuses on overall nutrition',
    icon: '🌟',
  },
} as const;