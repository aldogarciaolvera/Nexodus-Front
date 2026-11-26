import { apiFetch, handleResponse } from './api';

export interface GamificationStatus {
  currentStreak: number;
  highestStreak: number;
  lastActiveDate: string | null;
  isActiveToday: boolean;
  isRestDayToday: boolean;
  isGracePeriodActive: boolean;
  gracePeriodExpiresAt: string | null;
  scheduledRestDays: string[];
  streakFreezesAvailable: number;
  nxpTotal: number;
  tier: string;
  nextTier: string | null;
  nextTierNxp: number;
  currentTierBaseNxp: number;
  progressPercent: number;
  cyphers: number;
}

export interface StreakRestoreResult {
  success: boolean;
  restoredStreak: number;
  cyphersRemaining: number;
  message: string;
}

export interface VaultPurchaseResult {
  success: boolean;
  itemType: string;
  cyphersRemaining: number;
  freezesAvailable: number;
  message: string;
}

export const gamificationService = {
  getStatus: async (): Promise<GamificationStatus> => {
    const res = await apiFetch('/api/gamification/status');
    return handleResponse(res);
  },

  updateRestDays: async (restDays: string[]): Promise<GamificationStatus> => {
    const res = await apiFetch('/api/gamification/rest-days', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ restDays }),
    });
    return handleResponse(res);
  },

  restoreStreak: async (): Promise<StreakRestoreResult> => {
    const res = await apiFetch('/api/gamification/streak/restore', {
      method: 'POST',
    });
    return handleResponse(res);
  },

  buyStreakFreeze: async (): Promise<VaultPurchaseResult> => {
    const res = await apiFetch('/api/gamification/vault/buy-freeze', {
      method: 'POST',
    });
    return handleResponse(res);
  },
};
