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
  }
};
