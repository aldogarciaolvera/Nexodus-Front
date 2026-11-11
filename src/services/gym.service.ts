import { apiFetch, handleResponse } from './api';

export interface Exercise {
  id: string;
  name: string;
  description?: string;
  instructions?: string;
  targetMuscleGroup?: string;
  equipment?: string;
  videoUrl?: string;
  bodyPart?: string;
  muscle?: string;
  category?: string;
  externalId?: string;
  thumbUrl?: string;
  gifUrl?: string;
}

export interface RoutineExercise {
  id?: string;
  exerciseId: string;
  sets: number;
  reps: number;
  weight?: number; // Added weight property
  restTimeInSeconds: number;
  exercise?: Exercise;
}

export interface Routine {
  id: string;
  name: string;
  description: string;
  difficultyLevel: string;
  targetDay?: number; // 1 = Monday, ..., 7 = Sunday
  exercises: RoutineExercise[];
  createdAt: string;
  updatedAt?: string;
}

export interface CreateRoutineRequest {
  name: string;
  description: string;
  difficultyLevel: string;
  targetDay?: number;
  exercises: Omit<RoutineExercise, 'id' | 'exercise'>[];
}

export interface CreateWorkoutLogRequest {
  routineId: string;
  durationInSeconds: number;
  completedExercisesCount: number;
  dateCompleted: string;
}

export interface WorkoutLog {
  id: string;
  routineId: string;
  durationInSeconds: number;
  completedExercisesCount: number;
  dateCompleted: string;
  routine?: Routine;
}

export type SetType = 'Normal' | 'Warmup' | 'DropSet' | 'Failure' | 'Timed';

export interface WorkoutSetDto {
  id: string;
  workoutSessionId: string;
  exerciseId: string;
  setOrder: number;
  type: SetType;
  weightKg: number;
  reps: number;
  rpe?: number;
  durationSeconds?: number;
  calculatedOneRepMax: number;
  isCompleted: boolean;
  completedAt?: string;
  exercise?: Exercise;
}

export interface WorkoutSessionDto {
  id: string;
  userId: string;
  routineId?: string;
  name: string;
  startTime: string;
  endTime?: string;
  durationSeconds: number;
  totalVolumeKg: number;
  totalReps: number;
  completedSetsCount: number;
  xpEarned: number;
  isActive: boolean;
  notes?: string;
  sets: WorkoutSetDto[];
  routine?: Routine;
}

export interface StartWorkoutSessionRequest {
  routineId?: string;
  name?: string;
}

export interface LogWorkoutSetRequest {
  setId?: string;
  exerciseId: string;
  setOrder: number;
  type?: SetType;
  weightKg: number;
  reps: number;
  rpe?: number;
  durationSeconds?: number;
  isCompleted?: boolean;
}

export interface FinishWorkoutSessionRequest {
  notes?: string;
}

export interface MuscleRecoveryDto {
  muscleGroup: string;
  hoursSinceLastTrained?: number;
  fatigueScore: number;
  recoveryPercentage: number;
  status: 'Ready' | 'Recovering' | 'Fatigued';
  estimatedFullRecoveryHours: number;
}

export interface ExerciseRecordDto {
  exerciseId: string;
  maxWeightKg: number;
  maxReps: number;
  bestCalculatedOneRepMax: number;
  maxVolumeInSingleSet: number;
}

