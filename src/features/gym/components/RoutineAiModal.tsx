import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import {
  X,
  Sparkles,
  Clock,
  Dumbbell,
  ShieldAlert,
  Check,
  RefreshCw,
  Zap,
  Ban,
  Flame,
  HeartPulse,
} from 'lucide-react-native';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTheme } from '../../../utils/ThemeContext';
import { ThemeColors } from '../../../utils/theme';
import { useAlertStore } from '../../../store/alertStore';
import { useEquipmentStore } from '../../../store/equipmentStore';
import {
  gymService,
  AiRoutineGoal,
  GenerateAiRoutineRequest,
  GeneratedAiRoutineResponse,
} from '../../../services/gym.service';
import { Skeleton } from '../../../components/Skeleton';
import { translateBodyPart, translateMuscle } from '../../../utils/gymTranslations';

interface RoutineAiModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (generated: GeneratedAiRoutineResponse) => void;
  initialRoutineName?: string;
  initialDescription?: string;
  initialDifficulty?: string;
  userWeightKg?: number;
  userHeightM?: number;
}

const QUICK_PROMPTS = [
  'Push (Pecho, Hombro, Tríceps)',
  'Pull (Espalda y Bíceps)',
  'Pierna Completa',
  'Torso (Upper Body)',
  'Full Body',
  'Pecho y Tríceps',
  'Espalda y Bíceps',
  'Glúteo y Femoral',
];

const GOALS: { label: string; value: AiRoutineGoal; hint: string }[] = [
  { label: 'Hipertrofia', value: 'Hypertrophy', hint: '8-12 reps • 60-120s' },
  { label: 'Fuerza', value: 'Strength', hint: '3-6 reps • 150-180s' },
  { label: 'Resistencia', value: 'Endurance', hint: '15-20 reps • 30-60s' },
  { label: 'Mixto', value: 'Mixed', hint: 'Compuestos + Aislamiento' },
];

const DIFFICULTIES = ['Principiante', 'Intermedio', 'Avanzado'];

const DURATIONS = [30, 45, 60, 75];
const WARMUP_OPTIONS = [0, 5, 10, 15];
const CARDIO_DURATIONS = [10, 15, 20, 30];

