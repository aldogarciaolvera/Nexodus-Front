import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../utils/ThemeContext';
import { ThemeColors } from '../../utils/theme';
import { ArrowLeft, Plus, Save, Trash2, X, CheckCircle2 } from 'lucide-react-native';
import { useAlertStore } from '../../store/alertStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { gymService, Exercise } from '../../services/gym.service';
import { Image } from 'expo-image';
import { Skeleton } from '../../components/Skeleton';

type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

interface RoutineExerciseForm {
  id: string; // temp ID for UI
  exerciseId: string;
  name: string;
  sets: number;
  reps: number;
  restTimeInSeconds: number;
}

const generateTempId = () => Math.random().toString(36).substring(7);

export const CreateRoutineScreen = () => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);
  const navigation = useNavigation();
  const showAlert = useAlertStore((state: any) => state.showAlert);
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [exercises, setExercises] = useState<RoutineExerciseForm[]>([]);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [selectedForAddition, setSelectedForAddition] = useState<Set<string>>(new Set());
  const [selectedBodyPart, setSelectedBodyPart] = useState<string>('All');
  const [targetDay, setTargetDay] = useState<number | undefined>(undefined);

  const DAYS = [
    { label: 'L', value: 1 },
    { label: 'M', value: 2 },
    { label: 'M', value: 3 },
    { label: 'J', value: 4 },
    { label: 'V', value: 5 },
    { label: 'S', value: 6 },
    { label: 'D', value: 7 },
  ];

  // Fetch all available exercises with caching
  const { data: availableExercises = [], isLoading: isLoadingExercises } = useQuery({
    queryKey: ['exercises'],
    queryFn: gymService.getExercises,
    staleTime: 1000 * 60 * 60, // 1 hour cache
  });

  const bodyParts = ['All', ...Array.from(new Set(availableExercises.map((e: Exercise) => e.bodyPart || 'Otro').filter(Boolean)))];
  const filteredExercises = availableExercises.filter(
    (e: Exercise) => selectedBodyPart === 'All' || (e.bodyPart || 'Otro') === selectedBodyPart
  );

  const saveMutation = useMutation({
    mutationFn: gymService.createRoutine,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
      showAlert('Guardado', 'Rutina creada correctamente.', 'success');
      navigation.goBack();
    },
    onError: (error: any) => {
      showAlert('Error', error.message || 'Ocurrió un error al guardar.', 'error');
    }
  });

  const handleSave = () => {
    if (!name.trim()) {
      showAlert('Error', 'El nombre de la rutina es requerido.', 'error');
      return;
    }
    if (exercises.length === 0) {
      showAlert('Error', 'Debes agregar al menos un ejercicio.', 'error');
      return;
    }

    saveMutation.mutate({
      name,
      description,
      difficultyLevel: 'Intermediate',
      targetDay,
      exercises: exercises.map(e => ({
        exerciseId: e.exerciseId,
        sets: e.sets,
        reps: e.reps,
        restTimeInSeconds: e.restTimeInSeconds
      }))
    });
  };

  const toggleExerciseSelection = (exerciseId: string) => {
    const newSet = new Set(selectedForAddition);
    if (newSet.has(exerciseId)) {
      newSet.delete(exerciseId);
    } else {
      newSet.add(exerciseId);
    }
    setSelectedForAddition(newSet);
  };

  const handleConfirmAddExercises = () => {
    const selectedList = availableExercises.filter(ex => selectedForAddition.has(ex.id));
    
    // Solo añadimos los que no están ya en la rutina
    const newExercises = selectedList
      .filter(ex => !exercises.some(e => e.exerciseId === ex.id))
      .map(ex => ({
        id: generateTempId(),
        exerciseId: ex.id,
        name: ex.name,
        sets: 4,
        reps: 12,
        restTimeInSeconds: 90
      }));

    setExercises([...exercises, ...newExercises]);
    setShowExercisePicker(false);
  };

  const openPicker = () => {
    setSelectedForAddition(new Set(exercises.map(e => e.exerciseId)));
    setShowExercisePicker(true);
  };

  const updateExercise = (id: string, field: keyof RoutineExerciseForm, value: number) => {
    setExercises(exercises.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const removeExercise = (id: string) => {
    setExercises(exercises.filter(e => e.id !== id));
  };

  if (showExercisePicker) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowExercisePicker(false)} style={styles.backButton}>
            <ArrowLeft color={theme.colors.text} size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Selecciona tus Ejercicios</Text>
          <TouchableOpacity onPress={handleConfirmAddExercises}>
            <Text style={{ color: theme.colors.neonCyan, fontFamily: 'Geist_600SemiBold' }}>Listo</Text>
          </TouchableOpacity>
        </View>

        <View style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.borderGlow }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}>
            {bodyParts.map(bp => (
              <TouchableOpacity 
                key={bp as string} 
                style={[styles.filterChip, selectedBodyPart === bp && styles.filterChipActive]}
                onPress={() => setSelectedBodyPart(bp as string)}
              >
                <Text style={[styles.filterChipText, selectedBodyPart === bp && styles.filterChipTextActive]}>{bp as string}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {isLoadingExercises ? (
          <View style={{ padding: 20 }}>
            <Skeleton width="100%" height={80} borderRadius={16} style={{ marginBottom: 12 }} />
            <Skeleton width="100%" height={80} borderRadius={16} style={{ marginBottom: 12 }} />
            <Skeleton width="100%" height={80} borderRadius={16} style={{ marginBottom: 12 }} />
            <Skeleton width="100%" height={80} borderRadius={16} style={{ marginBottom: 12 }} />
          </View>
        ) : (
          <FlatList
            data={filteredExercises}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.scrollContent}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            extraData={selectedForAddition}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No hay ejercicios disponibles.</Text>
            }
            renderItem={({ item: ex }) => {
              const isSelected = selectedForAddition.has(ex.id);
              const imgUrl = ex.thumbUrl || ex.gifUrl;
              return (
                <TouchableOpacity 
                  style={[styles.exerciseOptionCard, isSelected && { borderColor: theme.colors.neonCyan }]} 
                  onPress={() => toggleExerciseSelection(ex.id)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.exerciseOptionName}>{ex.name}</Text>
                    <Text style={styles.exerciseOptionTarget}>{ex.muscle || ex.targetMuscleGroup} • {ex.equipment}</Text>
                  </View>
                  {imgUrl && (
                    <Image source={{ uri: imgUrl }} style={styles.exerciseThumb} />
                  )}
                  {isSelected && (
                    <View style={{ position: 'absolute', top: 10, right: 10 }}>
                      <CheckCircle2 color={theme.colors.neonCyan} size={20} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
          />
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft color={theme.colors.text} size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Crear Rutina</Text>
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
              textAlignVertical="top"
              value={description}
              onChangeText={setDescription}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>DÍA (Opcional)</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
              {DAYS.map((day, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.dayPill,
                    targetDay === day.value && styles.dayPillActive
                  ]}
                  onPress={() => setTargetDay(targetDay === day.value ? undefined : day.value)}
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

          {exercises.map((ex, index) => (
            <View key={ex.id} style={styles.exerciseCard}>
              <View style={styles.exCardTop}>
                <Text style={styles.exCardTitle}>{index + 1}. {ex.name}</Text>
                <TouchableOpacity onPress={() => removeExercise(ex.id)}>
                  <Trash2 color={theme.colors.error} size={18} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.exMetricsRow}>
                <View style={styles.metricControl}>
                  <Text style={styles.metricLabel}>SETS</Text>
                  <View style={styles.metricInputContainer}>
                    <TouchableOpacity onPress={() => updateExercise(ex.id, 'sets', Math.max(1, ex.sets - 1))}><Text style={styles.metricBtn}>-</Text></TouchableOpacity>
                    <Text style={styles.metricValue}>{ex.sets}</Text>
                    <TouchableOpacity onPress={() => updateExercise(ex.id, 'sets', ex.sets + 1)}><Text style={styles.metricBtn}>+</Text></TouchableOpacity>
                  </View>
                </View>
                
                <View style={styles.metricControl}>
                  <Text style={styles.metricLabel}>REPS</Text>
                  <View style={styles.metricInputContainer}>
                    <TouchableOpacity onPress={() => updateExercise(ex.id, 'reps', Math.max(1, ex.reps - 1))}><Text style={styles.metricBtn}>-</Text></TouchableOpacity>
                    <Text style={styles.metricValue}>{ex.reps}</Text>
                    <TouchableOpacity onPress={() => updateExercise(ex.id, 'reps', ex.reps + 1)}><Text style={styles.metricBtn}>+</Text></TouchableOpacity>
                  </View>
                </View>

                <View style={styles.metricControl}>
                  <Text style={styles.metricLabel}>REST (s)</Text>
                  <View style={styles.metricInputContainer}>
                    <TouchableOpacity onPress={() => updateExercise(ex.id, 'restTimeInSeconds', Math.max(0, ex.restTimeInSeconds - 15))}><Text style={styles.metricBtn}>-</Text></TouchableOpacity>
                    <Text style={styles.metricValue}>{ex.restTimeInSeconds}</Text>
                    <TouchableOpacity onPress={() => updateExercise(ex.id, 'restTimeInSeconds', ex.restTimeInSeconds + 15)}><Text style={styles.metricBtn}>+</Text></TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.addExerciseBtn} onPress={openPicker}>
            <Plus color={theme.colors.neonCyan} size={20} />
            <Text style={styles.addExerciseText}>Añadir Ejercicio</Text>
          </TouchableOpacity>
          
          <View style={{ height: 40 }} />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.saveButton, saveMutation.isPending && { opacity: 0.7 }]} 
            onPress={handleSave}
            disabled={saveMutation.isPending}
          >
            <Save color={theme.colors.obsidian} size={20} />
            <Text style={styles.saveButtonText}>
              {saveMutation.isPending ? 'Guardando...' : 'Guardar Rutina'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  dayPill: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
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
  exerciseCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  exCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  exCardTitle: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 15,
    color: colors.text,
    flex: 1,
  },
  exMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  metricControl: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.obsidian,
    borderRadius: 8,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  metricLabel: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 9,
    color: colors.mutedText,
    marginBottom: 4,
  },
  metricInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 8,
  },
  metricBtn: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 16,
    color: colors.text,
    paddingHorizontal: 6,
  },
  metricValue: {
    fontFamily: 'JetBrainsMono_700Bold',
    fontSize: 14,
    color: colors.text,
  },
  exerciseOptionCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exerciseThumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: colors.surfaceLight,
    marginLeft: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  filterChipActive: {
    backgroundColor: colors.neonCyan,
    borderColor: colors.neonCyan,
  },
  filterChipText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    color: colors.mutedText,
  },
  filterChipTextActive: {
    color: colors.obsidian,
    fontFamily: 'Geist_600SemiBold',
  },
  exerciseOptionName: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 15,
    color: colors.text,
    marginBottom: 4,
  },
  exerciseOptionTarget: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 11,
    color: colors.neonCyan,
  },
  emptyText: {
    fontFamily: 'Geist_400Regular',
    fontSize: 14,
    color: colors.mutedText,
    textAlign: 'center',
    marginTop: 40,
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