export const gymService = {
  // Exercises
  getExercisesPage: async (page = 1, pageSize = 100): Promise<{ items: Exercise[]; totalPages?: number; totalCount?: number }> => {
    const validPage = typeof page === 'number' ? page : 1;
    const validPageSize = typeof pageSize === 'number' ? pageSize : 100;
    const response = await apiFetch(`/api/exercises?page=${validPage}&pageSize=${validPageSize}`);
    const res = await handleResponse(response);
    
    let items: Exercise[] = [];
    let totalPages: number | undefined;
    let totalCount: number | undefined;

    if (Array.isArray(res)) {
      items = res;
    } else if (res && typeof res === 'object') {
      if (Array.isArray(res.items)) items = res.items;
      else if (Array.isArray(res.data)) items = res.data;
      else if (Array.isArray(res.exercises)) items = res.exercises;
      else if (Array.isArray(res.content)) items = res.content;
      
      totalCount = res.totalCount || res.total || res.count;
      totalPages = res.totalPages || res.pageCount;
    }

    return { items, totalPages, totalCount };
  },

  getExercises: async (page = 1, pageSize = 100): Promise<Exercise[]> => {
    const { items } = await gymService.getExercisesPage(page, pageSize);
    return items;
  },

  getAllExercises: async (): Promise<Exercise[]> => {
    // 1. Fetch first page with standard pageSize=100
    const firstPage = await gymService.getExercisesPage(1, 100);
    const allExercises: Exercise[] = [...firstPage.items];

    if (firstPage.items.length === 0) {
      return allExercises;
    }

    // 2. If the backend returned totalPages metadata, fetch all remaining pages in parallel
    if (typeof firstPage.totalPages === 'number' && firstPage.totalPages > 1) {
      const pagePromises: Promise<{ items: Exercise[] }>[] = [];
      for (let p = 2; p <= firstPage.totalPages; p++) {
        pagePromises.push(gymService.getExercisesPage(p, 100));
      }
      const restPages = await Promise.all(pagePromises);
      for (const pageRes of restPages) {
        if (pageRes.items && pageRes.items.length > 0) {
          allExercises.push(...pageRes.items);
        }
      }
    } else {
      // 3. If no totalPages metadata, paginate sequentially while the batch returned is full (>= 50 items)
      const batchSize = firstPage.items.length;
      let currentPage = 2;
      let hasMore = batchSize >= 50;

      while (hasMore && currentPage <= 50) {
        const nextPage = await gymService.getExercisesPage(currentPage, 100);
        if (nextPage.items && nextPage.items.length > 0) {
          allExercises.push(...nextPage.items);
          if (nextPage.items.length < batchSize) {
            hasMore = false;
          } else {
            currentPage++;
          }
        } else {
          hasMore = false;
        }
      }
    }

    // Deduplicate by ID
    const uniqueMap = new Map<string, Exercise>();
    for (const ex of allExercises) {
      if (ex.id) {
        uniqueMap.set(ex.id, ex);
      }
    }

    return uniqueMap.size > 0 ? Array.from(uniqueMap.values()) : allExercises;
  },

  getExerciseById: async (id: string): Promise<Exercise> => {
    const response = await apiFetch(`/api/exercises/${id}`);
    return handleResponse(response);
  },

  // Routines
  getRoutines: async (): Promise<Routine[]> => {
    const response = await apiFetch('/api/routines');
    return handleResponse(response);
  },

  getRoutineById: async (id: string): Promise<Routine> => {
    const response = await apiFetch(`/api/routines/${id}`);
    return handleResponse(response);
  },

  createRoutine: async (data: CreateRoutineRequest): Promise<Routine> => {
    const response = await apiFetch('/api/routines', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  updateRoutine: async (id: string, data: CreateRoutineRequest): Promise<Routine> => {
    const response = await apiFetch(`/api/routines/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  deleteRoutine: async (id: string): Promise<void> => {
    const response = await apiFetch(`/api/routines/${id}`, {
      method: 'DELETE',
    });
    if (response.status !== 204) {
      return handleResponse(response);
    }
  },

  // Workout Logs
  getWorkoutLogs: async (): Promise<WorkoutLog[]> => {
    const response = await apiFetch('/api/workouts');
    return handleResponse(response);
  },

  getWorkoutLogById: async (id: string): Promise<WorkoutLog> => {
    const response = await apiFetch(`/api/workouts/${id}`);
    return handleResponse(response);
  },

  createWorkoutLog: async (data: CreateWorkoutLogRequest): Promise<void> => {
    const response = await apiFetch('/api/workouts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  deleteWorkoutLog: async (id: string): Promise<void> => {
    const response = await apiFetch(`/api/workouts/${id}`, {
      method: 'DELETE',
    });
    if (response.status !== 204) {
      return handleResponse(response);
    }
  },

  // Workout Sessions (Live HUD)
  startWorkoutSession: async (data: StartWorkoutSessionRequest): Promise<WorkoutSessionDto> => {
    const response = await apiFetch('/api/gym/sessions/start', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  getActiveWorkoutSession: async (): Promise<WorkoutSessionDto | null> => {
    const response = await apiFetch('/api/gym/sessions/active');
    return handleResponse(response);
  },

  getWorkoutSessionById: async (id: string): Promise<WorkoutSessionDto> => {
    const response = await apiFetch(`/api/gym/sessions/${id}`);
    return handleResponse(response);
  },

  getUserWorkoutSessions: async (limit = 20): Promise<WorkoutSessionDto[]> => {
    const response = await apiFetch(`/api/gym/sessions?limit=${limit}`);
    return handleResponse(response);
  },

  logWorkoutSet: async (sessionId: string, data: LogWorkoutSetRequest): Promise<WorkoutSetDto> => {
    const isGuid = (val?: string) => !!val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
    const payload: Record<string, any> = {
      exerciseId: data.exerciseId,
      setOrder: data.setOrder,
      type: data.type || 'Normal',
      weightKg: Number(data.weightKg) || 0,
      reps: Number(data.reps) || 0,
      isCompleted: data.isCompleted ?? false,
    };
    if (isGuid(data.setId)) {
      payload.setId = data.setId;
    }
    if (data.rpe !== undefined && data.rpe !== null) {
      payload.rpe = Number(data.rpe);
    }
    if (data.durationSeconds !== undefined && data.durationSeconds !== null) {
      payload.durationSeconds = Number(data.durationSeconds);
    }

    const response = await apiFetch(`/api/gym/sessions/${sessionId}/sets`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  deleteWorkoutSet: async (sessionId: string, setId: string): Promise<void> => {
    const response = await apiFetch(`/api/gym/sessions/${sessionId}/sets/${setId}`, {
      method: 'DELETE',
    });
    if (response.status !== 204) {
      return handleResponse(response);
    }
  },

  finishWorkoutSession: async (sessionId: string, data: FinishWorkoutSessionRequest): Promise<WorkoutSessionDto> => {
    const response = await apiFetch(`/api/gym/sessions/${sessionId}/finish`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  cancelWorkoutSession: async (sessionId: string): Promise<void> => {
    const response = await apiFetch(`/api/gym/sessions/${sessionId}`, {
      method: 'DELETE',
    });
    if (response.status !== 204) {
      return handleResponse(response);
    }
  },

  getMuscleRecoveryStatus: async (): Promise<MuscleRecoveryDto[]> => {
    const response = await apiFetch('/api/gym/sessions/recovery/muscle-status');
    return handleResponse(response);
  },

  getExerciseRecords: async (exerciseId: string): Promise<ExerciseRecordDto> => {
    const response = await apiFetch(`/api/gym/sessions/exercises/${exerciseId}/records`);
    return handleResponse(response);
  }
};
