import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../utils/ThemeContext';
import { ThemeColors } from '../../utils/theme';
import { Activity, Clock, Flame, Play, Search, Target, CheckCircle2, Plus, X } from 'lucide-react-native';
import { Header } from '../../components/Header';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserService } from '../../services/user.service';
import { gymService } from '../../services/gym.service';
import { useAlertStore } from '../../store/alertStore';
import { Skeleton } from '../../components/Skeleton';
import { useWorkoutStore } from '../../store/workoutStore';

export const GymScreen = () => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const queryClient = useQueryClient();
  const showAlert = useAlertStore((state: any) => state.showAlert);

  const [inputWeight, setInputWeight] = useState('');
  const [inputHeight, setInputHeight] = useState('');

  const { 
    isActive, 
    activeRoutine, 
    elapsedSeconds, 
    currentExerciseIndex,
    startWorkout, 
  } = useWorkoutStore();

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: UserService.getProfile,
  });

  const { data: routinesList = [], isLoading: isLoadingRoutines } = useQuery({
    queryKey: ['routines'],
    queryFn: gymService.getRoutines,
  });

  const routineQueries = useQueries({
    queries: routinesList.map(r => ({
      queryKey: ['routine', r.id],
      queryFn: () => gymService.getRoutineById(r.id),
      enabled: !!r.id
    }))
  });

  const routines = routinesList.map((r, index) => {
    const fullRoutine = routineQueries[index]?.data;
    return fullRoutine || r;
  });

  const deleteMutation = useMutation({
    mutationFn: gymService.deleteRoutine,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
      useAlertStore.getState().showAlert('Éxito', 'La rutina ha sido eliminada.', 'success');
    },
    onError: () => {
      useAlertStore.getState().showAlert('Error', 'No se pudo eliminar la rutina.', 'error');
    }
  });

  const confirmDelete = (routineId: string, routineName: string) => {
    useAlertStore.getState().showAlert({
      title: 'Eliminar Rutina',
      message: `¿Estás seguro que deseas eliminar la rutina "${routineName}"?`,
      type: 'error',
      buttons: [
        { text: 'Cancelar', style: 'cancel', onPress: () => useAlertStore.getState().hideAlert() },
        { 
          text: 'Eliminar', 
          style: 'destructive', 
          onPress: () => {
            useAlertStore.getState().hideAlert();
            deleteMutation.mutate(routineId);
          }
        }
      ]
    });
  };

  const { data: workoutLogs = [] } = useQuery({
    queryKey: ['workouts'],
    queryFn: gymService.getWorkoutLogs,
  });

  const getDayNumber = () => {
    const day = new Date().getDay();
    return day === 0 ? 7 : day;
  };

  const todayRoutineLight = routines.find(r => r.targetDay === getDayNumber());
  
  const { data: todayRoutineFull } = useQuery({
    queryKey: ['routine', todayRoutineLight?.id],
    queryFn: () => gymService.getRoutineById(todayRoutineLight!.id),
    enabled: !!todayRoutineLight?.id,
  });

  const todayRoutine = todayRoutineFull || todayRoutineLight;
  const exercisesCount = todayRoutine?.exercises?.length || 0;
  const totalSetsCount = todayRoutine?.exercises?.reduce((acc, curr) => acc + curr.sets, 0) || 0;

  const todayDateString = new Date().toISOString().split('T')[0];
  const completedTodayWorkout = todayRoutine ? workoutLogs.find(log => 
    log.routineId === todayRoutine.id && 
    log.dateCompleted.startsWith(todayDateString)
  ) : undefined;

  const getDayStatus = (dayIndex: number) => {
    const today = new Date();
    // JS getDay() returns 0 for Sunday. Convert so 0=Mon, 1=Tue... 6=Sun
    const currentDayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1;
    
    const date = new Date(today);
    date.setDate(today.getDate() - currentDayIndex + dayIndex);
    const dateString = date.toISOString().split('T')[0];

    const isToday = dayIndex === currentDayIndex;
    const isPast = dayIndex < currentDayIndex;
    
    const hasWorkout = workoutLogs.some(log => log.dateCompleted.startsWith(dateString));

    if (hasWorkout) return 'completed';
    if (isPast) return 'missed';
    if (isToday) return 'active';
    return 'upcoming';
  };

  const mutation = useMutation({
    mutationFn: UserService.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      showAlert('Guardado', 'Tus datos corporales fueron actualizados', 'success');
    },
    onError: (e) => {
      showAlert('Error', 'No se pudieron guardar tus datos', 'error');
    }
  });

  const handleSaveBodyData = () => {
    if (!inputWeight || !inputHeight) {
      showAlert('Requerido', 'Por favor ingresa tu peso y altura.', 'error');
      return;
    }

    mutation.mutate({
      ...profile,
      username: profile?.username || '',
      email: profile?.email || '',
      phoneNumber: profile?.phoneNumber || '',
      weight: parseFloat(inputWeight),
      height: parseFloat(inputHeight),
    });
  };

  if (isLoading || isLoadingRoutines) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header />
        <View style={{ padding: 20 }}>
          <Skeleton width="50%" height={28} style={{ marginBottom: 20 }} />
          <Skeleton width="100%" height={100} borderRadius={16} style={{ marginBottom: 16 }} />
          <Skeleton width="100%" height={100} borderRadius={16} style={{ marginBottom: 16 }} />
          <Skeleton width="100%" height={100} borderRadius={16} />
        </View>
      </SafeAreaView>
    );
  }

  // Si no tiene peso O altura, mostrar la pantalla de bienvenida/onboarding
  if (!profile?.weight || !profile?.height) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView style={{ flex: 1, justifyContent: 'center', padding: 20 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.onboardingCard}>
            <Text style={styles.onboardingTitle}>Bienvenido al Gym</Text>
            <Text style={styles.onboardingSub}>Para personalizar tus rutinas y calorías, necesitamos un par de datos tuyos.</Text>
            
            <View style={{ marginBottom: 16 }}>
              <Text style={styles.onboardingLabel}>Peso (kg)</Text>
              <TextInput 
                style={styles.onboardingInput}
                placeholder="70.5"
                placeholderTextColor={theme.colors.mutedText}
                keyboardType="numeric"
                value={inputWeight}
                onChangeText={setInputWeight}
              />
            </View>

            <View style={{ marginBottom: 24 }}>
              <Text style={styles.onboardingLabel}>Altura (m)</Text>
              <TextInput 
                style={styles.onboardingInput}
                placeholder="1.75"
                placeholderTextColor={theme.colors.mutedText}
                keyboardType="numeric"
                value={inputHeight}
                onChangeText={setInputHeight}
              />
            </View>

            <TouchableOpacity 
              style={[styles.onboardingBtn, mutation.isPending && { opacity: 0.7 }]} 
              onPress={handleSaveBodyData}
              disabled={mutation.isPending}
            >
              <Text style={styles.onboardingBtnText}>{mutation.isPending ? 'Guardando...' : 'Comenzar a Entrenar'}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <Header title="Gym & Rutinas" />

        {/* Session Execution Card */}
        {completedTodayWorkout ? (
          <View style={styles.sessionCard}>
            <View style={styles.sessionTop}>
              <View style={styles.sessionInfo}>
                <Text style={styles.microcycleText}>RUTINA COMPLETADA</Text>
                <Text style={styles.sessionTitle}>{todayRoutine?.name}</Text>
                <Text style={styles.sessionFocus}>¡Buen trabajo hoy!</Text>
              </View>
              <View style={styles.progressCircle}>
                <CheckCircle2 color={theme.colors.neonCyan} size={32} />
              </View>
            </View>

            <View style={styles.metricsRow}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>DURACION</Text>
                <Text style={styles.metricValue}>
                  {formatTime(completedTodayWorkout.durationInSeconds)}
                </Text>
              </View>
            </View>
          </View>
        ) : todayRoutine ? (
          <View style={styles.sessionCard}>
            <View style={styles.sessionTop}>
              <View style={styles.sessionInfo}>
                <Text style={styles.microcycleText}>RUTINA DEL DÍA</Text>
                <Text style={styles.sessionTitle}>{todayRoutine.name}</Text>
                <Text style={styles.sessionFocus}>{todayRoutine.description}</Text>
              </View>
              <View style={styles.progressCircle}>
                <Text style={styles.progressText}>
                  {isActive && activeRoutine ? Math.round((currentExerciseIndex / activeRoutine.exercises.length) * 100) : 0}%
                </Text>
                <Text style={styles.progressSub}>
                  {isActive && activeRoutine ? currentExerciseIndex : 0}/{exercisesCount}
                </Text>
              </View>
            </View>

            <View style={styles.metricsRow}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>DURACION</Text>
                <Text style={styles.metricValue}>
                  {isActive && activeRoutine ? formatTime(elapsedSeconds) : '00:00'}
                </Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.resumeButton}
              onPress={() => {
                if (isActive && activeRoutine) {
                  navigation.navigate('ActiveWorkout');
                } else if (todayRoutine) {
                  startWorkout(todayRoutine);
                  navigation.navigate('ActiveWorkout');
                }
              }}
            >
              <View style={styles.playIconContainer}>
                <Play color={theme.colors.obsidian} size={12} fill={theme.colors.obsidian} />
              </View>
              <View>
                <Text style={styles.resumeTitle}>{isActive && activeRoutine ? 'Continuar Rutina' : 'Comenzar Rutina'}</Text>
                <Text style={styles.resumeSub}>{isActive && activeRoutine ? 'Rutina en progreso' : 'Listo para empezar'}</Text>
              </View>
              <View style={{flex:1}}/>
              <Text style={{color: theme.colors.mutedText}}>→</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.sessionCard, { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }]}>
            <Target color={theme.colors.slate400} size={48} style={{ marginBottom: 16 }} />
            <Text style={[styles.sessionTitle, { marginBottom: 8 }]}>Día de Descanso</Text>
            <Text style={[styles.sessionFocus, { textAlign: 'center' }]}>
              No tienes ninguna rutina programada para hoy.{'\n'}Puedes descansar o crear una nueva.
            </Text>
            <TouchableOpacity 
              style={[styles.resumeButton, { marginTop: 24, alignSelf: 'center', width: 'auto', paddingHorizontal: 24, backgroundColor: theme.colors.neonCyan }]}
              onPress={() => navigation.navigate('CreateRoutine')}
            >
              <Text style={[styles.resumeTitle, { color: theme.colors.obsidian }]}>Crear Rutina</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Strain Distribution */}
        <View style={styles.strainContainer}>
          <View style={styles.streakRow}>
            <Text style={styles.streakLabel}>RACHA:</Text>
            <View style={styles.daysContainer}>
              {['L','M','X','J','V','S','D'].map((day, i) => {
                const status = getDayStatus(i);
                
                let content;
                if (status === 'completed') {
                  content = <CheckCircle2 size={12} color={theme.colors.neonCyan} />;
                } else if (status === 'missed') {
                  content = <X size={12} color={theme.colors.error} />;
                } else {
                  content = <Text style={[styles.dayText, status === 'active' && styles.dayTextActive]}>{day}</Text>;
                }

                return (
                  <View 
                    key={i} 
                    style={[
                      styles.dayCircle, 
                      status === 'active' && styles.dayCircleActive, 
                      status === 'completed' && styles.dayCircleCompleted,
                      status === 'missed' && { borderColor: theme.colors.error, opacity: 0.8 }
                    ]}
                  >
                    {content}
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Routine Page */}
        {routines.sort((a, b) => (a.targetDay || 0) - (b.targetDay || 0)).map((routine, idx) => {
          const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
          // targetDay 1 = Monday, 7 = Sunday
          const dayName = routine.targetDay ? (routine.targetDay === 7 ? days[0] : days[routine.targetDay]) : 'Sin día asignado';
          const totalExercises = routine.exercises?.length || 0;
          
          return (
            <TouchableOpacity 
              key={routine.id || idx} 
              style={styles.exerciseCard}
              onPress={() => navigation.navigate('CreateRoutine', { routineId: routine.id })}
              onLongPress={() => confirmDelete(routine.id, routine.name)}
              delayLongPress={500}
            >
              <View style={styles.exerciseTop}>
                <View style={styles.exerciseIcon}><Activity color={theme.colors.obsidian} size={16}/></View>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseTitle}>{routine.name}</Text>
                  <Text style={styles.exerciseSub}>
                    <Text style={{color: theme.colors.neonCyan}}>{dayName}</Text> • {routine.difficultyLevel || 'Beginner'} • {totalExercises} Ejercicios
                  </Text>
                </View>
              </View>
              {routine.description ? (
                <Text style={{ fontFamily: 'Geist_400Regular', fontSize: 12, color: theme.colors.mutedText, marginTop: 8 }}>
                  {routine.description}
                </Text>
              ) : null}
            </TouchableOpacity>
          );
        })}

      </ScrollView>
      </KeyboardAvoidingView>

      <TouchableOpacity 
        style={styles.fab} 
        activeOpacity={0.8}
        onPress={() => navigation.navigate('CreateRoutine')}
      >
        <Plus color={theme.colors.obsidian} size={24} />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.obsidian,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    marginTop: 20,
  },
  dateText: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 10,
    color: colors.neonCyan,
    letterSpacing: 1,
    marginBottom: 8,
  },
  title: {
    fontFamily: 'Geist_700Bold',
    fontSize: 28,
    color: colors.text,
  },
  logButton: {
    backgroundColor: colors.neonCyan,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  logText: {
    color: colors.obsidian,
    fontFamily: 'Geist_700Bold',
    fontSize: 13,
  },
  sessionCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  sessionTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sessionInfo: {
    flex: 1,
  },
  microcycleText: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 10,
    color: colors.neonCyan,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  sessionTitle: {
    fontFamily: 'Geist_700Bold',
    fontSize: 18,
    color: colors.text,
    marginBottom: 4,
  },
  sessionFocus: {
    fontFamily: 'Geist_400Regular',
    fontSize: 13,
    color: colors.mutedText,
  },
  progressCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: colors.neonCyan,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    fontFamily: 'Geist_700Bold',
    fontSize: 12,
    color: colors.text,
  },
  progressSub: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 9,
    color: colors.mutedText,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metricItem: {
    alignItems: 'flex-start',
  },
  metricLabel: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 9,
    color: colors.mutedText,
    marginBottom: 4,
  },
  metricValue: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 13,
    color: colors.text,
  },
  resumeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    padding: 12,
    borderRadius: 12,
  },
  playIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.neonCyan,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  resumeTitle: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 13,
    color: colors.text,
  },
  resumeSub: {
    fontFamily: 'Geist_400Regular',
    fontSize: 11,
    color: colors.mutedText,
  },
  strainContainer: {
    marginBottom: 24,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakLabel: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 10,
    color: colors.mutedText,
    marginRight: 12,
  },
  daysContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  dayCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleActive: {
    backgroundColor: colors.neonCyan,
  },
  dayCircleCompleted: {
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
  },
  dayText: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 10,
    color: colors.mutedText,
  },
  dayTextActive: {
    color: colors.obsidian,
  },
  exerciseCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  exerciseTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  exerciseIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.neonCyan,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseTitle: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 15,
    color: colors.text,
  },
  exerciseSub: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 10,
    color: colors.mutedText,
  },
  volumeText: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 11,
    color: colors.text,
  },
  setsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  setBox: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  setLabel: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 9,
    color: colors.mutedText,
    marginBottom: 4,
  },
  setValue: {
    fontFamily: 'JetBrainsMono_600SemiBold',
    fontSize: 11,
    color: colors.text,
    marginBottom: 4,
  },
  setDone: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 9,
    color: colors.neonCyan,
  },
  fab: {
    position: 'absolute',
    bottom: 100, // Above bottom nav
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.neonCyan,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  onboardingCard: {
    backgroundColor: colors.surface,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  onboardingTitle: {
    fontFamily: 'Geist_700Bold',
    fontSize: 24,
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  onboardingSub: {
    fontFamily: 'Geist_400Regular',
    fontSize: 14,
    color: colors.mutedText,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  onboardingLabel: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 11,
    color: colors.mutedText,
    marginBottom: 8,
  },
  onboardingInput: {
    backgroundColor: colors.obsidian,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    borderRadius: 12,
    padding: 16,
    color: colors.text,
    fontFamily: 'Geist_500Medium',
    fontSize: 16,
  },
  onboardingBtn: {
    backgroundColor: colors.neonCyan,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  onboardingBtnText: {
    fontFamily: 'Geist_700Bold',
    fontSize: 16,
    color: colors.obsidian,
  }
});
