import { create } from 'zustand';
import { AppState, AppStateStatus } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { 
  Routine, 
  WorkoutSessionDto, 
  WorkoutSetDto, 
  SetType, 
  gymService 
} from '../services/gym.service';

const STORE_KEY_WORKOUT_PERSIST = 'nexodus_workout_session_persist';

interface PersistedWorkoutState {
  sessionId?: string;
  isActive: boolean;
  isPaused: boolean;
  elapsedSeconds: number;
  workoutStartMs: number;
  totalPausedMs: number;
  pauseStartMs: number | null;
  activeRoutineId?: string;
}

async function saveWorkoutStateToStorage(state: Partial<PersistedWorkoutState>) {
  try {
    if (!state.isActive) {
      await SecureStore.deleteItemAsync(STORE_KEY_WORKOUT_PERSIST);
    } else {
      await SecureStore.setItemAsync(STORE_KEY_WORKOUT_PERSIST, JSON.stringify(state));
    }
  } catch {
    // Ignore storage errors safely
  }
}

async function loadWorkoutStateFromStorage(): Promise<PersistedWorkoutState | null> {
  try {
    const raw = await SecureStore.getItemAsync(STORE_KEY_WORKOUT_PERSIST);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

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
  lastBackendSync: number;

  // Wall-Clock Timestamps for zero-drift, multi-instance-safe timing
  workoutStartMs: number;
  totalPausedMs: number;
  pauseStartMs: number | null;
  restEndTimeMs: number;
  
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

// Module-level singletons to ensure ONLY ONE timer runs globally
let timerInterval: ReturnType<typeof setInterval> | null = null;
let appStateSubscription: { remove: () => void } | null = null;
let wasAutoPausedByBackground = false;

function ensureTimerRunning() {
  if (!timerInterval) {
    timerInterval = setInterval(() => {
      const state = useWorkoutStore.getState();
      const shouldRunSession = state.isActive && !state.isPaused;
      const shouldRunRest = state.restTimer.isRunning;

      if (!shouldRunSession && !shouldRunRest) {
        stopTimerInterval();
        return;
      }

      if (shouldRunSession) {
        state.tickTimer();
      }
      if (shouldRunRest) {
        state.tickRestTimer();
      }
    }, 500);
  }

  if (!appStateSubscription) {
    appStateSubscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      const state = useWorkoutStore.getState();
      if (nextState === 'background' || nextState === 'inactive') {
        // Automatically pause workout when app is closed, minimized or sent to background
        if (state.isActive && !state.isPaused) {
          wasAutoPausedByBackground = true;
          state.pauseWorkout();
        }
      } else if (nextState === 'active') {
        // Automatically resume workout only if it was paused by backgrounding
        if (state.isActive) {
          if (state.isPaused && wasAutoPausedByBackground) {
            wasAutoPausedByBackground = false;
            state.resumeWorkout();
          } else if (!state.isPaused) {
            state.tickTimer();
            ensureTimerRunning();
          }
        }
        if (state.restTimer.isRunning) {
          state.tickRestTimer();
        }
      }
    });
  }
}

