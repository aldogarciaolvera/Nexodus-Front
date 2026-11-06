import { create } from 'zustand';
import { 
  Routine, 
  WorkoutSessionDto, 
  WorkoutSetDto, 
  SetType, 
  gymService 
} from '../services/gym.service';

export interface RestTimerState {
  isRunning: boolean;
  targetSeconds: number;
  remainingSeconds: number;
}

interface WorkoutState {
  isActive: boolean;
  isPaused: boolean;
  session: WorkoutSessionDto | null;
  activeRoutine: Routine | null;
  elapsedSeconds: number;
  currentExerciseIndex: number;
  completedSets: Record<string, number>; // exerciseId -> count
  restTimer: RestTimerState;
  
  // Core Actions
  initFromBackend: () => Promise<void>;
  startWorkout: (routine?: Routine, name?: string) => Promise<WorkoutSessionDto | null>;
  pauseWorkout: () => void;
  resumeWorkout: () => void;
  endWorkout: () => void;
  cancelWorkout: () => Promise<void>;
  finishWorkout: (notes?: string) => Promise<WorkoutSessionDto | null>;
  tickTimer: () => void;
  nextExercise: () => void;
  prevExercise: () => void;
  setExerciseIndex: (index: number) => void;
  
  // Set Management
  logSet: (data: {
    setId?: string;
    exerciseId: string;
    setOrder: number;
    type?: SetType;
    weightKg: number;
    reps: number;
    rpe?: number;
    isCompleted?: boolean;
    durationSeconds?: number;
  }) => Promise<WorkoutSetDto | null>;
  deleteSet: (setId: string) => Promise<void>;
  completeSet: (exerciseId: string) => void;
  updateExerciseWeight: (index: number, weight: number) => void;
  
  // Rest Timer
  startRestTimer: (seconds: number) => void;
  stopRestTimer: () => void;
  tickRestTimer: () => void;
  addRestTime: (seconds: number) => void;
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  isActive: false,
  isPaused: false,
  session: null,
  activeRoutine: null,
  elapsedSeconds: 0,
  currentExerciseIndex: 0,
  completedSets: {},
  restTimer: {
    isRunning: false,
    targetSeconds: 90,
    remainingSeconds: 90,
  },

  initFromBackend: async () => {
    try {
      const activeSession = await gymService.getActiveWorkoutSession();
      if (activeSession && activeSession.isActive) {
        let routine: Routine | null = null;
        if (activeSession.routineId) {
          try {
            routine = await gymService.getRoutineById(activeSession.routineId);
          } catch {
            // Silently fallback if routine cannot be fetched
          }
        }

        // Calculate elapsed seconds from startTime
        const startMs = new Date(activeSession.startTime).getTime();
        const nowMs = Date.now();
        const elapsed = Math.max(0, Math.floor((nowMs - startMs) / 1000));

        // Reconstruct completed sets mapping
        const completedMap: Record<string, number> = {};
        for (const s of activeSession.sets || []) {
          if (s.isCompleted) {
            completedMap[s.exerciseId] = (completedMap[s.exerciseId] || 0) + 1;
          }
        }

        set({
          isActive: true,
          isPaused: false,
          session: activeSession,
          activeRoutine: routine,
          elapsedSeconds: elapsed,
          currentExerciseIndex: 0,
          completedSets: completedMap,
        });
      }
    } catch {
      // Backend unavailable or user offline
    }
  },

  startWorkout: async (routine, name) => {
    try {
      const sessionName = name || routine?.name || 'Entrenamiento Libre';
      const createdSession = await gymService.startWorkoutSession({
        routineId: routine?.id,
        name: sessionName,
      });

      // Count completed sets if re-using an existing session
      const completedMap: Record<string, number> = {};
      for (const s of createdSession.sets || []) {
        if (s.isCompleted) {
          completedMap[s.exerciseId] = (completedMap[s.exerciseId] || 0) + 1;
        }
      }

      set({
        isActive: true,
        isPaused: false,
        session: createdSession,
        activeRoutine: routine || null,
        elapsedSeconds: createdSession.durationSeconds || 0,
        currentExerciseIndex: 0,
        completedSets: completedMap,
        restTimer: { isRunning: false, targetSeconds: 90, remainingSeconds: 90 },
      });

      return createdSession;
    } catch (err) {
      console.error('Failed to start workout session on backend:', err);
      // Fallback local start
      set({
        isActive: true,
        isPaused: false,
        session: null,
        activeRoutine: routine || null,
        elapsedSeconds: 0,
        currentExerciseIndex: 0,
        completedSets: {},
      });
      return null;
    }
  },

