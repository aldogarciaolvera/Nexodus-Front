import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Keyboard, Platform, ActivityIndicator, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from '../../utils/ThemeContext';
import { ThemeColors } from '../../utils/theme';
import { ArrowLeft, Plus, Save, Sparkles, Flame, HeartPulse } from 'lucide-react-native';
import { useAlertStore, AlertState } from '../../store/alertStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { gymService, Exercise, CreateRoutineRequest, GeneratedAiRoutineResponse, WarmupExercise } from '../../services/gym.service';
import { UserService } from '../../services/user.service';
import { calculateRecommendedWeight } from '../../utils/weightRecommendation';
import { ExercisePickerModal } from './components/ExercisePickerModal';
import { RoutineExerciseItem, RoutineExerciseForm } from './components/RoutineExerciseItem';
import { RoutineAiModal } from './components/RoutineAiModal';
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

const DIFFICULTIES = ['Principiante', 'Intermedio', 'Avanzado'];

const mapDifficultyToWeightLevel = (difficulty: string): 'Beginner' | 'Intermediate' | 'Advanced' => {
  const lower = (difficulty || '').toLowerCase();
  if (lower.includes('avanz') || lower.includes('advanc')) return 'Advanced';
  if (lower.includes('inter')) return 'Intermediate';
  return 'Beginner';
};