function stopTimerInterval() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function stopTimerIfIdle() {
  const state = useWorkoutStore.getState();
  const shouldRunSession = state.isActive && !state.isPaused;
  const shouldRunRest = state.restTimer.isRunning;
  if (!shouldRunSession && !shouldRunRest) {
    stopTimerInterval();
  }
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
  lastBackendSync: 0,
  workoutStartMs: 0,
  totalPausedMs: 0,
  pauseStartMs: null,
  restEndTimeMs: 0,

  initFromBackend: async () => {
    const { lastBackendSync, isActive } = get();
    // Cache de 2 minutos para evitar consultas repetitivas si ya está activo en memoria
    if (Date.now() - lastBackendSync < 120000 && isActive) {
      return;
    }
    set({ lastBackendSync: Date.now() });

    try {
      const localState = await loadWorkoutStateFromStorage();
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

        // Reconstruct completed sets mapping
        const completedMap: Record<string, number> = {};
        for (const s of activeSession.sets || []) {
          if (s.isCompleted) {
            completedMap[s.exerciseId] = (completedMap[s.exerciseId] || 0) + 1;
          }
        }

        const nowMs = Date.now();
        let isPaused = false;
        let elapsed = 0;
        let effectiveStartMs = nowMs;
        let totalPausedMs = 0;
        let pauseStartMs: number | null = null;

        if (localState && localState.isActive && localState.sessionId === activeSession.id) {
          // Restaurar exactamente el estado local persistido (duración congelada y si estaba pausado)
          isPaused = localState.isPaused;
          elapsed = localState.elapsedSeconds;
          totalPausedMs = localState.totalPausedMs || 0;
          pauseStartMs = localState.pauseStartMs || (isPaused ? nowMs : null);
          effectiveStartMs = localState.workoutStartMs || (nowMs - elapsed * 1000);
        } else {
          // Sesión backend sin persistencia local previa
          const durationSec = activeSession.durationSeconds || 0;
          const startMs = activeSession.startTime ? new Date(activeSession.startTime).getTime() : nowMs;
          const diffHours = (nowMs - startMs) / (1000 * 3600);

          if (durationSec > 0) {
            elapsed = durationSec;
            isPaused = true;
          } else if (diffHours > 4) {
            // Si la sesión fue creada hace más de 4 horas sin registrar duración, pausar de inmediato con 0
            elapsed = 0;
            isPaused = true;
          } else {
            elapsed = Math.max(0, Math.floor((nowMs - startMs) / 1000));
          }
          effectiveStartMs = nowMs - elapsed * 1000;
        }

        set({
          isActive: true,
          isPaused,
          session: activeSession,
          activeRoutine: routine,
          elapsedSeconds: elapsed,
          currentExerciseIndex: 0,
          completedSets: completedMap,
          workoutStartMs: effectiveStartMs,
          totalPausedMs,
          pauseStartMs,
          restEndTimeMs: 0,
        });

        if (!isPaused) {
          ensureTimerRunning();
        } else {
          stopTimerIfIdle();
        }
      } else {
        await saveWorkoutStateToStorage({ isActive: false });
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

      const initialDuration = createdSession.durationSeconds || 0;
      const now = Date.now();
      const sessionStartMs = createdSession.startTime ? new Date(createdSession.startTime).getTime() : now;
      const effectiveStartMs = initialDuration > 0 ? now - initialDuration * 1000 : sessionStartMs;

      set({
        isActive: true,
        isPaused: false,
        session: createdSession,
        activeRoutine: routine || null,
        elapsedSeconds: initialDuration,
        currentExerciseIndex: 0,
        completedSets: completedMap,
        restTimer: { isRunning: false, targetSeconds: 90, remainingSeconds: 90 },
        workoutStartMs: effectiveStartMs,
        totalPausedMs: 0,
        pauseStartMs: null,
        restEndTimeMs: 0,
      });

      saveWorkoutStateToStorage({
        sessionId: createdSession.id,
        isActive: true,
        isPaused: false,
        elapsedSeconds: initialDuration,
        workoutStartMs: effectiveStartMs,
        totalPausedMs: 0,
        pauseStartMs: null,
        activeRoutineId: routine?.id,
      });

      ensureTimerRunning();
      return createdSession;
    } catch (err) {
      console.error('Failed to start workout session on backend:', err);
      // Fallback local start
      const now = Date.now();
      set({
        isActive: true,
        isPaused: false,
        session: null,
        activeRoutine: routine || null,
        elapsedSeconds: 0,
        currentExerciseIndex: 0,
        completedSets: {},
        workoutStartMs: now,
        totalPausedMs: 0,
        pauseStartMs: null,
        restEndTimeMs: 0,
      });
      ensureTimerRunning();
      return null;
    }
  },

  pauseWorkout: () => {
    const { isPaused, isActive, session, elapsedSeconds, workoutStartMs, totalPausedMs, activeRoutine } = get();
    if (!isActive || isPaused) return;
    const now = Date.now();
    set({
      isPaused: true,
      pauseStartMs: now,
    });
    stopTimerIfIdle();
    saveWorkoutStateToStorage({
      sessionId: session?.id,
      isActive: true,
      isPaused: true,
      elapsedSeconds,
      workoutStartMs,
      totalPausedMs,
      pauseStartMs: now,
      activeRoutineId: activeRoutine?.id,
    });
  },
  
  resumeWorkout: () => {
    const { isPaused, pauseStartMs, totalPausedMs, isActive, session, elapsedSeconds, workoutStartMs, activeRoutine } = get();
    if (!isActive || !isPaused) return;
    const additionalPaused = pauseStartMs ? Math.max(0, Date.now() - pauseStartMs) : 0;
    const newTotalPausedMs = totalPausedMs + additionalPaused;
    set({
      isPaused: false,
      pauseStartMs: null,
      totalPausedMs: newTotalPausedMs,
    });
    ensureTimerRunning();
    saveWorkoutStateToStorage({
      sessionId: session?.id,
      isActive: true,
      isPaused: false,
      elapsedSeconds,
      workoutStartMs,
      totalPausedMs: newTotalPausedMs,
      pauseStartMs: null,
      activeRoutineId: activeRoutine?.id,
    });
  },
  
  endWorkout: () => {
    stopTimerInterval();
    wasAutoPausedByBackground = false;
    saveWorkoutStateToStorage({ isActive: false });
    if (appStateSubscription) {
      appStateSubscription.remove();
      appStateSubscription = null;
    }
    set({
      isActive: false,
      isPaused: false,
      session: null,
      activeRoutine: null,
      elapsedSeconds: 0,
      currentExerciseIndex: 0,
      completedSets: {},
      workoutStartMs: 0,
      totalPausedMs: 0,
      pauseStartMs: null,
      restEndTimeMs: 0,
      restTimer: { isRunning: false, targetSeconds: 90, remainingSeconds: 90 },
    });
  },

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
    const { isActive, isPaused, workoutStartMs, totalPausedMs, pauseStartMs, elapsedSeconds } = get();
    if (!isActive) return;
    if (isPaused) {
      if (pauseStartMs && workoutStartMs > 0) {
        const pausedElapsedMs = pauseStartMs - workoutStartMs - totalPausedMs;
        const currentSec = Math.max(0, Math.floor(pausedElapsedMs / 1000));
        if (currentSec !== elapsedSeconds) {
          set({ elapsedSeconds: currentSec });
        }
      }
      return;
    }
    if (workoutStartMs <= 0) return;
    const currentElapsedMs = Date.now() - workoutStartMs - totalPausedMs;
    const currentSec = Math.max(0, Math.floor(currentElapsedMs / 1000));
    if (currentSec !== elapsedSeconds) {
      set({ elapsedSeconds: currentSec });
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
        const index = existingSets.findIndex(
          s => s.id === logged.id || 
               (data.setId && s.id === data.setId) || 
               (s.exerciseId === data.exerciseId && s.setOrder === data.setOrder)
        );

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
    const restEndTimeMs = Date.now() + seconds * 1000;
    set({
      restEndTimeMs,
      restTimer: {
        isRunning: true,
        targetSeconds: seconds,
        remainingSeconds: seconds,
      }
    });
    ensureTimerRunning();
  },

  stopRestTimer: () => {
    set((state) => ({
      restEndTimeMs: 0,
      restTimer: {
        ...state.restTimer,
        isRunning: false,
        remainingSeconds: 0,
      }
    }));
    stopTimerIfIdle();
  },

  tickRestTimer: () => {
    const { restTimer, restEndTimeMs } = get();
    if (!restTimer.isRunning) return;

    const diffMs = restEndTimeMs - Date.now();
    const nextRemaining = Math.max(0, Math.ceil(diffMs / 1000));

    if (nextRemaining <= 0) {
      set({
        restEndTimeMs: 0,
        restTimer: {
          ...restTimer,
          remainingSeconds: 0,
          isRunning: false,
        }
      });
      stopTimerIfIdle();
    } else if (nextRemaining !== restTimer.remainingSeconds) {
      set({
        restTimer: {
          ...restTimer,
          remainingSeconds: nextRemaining,
          isRunning: true,
        }
      });
    }
  },

  addRestTime: (seconds) => {
    const { restTimer, restEndTimeMs } = get();
    const now = Date.now();
    const currentRemaining = restTimer.isRunning && restEndTimeMs > now
      ? Math.ceil((restEndTimeMs - now) / 1000)
      : 0;
    const newRemaining = currentRemaining + seconds;
    const newEndTimeMs = now + newRemaining * 1000;

    set({
      restEndTimeMs: newEndTimeMs,
      restTimer: {
        ...restTimer,
        remainingSeconds: newRemaining,
        targetSeconds: Math.max(restTimer.targetSeconds, newRemaining),
        isRunning: true,
      }
    });
    ensureTimerRunning();
  },
}));
