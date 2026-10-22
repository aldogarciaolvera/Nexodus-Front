import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../utils/ThemeContext';
import { ThemeColors } from '../../utils/theme';
import { useWorkoutStore } from '../../store/workoutStore';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Play, Pause, ChevronLeft, ChevronRight, CheckCircle, X } from 'lucide-react-native';
import { Image } from 'expo-image';
import { useAlertStore, AlertState } from '../../store/alertStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { gymService, RoutineExercise } from '../../services/gym.service';
import { RootStackParamList } from '../../utils/navigation';
import { queryKeys } from '../../services/queryKeys';
import { translateBodyPart, translateMuscle } from '../../utils/gymTranslations';

const WorkoutTimer = React.memo(({ style }: { style: any }) => {
  const elapsedSeconds = useWorkoutStore((state) => state.elapsedSeconds);
  const mins = Math.floor(elapsedSeconds / 60);
  const secs = elapsedSeconds % 60;
  const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  return <Text style={style}>{formatted}</Text>;
});

export const ActiveWorkoutScreen = () => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();
  const showAlert = useAlertStore((state: AlertState) => state.showAlert);
  
  const isActive = useWorkoutStore(state => state.isActive);
  const activeRoutine = useWorkoutStore(state => state.activeRoutine);
  const currentExerciseIndex = useWorkoutStore(state => state.currentExerciseIndex);
  const completedSets = useWorkoutStore(state => state.completedSets);
  const isPaused = useWorkoutStore(state => state.isPaused);
  const tickTimer = useWorkoutStore(state => state.tickTimer);
  const pauseWorkout = useWorkoutStore(state => state.pauseWorkout);
  const resumeWorkout = useWorkoutStore(state => state.resumeWorkout);
  const endWorkout = useWorkoutStore(state => state.endWorkout);
  const nextExercise = useWorkoutStore(state => state.nextExercise);
  const prevExercise = useWorkoutStore(state => state.prevExercise);
  const completeSet = useWorkoutStore(state => state.completeSet);
  const updateExerciseWeight = useWorkoutStore(state => state.updateExerciseWeight);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isActive && !isPaused) {
      interval = setInterval(() => {
        tickTimer();
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, isPaused, tickTimer]);

  const currentExercise = activeRoutine?.exercises?.[currentExerciseIndex];

  const { data: fullExerciseData } = useQuery({
    queryKey: queryKeys.gym.exercise(currentExercise?.exerciseId),
    queryFn: () => gymService.getExerciseById(currentExercise!.exerciseId),
    enabled: !!currentExercise?.exerciseId,
  });

  const mutation = useMutation({
    mutationFn: gymService.createWorkoutLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.gym.workouts });
      showAlert('Éxito', '¡Rutina completada y guardada!', 'success');
    },
    onError: (err) => {
      console.log('Error saving workout:', err);
      showAlert('Error', 'No se pudo guardar el progreso de la rutina.', 'error');
    }
  });

  if (!isActive || !activeRoutine) {
    return null; // Return null instead of a view to prevent UI flashes while navigation resolves
  }

  if (!currentExercise) return (
    <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
      <Text style={{ color: theme.colors.white }}>Esta rutina no tiene ejercicios asignados.</Text>
      <TouchableOpacity onPress={() => { endWorkout(); navigation.goBack(); }} style={{ marginTop: 20, padding: 10, backgroundColor: theme.colors.neonCyan, borderRadius: 8 }}>
        <Text>Volver</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );

  const displayExercise = fullExerciseData || currentExercise.exercise;

  const handleEndWorkout = () => {
    pauseWorkout();
    showAlert({
      title: 'Finalizar',
      message: '¿Estás seguro que deseas terminar la rutina?',
      type: 'info',
      buttons: [
        { text: 'Cancelar', onPress: () => resumeWorkout() },
        { 
          text: 'Finalizar', 
          onPress: () => {
            const currentRoutine = activeRoutine;
            const finalElapsedSeconds = useWorkoutStore.getState().elapsedSeconds;
            
            // First end the workout and navigate to prevent getting stuck
            endWorkout();
            navigation.navigate('MainTabs', { screen: 'Gym' });

            // Calculate total completed exercises (where at least 1 set was done)
            const completedCount = Object.keys(completedSets).filter(exId => completedSets[exId] > 0).length;
            
            // Fire the log mutation
            mutation.mutate({
              routineId: currentRoutine.id,
              durationInSeconds: finalElapsedSeconds,
              completedExercisesCount: completedCount,
              dateCompleted: new Date().toISOString()
            });

            // Update routine to save any weight changes
            gymService.updateRoutine(currentRoutine.id, {
              name: currentRoutine.name,
              description: currentRoutine.description || '',
              difficultyLevel: currentRoutine.difficultyLevel || 'Beginner',
              targetDay: currentRoutine.targetDay,
              exercises: currentRoutine.exercises.map((ex: RoutineExercise) => ({
                exerciseId: ex.exerciseId,
                sets: ex.sets,
                reps: ex.reps,
                weight: ex.weight || 0,
                restTimeInSeconds: ex.restTimeInSeconds
              }))
            }).catch(e => console.error("Error updating routine weights:", e));
          }
        }
      ]
    });
  };

  const handleGoBack = () => {
    pauseWorkout();
    navigation.goBack();
  };

  const exerciseDoneSets = completedSets[currentExercise.exerciseId] || 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerBtn} 
          onPress={handleGoBack}
          accessibilityRole="button"
          accessibilityLabel="Volver al gimnasio"
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ChevronLeft color={theme.colors.white} size={24} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <WorkoutTimer style={styles.headerTimer} />
          <Text style={styles.headerRoutineName}>{activeRoutine.name}</Text>
        </View>
        <TouchableOpacity 
          style={styles.headerBtn} 
          onPress={handleEndWorkout}
          accessibilityRole="button"
          accessibilityLabel="Finalizar entrenamiento"
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <X color={theme.colors.white} size={24} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Progress Dots */}
        <View style={styles.progressContainer}>
          {activeRoutine.exercises.map((_, idx) => (
            <View 
              key={idx} 
              style={[
                styles.progressDot, 
                idx === currentExerciseIndex && styles.progressDotActive,
                idx < currentExerciseIndex && styles.progressDotCompleted
              ]} 
            />
          ))}
        </View>

        <Text style={styles.exerciseCounter}>EJERCICIO {currentExerciseIndex + 1} DE {activeRoutine.exercises.length}</Text>
        <Text style={styles.exerciseTitle}>{displayExercise?.name || 'Ejercicio Desconocido'}</Text>
        
        {(Boolean(displayExercise?.bodyPart) || Boolean(displayExercise?.muscle)) ? (
          <View style={styles.exerciseMetaRow}>
            {displayExercise?.bodyPart ? (
              <View style={styles.bodyPartPill}>
                <Text style={styles.bodyPartPillText}>{translateBodyPart(displayExercise.bodyPart)}</Text>
              </View>
            ) : null}
            {displayExercise?.muscle ? (
              <Text style={styles.muscleText}>{translateMuscle(displayExercise.muscle)}</Text>
            ) : null}
          </View>
        ) : null}

        {displayExercise?.instructions ? (
          <Text style={styles.exerciseDescription}>{displayExercise.instructions}</Text>
        ) : (
          <Text style={styles.exerciseDescription}>Sin instrucciones disponibles</Text>
        )}

        {(displayExercise?.gifUrl || displayExercise?.thumbUrl) ? (
          <View style={styles.gifContainer}>
            <Image 
              source={{ uri: displayExercise?.gifUrl || displayExercise?.thumbUrl }} 
              style={styles.gifImage} 
              contentFit="contain" 
            />
          </View>
        ) : (
          <View style={styles.noImageContainer}>
            <Text style={styles.noImageText}>Cargando imagen...</Text>
          </View>
        )}

        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>SERIES</Text>
            <Text style={styles.statValue}>{currentExercise.sets}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>REPS</Text>
            <Text style={styles.statValue}>{currentExercise.reps}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>DESCANSO</Text>
            <Text style={styles.statValue}>{currentExercise.restTimeInSeconds}s</Text>
          </View>
        </View>

        <View style={styles.weightCard}>
          <Text style={styles.weightLabel}>PESO (kg)</Text>
          <View style={styles.weightControls}>
            <TouchableOpacity 
              style={styles.weightBtn}
              onPress={() => updateExerciseWeight(currentExerciseIndex, Math.max(0, (currentExercise.weight || 0) - 0.5))}
              accessibilityRole="button"
              accessibilityLabel="Reducir peso"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.weightBtnText}>-</Text>
            </TouchableOpacity>
            <TextInput
              style={[styles.weightValue, { padding: 0 }]}
              value={currentExercise.weight?.toString() || '0'}
              keyboardType="numeric"
              accessibilityLabel="Peso en kilogramos"
              onChangeText={(text) => {
                const parsed = parseFloat(text.replace(',', '.'));
                if (!isNaN(parsed)) {
                  updateExerciseWeight(currentExerciseIndex, parsed);
                } else if (text === '') {
                  updateExerciseWeight(currentExerciseIndex, 0);
                }
              }}
            />
            <TouchableOpacity 
              style={styles.weightBtn}
              onPress={() => updateExerciseWeight(currentExerciseIndex, (currentExercise.weight || 0) + 0.5)}
              accessibilityRole="button"
              accessibilityLabel="Aumentar peso"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.weightBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.setsContainer}>
          <Text style={styles.setsTitle}>Progreso de Series</Text>
          <View style={styles.setsRow}>
            {Array.from({ length: currentExercise.sets }).map((_, idx) => {
              const isCompleted = idx < exerciseDoneSets;
              return (
                <View key={idx} style={[styles.setCircle, isCompleted && styles.setCircleCompleted]}>
                  {isCompleted ? (
                    <CheckCircle color={theme.colors.neonCyan} size={20} />
                  ) : (
                    <Text style={styles.setNumber}>{idx + 1}</Text>
                  )}
                </View>
              );
            })}
          </View>
          <TouchableOpacity 
            style={[
              styles.completeSetBtn, 
              exerciseDoneSets >= currentExercise.sets && styles.completeSetBtnDisabled
            ]}
            onPress={() => completeSet(currentExercise.exerciseId)}
            disabled={exerciseDoneSets >= currentExercise.sets}
            accessibilityRole="button"
            accessibilityLabel="Completar serie actual"
            accessibilityState={{ disabled: exerciseDoneSets >= currentExercise.sets }}
          >
            <Text style={styles.completeSetText}>Completar Serie</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navBtn} onPress={prevExercise} disabled={currentExerciseIndex === 0}>
          <ChevronLeft color={currentExerciseIndex === 0 ? theme.colors.slate700 : theme.colors.white} size={24} />
          <Text style={[styles.navText, currentExerciseIndex === 0 && { color: theme.colors.slate700 }]}>Anterior</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.playPauseBtn} onPress={() => isPaused ? resumeWorkout() : pauseWorkout()}>
          {isPaused ? (
            <Play color={theme.colors.obsidian} size={24} fill={theme.colors.obsidian} />
          ) : (
            <Pause color={theme.colors.obsidian} size={24} fill={theme.colors.obsidian} />
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navBtn} 
          onPress={currentExerciseIndex === activeRoutine.exercises.length - 1 ? handleEndWorkout : nextExercise}
        >
          <Text style={styles.navText}>{currentExerciseIndex === activeRoutine.exercises.length - 1 ? 'Terminar' : 'Siguiente'}</Text>
          {currentExerciseIndex !== activeRoutine.exercises.length - 1 && (
            <ChevronRight color={theme.colors.white} size={24} />
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.obsidian },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceLight,
  },
  headerBtn: { padding: 8 },
  headerTitleContainer: { alignItems: 'center' },
  headerTimer: { color: colors.neonCyan, fontFamily: 'JetBrainsMono_500Medium', fontSize: 24 },
  headerRoutineName: { color: colors.mutedText, fontFamily: 'Geist_400Regular', fontSize: 12, marginTop: 4 },
  content: { padding: 20, paddingBottom: 100 },
  progressContainer: { flexDirection: 'row', gap: 6, marginBottom: 24, justifyContent: 'center' },
  progressDot: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.surfaceLight },
  progressDotActive: { backgroundColor: colors.neonCyan },
  progressDotCompleted: { backgroundColor: colors.success },
  exerciseCounter: { color: colors.mutedText, fontFamily: 'JetBrainsMono_500Medium', fontSize: 12, letterSpacing: 1, marginBottom: 8, textAlign: 'center' },
  exerciseTitle: { color: colors.white, fontFamily: 'Geist_700Bold', fontSize: 28, textAlign: 'center', marginBottom: 6 },
  exerciseMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 },
  bodyPartPill: { backgroundColor: 'rgba(0, 240, 255, 0.12)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(0, 240, 255, 0.3)' },
  bodyPartPillText: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 11, color: colors.neonCyan },
  muscleText: { fontFamily: 'JetBrainsMono_400Regular', fontSize: 12, color: colors.mutedText },
  exerciseDescription: { color: colors.slate400, fontFamily: 'Geist_400Regular', fontSize: 14, textAlign: 'left', marginBottom: 24, paddingHorizontal: 10 },
  gifContainer: { width: '100%', height: 250, backgroundColor: colors.white, borderRadius: 20, overflow: 'hidden', marginBottom: 24 },
  gifImage: { width: '100%', height: '100%' },
  noImageContainer: { width: '100%', height: 200, backgroundColor: colors.surfaceLight, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  noImageText: { color: colors.mutedText, fontFamily: 'Geist_500Medium', fontSize: 14 },
  statsCard: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 16, padding: 16, justifyContent: 'space-around', marginBottom: 24, borderWidth: 1, borderColor: colors.slate700 },
  statItem: { alignItems: 'center' },
  statLabel: { color: colors.slate400, fontFamily: 'JetBrainsMono_500Medium', fontSize: 11, marginBottom: 4 },
  statValue: { color: colors.white, fontFamily: 'JetBrainsMono_500Medium', fontSize: 20 },
  weightCard: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 16, padding: 16, justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: colors.neonCyan },
  weightLabel: { color: colors.neonCyan, fontFamily: 'JetBrainsMono_500Medium', fontSize: 14, letterSpacing: 1 },
  weightControls: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  weightBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0, 240, 255, 0.1)', borderWidth: 1, borderColor: colors.neonCyan, justifyContent: 'center', alignItems: 'center' },
  weightBtnText: { color: colors.neonCyan, fontSize: 20, fontFamily: 'JetBrainsMono_500Medium', marginTop: -2 },
  weightValue: { color: colors.white, fontFamily: 'JetBrainsMono_500Medium', fontSize: 24, minWidth: 60, textAlign: 'center' },
  setsContainer: { backgroundColor: colors.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.slate700 },
  setsTitle: { color: colors.white, fontFamily: 'Geist_600SemiBold', fontSize: 16, marginBottom: 16, textAlign: 'center' },
  setsRow: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  setCircle: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: colors.slate600, justifyContent: 'center', alignItems: 'center' },
  setCircleCompleted: { backgroundColor: 'transparent', borderColor: colors.neonCyan },
  setNumber: { color: colors.white, fontFamily: 'JetBrainsMono_500Medium', fontSize: 18 },
  completeSetBtn: { backgroundColor: colors.neonCyan, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  completeSetBtnDisabled: { backgroundColor: colors.slate700 },
  completeSetText: { color: colors.obsidian, fontFamily: 'Geist_600SemiBold', fontSize: 16 },
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.surface, paddingHorizontal: 24, paddingVertical: 16, paddingBottom: 32, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.slate700 },
  navBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  navText: { color: colors.white, fontFamily: 'Geist_600SemiBold', fontSize: 16 },
  playPauseBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.neonCyan, justifyContent: 'center', alignItems: 'center' },
});
