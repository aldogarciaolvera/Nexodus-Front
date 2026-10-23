import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from '../../utils/ThemeContext';
import { ThemeColors } from '../../utils/theme';
import { ArrowLeft, Plus, Save } from 'lucide-react-native';
import { useAlertStore, AlertState } from '../../store/alertStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { gymService, Exercise, CreateRoutineRequest } from '../../services/gym.service';
import { UserService } from '../../services/user.service';
import { calculateRecommendedWeight } from '../../utils/weightRecommendation';
import { ExercisePickerModal } from './components/ExercisePickerModal';
import { RoutineExerciseItem, RoutineExerciseForm } from './components/RoutineExerciseItem';
import { queryKeys } from '../../services/queryKeys';

const generateTempId = () => Math.random().toString(36).substring(7);

const DAYS = [
  { label: 'L', value: 1 },
  { label: 'M', value: 2 },
  { label: 'X', value: 3 },
  { label: 'J', value: 4 },
  { label: 'V', value: 5 },
  { label: 'S', value: 6 },
  { label: 'D', value: 7 },
];

export const CreateRoutineScreen = () => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);
  const navigation = useNavigation();
  const route = useRoute<RouteProp<{ params: { routineId?: string } }>>();
  const routineId = route.params?.routineId;
  
  const showAlert = useAlertStore((state: AlertState) => state.showAlert);
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [exercises, setExercises] = useState<RoutineExerciseForm[]>([]);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [targetDay, setTargetDay] = useState<number | undefined>(undefined);

  // Fetch available exercises to hydrate existing routine exercise names/thumbnails
  const { data: availableExercises = [] } = useQuery({
    queryKey: queryKeys.gym.exercises,
    queryFn: () => gymService.getAllExercises(),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const { data: profile } = useQuery({
    queryKey: queryKeys.gym.profile,
    queryFn: UserService.getProfile,
  });

  const { data: existingRoutine } = useQuery({
    queryKey: queryKeys.gym.routine(routineId),
    queryFn: () => gymService.getRoutineById(routineId!),
    enabled: !!routineId,
  });

  useEffect(() => {
    if (existingRoutine && availableExercises.length > 0) {
      setName(existingRoutine.name);
      setDescription(existingRoutine.description || '');
      setTargetDay(existingRoutine.targetDay);
      setExercises(existingRoutine.exercises.map(ex => {
        const foundEx = availableExercises.find((e: Exercise) => e.id === ex.exerciseId);
        return {
          id: ex.id || generateTempId(),
          exerciseId: ex.exerciseId,
          name: foundEx?.name || ex.exercise?.name || 'Ejercicio',
          thumbUrl: foundEx?.thumbUrl || foundEx?.gifUrl,
          sets: ex.sets,
          reps: ex.reps,
          weight: ex.weight || 0,
          restTimeInSeconds: ex.restTimeInSeconds,
          muscle: foundEx?.muscle || ex.exercise?.muscle || foundEx?.targetMuscleGroup,
          bodyPart: foundEx?.bodyPart || ex.exercise?.bodyPart
        };
      }));
    }
  }, [existingRoutine, availableExercises]);

  const saveMutation = useMutation({
    mutationFn: (data: CreateRoutineRequest) => routineId 
      ? gymService.updateRoutine(routineId, data)
      : gymService.createRoutine(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.gym.routines });
      queryClient.invalidateQueries({ queryKey: queryKeys.gym.routine(routineId) });
      showAlert('Guardado', routineId ? 'Rutina actualizada.' : 'Rutina creada correctamente.', 'success');
      navigation.goBack();
    },
    onError: (error: Error) => {
      showAlert('Error', error.message || 'Ocurrió un error al guardar.', 'error');
    }
  });

  const handleSave = () => {
    if (!name.trim()) {
      showAlert('Error', 'El nombre de la rutina es requerido.', 'error');
      return;
    }
    if (!targetDay) {
      showAlert('Error', 'Debes asignar un día para la rutina.', 'error');
      return;
    }
    if (exercises.length === 0) {
      showAlert('Error', 'Debes agregar al menos un ejercicio.', 'error');
      return;
    }

    saveMutation.mutate({
      name,
      description,
      difficultyLevel: existingRoutine?.difficultyLevel || 'Intermedio',
      targetDay,
      exercises: exercises.map(e => ({
        exerciseId: e.exerciseId,
        sets: e.sets,
        reps: e.reps,
        weight: e.weight || 0,
        restTimeInSeconds: e.restTimeInSeconds
      }))
    });
  };

  const handleConfirmAddExercises = (selectedList: Exercise[]) => {
    const newExercises = selectedList
      .filter(ex => !exercises.some(e => e.exerciseId === ex.id))
      .map(ex => {
        const rec = calculateRecommendedWeight(
          ex,
          profile?.weight,
          profile?.height,
          'Beginner'
        );

        return {
          id: generateTempId(),
          exerciseId: ex.id,
          name: ex.name,
          thumbUrl: ex.thumbUrl || ex.gifUrl,
          sets: rec.suggestedSets || 4,
          reps: rec.suggestedReps || 12,
          weight: rec.weight,
          restTimeInSeconds: 90,
          muscle: ex.muscle || ex.targetMuscleGroup,
          bodyPart: ex.bodyPart,
          equipment: ex.equipment,
        };
      });

    setExercises(prev => [...prev, ...newExercises]);
  };

  const updateExercise = (id: string, field: keyof RoutineExerciseForm, value: number) => {
    setExercises(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const removeExercise = (id: string) => {
    setExercises(prev => prev.filter(e => e.id !== id));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Volver a la pantalla de gimnasio"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowLeft color={theme.colors.text} size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{routineId ? 'Editar Rutina' : 'Crear Rutina'}</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.inputGroup}>
            <Text style={styles.label}>NOMBRE DE LA RUTINA</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. Dia de Pecho..."
              placeholderTextColor={theme.colors.mutedText}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>DESCRIPCIÓN (Opcional)</Text>
            <TextInput
              style={[styles.input, { height: 80 }]}
              placeholder="Ej. Rutina enfocada en pecho y tríceps..."
              placeholderTextColor={theme.colors.mutedText}
              multiline
              numberOfLines={3}
              value={description}
              onChangeText={setDescription}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>DÍA DE LA SEMANA</Text>
            <View style={styles.daysRow}>
              {DAYS.map(day => (
                <TouchableOpacity
                  key={day.value}
                  style={[
                    styles.dayPill,
                    targetDay === day.value && styles.dayPillActive
                  ]}
                  onPress={() => setTargetDay(day.value)}
                >
                  <Text style={[
                    styles.dayPillText,
                    targetDay === day.value && styles.dayPillTextActive
                  ]}>{day.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.exercisesHeader}>
            <Text style={styles.label}>EJERCICIOS ({exercises.length})</Text>
          </View>

          {exercises.map((ex, index) => {
            const foundEx = availableExercises.find((e: Exercise) => e.id === ex.exerciseId);
            const rec = calculateRecommendedWeight(
              foundEx || ex,
              profile?.weight,
              profile?.height,
              'Beginner'
            );

            return (
              <RoutineExerciseItem
                key={ex.id}
                exercise={ex}
                index={index}
                onUpdate={updateExercise}
                onRemove={removeExercise}
                recommendedWeight={rec.weight}
                recommendationRationale={rec.rationale}
              />
            );
          })}

          <TouchableOpacity style={styles.addExerciseBtn} onPress={() => setShowExercisePicker(true)}>
            <Plus color={theme.colors.neonCyan} size={20} />
            <Text style={styles.addExerciseText}>Añadir Ejercicio</Text>
          </TouchableOpacity>
          
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.saveButton, saveMutation.isPending && { opacity: 0.7 }]} 
          onPress={handleSave}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? (
            <ActivityIndicator color={theme.colors.obsidian} />
          ) : (
            <>
              <Save color={theme.colors.obsidian} size={20} />
              <Text style={styles.saveButtonText}>Guardar Rutina</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <ExercisePickerModal
        visible={showExercisePicker}
        onClose={() => setShowExercisePicker(false)}
        onConfirm={handleConfirmAddExercises}
        initialSelectedIds={exercises.map(e => e.exerciseId)}
      />
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.obsidian,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderGlow,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontFamily: 'Geist_700Bold',
    fontSize: 18,
    color: colors.text,
  },
  scrollContent: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 11,
    color: colors.mutedText,
    marginBottom: 8,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    borderRadius: 12,
    padding: 16,
    color: colors.text,
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayPill: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayPillActive: {
    backgroundColor: colors.neonCyan,
    borderColor: colors.neonCyan,
  },
  dayPillText: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 14,
    color: colors.mutedText,
  },
  dayPillTextActive: {
    color: colors.obsidian,
  },
  exercisesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  addExerciseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    borderWidth: 1,
    borderColor: colors.neonCyan,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    marginTop: 8,
  },
  addExerciseText: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 14,
    color: colors.neonCyan,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.borderGlow,
    backgroundColor: colors.obsidian,
  },
  saveButton: {
    backgroundColor: colors.neonCyan,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonText: {
    color: colors.obsidian,
    fontFamily: 'Geist_700Bold',
    fontSize: 16,
  },
});
