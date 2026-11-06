import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { BiologicalSex, ActivityLevel, NutritionGoal, FastingProtocol } from '../utils/nutritionCalculator';

export interface DietUserProfile {
  weightKg: number;
  heightCm: number;
  age: number;
  sex: BiologicalSex;
  activityLevel: ActivityLevel;
  goal: NutritionGoal;
  fastingProtocol: FastingProtocol;
  targetCalories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  waterTargetMl: number;
  configuredAt: string;
}

export interface FastingState {
  isFasting: boolean;
  startTime: string | null;
  targetHours: number;
}

interface DietState {
  dietProfile: DietUserProfile | null;
  isConfigured: boolean;
  consumedWaterMl: number;
  lastWaterDate: string;
  fastingState: FastingState;
  initialized: boolean;

  initialize: () => Promise<void>;
  saveDietProfile: (profile: DietUserProfile) => Promise<void>;
  addWater: (amountMl?: number) => Promise<void>;
  resetWater: () => Promise<void>;
  startFasting: (targetHours?: number) => Promise<void>;
  stopFasting: () => Promise<void>;
  resetDiet: () => Promise<void>;
}

const STORE_KEY_DIET_PROFILE = 'nexodus_diet_profile_v1';
const STORE_KEY_WATER_LOG = 'nexodus_diet_water_log_v1';
const STORE_KEY_FASTING = 'nexodus_diet_fasting_v1';

const getTodayString = () => new Date().toISOString().split('T')[0];

export const useDietStore = create<DietState>((set, get) => ({
  dietProfile: null,
  isConfigured: false,
  consumedWaterMl: 0,
  lastWaterDate: getTodayString(),
  fastingState: {
    isFasting: false,
    startTime: null,
    targetHours: 16,
  },
  initialized: false,

  initialize: async () => {
    try {
      const storedProfileStr = await SecureStore.getItemAsync(STORE_KEY_DIET_PROFILE);
      const storedWaterStr = await SecureStore.getItemAsync(STORE_KEY_WATER_LOG);
      const storedFastingStr = await SecureStore.getItemAsync(STORE_KEY_FASTING);

      let dietProfile: DietUserProfile | null = null;
      let isConfigured = false;
      if (storedProfileStr) {
        try {
          const parsed = JSON.parse(storedProfileStr);
          if (parsed && parsed.targetCalories > 0) {
            dietProfile = parsed;
            isConfigured = true;
          }
        } catch {
          // Keep null
        }
      }

      let consumedWaterMl = 0;
      let lastWaterDate = getTodayString();
      if (storedWaterStr) {
        try {
          const parsedWater = JSON.parse(storedWaterStr);
          if (parsedWater.date === getTodayString()) {
            consumedWaterMl = parsedWater.amount || 0;
          }
          lastWaterDate = parsedWater.date || getTodayString();
        } catch {
          // Reset water
        }
      }

      let fastingState: FastingState = {
        isFasting: false,
        startTime: null,
        targetHours: 16,
      };
      if (storedFastingStr) {
        try {
          const parsedFasting = JSON.parse(storedFastingStr);
          if (parsedFasting && typeof parsedFasting.isFasting === 'boolean') {
            fastingState = parsedFasting;
          }
        } catch {
          // Default fasting
        }
      }

      set({
        dietProfile,
        isConfigured,
        consumedWaterMl,
        lastWaterDate,
        fastingState,
        initialized: true,
      });
    } catch (e) {
      console.warn('[DietStore] Error initializing from SecureStore:', e);
      set({ initialized: true });
    }
  },

  saveDietProfile: async (profile: DietUserProfile) => {
    try {
      await SecureStore.setItemAsync(STORE_KEY_DIET_PROFILE, JSON.stringify(profile));
      set({
        dietProfile: profile,
        isConfigured: true,
      });
    } catch (e) {
      console.error('[DietStore] Error saving diet profile:', e);
      throw e;
    }
  },

  addWater: async (amountMl = 250) => {
    const today = getTodayString();
    const current = get();
    const isNewDay = current.lastWaterDate !== today;
    const base = isNewDay ? 0 : current.consumedWaterMl;
    const newAmount = base + amountMl;

    set({
      consumedWaterMl: newAmount,
      lastWaterDate: today,
    });

    try {
      await SecureStore.setItemAsync(
        STORE_KEY_WATER_LOG,
        JSON.stringify({ date: today, amount: newAmount })
      );
    } catch (e) {
      console.warn('[DietStore] Error storing water log:', e);
    }
  },

  resetWater: async () => {
    const today = getTodayString();
    set({
      consumedWaterMl: 0,
      lastWaterDate: today,
    });
    try {
      await SecureStore.setItemAsync(
        STORE_KEY_WATER_LOG,
        JSON.stringify({ date: today, amount: 0 })
      );
    } catch (e) {
      console.warn('[DietStore] Error resetting water log:', e);
    }
  },

  startFasting: async (targetHours = 16) => {
    const state: FastingState = {
      isFasting: true,
      startTime: new Date().toISOString(),
      targetHours,
    };
    set({ fastingState: state });
    try {
      await SecureStore.setItemAsync(STORE_KEY_FASTING, JSON.stringify(state));
    } catch (e) {
      console.warn('[DietStore] Error saving fasting state:', e);
    }
  },

  stopFasting: async () => {
    const current = get().fastingState;
    const state: FastingState = {
      isFasting: false,
      startTime: null,
      targetHours: current.targetHours || 16,
    };
    set({ fastingState: state });
    try {
      await SecureStore.setItemAsync(STORE_KEY_FASTING, JSON.stringify(state));
    } catch (e) {
      console.warn('[DietStore] Error saving fasting state:', e);
    }
  },

  resetDiet: async () => {
    set({
      dietProfile: null,
      isConfigured: false,
    });
    try {
      await SecureStore.deleteItemAsync(STORE_KEY_DIET_PROFILE);
    } catch (e) {
      console.warn('[DietStore] Error deleting diet profile:', e);
    }
  },
}));

// Initialize store on import
useDietStore.getState().initialize();
