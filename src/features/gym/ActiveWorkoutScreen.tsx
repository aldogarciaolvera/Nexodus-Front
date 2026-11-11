import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../utils/ThemeContext';
import { ThemeColors } from '../../utils/theme';
import { useWorkoutStore } from '../../store/workoutStore';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ChevronLeft,
  ChevronRight,
  Disc,
  Plus,
  Trophy,
  Eye,
  EyeOff,
} from 'lucide-react-native';
import { Image } from 'expo-image';
import { useAlertStore } from '../../store/alertStore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { gymService, SetType, WorkoutSetDto } from '../../services/gym.service';
import { RootStackParamList } from '../../utils/navigation';
import { queryKeys } from '../../services/queryKeys';
import { translateBodyPart, translateMuscle } from '../../utils/gymTranslations';
import { SetRowItem } from './components/SetRowItem';
import { RestTimerOverlay } from './components/RestTimerOverlay';
import { PlateCalculatorModal } from './components/PlateCalculatorModal';
import { WorkoutSummaryModal } from './components/WorkoutSummaryModal';
import { ExitWorkoutModal } from './components/ExitWorkoutModal';
import { Skeleton } from '../../components/Skeleton';

const WorkoutTimer = React.memo(({ style }: { style: any }) => {
  const elapsedSeconds = useWorkoutStore((state) => state.elapsedSeconds);
  const hrs = Math.floor(elapsedSeconds / 3600);
  const mins = Math.floor((elapsedSeconds % 3600) / 60);
  const secs = elapsedSeconds % 60;
  const formatted = hrs > 0
    ? `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    : `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  return <Text style={style}>{formatted}</Text>;
});