  pauseWorkout: () => set({ isPaused: true }),
  
  resumeWorkout: () => set({ isPaused: false }),
  
  endWorkout: () => set({
    isActive: false,
    isPaused: false,
    session: null,
    activeRoutine: null,
    elapsedSeconds: 0,
    currentExerciseIndex: 0,
    completedSets: {},
    restTimer: { isRunning: false, targetSeconds: 90, remainingSeconds: 90 },
  }),

  cancelWorkout: async () => {
    const { session } = get();
    if (session?.id) {
      try {
        await gymService.cancelWorkoutSession(session.id);
      } catch (err) {
        console.error('Failed to cancel workout on backend:', err);
      }
    }
    get().endWorkout();
  },

  finishWorkout: async (notes) => {
    const { session } = get();
    if (!session?.id) {
      get().endWorkout();
      return null;
    }

    try {
      const finished = await gymService.finishWorkoutSession(session.id, { notes });
      get().endWorkout();
      return finished;
    } catch (err) {
      console.error('Failed to finish workout on backend:', err);
      throw err;
    }
  },

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

  setExerciseIndex: (index: number) => {
    set({ currentExerciseIndex: index });
  },

  logSet: async (data) => {
    const { session, completedSets } = get();
    if (!session?.id) return null;

    try {
      const logged = await gymService.logWorkoutSet(session.id, {
        setId: data.setId,
        exerciseId: data.exerciseId,
        setOrder: data.setOrder,
        type: data.type || 'Normal',
        weightKg: data.weightKg,
        reps: data.reps,
        rpe: data.rpe,
        durationSeconds: data.durationSeconds,
        isCompleted: data.isCompleted ?? true,
      });

      // Update session sets in store
      set((state) => {
        if (!state.session) return state;
        const existingSets = state.session.sets || [];
        const index = existingSets.findIndex(s => s.id === logged.id || (data.setId && s.id === data.setId));

        let updatedSets: WorkoutSetDto[];
        if (index >= 0) {
          updatedSets = [...existingSets];
          updatedSets[index] = logged;
        } else {
          updatedSets = [...existingSets, logged];
        }

        // Update completed sets count
        const newCompletedMap = { ...state.completedSets };
        const completedCount = updatedSets.filter(s => s.exerciseId === data.exerciseId && s.isCompleted).length;
        newCompletedMap[data.exerciseId] = completedCount;

        return {
          session: {
            ...state.session,
            sets: updatedSets,
          },
          completedSets: newCompletedMap,
        };
      });

      return logged;
    } catch (err) {
      console.error('Failed to log set to backend:', err);
      throw err;
    }
  },

  deleteSet: async (setId) => {
    const { session } = get();
    if (!session?.id) return;

    try {
      await gymService.deleteWorkoutSet(session.id, setId);

      set((state) => {
        if (!state.session) return state;
        const updatedSets = (state.session.sets || []).filter(s => s.id !== setId);
        
        // Recalculate completed count
        const newCompletedMap: Record<string, number> = {};
        for (const s of updatedSets) {
          if (s.isCompleted) {
            newCompletedMap[s.exerciseId] = (newCompletedMap[s.exerciseId] || 0) + 1;
          }
        }

        return {
          session: {
            ...state.session,
            sets: updatedSets,
          },
          completedSets: newCompletedMap,
        };
      });
    } catch (err) {
      console.error('Failed to delete set from backend:', err);
      throw err;
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
  },

  // Rest Timer Controls
  startRestTimer: (seconds) => {
    set({
      restTimer: {
        isRunning: true,
        targetSeconds: seconds,
        remainingSeconds: seconds,
      }
    });
  },

  stopRestTimer: () => {
    set((state) => ({
      restTimer: {
        ...state.restTimer,
        isRunning: false,
        remainingSeconds: 0,
      }
    }));
  },

  tickRestTimer: () => {
    const { restTimer } = get();
    if (restTimer.isRunning && restTimer.remainingSeconds > 0) {
      const nextRemaining = restTimer.remainingSeconds - 1;
      set({
        restTimer: {
          ...restTimer,
          remainingSeconds: nextRemaining,
          isRunning: nextRemaining > 0,
        }
      });
    }
  },

  addRestTime: (seconds) => {
    set((state) => ({
      restTimer: {
        ...state.restTimer,
        remainingSeconds: Math.max(0, state.restTimer.remainingSeconds + seconds),
        targetSeconds: Math.max(state.restTimer.targetSeconds, state.restTimer.remainingSeconds + seconds),
        isRunning: true,
      }
    }));
  },
}));
