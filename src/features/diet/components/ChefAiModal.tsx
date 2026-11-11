import React, { useState } from 'react';
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
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  X,
  ChefHat,
  Clock,
  Flame,
  Check,
  Plus,
  Bookmark,
  RefreshCw,
} from 'lucide-react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../../utils/ThemeContext';
import { ThemeColors } from '../../../utils/theme';
import { useAlertStore } from '../../../store/alertStore';
import { queryKeys } from '../../../services/queryKeys';
import { recipeService, Recipe, MatchMacrosRequest } from '../../../services/recipe.service';
import { Skeleton } from '../../../components/Skeleton';

interface ChefAiModalProps {
  visible: boolean;
  onClose: () => void;
  selectedDate: string;
  remainingCals: number;
  remainingProtein: number;
  remainingCarbs: number;
  remainingFat: number;
}

export const ChefAiModal: React.FC<ChefAiModalProps> = ({
  visible,
  onClose,
  selectedDate,
  remainingCals,
  remainingProtein,
  remainingCarbs,
  remainingFat,
}) => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);
  const showAlert = useAlertStore((state) => state.showAlert);
  const queryClient = useQueryClient();

  const [mealType, setMealType] = useState('Dinner');
  const [dietType, setDietType] = useState('HighProtein');
  const [maxTime, setMaxTime] = useState(25);
  const [preferences, setPreferences] = useState('');
  const [generatedRecipe, setGeneratedRecipe] = useState<Recipe | null>(null);

  // Generate Recipe Mutation
  const generateMutation = useMutation({
    mutationFn: (req: MatchMacrosRequest) => recipeService.generateRecipeForMacros(req),
    onSuccess: (recipe) => {
      setGeneratedRecipe(recipe);
      showAlert('Receta Diseñada', `Chef IA creó "${recipe.name}" para tus macros.`, 'success');
    },
    onError: (e: any) => {
      showAlert('Error del Chef IA', e?.message || 'No se pudo generar la receta con Gemini.', 'error');
    },
  });

  // Log as Meal Mutation (Option A)
  const logMealMutation = useMutation({
    mutationFn: (data: {
      recipeId: string;
      date: string;
      mealType: string;
      servings: number;
      fallbackRecipe?: any;
    }) => recipeService.logRecipeAsMeal(data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.diet.daily(vars.date) });
      queryClient.invalidateQueries({ queryKey: queryKeys.diet.pantry });
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      showAlert('Plato Registrado', `"${generatedRecipe?.name}" registrado en tu diario e inventario actualizado.`, 'success');
      handleClose();
    },
    onError: (e: any) => {
      showAlert('Error', e?.message || 'No se pudo registrar la comida.', 'error');
    },
  });

  const handleGenerate = () => {
    generateMutation.mutate({
      remainingCalories: Math.max(150, remainingCals),
      remainingProtein: Math.max(15, remainingProtein),
      remainingCarbs: Math.max(0, remainingCarbs),
      remainingFat: Math.max(0, remainingFat),
      mealType,
      dietType,
      preferences: preferences.trim() || undefined,
      maxPrepTimeMinutes: maxTime,
    });
  };

  const handleLogGenerated = () => {
    if (!generatedRecipe) return;
    logMealMutation.mutate({
      recipeId: generatedRecipe.id,
      date: selectedDate,
      mealType,
      servings: 1,
      fallbackRecipe: {
        name: generatedRecipe.name,
        description: generatedRecipe.description,
        mealType: generatedRecipe.mealType || mealType,
        dietType: generatedRecipe.dietType || 'Standard',
        prepTimeMinutes: generatedRecipe.prepTimeMinutes || 10,
        cookTimeMinutes: generatedRecipe.cookTimeMinutes || 15,
        servings: 1,
        difficulty: generatedRecipe.difficulty || 'Easy',
        isCommunity: true,
        tags: generatedRecipe.tags || ['ChefAI', 'Macros'],
        imageUrl: generatedRecipe.imageUrl,
        ingredients: generatedRecipe.ingredients.map((i) => ({
          foodId: i.foodId,
          customFoodName: i.customFoodName,
          cookingState: i.cookingState,
          quantity: i.quantity,
          unit: i.unit,
          calories: i.calories,
          protein: i.protein,
          carbs: i.carbs,
          fat: i.fat,
          isOptional: i.isOptional,
        })),
        steps: generatedRecipe.steps.map((s) => ({
          stepNumber: s.stepNumber,
          instruction: s.instruction,
        })),
      },
    });
  };

  const handleClose = () => {
    setGeneratedRecipe(null);
    setPreferences('');
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={handleClose}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View style={styles.iconCircle}>
              <ChefHat size={18} color={theme.colors.neonCyan} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Nexodus Chef IA</Text>
              <Text style={styles.headerSub}>Generador inteligente por macros restantes</Text>
            </View>
          </View>
          <TouchableOpacity 
            onPress={handleClose} 
            style={styles.closeBtn}
            accessibilityRole="button"
            accessibilityLabel="Cerrar asistente Chef IA"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={20} color={theme.colors.slate400} />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView 
            style={styles.scrollContent} 
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
          {/* Target Banner */}
          <View style={styles.targetBanner}>
            <Text style={styles.bannerLabel}>MACROS OBJETIVO A CUBRIR</Text>
            <View style={styles.bannerGrid}>
              <View style={styles.bannerItem}>
                <Text style={styles.bannerItemLabel}>CALORÍAS</Text>
                <Text style={[styles.bannerItemVal, { color: theme.colors.text }]}>
                  ~{Math.max(0, Math.round(remainingCals))} kcal
                </Text>
              </View>
              <View style={styles.bannerItem}>
                <Text style={styles.bannerItemLabel}>PROTEÍNA</Text>
                <Text style={[styles.bannerItemVal, { color: theme.colors.neonCyan }]}>
                  ~{Math.max(0, Math.round(remainingProtein))}g
                </Text>
              </View>
              <View style={styles.bannerItem}>
                <Text style={styles.bannerItemLabel}>CARBOS</Text>
                <Text style={[styles.bannerItemVal, { color: theme.colors.warning }]}>
                  ~{Math.max(0, Math.round(remainingCarbs))}g
                </Text>
              </View>
              <View style={styles.bannerItem}>
                <Text style={styles.bannerItemLabel}>GRASAS</Text>
                <Text style={[styles.bannerItemVal, { color: theme.colors.error }]}>
                  ~{Math.max(0, Math.round(remainingFat))}g
                </Text>
              </View>
            </View>
          </View>

          {!generatedRecipe ? (
            // ================== CONFIGURADOR DEL CHEF ==================
            <View style={styles.formContainer}>
              {/* Meal Type */}
              <Text style={styles.fieldLabel}>TIPO DE COMIDA</Text>
              <View style={styles.chipRow}>
                {[
                  { id: 'Breakfast', label: 'Desayuno' },
                  { id: 'Lunch', label: 'Almuerzo' },
                  { id: 'Dinner', label: 'Cena' },
                  { id: 'Snack', label: 'Snack' },
                ].map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    style={[styles.chip, mealType === m.id && styles.chipActive]}
                    onPress={() => setMealType(m.id)}
                  >
                    <Text style={[styles.chipText, mealType === m.id && styles.chipTextActive]}>
                      {m.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Diet Focus */}
              <Text style={styles.fieldLabel}>ENFOQUE NUTRICIONAL</Text>
              <View style={styles.chipRow}>
                {[
                  { id: 'HighProtein', label: 'Alto en Proteína' },
                  { id: 'Standard', label: 'Balanceado' },
                  { id: 'Keto', label: 'Keto' },
                  { id: 'LowCarb', label: 'Bajo en Grasa' },
                ].map((d) => (
                  <TouchableOpacity
                    key={d.id}
                    style={[styles.chip, dietType === d.id && styles.chipActive]}
                    onPress={() => setDietType(d.id)}
                  >
                    <Text style={[styles.chipText, dietType === d.id && styles.chipTextActive]}>
                      {d.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Max Prep Time */}
              <Text style={styles.fieldLabel}>TIEMPO DISPONIBLE</Text>
              <View style={styles.chipRow}>
                {[15, 25, 40].map((mins) => (
                  <TouchableOpacity
                    key={mins}
                    style={[styles.chip, maxTime === mins && styles.chipActive]}
                    onPress={() => setMaxTime(mins)}
                  >
                    <Text style={[styles.chipText, maxTime === mins && styles.chipTextActive]}>
                      ⏱️ {mins} minutos
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Preferences / Custom note */}
              <Text style={styles.fieldLabel}>PREFERENCIAS O INGREDIENTES A INCLUIR (OPCIONAL)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ej. Con pechuga de pollo, sin lácteos, preparación rápida..."
                placeholderTextColor={theme.colors.slate600}
                value={preferences}
                onChangeText={setPreferences}
                maxLength={120}
              />

              {/* Generate Button */}
              <TouchableOpacity
                style={[styles.generateBtn, generateMutation.isPending && styles.generateBtnDisabled]}
                onPress={handleGenerate}
                disabled={generateMutation.isPending}
                activeOpacity={0.8}
              >
                {generateMutation.isPending ? (
                  <View style={styles.btnRow}>
                    <ActivityIndicator color={theme.colors.obsidian} />
                    <Text style={styles.generateBtnText}>Creando receta con Gemini...</Text>
                  </View>
                ) : (
                  <View style={styles.btnRow}>
                    <ChefHat size={18} color={theme.colors.obsidian} />
                    <Text style={styles.generateBtnText}>Diseñar Plato con Chef IA</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            // ================== RECETA GENERADA RESULTADO ==================
            <View style={styles.resultContainer}>
              <View style={styles.resultHeaderBox}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.resultTag}>RECETA CREADA POR CHEF IA</Text>
                  <Text style={styles.resultName}>{generatedRecipe.name}</Text>
                  <Text style={styles.resultDesc}>{generatedRecipe.description}</Text>
                </View>
              </View>

              {/* Macros Match Card */}
              <View style={styles.recipeMacroGrid}>
                <View style={styles.recipeMacroItem}>
                  <Text style={styles.recipeMacroLabel}>CALORÍAS</Text>
                  <Text style={[styles.recipeMacroVal, { color: theme.colors.text }]}>
                    {Math.round(generatedRecipe.totalCalories)}
                  </Text>
                </View>
                <View style={styles.recipeMacroItem}>
                  <Text style={styles.recipeMacroLabel}>PROTEÍNA</Text>
                  <Text style={[styles.recipeMacroVal, { color: theme.colors.neonCyan }]}>
                    {Math.round(generatedRecipe.totalProtein)}g
                  </Text>
                </View>
                <View style={styles.recipeMacroItem}>
                  <Text style={styles.recipeMacroLabel}>CARBOS</Text>
                  <Text style={[styles.recipeMacroVal, { color: theme.colors.warning }]}>
                    {Math.round(generatedRecipe.totalCarbs)}g
                  </Text>
                </View>
                <View style={styles.recipeMacroItem}>
                  <Text style={styles.recipeMacroLabel}>GRASAS</Text>
                  <Text style={[styles.recipeMacroVal, { color: theme.colors.error }]}>
                    {Math.round(generatedRecipe.totalFat)}g
                  </Text>
                </View>
              </View>

              {/* Ingredients */}
              <Text style={styles.sectionTitle}>INGREDIENTES EXACTOS</Text>
              <View style={styles.itemsCard}>
                {generatedRecipe.ingredients.map((ing, i) => (
                  <View key={i} style={styles.ingredientRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.ingName}>{ing.customFoodName}</Text>
                      {ing.cookingState && ing.cookingState !== 'Raw' && (
                        <Text style={styles.ingCooking}>Cocción: {ing.cookingState}</Text>
                      )}
                    </View>
                    <Text style={styles.ingQty}>
                      {ing.quantity} {ing.unit}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Steps */}
              <Text style={styles.sectionTitle}>INSTRUCCIONES DE PREPARACIÓN</Text>
              <View style={styles.itemsCard}>
                {generatedRecipe.steps.map((st, i) => (
                  <View key={i} style={styles.stepLine}>
                    <View style={styles.stepCircle}>
                      <Text style={styles.stepNum}>{st.stepNumber || i + 1}</Text>
                    </View>
                    <Text style={styles.stepText}>{st.instruction}</Text>
                  </View>
                ))}
              </View>

              {/* Actions */}
              <View style={styles.resultActions}>
                <TouchableOpacity
                  style={[styles.primaryActionBtn, logMealMutation.isPending && styles.generateBtnDisabled]}
                  onPress={handleLogGenerated}
                  disabled={logMealMutation.isPending}
                  activeOpacity={0.8}
                >
                  {logMealMutation.isPending ? (
                    <ActivityIndicator color={theme.colors.obsidian} />
                  ) : (
                    <>
                      <Plus size={18} color={theme.colors.obsidian} />
                      <Text style={styles.primaryActionBtnText}>Registrar en Diario de Hoy</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.retryBtn}
                  onPress={() => setGeneratedRecipe(null)}
                  activeOpacity={0.8}
                >
                  <RefreshCw size={15} color={theme.colors.slate400} />
                  <Text style={styles.retryBtnText}>Generar Otra Opción</Text>
                </TouchableOpacity>
              </View>
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
    headerTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    iconCircle: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: 'rgba(56, 189, 248, 0.12)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.neonCyan,
    },
    headerTitle: {
      fontFamily: 'Geist_700Bold',
      fontSize: 16,
      color: colors.text,
    },
    headerSub: {
      fontFamily: 'JetBrainsMono_400Regular',
      fontSize: 10,
      color: colors.mutedText,
    },
    closeBtn: {
      padding: 6,
    },
    scrollContent: {
      flex: 1,
    },
    targetBanner: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      padding: 14,
      marginBottom: 16,
    },
    bannerLabel: {
      fontFamily: 'JetBrainsMono_700Bold',
      fontSize: 10,
      color: colors.slate400,
      marginBottom: 10,
      letterSpacing: 0.5,
    },
    bannerGrid: {
      flexDirection: 'row',
      gap: 8,
    },
    bannerItem: {
      flex: 1,
      backgroundColor: colors.surfaceLight,
      paddingVertical: 8,
      borderRadius: 8,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.borderGlow,
    },
    bannerItemLabel: {
      fontFamily: 'JetBrainsMono_700Bold',
      fontSize: 8,
      color: colors.slate500,
      marginBottom: 2,
    },
    bannerItemVal: {
      fontFamily: 'JetBrainsMono_700Bold',
      fontSize: 12,
    },
    formContainer: {
      gap: 12,
    },
    fieldLabel: {
      fontFamily: 'JetBrainsMono_700Bold',
      fontSize: 10,
      color: colors.slate400,
      marginTop: 6,
      letterSpacing: 0.5,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderGlow,
    },
    chipActive: {
      backgroundColor: 'rgba(56, 189, 248, 0.15)',
      borderColor: colors.neonCyan,
    },
    chipText: {
      fontFamily: 'Geist_500Medium',
      fontSize: 12,
      color: colors.slate400,
    },
    chipTextActive: {
      fontFamily: 'Geist_700Bold',
      color: colors.neonCyan,
    },
    textInput: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      paddingHorizontal: 14,
      paddingVertical: 10,
      fontFamily: 'Geist_400Regular',
      fontSize: 13,
      color: colors.text,
    },
    generateBtn: {
      backgroundColor: colors.neonCyan,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 12,
    },
    generateBtnDisabled: {
      opacity: 0.6,
    },
    btnRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    generateBtnText: {
      fontFamily: 'Geist_700Bold',
      fontSize: 14,
      color: colors.obsidian,
    },
    resultContainer: {
      gap: 16,
    },
    resultHeaderBox: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.neonCyan,
      padding: 16,
    },
    resultTag: {
      fontFamily: 'JetBrainsMono_700Bold',
      fontSize: 10,
      color: colors.neonCyan,
      marginBottom: 6,
    },
    resultName: {
      fontFamily: 'Geist_700Bold',
      fontSize: 18,
      color: colors.text,
      marginBottom: 6,
    },
    resultDesc: {
      fontFamily: 'Geist_400Regular',
      fontSize: 12,
      color: colors.mutedText,
      lineHeight: 18,
    },
    recipeMacroGrid: {
      flexDirection: 'row',
      gap: 8,
    },
    recipeMacroItem: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      paddingVertical: 8,
      alignItems: 'center',
    },
    recipeMacroLabel: {
      fontFamily: 'JetBrainsMono_700Bold',
      fontSize: 8,
      color: colors.slate500,
      marginBottom: 2,
    },
    recipeMacroVal: {
      fontFamily: 'JetBrainsMono_700Bold',
      fontSize: 13,
    },
    sectionTitle: {
      fontFamily: 'JetBrainsMono_700Bold',
      fontSize: 11,
      color: colors.slate400,
      letterSpacing: 0.5,
      marginTop: 4,
    },
    itemsCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      padding: 12,
      gap: 8,
    },
    ingredientRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 4,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255, 255, 255, 0.04)',
    },
    ingName: {
      fontFamily: 'Geist_500Medium',
      fontSize: 13,
      color: colors.text,
    },
    ingCooking: {
      fontFamily: 'JetBrainsMono_400Regular',
      fontSize: 9,
      color: colors.neonCyan,
      marginTop: 1,
    },
    ingQty: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 12,
      color: colors.slate400,
    },
    stepLine: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
    },
    stepCircle: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: 'rgba(56, 189, 248, 0.15)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepNum: {
      fontFamily: 'JetBrainsMono_700Bold',
      fontSize: 10,
      color: colors.neonCyan,
    },
    stepText: {
      flex: 1,
      fontFamily: 'Geist_400Regular',
      fontSize: 12,
      color: colors.text,
      lineHeight: 18,
    },
    resultActions: {
      gap: 10,
      marginTop: 8,
    },
    primaryActionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.neonCyan,
      borderRadius: 12,
      paddingVertical: 14,
    },
    primaryActionBtnText: {
      fontFamily: 'Geist_700Bold',
      fontSize: 13,
      color: colors.obsidian,
    },
    retryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
    },
    retryBtnText: {
      fontFamily: 'Geist_500Medium',
      fontSize: 12,
      color: colors.slate400,
    },
  });