export const ActiveWorkoutScreen = () => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();

  const {
    isActive,
    isPaused,
    session,
    activeRoutine,
    currentExerciseIndex,
    elapsedSeconds,
    tickTimer,
    pauseWorkout,
    resumeWorkout,
    nextExercise,
    prevExercise,
    setExerciseIndex,
    logSet,
    deleteSet,
    finishWorkout,
    cancelWorkout,
    startRestTimer,
  } = useWorkoutStore();

  const [showPlateCalculator, setShowPlateCalculator] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [showGif, setShowGif] = useState(false);

  // Auto-resume timer when entering or focusing the screen
  useEffect(() => {
    if (isActive && isPaused) {
      resumeWorkout();
    }
  }, [isActive, isPaused, resumeWorkout]);

  // Tick main session timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isActive && !isPaused) {
      interval = setInterval(() => {
        tickTimer();
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, isPaused, tickTimer]);

  const exercises = activeRoutine?.exercises || [];
  const currentRoutineExercise = exercises[currentExerciseIndex];

  // Fetch full exercise details (GIF, instructions, muscle)
  const { data: fullExerciseData, isLoading: isLoadingExercise } = useQuery({
    queryKey: queryKeys.gym.exercise(currentRoutineExercise?.exerciseId),
    queryFn: () => gymService.getExerciseById(currentRoutineExercise!.exerciseId),
    enabled: !!currentRoutineExercise?.exerciseId,
  });

  // Fetch exercise personal records
  const { data: exerciseRecords } = useQuery({
    queryKey: queryKeys.gym.exerciseRecords(currentRoutineExercise?.exerciseId),
    queryFn: () => gymService.getExerciseRecords(currentRoutineExercise!.exerciseId),
    enabled: !!currentRoutineExercise?.exerciseId,
  });

  const displayExercise = fullExerciseData || currentRoutineExercise?.exercise;

  // Determine if the exercise is performed with a barbell to conditionally show plate calculator
  const isBarbellExercise = useMemo(() => {
    if (!displayExercise) return false;
    const eq = (displayExercise.equipment || '').toLowerCase();
    const name = (displayExercise.name || '').toLowerCase();

    // Explicit non-barbell equipment
    if (
      eq.includes('kettlebell') || name.includes('kettlebell') ||
      eq.includes('dumbbell') || name.includes('mancuerna') || name.includes('dumbbell') ||
      eq.includes('body weight') || eq.includes('bodyweight') || eq.includes('peso corporal') ||
      eq.includes('cable') || eq.includes('polea') ||
      eq.includes('band') || eq.includes('liga') ||
      eq.includes('machine') || eq.includes('máquina') || eq.includes('maquina')
    ) {
      return false;
    }

    // Barbell keywords
    return (
      eq.includes('barbell') ||
      eq.includes('barra') ||
      eq.includes('smith') ||
      eq.includes('olympic') ||
      name.includes('barbell') ||
      name.includes('barra') ||
      name.includes('press banca') ||
      name.includes('press de banca') ||
      name.includes('bench press') ||
      name.includes('squat') ||
      name.includes('sentadilla') ||
      name.includes('deadlift') ||
      name.includes('peso muerto') ||
      name.includes('clean') ||
      name.includes('snatch')
    );
  }, [displayExercise]);

  // Current exercise sets in active session
  const currentExerciseSets = useMemo(() => {
    if (!currentRoutineExercise) return [];
    const exerciseId = currentRoutineExercise.exerciseId;
    const sessionSets = (session?.sets || [])
      .filter((s) => s.exerciseId === exerciseId)
      .sort((a, b) => a.setOrder - b.setOrder);

    if (sessionSets.length > 0) {
      return sessionSets;
    }

    // Default template sets based on routine exercise count
    const targetCount = currentRoutineExercise.sets || 3;
    const defaultSets: Partial<WorkoutSetDto>[] = [];
    for (let i = 1; i <= targetCount; i++) {
      defaultSets.push({
        setOrder: i,
        type: 'Normal',
        weightKg: currentRoutineExercise.weight || 0,
        reps: currentRoutineExercise.reps || 10,
        isCompleted: false,
      });
    }
    return defaultSets as WorkoutSetDto[];
  }, [session?.sets, currentRoutineExercise]);

  if (!isActive) {
    return null;
  }

  const handleGoBack = () => {
    pauseWorkout();
    setShowExitModal(true);
  };

  const handleSaveSet = async (setData: {
    setId?: string;
    setOrder: number;
    type: SetType;
    weightKg: number;
    reps: number;
    rpe?: number;
    isCompleted: boolean;
  }) => {
    if (!currentRoutineExercise) return;

    try {
      await logSet({
        setId: setData.setId,
        exerciseId: currentRoutineExercise.exerciseId,
        setOrder: setData.setOrder,
        type: setData.type,
        weightKg: setData.weightKg,
        reps: setData.reps,
        rpe: setData.rpe,
        isCompleted: setData.isCompleted,
      });
    } catch {
      useAlertStore.getState().showAlert('Error', 'No se pudo guardar la serie en el servidor.', 'error');
    }
  };

  const handleToggleComplete = (isCompleted: boolean) => {
    if (isCompleted) {
      const restSeconds = currentRoutineExercise?.restTimeInSeconds || 90;
      startRestTimer(restSeconds);
    }
  };

  const handleAddSet = () => {
    if (!currentRoutineExercise) return;
    const nextOrder = currentExerciseSets.length + 1;
    const lastSet = currentExerciseSets[currentExerciseSets.length - 1];

    handleSaveSet({
      setOrder: nextOrder,
      type: 'Normal',
      weightKg: lastSet?.weightKg || currentRoutineExercise.weight || 0,
      reps: lastSet?.reps || currentRoutineExercise.reps || 10,
      isCompleted: false,
    });
  };

  const handleDeleteSet = async (setId?: string) => {
    if (!setId) return;
    try {
      await deleteSet(setId);
    } catch {
      useAlertStore.getState().showAlert('Error', 'No se pudo eliminar la serie.', 'error');
    }
  };

  const handleOpenFinishModal = () => {
    pauseWorkout();
    setShowSummaryModal(true);
  };

  const handleConfirmFinish = async (notes: string) => {
    setIsFinishing(true);
    try {
      await finishWorkout(notes);
      queryClient.invalidateQueries({ queryKey: queryKeys.gym.workouts });
      queryClient.invalidateQueries({ queryKey: queryKeys.gym.sessions });
      queryClient.invalidateQueries({ queryKey: queryKeys.gym.muscleRecovery });
      setShowSummaryModal(false);
      navigation.navigate('MainTabs', { screen: 'Fit', params: { initialTab: 'gym' } });
      useAlertStore.getState().showAlert('¡Excelente Sesión!', 'Tu entrenamiento ha sido guardado y se ha otorgado tu NXP.', 'success');
    } catch {
      useAlertStore.getState().showAlert('Error', 'Ocurrió un problema al finalizar la sesión.', 'error');
    } finally {
      setIsFinishing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top HUD Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerIconBtn}
          onPress={handleGoBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft color={theme.colors.slate300} size={24} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <WorkoutTimer style={styles.headerTimer} />
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {session?.name || activeRoutine?.name || 'Entrenamiento'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.finishBtnHeader}
          onPress={handleOpenFinishModal}
          activeOpacity={0.8}
        >
          <Text style={styles.finishBtnHeaderText}>Finalizar</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Exercise Dots Carousel Indicator */}
          {exercises.length > 0 ? (
            <View style={styles.dotsContainer}>
              {exercises.map((_, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => setExerciseIndex(idx)}
                  style={[
                    styles.dot,
                    idx === currentExerciseIndex && styles.dotActive,
                    idx < currentExerciseIndex && styles.dotCompleted,
                  ]}
                />
              ))}
            </View>
          ) : null}

          {/* Exercise Switcher Header */}
          <View style={styles.exerciseNavCard}>
            <View style={styles.exerciseNavTop}>
              <TouchableOpacity
                style={[styles.arrowBtn, currentExerciseIndex === 0 && styles.arrowBtnDisabled]}
                onPress={prevExercise}
                disabled={currentExerciseIndex === 0}
              >
                <ChevronLeft size={20} color={currentExerciseIndex === 0 ? theme.colors.slate700 : theme.colors.neonCyan} />
              </TouchableOpacity>

              <View style={styles.exerciseCounterCol}>
                <Text style={styles.exerciseCounterText}>
                  EJERCICIO {currentExerciseIndex + 1} DE {Math.max(1, exercises.length)}
                </Text>
                {isLoadingExercise ? (
                  <Skeleton width={180} height={24} style={{ marginTop: 4 }} />
                ) : (
                  <Text style={styles.exerciseNameText}>
                    {displayExercise?.name || 'Ejercicio'}
                  </Text>
                )}
              </View>

              <TouchableOpacity
                style={[
                  styles.arrowBtn,
                  currentExerciseIndex === exercises.length - 1 && styles.arrowBtnDisabled,
                ]}
                onPress={nextExercise}
                disabled={currentExerciseIndex === exercises.length - 1}
              >
                <ChevronRight
                  size={20}
                  color={
                    currentExerciseIndex === exercises.length - 1
                      ? theme.colors.slate700
                      : theme.colors.neonCyan
                  }
                />
              </TouchableOpacity>
            </View>

            {/* Muscle and Equipment Badges */}
            <View style={styles.badgesRow}>
              {displayExercise?.bodyPart ? (
                <View style={styles.badgePill}>
                  <Text style={styles.badgePillText}>
                    {translateBodyPart(displayExercise.bodyPart)}
                  </Text>
                </View>
              ) : null}

              {displayExercise?.muscle ? (
                <View style={[styles.badgePill, styles.musclePill]}>
                  <Text style={[styles.badgePillText, { color: theme.colors.slate300 }]}>
                    {translateMuscle(displayExercise.muscle)}
                  </Text>
                </View>
              ) : null}

              {/* Personal Record Tag */}
              {exerciseRecords && exerciseRecords.maxWeightKg > 0 ? (
                <View style={styles.prBadge}>
                  <Trophy size={11} color={theme.colors.warning} />
                  <Text style={styles.prBadgeText}>
                    PR {exerciseRecords.maxWeightKg}kg ({Math.round(exerciseRecords.bestCalculatedOneRepMax)}kg 1RM)
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Quick Actions Row: Plate Calculator (Barbell only) + Demo Video Toggle */}
            <View style={styles.toolsRow}>
              {isBarbellExercise ? (
                <TouchableOpacity
                  style={styles.toolBtn}
                  onPress={() => setShowPlateCalculator(true)}
                >
                  <Disc size={14} color={theme.colors.neonCyan} />
                  <Text style={styles.toolBtnText}>Calculadora de Discos</Text>
                </TouchableOpacity>
              ) : null}

              {(displayExercise?.gifUrl || displayExercise?.thumbUrl) ? (
                <TouchableOpacity
                  style={styles.toolBtn}
                  onPress={() => setShowGif(!showGif)}
                >
                  {showGif ? (
                    <EyeOff size={14} color={theme.colors.slate400} />
                  ) : (
                    <Eye size={14} color={theme.colors.slate400} />
                  )}
                  <Text style={[styles.toolBtnText, { color: theme.colors.slate400 }]}>
                    {showGif ? 'Ocultar GIF' : 'Ver Técnica'}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Collapsible GIF Demonstration */}
            {showGif && (displayExercise?.gifUrl || displayExercise?.thumbUrl) ? (
              <View style={styles.gifPreview}>
                <Image
                  source={{ uri: displayExercise?.gifUrl || displayExercise?.thumbUrl }}
                  style={styles.gifImage}
                  contentFit="contain"
                />
              </View>
            ) : null}
          </View>

          {/* Sets Table */}
          <View style={styles.tableCard}>
            <View style={styles.tableHeader}>
              <Text style={[styles.thText, { width: 26, textAlign: 'center' }]}>SET</Text>
              <Text style={[styles.thText, { width: 34, textAlign: 'center' }]}>TIPO</Text>
              <Text style={[styles.thText, { flex: 1, textAlign: 'center' }]}>PREV</Text>
              <Text style={[styles.thText, { width: 60, textAlign: 'center' }]}>KG</Text>
              <Text style={[styles.thText, { width: 52, textAlign: 'center' }]}>REPS</Text>
              <Text style={[styles.thText, { width: 32, textAlign: 'center' }]}>✓</Text>
              <View style={{ width: 26 }} />
            </View>

            {currentExerciseSets.map((set, idx) => (
              <SetRowItem
                key={set.id || idx}
                setOrder={idx + 1}
                initialSet={set}
                previousRecord={
                  exerciseRecords && exerciseRecords.maxWeightKg > 0
                    ? `${exerciseRecords.maxWeightKg}kg × ${exerciseRecords.maxReps}`
                    : undefined
                }
                onSaveSet={handleSaveSet}
                onDeleteSet={handleDeleteSet}
                onToggleComplete={handleToggleComplete}
              />
            ))}

            {/* Add Set Button */}
            <TouchableOpacity
              style={styles.addSetBtn}
              activeOpacity={0.7}
              onPress={handleAddSet}
            >
              <Plus size={16} color={theme.colors.neonCyan} />
              <Text style={styles.addSetBtnText}>Añadir Serie</Text>
            </TouchableOpacity>

            {/* Fixed Series Type Legend */}
            <View style={styles.legendContainer}>
              <View style={styles.legendItem}>
                <View style={[styles.legendBadge, { backgroundColor: 'rgba(56, 189, 248, 0.15)', borderColor: '#38BDF8' }]}>
                  <Text style={[styles.legendBadgeText, { color: '#38BDF8' }]}>N</Text>
                </View>
                <Text style={styles.legendText}>Normal</Text>
              </View>

              <View style={styles.legendItem}>
                <View style={[styles.legendBadge, { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: '#F59E0B' }]}>
                  <Text style={[styles.legendBadgeText, { color: '#F59E0B' }]}>W</Text>
                </View>
                <Text style={styles.legendText}>Warmup</Text>
              </View>

              <View style={styles.legendItem}>
                <View style={[styles.legendBadge, { backgroundColor: 'rgba(168, 85, 247, 0.15)', borderColor: '#A855F7' }]}>
                  <Text style={[styles.legendBadgeText, { color: '#A855F7' }]}>D</Text>
                </View>
                <Text style={styles.legendText}>Drop</Text>
              </View>

              <View style={styles.legendItem}>
                <View style={[styles.legendBadge, { backgroundColor: 'rgba(255, 51, 102, 0.15)', borderColor: '#FF3366' }]}>
                  <Text style={[styles.legendBadgeText, { color: '#FF3366' }]}>F</Text>
                </View>
                <Text style={styles.legendText}>Fallo</Text>
              </View>

              <View style={styles.legendItem}>
                <View style={[styles.legendBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: '#10B981' }]}>
                  <Text style={[styles.legendBadgeText, { color: '#10B981' }]}>T</Text>
                </View>
                <Text style={styles.legendText}>Tiempo</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Floating Rest Timer Overlay */}
      <RestTimerOverlay />

      {/* Plate Calculator Modal */}
      <PlateCalculatorModal
        visible={showPlateCalculator}
        initialWeight={currentExerciseSets[0]?.weightKg || 60}
        onClose={() => setShowPlateCalculator(false)}
      />

      {/* Workout Summary Finish Modal */}
      <WorkoutSummaryModal
        visible={showSummaryModal}
        session={session}
        elapsedSeconds={elapsedSeconds}
        isLoading={isFinishing}
        onConfirmFinish={handleConfirmFinish}
        onCancel={() => {
          setShowSummaryModal(false);
          resumeWorkout();
        }}
      />

      {/* Exit Workout Confirmation Modal */}
      <ExitWorkoutModal
        visible={showExitModal}
        onClose={() => {
          setShowExitModal(false);
          resumeWorkout();
        }}
        onPauseAndExit={() => {
          setShowExitModal(false);
          navigation.goBack();
        }}
        onConfirmDiscard={async () => {
          await cancelWorkout();
          setShowExitModal(false);
          navigation.goBack();
          useAlertStore.getState().showAlert('Sesión Descartada', 'El entrenamiento ha sido descartado y eliminado de la base de datos.', 'info');
        }}
      />
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.obsidian,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderGlow,
      backgroundColor: colors.surface,
    },
    headerIconBtn: {
      padding: 6,
    },
    headerCenter: {
      alignItems: 'center',
    },
    headerTimer: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 20,
      color: colors.neonCyan,
      fontWeight: '700',
    },
    headerSubtitle: {
      fontFamily: 'Geist_400Regular',
      fontSize: 11,
      color: colors.mutedText,
      maxWidth: 180,
    },
    finishBtnHeader: {
      backgroundColor: 'rgba(56, 189, 248, 0.15)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.neonCyan,
    },
    finishBtnHeaderText: {
      fontFamily: 'Geist_700Bold',
      fontSize: 12,
      color: colors.neonCyan,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 120,
    },
    dotsContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 6,
      marginBottom: 16,
    },
    dot: {
      flex: 1,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.surfaceLight,
      maxWidth: 32,
    },
    dotActive: {
      backgroundColor: colors.neonCyan,
    },
    dotCompleted: {
      backgroundColor: colors.success,
    },
    exerciseNavCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      padding: 16,
      marginBottom: 16,
    },
    exerciseNavTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    arrowBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surfaceLight,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      alignItems: 'center',
      justifyContent: 'center',
    },
    arrowBtnDisabled: {
      opacity: 0.4,
    },
    exerciseCounterCol: {
      flex: 1,
      alignItems: 'center',
      paddingHorizontal: 8,
    },
    exerciseCounterText: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 10,
      color: colors.slate400,
      letterSpacing: 0.5,
    },
    exerciseNameText: {
      fontFamily: 'Geist_700Bold',
      fontSize: 18,
      color: colors.text,
      textAlign: 'center',
      marginTop: 2,
    },
    badgesRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 8,
      marginTop: 12,
    },
    badgePill: {
      backgroundColor: 'rgba(56, 189, 248, 0.12)',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: 'rgba(56, 189, 248, 0.3)',
    },
    badgePillText: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 10,
      color: colors.neonCyan,
    },
    musclePill: {
      backgroundColor: colors.surfaceLight,
      borderColor: colors.borderGlow,
    },
    prBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'rgba(251, 191, 36, 0.12)',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: 'rgba(251, 191, 36, 0.3)',
    },
    prBadgeText: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 10,
      color: colors.warning,
    },
    toolsRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 12,
      marginTop: 14,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.borderGlow,
    },
    toolBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.surfaceLight,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.borderGlow,
    },
    toolBtnText: {
      fontFamily: 'Geist_500Medium',
      fontSize: 12,
      color: colors.neonCyan,
    },
    gifPreview: {
      width: '100%',
      height: 200,
      borderRadius: 12,
      backgroundColor: colors.white,
      marginTop: 14,
      overflow: 'hidden',
    },
    gifImage: {
      width: '100%',
      height: '100%',
    },
    tableCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      padding: 12,
      marginBottom: 20,
    },
    tableHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderGlow,
      marginBottom: 8,
    },
    thText: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 10,
      color: colors.slate400,
      letterSpacing: 0.5,
    },
    addSetBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 12,
      backgroundColor: colors.surfaceLight,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      marginTop: 6,
    },
    addSetBtnText: {
      fontFamily: 'Geist_500Medium',
      fontSize: 13,
      color: colors.neonCyan,
    },
    legendContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 12,
      marginTop: 10,
      borderTopWidth: 1,
      borderTopColor: colors.borderGlow,
      paddingHorizontal: 4,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    legendBadge: {
      width: 18,
      height: 18,
      borderRadius: 5,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    legendBadgeText: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 9,
      fontWeight: '700',
    },
    legendText: {
      fontFamily: 'Geist_500Medium',
      fontSize: 10,
      color: colors.slate400,
    },
  });
