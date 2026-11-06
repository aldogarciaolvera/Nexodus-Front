import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UserService, UserProfile } from '../../../services/user.service';
import { queryKeys } from '../../../services/queryKeys';
import { useAlertStore, AlertState } from '../../../store/alertStore';
import { useTheme } from '../../../utils/ThemeContext';
import { ThemeColors } from '../../../utils/theme';
import { 
  BiologicalSex, 
  ActivityLevel, 
  NutritionGoal, 
  FastingProtocol, 
  ACTIVITY_MULTIPLIERS, 
  NUTRITION_GOALS, 
  FASTING_PROTOCOLS, 
  calculateNutritionTargets, 
  normalizeHeightCm 
} from '../../../utils/nutritionCalculator';
import { useDietStore } from '../../../store/dietStore';
import { Sparkles, Flame, Droplet, Clock, Check, HelpCircle } from 'lucide-react-native';
import { dietService } from '../../../services/diet.service';
import { DietHelpModal } from './DietHelpModal';

interface DietOnboardingViewProps {
  profile?: UserProfile | null;
  onCompleted?: () => void;
  isEditing?: boolean;
}

export const DietOnboardingView: React.FC<DietOnboardingViewProps> = ({ 
  profile, 
  onCompleted,
  isEditing = false 
}) => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);
  const queryClient = useQueryClient();
  const showAlert = useAlertStore((state: AlertState) => state.showAlert);
  const { dietProfile, saveDietProfile } = useDietStore();

  const [showHelpModal, setShowHelpModal] = useState(false);

  // Initial values derived from existing dietProfile or userProfile
  const [weight, setWeight] = useState<string>(
    dietProfile?.weightKg?.toString() || profile?.weight?.toString() || '75'
  );
  const [height, setHeight] = useState<string>(
    dietProfile?.heightCm?.toString() || (profile?.height ? normalizeHeightCm(profile.height).toString() : '175')
  );
  const [age, setAge] = useState<string>(
    dietProfile?.age?.toString() || '25'
  );
  const [sex, setSex] = useState<BiologicalSex>(
    dietProfile?.sex || 'male'
  );
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(
    dietProfile?.activityLevel || 'moderate'
  );
  const [goal, setGoal] = useState<NutritionGoal>(
    dietProfile?.goal || 'maintenance'
  );
  const [fastingProtocol, setFastingProtocol] = useState<FastingProtocol>(
    dietProfile?.fastingProtocol || '16:8'
  );

  const [isSaving, setIsSaving] = useState(false);

  // Live calculation of targets as user types or picks options
  const calculatedTargets = useMemo(() => {
    const numWeight = parseFloat(weight) || 75;
    const numHeight = parseFloat(height) || 175;
    const numAge = parseInt(age, 10) || 25;

    return calculateNutritionTargets({
      weightKg: numWeight,
      heightCm: numHeight,
      age: numAge,
      sex,
      activityLevel,
      goal,
      fastingProtocol,
    });
  }, [weight, height, age, sex, activityLevel, goal, fastingProtocol]);

  const profileMutation = useMutation({
    mutationFn: UserService.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.profile });
      queryClient.invalidateQueries({ queryKey: queryKeys.gym.profile });
    },
  });

  const handleSavePlan = async () => {
    const numWeight = parseFloat(weight);
    const numHeight = parseFloat(height);
    const numAge = parseInt(age, 10);

    if (!numWeight || numWeight <= 0) {
      showAlert('Dato Requerido', 'Por favor ingresa un peso válido.', 'error');
      return;
    }
    if (!numHeight || numHeight <= 0) {
      showAlert('Dato Requerido', 'Por favor ingresa una altura válida.', 'error');
      return;
    }
    if (!numAge || numAge < 10 || numAge > 110) {
      showAlert('Dato Requerido', 'Por favor ingresa una edad válida.', 'error');
      return;
    }

    try {
      setIsSaving(true);

      // 1. Sync weight, height, and dieta flag to backend user profile
      const normalizedHeightMeters = numHeight > 3 ? numHeight / 100 : numHeight;
      await profileMutation.mutateAsync({
        ...profile,
        username: profile?.username || '',
        email: profile?.email || '',
        phoneNumber: profile?.phoneNumber || '',
        weight: numWeight,
        height: normalizedHeightMeters,
        dieta: true,
      });

      // 2. Save comprehensive diet profile into dietStore (persisted in expo-secure-store)
      await saveDietProfile({
        weightKg: numWeight,
        heightCm: normalizeHeightCm(numHeight),
        age: numAge,
        sex,
        activityLevel,
        goal,
        fastingProtocol,
        targetCalories: calculatedTargets.targetCalories,
        proteinGrams: calculatedTargets.proteinGrams,
        carbsGrams: calculatedTargets.carbsGrams,
        fatGrams: calculatedTargets.fatGrams,
        waterTargetMl: calculatedTargets.waterTargetMl,
        configuredAt: new Date().toISOString(),
      });

      // 3. Sync target with backend API
      try {
        await dietService.updateTarget({
          targetCalories: calculatedTargets.targetCalories,
          proteinGrams: calculatedTargets.proteinGrams,
          carbsGrams: calculatedTargets.carbsGrams,
          fatGrams: calculatedTargets.fatGrams,
          waterTargetMl: calculatedTargets.waterTargetMl,
          fastingProtocol: fastingProtocol === '16:8' ? '16:8' : 'None',
          eatingWindowStart: '12:00',
          eatingWindowEnd: '20:00',
        });
        queryClient.invalidateQueries({ queryKey: queryKeys.diet.target });
        queryClient.invalidateQueries({ queryKey: queryKeys.diet.daily() });
      } catch (apiErr) {
        console.warn('Backend diet target sync failed (continuing with local store):', apiErr);
      }

      if (onCompleted) {
        onCompleted();
      }
    } catch (e: any) {
      showAlert('Error', 'No se pudo guardar la configuración nutricional.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Intro Header */}
      <View style={styles.headerBox}>
        <View style={styles.headerTopRow}>
          <View style={styles.badge}>
            <Sparkles size={12} color={theme.colors.neonCyan} />
            <Text style={styles.badgeText}>SETUP BIOMÉTRICO</Text>
          </View>

          <TouchableOpacity
            style={styles.helpButton}
            onPress={() => setShowHelpModal(true)}
            accessibilityRole="button"
            accessibilityLabel="Abrir guía de ayuda sobre cómo conseguir tus datos"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <HelpCircle size={14} color={theme.colors.neonCyan} />
            <Text style={styles.helpButtonText}>Guía de Ayuda</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>
          {isEditing ? 'Ajustar Plan Nutricional' : 'Configura tu Plan de Dieta'}
        </Text>
        <Text style={styles.subtitle}>
          Ingresa tus parámetros para calcular con precisión científica tus calorías diarias y macronutrientes.
        </Text>
      </View>

      {/* 1. Biometrics Section */}
      <View style={styles.card}>
        <Text style={styles.cardSectionTitle}>1. DATOS BIOMÉTRICOS</Text>

        <View style={styles.rowInputs}>
          <View style={styles.inputCol}>
            <Text style={styles.inputLabel}>PESO (KG)</Text>
            <TextInput
              style={styles.textInput}
              value={weight}
              onChangeText={setWeight}
              keyboardType="numeric"
              placeholder="75.0"
              placeholderTextColor={theme.colors.mutedText}
              accessibilityLabel="Peso en kilogramos"
            />
          </View>

          <View style={styles.inputCol}>
            <Text style={styles.inputLabel}>ALTURA (CM)</Text>
            <TextInput
              style={styles.textInput}
              value={height}
              onChangeText={setHeight}
              keyboardType="numeric"
              placeholder="175"
              placeholderTextColor={theme.colors.mutedText}
              accessibilityLabel="Altura en centímetros"
            />
          </View>

          <View style={styles.inputCol}>
            <Text style={styles.inputLabel}>EDAD</Text>
            <TextInput
              style={styles.textInput}
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
              placeholder="25"
              placeholderTextColor={theme.colors.mutedText}
              accessibilityLabel="Edad en años"
            />
          </View>
        </View>

        {/* Biological Sex Toggle */}
        <Text style={[styles.inputLabel, { marginTop: 14 }]}>SEXO BIOLÓGICO</Text>
        <View style={styles.pillsRow}>
          <TouchableOpacity
            style={[styles.pillBtn, sex === 'male' && styles.pillBtnActive]}
            onPress={() => setSex('male')}
            accessibilityRole="button"
            accessibilityLabel="Sexo biológico masculino"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.pillBtnText, sex === 'male' && styles.pillBtnTextActive]}>
              Hombre
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.pillBtn, sex === 'female' && styles.pillBtnActive]}
            onPress={() => setSex('female')}
            accessibilityRole="button"
            accessibilityLabel="Sexo biológico femenino"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.pillBtnText, sex === 'female' && styles.pillBtnTextActive]}>
              Mujer
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Activity Level Section */}
      <View style={styles.card}>
        <Text style={styles.cardSectionTitle}>2. NIVEL DE ACTIVIDAD SEMANAL</Text>
        <View style={styles.optionsList}>
          {(['sedentary', 'light', 'moderate', 'very_active'] as ActivityLevel[]).map((actKey) => {
            const isSelected = activityLevel === actKey;
            const item = ACTIVITY_MULTIPLIERS[actKey];
            return (
              <TouchableOpacity
                key={actKey}
                style={[styles.optionCard, isSelected && styles.optionCardActive]}
                onPress={() => setActivityLevel(actKey)}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`${item.label}: ${item.description}`}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <View style={styles.optionContent}>
                  <Text style={[styles.optionTitle, isSelected && styles.optionTitleActive]}>
                    {item.label}
                  </Text>
                  <Text style={styles.optionDesc}>{item.description}</Text>
                </View>
                {isSelected && (
                  <View style={styles.checkCircle}>
                    <Check size={14} color={theme.colors.neonCyan} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 3. Nutrition Goal Section */}
      <View style={styles.card}>
        <Text style={styles.cardSectionTitle}>3. OBJETIVO NUTRICIONAL</Text>
        <View style={styles.optionsList}>
          {(['fat_loss', 'maintenance', 'muscle_gain'] as NutritionGoal[]).map((goalKey) => {
            const isSelected = goal === goalKey;
            const item = NUTRITION_GOALS[goalKey];
            return (
              <TouchableOpacity
                key={goalKey}
                style={[styles.optionCard, isSelected && styles.optionCardActive]}
                onPress={() => setGoal(goalKey)}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`${item.label}: ${item.description}`}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <View style={styles.optionContent}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.optionTitle, isSelected && styles.optionTitleActive]}>
                      {item.label}
                    </Text>
                    <Text style={styles.deltaTag}>
                      {item.delta > 0 ? `+${item.delta} kcal` : item.delta < 0 ? `${item.delta} kcal` : '±0 kcal'}
                    </Text>
                  </View>
                  <Text style={styles.optionDesc}>{item.description}</Text>
                </View>
                {isSelected && (
                  <View style={styles.checkCircle}>
                    <Check size={14} color={theme.colors.neonCyan} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 4. Fasting Protocol Section */}
      <View style={styles.card}>
        <Text style={styles.cardSectionTitle}>4. PROTOCOLO DE ALIMENTACIÓN</Text>
        <View style={styles.pillsRow}>
          {(['16:8', '18:6', 'none'] as FastingProtocol[]).map((protoKey) => {
            const isSelected = fastingProtocol === protoKey;
            const item = FASTING_PROTOCOLS[protoKey];
            return (
              <TouchableOpacity
                key={protoKey}
                style={[styles.pillBtn, isSelected && styles.pillBtnActive]}
                onPress={() => setFastingProtocol(protoKey)}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={[styles.pillBtnText, isSelected && styles.pillBtnTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Dynamic & Clear Explanations with Examples */}
        <View style={styles.fastingGuideBox}>
          {fastingProtocol === '16:8' && (
            <>
              <View style={styles.fastingGuideHeader}>
                <Clock size={13} color={theme.colors.neonCyan} />
                <Text style={styles.fastingGuideTitle}>Protocolo 16:8 (Ventana de 8h)</Text>
              </View>

              <View style={styles.fastingRow}>
                <View style={[styles.fastingStatusDot, { backgroundColor: '#10B981' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.fastingRowLabel}>
                    VENTANA DE COMIDA (8 HORAS): <Text style={styles.fastingRowTime}>12:00 PM a 08:00 PM</Text>
                  </Text>
                  <Text style={styles.fastingRowDesc}>
                    Es el horario del día en el que <Text style={{ color: theme.colors.text, fontFamily: 'Geist_600SemiBold' }}>SÍ puedes comer</Text>. Aquí distribuyes todas tus comidas y calorías (ej. almuerzo a las 12:30 PM, snack a las 4:30 PM y cena antes de las 8:00 PM).
                  </Text>
                </View>
              </View>

              <View style={[styles.fastingRow, { marginTop: 10 }]}>
                <View style={[styles.fastingStatusDot, { backgroundColor: '#EF4444' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.fastingRowLabel}>
                    PERÍODO DE AYUNO (16 HORAS): <Text style={styles.fastingRowTime}>08:00 PM a 12:00 PM (sig. día)</Text>
                  </Text>
                  <Text style={styles.fastingRowDesc}>
                    Es el horario en el que <Text style={{ color: theme.colors.text, fontFamily: 'Geist_600SemiBold' }}>NO se consumen alimentos</Text> (incluye tus horas de sueño nocturno). Únicamente se permite agua, café solo sin azúcar ni leche, té o infusiones no calóricas.
                  </Text>
                </View>
              </View>
            </>
          )}

          {fastingProtocol === '18:6' && (
            <>
              <View style={styles.fastingGuideHeader}>
                <Clock size={13} color={theme.colors.neonCyan} />
                <Text style={styles.fastingGuideTitle}>Protocolo 18:6 (Ventana de 6h)</Text>
              </View>

              <View style={styles.fastingRow}>
                <View style={[styles.fastingStatusDot, { backgroundColor: '#10B981' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.fastingRowLabel}>
                    VENTANA DE COMIDA (6 HORAS): <Text style={styles.fastingRowTime}>01:00 PM a 07:00 PM</Text>
                  </Text>
                  <Text style={styles.fastingRowDesc}>
                    Horario en el que <Text style={{ color: theme.colors.text, fontFamily: 'Geist_600SemiBold' }}>SÍ se consumen alimentos</Text>. Concentras tus requerimientos nutricionales en este intervalo más reducido.
                  </Text>
                </View>
              </View>

              <View style={[styles.fastingRow, { marginTop: 10 }]}>
                <View style={[styles.fastingStatusDot, { backgroundColor: '#EF4444' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.fastingRowLabel}>
                    PERÍODO DE AYUNO (18 HORAS): <Text style={styles.fastingRowTime}>07:00 PM a 01:00 PM (sig. día)</Text>
                  </Text>
                  <Text style={styles.fastingRowDesc}>
                    Horario en el que <Text style={{ color: theme.colors.text, fontFamily: 'Geist_600SemiBold' }}>NO se ingieren calorías</Text>. Ayuno continuo con hidratación exclusiva de agua, té o café sin calorías.
                  </Text>
                </View>
              </View>
            </>
          )}

          {fastingProtocol === 'none' && (
            <>
              <View style={styles.fastingGuideHeader}>
                <Clock size={13} color={theme.colors.neonCyan} />
                <Text style={styles.fastingGuideTitle}>Alimentación Tradicional (Sin Ayuno)</Text>
              </View>

              <View style={styles.fastingRow}>
                <View style={[styles.fastingStatusDot, { backgroundColor: '#38BDF8' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.fastingRowLabel}>HORARIO CONTINUO FLEXIBLE</Text>
                  <Text style={styles.fastingRowDesc}>
                    No tienes horarios restringidos. Puedes realizar desayuno, almuerzo, colaciones y cena a la hora que gustes según tu rutina, enfocándote únicamente en cumplir tus calorías y macronutrientes diarios.
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>
      </View>

      {/* 5. Live Calculation Preview Card */}
      <View style={styles.previewCard}>
        <View style={styles.previewHeader}>
          <Flame size={16} color={theme.colors.neonCyan} />
          <Text style={styles.previewTitle}>RECOMENDACIÓN EN TIEMPO REAL</Text>
        </View>

        <View style={styles.previewCaloriesRow}>
          <View>
            <Text style={styles.caloriesNumber}>
              {calculatedTargets.targetCalories.toLocaleString()}
            </Text>
            <Text style={styles.caloriesUnit}>KCAL / DÍA OBJETIVO</Text>
          </View>

          <View style={styles.metaRowRight}>
            <Text style={styles.bmrText}>
              BMR: <Text style={{ color: theme.colors.text }}>{calculatedTargets.bmr} kcal</Text>
            </Text>
            <Text style={styles.bmrText}>
              TDEE: <Text style={{ color: theme.colors.text }}>{calculatedTargets.tdee} kcal</Text>
            </Text>
          </View>
        </View>

        {/* Macros Breakdown */}
        <View style={styles.macrosPreviewGrid}>
          <View style={styles.macroBox}>
            <Text style={styles.macroBoxLabel}>PROTEÍNA</Text>
            <Text style={styles.macroBoxGrams}>{calculatedTargets.proteinGrams}g</Text>
            <Text style={styles.macroBoxSub}>Muscle Preserv.</Text>
          </View>

          <View style={styles.macroBox}>
            <Text style={[styles.macroBoxLabel, { color: theme.colors.warning }]}>CARBOS</Text>
            <Text style={[styles.macroBoxGrams, { color: theme.colors.warning }]}>{calculatedTargets.carbsGrams}g</Text>
            <Text style={styles.macroBoxSub}>Energía & Glucógeno</Text>
          </View>

          <View style={styles.macroBox}>
            <Text style={[styles.macroBoxLabel, { color: theme.colors.mutedText }]}>GRASAS</Text>
            <Text style={[styles.macroBoxGrams, { color: theme.colors.text }]}>{calculatedTargets.fatGrams}g</Text>
            <Text style={styles.macroBoxSub}>Salud Hormonal</Text>
          </View>
        </View>

        {/* Hydration preview */}
        <View style={styles.hydrationPreviewRow}>
          <Droplet size={14} color={theme.colors.neonCyan} />
          <Text style={styles.hydrationPreviewText}>
            Meta de Agua recomendada: <Text style={styles.hydrationBold}>{(calculatedTargets.waterTargetMl / 1000).toFixed(1)}L / día</Text>
          </Text>
        </View>

        {/* BMR & TDEE Explanation */}
        <View style={styles.glossaryBox}>
          <View style={styles.glossaryItem}>
            <View style={styles.glossaryTitleRow}>
              <View style={styles.glossaryBadge}>
                <Text style={styles.glossaryBadgeText}>BMR</Text>
              </View>
              <Text style={styles.glossaryTitle}>
                Tasa Metabólica Basal ({calculatedTargets.bmr} kcal)
              </Text>
            </View>
            <Text style={styles.glossaryDesc}>
              Son las calorías mínimas que tu cuerpo quema en reposo absoluto durante 24 horas solo para mantenerse con vida (respiración, bombeo de sangre, regeneración celular y función cerebral).
            </Text>
          </View>

          <View style={[styles.glossaryItem, { marginTop: 10 }]}>
            <View style={styles.glossaryTitleRow}>
              <View style={[styles.glossaryBadge, { backgroundColor: 'rgba(56, 189, 248, 0.12)', borderColor: 'rgba(56, 189, 248, 0.3)' }]}>
                <Text style={[styles.glossaryBadgeText, { color: theme.colors.neonCyan }]}>TDEE</Text>
              </View>
              <Text style={styles.glossaryTitle}>
                Gasto Energético Total Diario ({calculatedTargets.tdee} kcal)
              </Text>
            </View>
            <Text style={styles.glossaryDesc}>
              Es la energía total que tu cuerpo quema en un día completo, sumando tu BMR más tu actividad física y entrenamientos en el Gym. Es el valor de referencia sobre el que se calculan tus calorías meta ({calculatedTargets.targetCalories} kcal).
            </Text>
          </View>
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveBtn, isSaving && { opacity: 0.7 }]}
        onPress={handleSavePlan}
        disabled={isSaving}
        accessibilityRole="button"
        accessibilityLabel="Guardar y activar plan nutricional"
        activeOpacity={0.8}
      >
        {isSaving ? (
          <ActivityIndicator color={theme.colors.obsidian} />
        ) : (
          <Text style={styles.saveBtnText}>
            {isEditing ? 'Actualizar Metas' : 'Comenzar Plan de Dieta'}
          </Text>
        )}
      </TouchableOpacity>

      {/* Help Modal */}
      <DietHelpModal
        visible={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />
    </View>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    width: '100%',
    paddingBottom: 24,
  },
  headerBox: {
    marginBottom: 20,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.25)',
  },
  helpButtonText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 11,
    color: colors.neonCyan,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
  },
  badgeText: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 10,
    color: colors.neonCyan,
    letterSpacing: 0.8,
  },
  title: {
    fontFamily: 'Geist_700Bold',
    fontSize: 22,
    color: colors.text,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: 'Geist_400Regular',
    fontSize: 13,
    color: colors.mutedText,
    lineHeight: 18,
  },
  card: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    marginBottom: 16,
  },
  cardSectionTitle: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 11,
    color: colors.neonCyan,
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 10,
  },
  inputCol: {
    flex: 1,
  },
  inputLabel: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 10,
    color: colors.mutedText,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: colors.obsidian,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 15,
    textAlign: 'center',
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pillBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillBtnActive: {
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    borderColor: colors.neonCyan,
  },
  pillBtnText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    color: colors.mutedText,
  },
  pillBtnTextActive: {
    color: colors.neonCyan,
    fontFamily: 'Geist_600SemiBold',
  },
  optionsList: {
    gap: 8,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  optionCardActive: {
    borderColor: colors.neonCyan,
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
  },
  optionContent: {
    flex: 1,
    paddingRight: 8,
  },
  optionTitle: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 14,
    color: colors.text,
    marginBottom: 2,
  },
  optionTitleActive: {
    color: colors.neonCyan,
  },
  optionDesc: {
    fontFamily: 'Geist_400Regular',
    fontSize: 11,
    color: colors.mutedText,
  },
  deltaTag: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 10,
    color: colors.neonCyan,
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.neonCyan,
  },
  fastingGuideBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: colors.borderGlow,
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
  },
  fastingGuideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderGlow,
  },
  fastingGuideTitle: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 11,
    color: colors.neonCyan,
    letterSpacing: 0.5,
  },
  fastingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  fastingStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  fastingRowLabel: {
    fontFamily: 'JetBrainsMono_600SemiBold',
    fontSize: 10.5,
    color: colors.text,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  fastingRowTime: {
    color: colors.neonCyan,
  },
  fastingRowDesc: {
    fontFamily: 'Geist_400Regular',
    fontSize: 11.5,
    color: colors.mutedText,
    lineHeight: 16,
  },
  previewCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.neonCyan,
    marginBottom: 20,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  previewTitle: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 11,
    color: colors.neonCyan,
    letterSpacing: 0.8,
  },
  previewCaloriesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderGlow,
    paddingBottom: 14,
    marginBottom: 14,
  },
  caloriesNumber: {
    fontFamily: 'Geist_700Bold',
    fontSize: 32,
    color: colors.text,
    lineHeight: 36,
  },
  caloriesUnit: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 10,
    color: colors.neonCyan,
    letterSpacing: 0.8,
    marginTop: 2,
  },
  metaRowRight: {
    alignItems: 'flex-end',
    gap: 3,
  },
  bmrText: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 11,
    color: colors.mutedText,
  },
  macrosPreviewGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  macroBox: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    alignItems: 'center',
  },
  macroBoxLabel: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 9,
    color: colors.neonCyan,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  macroBoxGrams: {
    fontFamily: 'Geist_700Bold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 2,
  },
  macroBoxSub: {
    fontFamily: 'Geist_400Regular',
    fontSize: 9,
    color: colors.mutedText,
    textAlign: 'center',
  },
  hydrationPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.2)',
  },
  hydrationPreviewText: {
    fontFamily: 'Geist_400Regular',
    fontSize: 11,
    color: colors.text,
  },
  hydrationBold: {
    fontFamily: 'JetBrainsMono_600SemiBold',
    color: colors.neonCyan,
  },
  glossaryBox: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderGlow,
  },
  glossaryItem: {
    backgroundColor: colors.surfaceLight,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  glossaryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  glossaryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.25)',
  },
  glossaryBadgeText: {
    fontFamily: 'JetBrainsMono_600SemiBold',
    fontSize: 9.5,
    color: colors.neonCyan,
    letterSpacing: 0.5,
  },
  glossaryTitle: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 12,
    color: colors.text,
  },
  glossaryDesc: {
    fontFamily: 'Geist_400Regular',
    fontSize: 11,
    color: colors.mutedText,
    lineHeight: 16,
  },
  saveBtn: {
    backgroundColor: colors.neonCyan,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 16,
    color: colors.obsidian,
  },
});
