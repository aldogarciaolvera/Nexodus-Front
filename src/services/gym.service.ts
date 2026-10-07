import { apiFetch, handleResponse } from './api';

export interface Exercise {
  id: string;
  name: string;
  description?: string;
  instructions?: string;
  targetMuscleGroup: string;
  equipment: string;
  videoUrl?: string;
  bodyPart?: string;
  muscle?: string;
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
  getExercises: async (): Promise<Exercise[]> => {
    const response = await apiFetch('/api/exercises');
    return handleResponse(response);
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

  createWorkoutLog: async (data: CreateWorkoutLogRequest): Promise<void> => {
    const response = await apiFetch('/api/workouts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  }
};
