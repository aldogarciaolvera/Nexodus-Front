import { create } from 'zustand';
import { Routine, RoutineExercise } from '../services/gym.service';

interface WorkoutState {
  isActive: boolean;
  activeRoutine: Routine | null;
  elapsedSeconds: number;
  currentExerciseIndex: number;
  completedSets: Record<string, number>; // exerciseId -> number of completed sets
  isPaused: boolean;
  
  startWorkout: (routine: Routine) => void;
  pauseWorkout: () => void;
  resumeWorkout: () => void;
  endWorkout: () => void;
  tickTimer: () => void;
  nextExercise: () => void;
  prevExercise: () => void;
  completeSet: (exerciseId: string) => void;
  updateExerciseWeight: (index: number, weight: number) => void;
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  isActive: false,
  activeRoutine: null,
  elapsedSeconds: 0,
  currentExerciseIndex: 0,
  completedSets: {},
  isPaused: false,

  startWorkout: (routine) => set({
    isActive: true,
    activeRoutine: routine,
    elapsedSeconds: 0,
    currentExerciseIndex: 0,
    completedSets: {},
    isPaused: false,
  }),

  pauseWorkout: () => set({ isPaused: true }),
  
  resumeWorkout: () => set({ isPaused: false }),
  
  endWorkout: () => set({
    isActive: false,
    activeRoutine: null,
    elapsedSeconds: 0,
    currentExerciseIndex: 0,
    completedSets: {},
    isPaused: false,
  }),

  tickTimer: () => {
    const { isActive, isPaused } = get();
    if (isActive && !isPaused) {
      set((state) => ({ elapsedSeconds: state.elapsedSeconds + 1 }));
    }
  },

  nextExercise: () => {
    const { currentExerciseIndex, activeRoutine } = get();
    if (activeRoutine && currentExerciseIndex < activeRoutine.exercises.length - 1) {
      set({ currentExerciseIndex: currentExerciseIndex + 1 });
    }
  },

  prevExercise: () => {
    const { currentExerciseIndex } = get();
    if (currentExerciseIndex > 0) {
      set({ currentExerciseIndex: currentExerciseIndex - 1 });
    }
  },

  completeSet: (exerciseId) => {
    set((state) => {
      const currentCount = state.completedSets[exerciseId] || 0;
      return {
        completedSets: {
          ...state.completedSets,
          [exerciseId]: currentCount + 1,
        }
      };
    });
  },

  updateExerciseWeight: (index, weight) => {
    set((state) => {
      if (!state.activeRoutine) return state;
      const newExercises = [...state.activeRoutine.exercises];
      if (newExercises[index]) {
        newExercises[index] = { ...newExercises[index], weight };
      }
      return {
        activeRoutine: {
          ...state.activeRoutine,
          exercises: newExercises
        }
      };
    });
  }
}));