export const RoutineAiModal: React.FC<RoutineAiModalProps> = ({
  visible,
  onClose,
  onApply,
  initialRoutineName = '',
  initialDescription = '',
  initialDifficulty = 'Intermedio',
  userWeightKg,
  userHeightM,
}) => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);
  const showAlert = useAlertStore((state) => state.showAlert);
  const scrollViewRef = useRef<React.ComponentRef<typeof ScrollView>>(null);

  const { getActiveProfile, initialized, initialize, excludedExerciseIds, excludeExercise } = useEquipmentStore();

  const [prompt, setPrompt] = useState('');
  const [goal, setGoal] = useState<AiRoutineGoal>('Hypertrophy');
  const [difficultyLevel, setDifficultyLevel] = useState('Intermedio');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [warmupMinutes, setWarmupMinutes] = useState(5);
  const [includeCardio, setIncludeCardio] = useState(false);
  const [cardioMinutes, setCardioMinutes] = useState(15);
  const [respectEquipment, setRespectEquipment] = useState(true);
  const [considerRecovery, setConsiderRecovery] = useState(true);
  const [generatedRoutine, setGeneratedRoutine] = useState<GeneratedAiRoutineResponse | null>(null);
  const [swappingExerciseId, setSwappingExerciseId] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (!initialized) {
      initialize();
    }
  }, [initialized, initialize]);

  useEffect(() => {
    if (visible) {
      const basePrompt = [initialRoutineName?.trim(), initialDescription?.trim()]
        .filter(Boolean)
        .join(' — ');
      setPrompt(basePrompt);
      setDifficultyLevel(
        DIFFICULTIES.includes(initialDifficulty) ? initialDifficulty : 'Intermedio'
      );
      setGeneratedRoutine(null);
    }
  }, [visible, initialRoutineName, initialDescription, initialDifficulty]);

  // Dynamic keyboard height tracking (Safe Keyboard Pattern)
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleFocusField = (offsetY: number) => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        y: offsetY,
        animated: true,
      });
    }, 120);
  };

  const { data: recoveryList = [] } = useQuery({
    queryKey: ['muscleRecovery'],
    queryFn: gymService.getMuscleRecoveryStatus,
    enabled: visible,
    staleTime: 5 * 60 * 1000,
  });

  const fatiguedMuscles = recoveryList
    .filter((m) => m.status === 'Fatigued' || m.recoveryPercentage < 50)
    .map((m) => m.muscleGroup);

  const activeEquipmentProfile = getActiveProfile();

  const generateMutation = useMutation({
    mutationFn: (req: GenerateAiRoutineRequest) => gymService.generateAiRoutine(req),
    onSuccess: (data) => {
      setGeneratedRoutine(data);
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      }, 100);
    },
    onError: (e: Error) => {
      showAlert(
        'Error del Coach IA',
        e?.message || 'No se pudo diseñar la rutina. Intenta nuevamente.',
        'error'
      );
    },
  });

  const handleGenerate = () => {
    Keyboard.dismiss();
    const trimmedPrompt = prompt.trim();
    const trimmedName = initialRoutineName.trim();

    if (!trimmedPrompt && !trimmedName) {
      showAlert(
        'Indica tu enfoque',
        'Escribe qué quieres entrenar o selecciona un enfoque rápido para generar la rutina.',
        'info'
      );
      return;
    }

    generateMutation.mutate({
      prompt: trimmedPrompt || undefined,
      routineName: trimmedName || undefined,
      goal,
      difficultyLevel,
      durationMinutes,
      availableEquipment: respectEquipment ? activeEquipmentProfile.availableEquipment : undefined,
      considerMuscleRecovery: considerRecovery,
      avoidMuscles: considerRecovery && fatiguedMuscles.length > 0 ? fatiguedMuscles : undefined,
      userWeightKg,
      userHeightM,
      excludedExerciseIds: excludedExerciseIds.length > 0 ? excludedExerciseIds : undefined,
      warmupMinutes: warmupMinutes > 0 ? warmupMinutes : undefined,
      includeCardio,
      cardioMinutes: includeCardio ? cardioMinutes : undefined,
    });
  };

  const handleSwapExercise = async (exerciseIdToReplace: string) => {
    if (!generatedRoutine || swappingExerciseId) return;
    setSwappingExerciseId(exerciseIdToReplace);
    try {
      await excludeExercise(exerciseIdToReplace);
      const updatedExcluded = Array.from(new Set([...excludedExerciseIds, exerciseIdToReplace]));
      const replacement = await gymService.swapAiExercise({
        exerciseIdToReplace,
        currentRoutineExerciseIds: generatedRoutine.exercises.map((e) => e.exerciseId),
        excludedExerciseIds: updatedExcluded,
        availableEquipment: respectEquipment ? activeEquipmentProfile.availableEquipment : undefined,
        goal,
        difficultyLevel,
        routineName: generatedRoutine.name,
      });

      setGeneratedRoutine((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          exercises: prev.exercises.map((ex) =>
            ex.exerciseId === exerciseIdToReplace ? replacement : ex
          ),
        };
      });
      showAlert(
        'Ejercicio Reemplazado',
        `Descartamos esa máquina de tus recomendaciones y la cambiamos por "${replacement.name}".`,
        'success'
      );
    } catch (e: any) {
      showAlert(
        'No se pudo reemplazar',
        e?.message || 'No encontramos un ejercicio equivalente disponible.',
        'error'
      );
    } finally {
      setSwappingExerciseId(null);
    }
  };

  const handleApply = () => {
    if (!generatedRoutine) return;
    onApply(generatedRoutine);
    onClose();
  };

  const handleClose = () => {
    if (generateMutation.isPending) return;
    setGeneratedRoutine(null);
    onClose();
  };

  if (!visible) return null;

  const selectedGoalObj = GOALS.find((g) => g.value === goal);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View style={styles.aiIconBadge}>
              <Sparkles color={theme.colors.neonCyan} size={18} />
            </View>
            <View>
              <Text style={styles.headerEyebrow}>NEXODUS COACH IA</Text>
              <Text style={styles.headerTitle}>Diseñar Rutina Inteligente</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={handleClose}
            style={styles.closeBtn}
            accessibilityRole="button"
            accessibilityLabel="Cerrar generador de rutinas con IA"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <X color={theme.colors.mutedText} size={22} />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          style={styles.flex1}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            ref={scrollViewRef}
            style={styles.flex1}
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
            {/* Loading State with Skeletons */}
            {generateMutation.isPending ? (
              <View style={styles.loadingContainer}>
                <View style={styles.loadingBanner}>
                  <Sparkles color={theme.colors.neonCyan} size={18} />
                  <Text style={styles.loadingBannerText}>
                    Analizando tu catálogo de ejercicios, series y descansos óptimos...
                  </Text>
                </View>
                <Skeleton width="70%" height={24} borderRadius={8} />
                <Skeleton width="100%" height={68} borderRadius={16} />
                <Skeleton width="100%" height={86} borderRadius={16} />
                <Skeleton width="100%" height={86} borderRadius={16} />
                <Skeleton width="100%" height={86} borderRadius={16} />
                <Skeleton width="100%" height={86} borderRadius={16} />
              </View>
            ) : generatedRoutine ? (
              /* Preview State */
              <View style={styles.previewContainer}>
                <View style={styles.previewSummaryCard}>
                  <View style={styles.previewBadgesRow}>
                    <View style={styles.cyanPill}>
                      <Sparkles color={theme.colors.neonCyan} size={12} />
                      <Text style={styles.cyanPillText}>GENERADA CON IA</Text>
                    </View>
                    <View style={styles.metaPill}>
                      <Clock color={theme.colors.mutedText} size={12} />
                      <Text style={styles.metaPillText}>
                        ~{generatedRoutine.estimatedDurationMinutes} MIN
                      </Text>
                    </View>
                    <View style={styles.metaPill}>
                      <Text style={styles.metaPillText}>
                        {generatedRoutine.difficultyLevel.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.previewTitle}>{generatedRoutine.name}</Text>
                  {Boolean(generatedRoutine.description) && (
                    <Text style={styles.previewDescription}>
                      {generatedRoutine.description}
                    </Text>
                  )}

                  {Boolean(generatedRoutine.rationale) && (
                    <View style={styles.rationaleBox}>
                      <Zap color={theme.colors.neonCyan} size={14} style={{ marginTop: 2 }} />
                      <Text style={styles.rationaleText}>{generatedRoutine.rationale}</Text>
                    </View>
                  )}
                </View>

                {/* Warmup Block Preview */}
                {Boolean(generatedRoutine.warmupMinutes && generatedRoutine.warmupMinutes > 0) && (
                  <View style={styles.extraBlockCard}>
                    <View style={styles.extraBlockHeader}>
                      <Flame color={theme.colors.neonCyan} size={15} />
                      <Text style={styles.extraBlockTitle}>
                        CALENTAMIENTO ({generatedRoutine.warmupMinutes} MIN)
                      </Text>
                    </View>
                    {generatedRoutine.warmupExercises && generatedRoutine.warmupExercises.length > 0 ? (
                      generatedRoutine.warmupExercises.map((w, wIdx) => (
                        <View key={`warmup_${wIdx}`} style={styles.warmupRow}>
                          <Text style={styles.warmupName}>{w.name}</Text>
                          <Text style={styles.warmupMeta}>
                            {w.durationSeconds}s{w.focus ? ` • ${w.focus}` : ''}
                          </Text>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.warmupMeta}>
                        Movilidad articular y series de aproximación antes del primer ejercicio.
                      </Text>
                    )}
                  </View>
                )}

                <Text style={styles.sectionLabel}>
                  EJERCICIOS SELECCIONADOS ({generatedRoutine.exercises.length})
                </Text>

                {generatedRoutine.exercises.map((ex, idx) => {
                  const subLabel = [
                    translateBodyPart(ex.bodyPart),
                    translateMuscle(ex.muscle),
                  ]
                    .filter(Boolean)
                    .join(' • ');
                  const isSwapping = swappingExerciseId === ex.exerciseId;

                  return (
                    <View key={`${ex.exerciseId}_${idx}`} style={styles.previewExCard}>
                      <View style={styles.previewExTop}>
                        {ex.thumbUrl ? (
                          <Image source={{ uri: ex.thumbUrl }} style={styles.previewThumb} />
                        ) : (
                          <View style={styles.previewThumbFallback}>
                            <Dumbbell color={theme.colors.neonCyan} size={18} />
                          </View>
                        )}
                        <View style={styles.flex1}>
                          <Text style={styles.previewExName}>
                            {idx + 1}. {ex.name}
                          </Text>
                          {Boolean(subLabel) && (
                            <Text style={styles.previewExSub}>{subLabel}</Text>
                          )}
                        </View>
                      </View>

                      <View style={styles.previewMetricsRow}>
                        <View style={styles.metricTag}>
                          <Text style={styles.metricTagValue}>
                            {ex.sets} × {ex.reps}
                          </Text>
                          <Text style={styles.metricTagLabel}>SERIES × REPS</Text>
                        </View>
                        <View style={styles.metricTag}>
                          <Text style={styles.metricTagValue}>{ex.restTimeInSeconds}s</Text>
                          <Text style={styles.metricTagLabel}>DESCANSO</Text>
                        </View>
                      </View>

                      {Boolean(ex.notes) && (
                        <Text style={styles.previewExNotes}>{ex.notes}</Text>
                      )}

                      <TouchableOpacity
                        style={styles.swapBtn}
                        onPress={() => handleSwapExercise(ex.exerciseId)}
                        disabled={Boolean(swappingExerciseId)}
                        activeOpacity={0.75}
                      >
                        {isSwapping ? (
                          <ActivityIndicator size="small" color={theme.colors.neonCyan} />
                        ) : (
                          <>
                            <Ban color={theme.colors.mutedText} size={13} />
                            <Text style={styles.swapBtnText}>
                              No tengo esta máquina • Cambiar por equivalente
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  );
                })}

                {/* Cardio Block Preview */}
                {Boolean(generatedRoutine.includeCardio) && (
                  <View style={styles.extraBlockCard}>
                    <View style={styles.extraBlockHeader}>
                      <HeartPulse color={theme.colors.neonCyan} size={15} />
                      <Text style={styles.extraBlockTitle}>
                        CARDIO FINAL ({generatedRoutine.cardioMinutes || 15} MIN)
                      </Text>
                    </View>
                    <Text style={styles.warmupName}>
                      {generatedRoutine.cardioType || 'Cardio moderado al finalizar pesas'}
                    </Text>
                  </View>
                )}

                <View style={styles.previewActions}>
                  <TouchableOpacity
                    style={styles.secondaryBtn}
                    onPress={handleGenerate}
                    activeOpacity={0.8}
                  >
                    <RefreshCw color={theme.colors.text} size={18} />
                    <Text style={styles.secondaryBtnText}>Regenerar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={handleApply}
                    activeOpacity={0.85}
                  >
                    <Check color={theme.colors.obsidian} size={18} />
                    <Text style={styles.primaryBtnText}>Aplicar Rutina</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.editParamsLink}
                  onPress={() => setGeneratedRoutine(null)}
                >
                  <Text style={styles.editParamsLinkText}>
                    Ajustar parámetros de generación
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* Configuration Form State */
              <View style={styles.formContainer}>
                <View style={styles.inputGroup}>
                  <Text style={styles.sectionLabel}>¿QUÉ QUIERES ENTRENAR?</Text>
                  <TextInput
                    style={[styles.textInput, styles.textArea]}
                    placeholder="Ej. Pecho y tríceps enfoque parte superior, o Pierna sin sobrecargar espalda baja..."
                    placeholderTextColor={theme.colors.mutedText}
                    multiline
                    numberOfLines={3}
                    value={prompt}
                    onChangeText={setPrompt}
                    onFocus={() => handleFocusField(0)}
                  />
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chipsScroll}
                  >
                    {QUICK_PROMPTS.map((chip) => {
                      const isActive = prompt.trim().toLowerCase() === chip.toLowerCase();
                      return (
                        <TouchableOpacity
                          key={chip}
                          style={[styles.chipPill, isActive && styles.chipPillActive]}
                          onPress={() => setPrompt(chip)}
                        >
                          <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                            {chip}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Goal */}
                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Text style={styles.sectionLabel}>OBJETIVO</Text>
                    {selectedGoalObj && (
                      <Text style={styles.labelHint}>{selectedGoalObj.hint}</Text>
                    )}
                  </View>
                  <View style={styles.pillsWrap}>
                    {GOALS.map((g) => {
                      const active = goal === g.value;
                      return (
                        <TouchableOpacity
                          key={g.value}
                          style={[styles.optionPill, active && styles.optionPillActive]}
                          onPress={() => setGoal(g.value)}
                        >
                          <Text style={[styles.optionPillText, active && styles.optionPillTextActive]}>
                            {g.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Difficulty */}
                <View style={styles.inputGroup}>
                  <Text style={styles.sectionLabel}>NIVEL DE DIFICULTAD</Text>
                  <View style={styles.pillsRow}>
                    {DIFFICULTIES.map((lvl) => {
                      const active = difficultyLevel === lvl;
                      return (
                        <TouchableOpacity
                          key={lvl}
                          style={[
                            styles.optionPill,
                            styles.flex1,
                            active && styles.optionPillActive,
                          ]}
                          onPress={() => setDifficultyLevel(lvl)}
                        >
                          <Text style={[styles.optionPillText, active && styles.optionPillTextActive]}>
                            {lvl}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Duration */}
                <View style={styles.inputGroup}>
                  <Text style={styles.sectionLabel}>DURACIÓN ESTIMADA</Text>
                  <View style={styles.pillsRow}>
                    {DURATIONS.map((mins) => {
                      const active = durationMinutes === mins;
                      return (
                        <TouchableOpacity
                          key={mins}
                          style={[
                            styles.optionPill,
                            styles.flex1,
                            active && styles.optionPillActive,
                          ]}
                          onPress={() => setDurationMinutes(mins)}
                        >
                          <Text
                            style={[
                              styles.durationPillText,
                              active && styles.optionPillTextActive,
                            ]}
                          >
                            {mins}m
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Warmup Time */}
                <View style={styles.inputGroup}>
                  <Text style={styles.sectionLabel}>TIEMPO DE CALENTAMIENTO</Text>
                  <View style={styles.pillsRow}>
                    {WARMUP_OPTIONS.map((mins) => {
                      const active = warmupMinutes === mins;
                      return (
                        <TouchableOpacity
                          key={mins}
                          style={[
                            styles.optionPill,
                            styles.flex1,
                            active && styles.optionPillActive,
                          ]}
                          onPress={() => setWarmupMinutes(mins)}
                        >
                          <Text
                            style={[
                              styles.durationPillText,
                              active && styles.optionPillTextActive,
                            ]}
                          >
                            {mins === 0 ? 'Sin' : `${mins}m`}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Smart Context Toggles */}
                <View style={styles.togglesCard}>
                  <View style={styles.toggleRow}>
                    <View style={styles.toggleIconBox}>
                      <HeartPulse color={theme.colors.neonCyan} size={16} />
                    </View>
                    <View style={styles.flex1}>
                      <Text style={styles.toggleTitle}>¿Hacer cardio en esta rutina?</Text>
                      <Text style={styles.toggleSub}>
                        {includeCardio
                          ? `Incluye ${cardioMinutes} min de cardio sugerido al finalizar`
                          : 'Solo entrenamiento de fuerza'}
                      </Text>
                    </View>
                    <Switch
                      value={includeCardio}
                      onValueChange={setIncludeCardio}
                      trackColor={{
                        false: theme.colors.borderGlow,
                        true: 'rgba(0, 240, 255, 0.35)',
                      }}
                      thumbColor={
                        includeCardio ? theme.colors.neonCyan : theme.colors.mutedText
                      }
                    />
                  </View>

                  {includeCardio && (
                    <View style={styles.pillsRow}>
                      {CARDIO_DURATIONS.map((mins) => {
                        const active = cardioMinutes === mins;
                        return (
                          <TouchableOpacity
                            key={mins}
                            style={[
                              styles.optionPill,
                              styles.flex1,
                              { paddingVertical: 8 },
                              active && styles.optionPillActive,
                            ]}
                            onPress={() => setCardioMinutes(mins)}
                          >
                            <Text
                              style={[
                                styles.durationPillText,
                                active && styles.optionPillTextActive,
                              ]}
                            >
                              {mins}m
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}

                  <View style={styles.toggleDivider} />
                  <View style={styles.toggleRow}>
                    <View style={styles.toggleIconBox}>
                      <Dumbbell color={theme.colors.neonCyan} size={16} />
                    </View>
                    <View style={styles.flex1}>
                      <Text style={styles.toggleTitle}>Respetar mi equipamiento</Text>
                      <Text style={styles.toggleSub}>
                        {activeEquipmentProfile.name} • {activeEquipmentProfile.availableEquipment.length} equipos
                      </Text>
                    </View>
                    <Switch
                      value={respectEquipment}
                      onValueChange={setRespectEquipment}
                      trackColor={{
                        false: theme.colors.borderGlow,
                        true: 'rgba(0, 240, 255, 0.35)',
                      }}
                      thumbColor={
                        respectEquipment ? theme.colors.neonCyan : theme.colors.mutedText
                      }
                    />
                  </View>

                  <View style={styles.toggleDivider} />

                  <View style={styles.toggleRow}>
                    <View style={styles.toggleIconBox}>
                      <ShieldAlert color={theme.colors.neonCyan} size={16} />
                    </View>
                    <View style={styles.flex1}>
                      <Text style={styles.toggleTitle}>Considerar músculos fatigados</Text>
                      <Text style={styles.toggleSub}>
                        {fatiguedMuscles.length > 0
                          ? `Evitar fatiga en: ${fatiguedMuscles.map((m) => translateMuscle(m) || m).join(', ')}`
                          : 'Todos tus grupos musculares están recuperados'}
                      </Text>
                    </View>
                    <Switch
                      value={considerRecovery}
                      onValueChange={setConsiderRecovery}
                      trackColor={{
                        false: theme.colors.borderGlow,
                        true: 'rgba(0, 240, 255, 0.35)',
                      }}
                      thumbColor={
                        considerRecovery ? theme.colors.neonCyan : theme.colors.mutedText
                      }
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.generateBtn}
                  onPress={handleGenerate}
                  disabled={generateMutation.isPending}
                  activeOpacity={0.85}
                >
                  {generateMutation.isPending ? (
                    <ActivityIndicator color={theme.colors.obsidian} />
                  ) : (
                    <>
                      <Sparkles color={theme.colors.obsidian} size={18} />
                      <Text style={styles.generateBtnText}>Generar Rutina con IA</Text>
                    </>
                  )}
                </TouchableOpacity>

                <Text style={styles.disclaimerText}>
                  Todos los ejercicios se seleccionan exclusivamente desde tu catálogo real en la base de datos.
                </Text>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.obsidian,
    },
    flex1: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderGlow,
    },
    headerTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    aiIconBadge: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: 'rgba(0, 240, 255, 0.1)',
      borderWidth: 1,
      borderColor: 'rgba(0, 240, 255, 0.35)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerEyebrow: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 10,
      color: colors.neonCyan,
      letterSpacing: 1,
    },
    headerTitle: {
      fontFamily: 'Geist_700Bold',
      fontSize: 17,
      color: colors.text,
    },
    closeBtn: {
      padding: 6,
    },
    scrollContent: {
      padding: 20,
    },
    formContainer: {
      gap: 20,
    },
    inputGroup: {
      gap: 10,
    },
    labelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    sectionLabel: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 11,
      color: colors.mutedText,
      letterSpacing: 0.9,
    },
    labelHint: {
      fontFamily: 'JetBrainsMono_400Regular',
      fontSize: 11,
      color: colors.neonCyan,
    },
    textInput: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      borderRadius: 14,
      padding: 14,
      color: colors.text,
      fontFamily: 'Geist_400Regular',
      fontSize: 15,
    },
    textArea: {
      minHeight: 84,
      textAlignVertical: 'top',
    },
    chipsScroll: {
      gap: 8,
      paddingTop: 4,
    },
    chipPill: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 999,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderGlow,
    },
    chipPillActive: {
      backgroundColor: 'rgba(0, 240, 255, 0.12)',
      borderColor: colors.neonCyan,
    },
    chipText: {
      fontFamily: 'Geist_500Medium',
      fontSize: 12,
      color: colors.mutedText,
    },
    chipTextActive: {
      color: colors.neonCyan,
    },
    pillsWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    pillsRow: {
      flexDirection: 'row',
      gap: 8,
    },
    optionPill: {
      paddingHorizontal: 14,
      paddingVertical: 11,
      borderRadius: 999,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      alignItems: 'center',
      justifyContent: 'center',
    },
    optionPillActive: {
      backgroundColor: 'rgba(0, 240, 255, 0.12)',
      borderColor: colors.neonCyan,
    },
    optionPillText: {
      fontFamily: 'Geist_600SemiBold',
      fontSize: 13,
      color: colors.mutedText,
    },
    durationPillText: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 13,
      color: colors.mutedText,
    },
    optionPillTextActive: {
      color: colors.neonCyan,
    },
    togglesCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      padding: 16,
      gap: 14,
    },
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    toggleIconBox: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: colors.surfaceLight,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      alignItems: 'center',
      justifyContent: 'center',
    },
    toggleTitle: {
      fontFamily: 'Geist_600SemiBold',
      fontSize: 14,
      color: colors.text,
    },
    toggleSub: {
      fontFamily: 'Geist_400Regular',
      fontSize: 12,
      color: colors.mutedText,
      marginTop: 2,
    },
    toggleDivider: {
      height: 1,
      backgroundColor: colors.borderGlow,
    },
    generateBtn: {
      backgroundColor: colors.neonCyan,
      borderRadius: 12,
      paddingVertical: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: 4,
    },
    generateBtnText: {
      fontFamily: 'Geist_700Bold',
      fontSize: 15,
      color: colors.obsidian,
    },
    disclaimerText: {
      fontFamily: 'Geist_400Regular',
      fontSize: 12,
      color: colors.mutedText,
      textAlign: 'center',
      lineHeight: 18,
    },
    loadingContainer: {
      gap: 14,
    },
    loadingBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: 'rgba(0, 240, 255, 0.08)',
      borderWidth: 1,
      borderColor: 'rgba(0, 240, 255, 0.25)',
      borderRadius: 14,
      padding: 14,
    },
    loadingBannerText: {
      flex: 1,
      fontFamily: 'Geist_500Medium',
      fontSize: 13,
      color: colors.text,
    },
    previewContainer: {
      gap: 14,
    },
    previewSummaryCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      padding: 16,
      gap: 10,
    },
    previewBadgesRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    cyanPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: 'rgba(0, 240, 255, 0.1)',
      borderWidth: 1,
      borderColor: 'rgba(0, 240, 255, 0.3)',
    },
    cyanPillText: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 10,
      color: colors.neonCyan,
      letterSpacing: 0.6,
    },
    metaPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: colors.surfaceLight,
      borderWidth: 1,
      borderColor: colors.borderGlow,
    },
    metaPillText: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 10,
      color: colors.mutedText,
    },
    previewTitle: {
      fontFamily: 'Geist_700Bold',
      fontSize: 20,
      color: colors.text,
    },
    previewDescription: {
      fontFamily: 'Geist_400Regular',
      fontSize: 14,
      color: colors.mutedText,
      lineHeight: 20,
    },
    rationaleBox: {
      flexDirection: 'row',
      gap: 8,
      backgroundColor: colors.surfaceLight,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      padding: 12,
      marginTop: 2,
    },
    rationaleText: {
      flex: 1,
      fontFamily: 'Geist_400Regular',
      fontSize: 12,
      color: colors.text,
      lineHeight: 18,
    },
    previewExCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      padding: 14,
      gap: 10,
    },
    previewExTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    previewThumb: {
      width: 42,
      height: 42,
      borderRadius: 10,
    },
    previewThumbFallback: {
      width: 42,
      height: 42,
      borderRadius: 10,
      backgroundColor: colors.surfaceLight,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      alignItems: 'center',
      justifyContent: 'center',
    },
    previewExName: {
      fontFamily: 'Geist_600SemiBold',
      fontSize: 15,
      color: colors.text,
    },
    previewExSub: {
      fontFamily: 'JetBrainsMono_400Regular',
      fontSize: 11,
      color: colors.neonCyan,
      marginTop: 2,
    },
    previewMetricsRow: {
      flexDirection: 'row',
      gap: 10,
    },
    metricTag: {
      flex: 1,
      backgroundColor: colors.surfaceLight,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      paddingVertical: 8,
      paddingHorizontal: 10,
      alignItems: 'center',
    },
    metricTagValue: {
      fontFamily: 'JetBrainsMono_600SemiBold',
      fontSize: 14,
      color: colors.text,
    },
    metricTagLabel: {
      fontFamily: 'JetBrainsMono_400Regular',
      fontSize: 9,
      color: colors.mutedText,
      letterSpacing: 0.6,
      marginTop: 2,
    },
    previewExNotes: {
      fontFamily: 'Geist_400Regular',
      fontSize: 12,
      color: colors.mutedText,
      lineHeight: 17,
    },
    swapBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 9,
      paddingHorizontal: 12,
      borderRadius: 10,
      backgroundColor: colors.surfaceLight,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      marginTop: 2,
    },
    swapBtnText: {
      fontFamily: 'Geist_500Medium',
      fontSize: 12,
      color: colors.mutedText,
    },
    extraBlockCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      padding: 14,
      gap: 8,
    },
    extraBlockHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    extraBlockTitle: {
      fontFamily: 'JetBrainsMono_600SemiBold',
      fontSize: 11,
      color: colors.neonCyan,
      letterSpacing: 0.8,
    },
    warmupRow: {
      paddingTop: 6,
      borderTopWidth: 1,
      borderTopColor: colors.borderGlow,
    },
    warmupName: {
      fontFamily: 'Geist_500Medium',
      fontSize: 13,
      color: colors.text,
    },
    warmupMeta: {
      fontFamily: 'JetBrainsMono_400Regular',
      fontSize: 11,
      color: colors.mutedText,
      marginTop: 2,
    },
    previewActions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8,
    },
    secondaryBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 15,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      backgroundColor: colors.surface,
    },
    secondaryBtnText: {
      fontFamily: 'Geist_600SemiBold',
      fontSize: 14,
      color: colors.text,
    },
    primaryBtn: {
      flex: 1.4,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 15,
      borderRadius: 12,
      backgroundColor: colors.neonCyan,
    },
    primaryBtnText: {
      fontFamily: 'Geist_700Bold',
      fontSize: 14,
      color: colors.obsidian,
    },
    editParamsLink: {
      alignItems: 'center',
      paddingVertical: 8,
    },
    editParamsLinkText: {
      fontFamily: 'Geist_500Medium',
      fontSize: 13,
      color: colors.mutedText,
      textDecorationLine: 'underline',
    },
  });
