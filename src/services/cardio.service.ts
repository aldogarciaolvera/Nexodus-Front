import { apiFetch, handleResponse } from './api';

export type CardioEnvironment = 'Outdoor' | 'Gym';
export type CardioModality = 'Walking' | 'Jogging' | 'Running' | 'Mixed';
export type CardioTrackingMode = 'Manual' | 'Gps';
export type CardioState =
  | 'Warmup'
  | 'Walking'
  | 'Jogging'
  | 'Running'
  | 'Sprint'
  | 'Resting'
  | 'Cooldown';

export interface CardioSegment {
  segmentOrder: number;
  state: CardioState;
  durationSeconds: number;
  startedAt: string;
  endedAt: string;
}

export interface SaveCardioSessionRequest {
  name: string;
  environment: CardioEnvironment;
  activityType: string;
  trackingMode: CardioTrackingMode;
  startTime: string;
  endTime: string;
  totalDurationSeconds: number;
  distanceKm?: number;
  estimatedCalories?: number;
  isAiGenerated: boolean;
  notes?: string;
  segments: CardioSegment[];
}

export interface CardioSession {
  id: string;
  name: string;
  environment: CardioEnvironment;
  activityType: string;
  trackingMode: CardioTrackingMode;
  startTime: string;
  endTime?: string;
  totalDurationSeconds: number;
  distanceKm?: number;
  estimatedCalories: number;
  isAiGenerated: boolean;
  notes?: string;
  segments: CardioSegment[];
}

export interface GenerateAiCardioRequest {
  environment: CardioEnvironment;
  modality: CardioModality;
  durationMinutes: number;
  difficultyLevel: string;
  prompt?: string;
  userWeightKg?: number;
}

export interface AiCardioBlock {
  order: number;
  state: CardioState;
  durationSeconds: number;
  label: string;
  cue?: string;
}

export interface GeneratedAiCardioPlan {
  name: string;
  description: string;
  environment: CardioEnvironment;
  modality: string;
  estimatedDurationMinutes: number;
  estimatedCalories: number;
  rationale: string;
  blocks: AiCardioBlock[];
}

export const CARDIO_STATE_LABELS: Record<CardioState, string> = {
  Warmup: 'Calentamiento',
  Walking: 'Caminando',
  Jogging: 'Trotando',
  Running: 'Corriendo',
  Sprint: 'Sprint',
  Resting: 'Descansando',
  Cooldown: 'Enfriamiento',
};

export const cardioService = {
  getSessions: async (limit = 20): Promise<CardioSession[]> => {
    const response = await apiFetch(`/api/cardio/sessions?limit=${limit}`);
    return handleResponse(response);
  },

  saveSession: async (data: SaveCardioSessionRequest): Promise<CardioSession> => {
    const response = await apiFetch('/api/cardio/sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  deleteSession: async (id: string): Promise<void> => {
    const response = await apiFetch(`/api/cardio/sessions/${id}`, {
      method: 'DELETE',
    });
    if (response.status !== 204) {
      return handleResponse(response);
    }
  },

  generateAiPlan: async (data: GenerateAiCardioRequest): Promise<GeneratedAiCardioPlan> => {
    const response = await apiFetch('/api/cardio/ai/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
};