export const CreateRoutineScreen = () => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);
  const navigation = useNavigation();
  const route = useRoute<RouteProp<{ params: { routineId?: string } }>>();
  const routineId = route.params?.routineId;
  
  const showAlert = useAlertStore((state: AlertState) => state.showAlert);
  const hideAlert = useAlertStore((state: AlertState) => state.hideAlert);
  const queryClient = useQueryClient();
  const scrollViewRef = useRef<React.ComponentRef<typeof ScrollView>>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [difficultyLevel, setDifficultyLevel] = useState('Intermedio');
  const [isAiGenerated, setIsAiGenerated] = useState(false);
  const [warmupMinutes, setWarmupMinutes] = useState<number>(0);
  const [warmupExercises, setWarmupExercises] = useState<WarmupExercise[]>([]);
  const [includeCardio, setIncludeCardio] = useState(false);
  const [cardioMinutes, setCardioMinutes] = useState<number>(15);
  const [cardioType, setCardioType] = useState('');
  const [exercises, setExercises] = useState<RoutineExerciseForm[]>([]);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [targetDay, setTargetDay] = useState<number | undefined>(undefined);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => setKeyboardHeight(e.endCoordinates.height));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleFocusField = (offsetY: number) => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: offsetY, animated: true });
    }, 120);
  };

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
      setDifficultyLevel(
        DIFFICULTIES.includes(existingRoutine.difficultyLevel)
          ? existingRoutine.difficultyLevel
          : 'Intermedio'
      );
      setIsAiGenerated(Boolean(existingRoutine.isAiGenerated));
      setWarmupMinutes(existingRoutine.warmupMinutes || 0);
      setWarmupExercises(existingRoutine.warmupExercises || []);
      setIncludeCardio(Boolean(existingRoutine.includeCardio));
      setCardioMinutes(existingRoutine.cardioMinutes || 15);
      setCardioType(existingRoutine.cardioType || '');
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

  const isPersistedAiRoutine = Boolean(routineId && existingRoutine?.isAiGenerated);
  const canUseAiGenerator = !isPersistedAiRoutine;

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
      name: name.trim(),
      description: description.trim(),
      difficultyLevel,
      targetDay,
      isAiGenerated,
      warmupMinutes: warmupMinutes > 0 ? warmupMinutes : undefined,
      warmupExercises: warmupMinutes > 0 && warmupExercises.length > 0 ? warmupExercises : undefined,
      includeCardio,
      cardioMinutes: includeCardio ? cardioMinutes : undefined,
      cardioType: includeCardio && cardioType.trim() ? cardioType.trim() : undefined,
      exercises: exercises.map(e => ({
        exerciseId: e.exerciseId,
        sets: e.sets,
        reps: e.reps,
        weight: e.weight || 0,
        restTimeInSeconds: e.restTimeInSeconds
      }))
    });
  };

  const buildAiExercisesForm = (generated: GeneratedAiRoutineResponse): RoutineExerciseForm[] => {
    const weightLevel = mapDifficultyToWeightLevel(generated.difficultyLevel || difficultyLevel);

    return generated.exercises.map((aiEx) => {
      const foundEx = availableExercises.find((e: Exercise) => e.id === aiEx.exerciseId);
      const rec = calculateRecommendedWeight(
        foundEx || {
          name: aiEx.name,
          muscle: aiEx.muscle,
          bodyPart: aiEx.bodyPart,
          equipment: aiEx.equipment,
        },
        profile?.weight,
        profile?.height,
        weightLevel
      );

      return {
        id: generateTempId(),
        exerciseId: aiEx.exerciseId,
        name: foundEx?.name || aiEx.name,
        thumbUrl: foundEx?.thumbUrl || foundEx?.gifUrl || aiEx.thumbUrl,
        sets: aiEx.sets,
        reps: aiEx.reps,
        weight: rec.weight,
        restTimeInSeconds: aiEx.restTimeInSeconds,
        muscle: foundEx?.muscle || aiEx.muscle || foundEx?.targetMuscleGroup,
        bodyPart: foundEx?.bodyPart || aiEx.bodyPart,
        equipment: foundEx?.equipment || aiEx.equipment,
      };
    });
  };

  const applyAiRoutine = (generated: GeneratedAiRoutineResponse, mode: 'replace' | 'append') => {
    const mapped = buildAiExercisesForm(generated);

    if (mode === 'replace') {
      setName(generated.name || name);
      setDescription(generated.description || description);
      if (DIFFICULTIES.includes(generated.difficultyLevel)) {
        setDifficultyLevel(generated.difficultyLevel);
      }
      setWarmupMinutes(generated.warmupMinutes || 0);
      setWarmupExercises(generated.warmupExercises || []);
      setIncludeCardio(Boolean(generated.includeCardio));
      setCardioMinutes(generated.cardioMinutes || 15);
      setCardioType(generated.cardioType || '');
      setExercises(mapped);
    } else {
      if (!name.trim() && generated.name) setName(generated.name);
      if (!description.trim() && generated.description) setDescription(generated.description);
      if (generated.warmupMinutes && !warmupMinutes) {
        setWarmupMinutes(generated.warmupMinutes);
        setWarmupExercises(generated.warmupExercises || []);
      }
      if (generated.includeCardio && !includeCardio) {
        setIncludeCardio(true);
        setCardioMinutes(generated.cardioMinutes || 15);
        setCardioType(generated.cardioType || '');
      }
      setExercises((prev) => [
        ...prev,
        ...mapped.filter((m) => !prev.some((p) => p.exerciseId === m.exerciseId)),
      ]);
    }

    setIsAiGenerated(true);
    showAlert(
      'Rutina Aplicada',
      'Puedes ajustar series, repeticiones, descansos o pesos antes de guardar.',
      'success'
    );
  };

  const handleApplyAiRoutine = (generated: GeneratedAiRoutineResponse) => {
    if (exercises.length > 0) {
      showAlert({
        title: 'Aplicar Rutina con IA',
        message: 'Ya tienes ejercicios en esta rutina. ¿Deseas reemplazarlos o añadir los nuevos al final?',
        type: 'info',
        buttons: [
          {
            text: 'Añadir al final',
            style: 'cancel',
            onPress: () => {
              hideAlert();
              applyAiRoutine(generated, 'append');
            },
          },
          {
            text: 'Reemplazar',
            style: 'default',
            onPress: () => {
              hideAlert();
              applyAiRoutine(generated, 'replace');
            },
          },
        ],
      });
    } else {
      applyAiRoutine(generated, 'replace');
    }
  };

  const handleConfirmAddExercises = (selectedList: Exercise[]) => {
    const weightLevel = mapDifficultyToWeightLevel(difficultyLevel);
    const newExercises = selectedList
      .filter(ex => !exercises.some(e => e.exerciseId === ex.id))
      .map(ex => {
        const rec = calculateRecommendedWeight(
          ex,
          profile?.weight,
          profile?.height,
          weightLevel
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
          <View style={styles.originBadge}>
            {isAiGenerated ? (
              <>
                <Sparkles color={theme.colors.neonCyan} size={11} />
                <Text style={styles.originBadgeTextAi}>IA</Text>
              </>
            ) : (
              <Text style={styles.originBadgeTextManual}>MANUAL</Text>
            )}
          </View>
        </View>

        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom: keyboardHeight > 0 ? keyboardHeight + 80 : 40,
              justifyContent: 'flex-start',
            },
          ]}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets={true}
          keyboardDismissMode="on-drag"
        >
          {/* AI Coach Banner or Locked Notice */}
          {canUseAiGenerator ? (
            <TouchableOpacity
              style={styles.aiBannerBtn}
              activeOpacity={0.85}
              onPress={() => setShowAiModal(true)}
              accessibilityRole="button"
              accessibilityLabel="Generar rutina con inteligencia artificial"
            >
              <View style={styles.aiBannerIcon}>
                <Sparkles color={theme.colors.neonCyan} size={18} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.aiBannerTitle}>Generar con IA</Text>
                <Text style={styles.aiBannerSub}>
                  Crea series, reps y descansos con los ejercicios de tu BD
                </Text>
              </View>
              <Text style={styles.aiBannerArrow}>→</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.aiLockedCard}>
              <Sparkles color={theme.colors.neonCyan} size={16} />
              <Text style={styles.aiLockedText}>
                Rutina creada con IA. Puedes ajustar valores manualmente; si deseas otra propuesta de IA, crea una rutina nueva.
              </Text>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>NOMBRE DE LA RUTINA</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. Dia de Pecho..."
              placeholderTextColor={theme.colors.mutedText}
              value={name}
              onChangeText={setName}
              onFocus={() => handleFocusField(80)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>DESCRIPCIÓN (Opcional)</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              placeholder="Ej. Rutina enfocada en pecho y tríceps..."
              placeholderTextColor={theme.colors.mutedText}
              multiline
              numberOfLines={3}
              value={description}
              onChangeText={setDescription}
              onFocus={() => handleFocusField(170)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>NIVEL DE DIFICULTAD</Text>
            <View style={styles.difficultyRow}>
              {DIFFICULTIES.map(lvl => (
                <TouchableOpacity
                  key={lvl}
                  style={[
                    styles.difficultyPill,
                    difficultyLevel === lvl && styles.difficultyPillActive
                  ]}
                  onPress={() => setDifficultyLevel(lvl)}
                >
                  <Text style={[
                    styles.difficultyPillText,
                    difficultyLevel === lvl && styles.difficultyPillTextActive
                  ]}>{lvl}</Text>
                </TouchableOpacity>
              ))}
            </View>
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

          {/* Warmup & Cardio Configuration */}
          <View style={styles.inputGroup}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Flame color={theme.colors.neonCyan} size={14} />
              <Text style={[styles.label, { marginBottom: 0 }]}>CALENTAMIENTO</Text>
            </View>
            <View style={styles.difficultyRow}>
              {[0, 5, 10, 15].map(mins => (
                <TouchableOpacity
                  key={mins}
                  style={[
                    styles.difficultyPill,
                    warmupMinutes === mins && styles.difficultyPillActive
                  ]}
                  onPress={() => setWarmupMinutes(mins)}
                >
                  <Text style={[
                    styles.difficultyPillText,
                    warmupMinutes === mins && styles.difficultyPillTextActive
                  ]}>{mins === 0 ? 'Sin' : `${mins} min`}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {warmupMinutes > 0 && warmupExercises.length > 0 && (
              <View style={styles.warmupListBox}>
                {warmupExercises.map((w, idx) => (
                  <Text key={`w_${idx}`} style={styles.warmupItemText}>
                    • {w.name} ({w.durationSeconds}s)
                  </Text>
                ))}
              </View>
            )}
          </View>

          <View style={[styles.inputGroup, styles.cardioToggleCard]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <HeartPulse color={theme.colors.neonCyan} size={16} />
              <View style={{ flex: 1 }}>
                <Text style={styles.cardioToggleTitle}>¿Incluir cardio en esta rutina?</Text>
                <Text style={styles.cardioToggleSub}>
                  {includeCardio ? `${cardioMinutes} min ${cardioType ? `• ${cardioType}` : ''}` : 'Opcional al finalizar pesas'}
                </Text>
              </View>
              <Switch
                value={includeCardio}
                onValueChange={setIncludeCardio}
                trackColor={{ false: theme.colors.borderGlow, true: 'rgba(0, 240, 255, 0.35)' }}
                thumbColor={includeCardio ? theme.colors.neonCyan : theme.colors.mutedText}
              />
            </View>
            {includeCardio && (
              <View style={{ marginTop: 12, gap: 10 }}>
                <View style={styles.difficultyRow}>
                  {[10, 15, 20, 30].map(mins => (
                    <TouchableOpacity
                      key={mins}
                      style={[
                        styles.difficultyPill,
                        { paddingVertical: 8 },
                        cardioMinutes === mins && styles.difficultyPillActive
                      ]}
                      onPress={() => setCardioMinutes(mins)}
                    >
                      <Text style={[
                        styles.difficultyPillText,
                        cardioMinutes === mins && styles.difficultyPillTextActive
                      ]}>{mins}m</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  style={[styles.input, { padding: 12 }]}
                  placeholder="Tipo de cardio (ej. Caminadora inclinada, Trote suave...)"
                  placeholderTextColor={theme.colors.mutedText}
                  value={cardioType}
                  onChangeText={setCardioType}
                  onFocus={() => handleFocusField(380)}
                />
              </View>
            )}
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
              mapDifficultyToWeightLevel(difficultyLevel)
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

      <RoutineAiModal
        visible={showAiModal}
        onClose={() => setShowAiModal(false)}
        onApply={handleApplyAiRoutine}
        initialRoutineName={name}
        initialDescription={description}
        initialDifficulty={difficultyLevel}
        userWeightKg={profile?.weight}
        userHeightM={profile?.height}
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
  originBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  originBadgeTextAi: {
    fontFamily: 'JetBrainsMono_600SemiBold',
    fontSize: 10,
    color: colors.neonCyan,
    letterSpacing: 0.8,
  },
  originBadgeTextManual: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 10,
    color: colors.mutedText,
    letterSpacing: 0.8,
  },
  aiBannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(0, 240, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.35)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 22,
  },
  aiBannerIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiBannerTitle: {
    fontFamily: 'Geist_700Bold',
    fontSize: 15,
    color: colors.text,
  },
  aiBannerSub: {
    fontFamily: 'Geist_400Regular',
    fontSize: 12,
    color: colors.mutedText,
    marginTop: 2,
  },
  aiBannerArrow: {
    fontFamily: 'JetBrainsMono_600SemiBold',
    fontSize: 16,
    color: colors.neonCyan,
  },
  aiLockedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    borderRadius: 14,
    padding: 14,
    marginBottom: 22,
  },
  aiLockedText: {
    flex: 1,
    fontFamily: 'Geist_400Regular',
    fontSize: 12,
    color: colors.mutedText,
    lineHeight: 18,
  },
  difficultyRow: {
    flexDirection: 'row',
    gap: 8,
  },
  difficultyPill: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  difficultyPillActive: {
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    borderColor: colors.neonCyan,
  },
  difficultyPillText: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 13,
    color: colors.mutedText,
  },
  difficultyPillTextActive: {
    color: colors.neonCyan,
  },
  warmupListBox: {
    marginTop: 10,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    padding: 12,
    gap: 6,
  },
  warmupItemText: {
    fontFamily: 'Geist_400Regular',
    fontSize: 12,
    color: colors.mutedText,
    lineHeight: 18,
  },
  cardioToggleCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    padding: 14,
  },
  cardioToggleTitle: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 14,
    color: colors.text,
  },
  cardioToggleSub: {
    fontFamily: 'Geist_400Regular',
    fontSize: 12,
    color: colors.mutedText,
    marginTop: 2,
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
