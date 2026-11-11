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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  X,
  Search,
  Clock,
  Flame,
  ChefHat,
  Plus,
  GitFork,
  Check,
  ChevronLeft,
  Users,
} from 'lucide-react-native';
import { Image } from 'expo-image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../../utils/ThemeContext';
import { ThemeColors } from '../../../utils/theme';
import { useAlertStore } from '../../../store/alertStore';
import { queryKeys } from '../../../services/queryKeys';
import { recipeService, Recipe, CreateRecipeRequest } from '../../../services/recipe.service';
import { Skeleton } from '../../../components/Skeleton';

interface RecipeCatalogModalProps {
  visible: boolean;
  onClose: () => void;
  selectedDate: string;
}

const UNIFIED_FILTERS = [
  { id: 'all', label: 'Todos', mealType: 'Any', dietType: 'Standard' },
  { id: 'breakfast', label: 'Desayuno', mealType: 'Breakfast', dietType: 'Standard' },
  { id: 'lunch', label: 'Almuerzo', mealType: 'Lunch', dietType: 'Standard' },
  { id: 'dinner', label: 'Cena', mealType: 'Dinner', dietType: 'Standard' },
  { id: 'snack', label: 'Snacks', mealType: 'Snack', dietType: 'Standard' },
  { id: 'protein', label: 'Alta Proteína', mealType: 'Any', dietType: 'HighProtein' },
  { id: 'keto', label: 'Keto', mealType: 'Any', dietType: 'Keto' },
  { id: 'lowcarb', label: 'Baja Grasa', mealType: 'Any', dietType: 'LowCarb' },
] as const;

export const RecipeCatalogModal: React.FC<RecipeCatalogModalProps> = ({
  visible,
  onClose,
  selectedDate,
}) => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);
  const showAlert = useAlertStore((state) => state.showAlert);
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilterId, setActiveFilterId] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'all' | 'community'>('all');

  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [targetMealType, setTargetMealType] = useState<'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'>('Lunch');
  const [servings, setServings] = useState(1);
  const [isLogging, setIsLogging] = useState(false);

  const activeFilter = UNIFIED_FILTERS.find((f) => f.id === activeFilterId) || UNIFIED_FILTERS[0];
  const selectedMealType = activeFilter.mealType;
  const selectedDietType = activeFilter.dietType;

  // Query recipes
  const { data: recipesData, isLoading } = useQuery({
    queryKey: queryKeys.diet.recipes({
      searchQuery,
      selectedMealType,
      selectedDietType,
      communityOnly: activeTab === 'community',
    }),
    queryFn: () =>
      recipeService.searchRecipes({
        query: searchQuery.trim() || undefined,
        mealType: selectedMealType === 'Any' ? undefined : selectedMealType,
        dietType: selectedDietType === 'Standard' ? undefined : selectedDietType,
        communityOnly: activeTab === 'community',
      }),
    enabled: visible,
  });

  const recipes = recipesData?.items || [];

  // Log Recipe as Meal Mutation (Option A: Whole plate title + atomic ingredients)
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
      showAlert('Plato Registrado', `"${selectedRecipe?.name}" agregado a tu diario e inventario actualizado.`, 'success');
      setSelectedRecipe(null);
      onClose();
    },
    onError: (e: any) => {
      showAlert('Error', e?.message || 'No se pudo registrar la receta en el diario.', 'error');
    },
    onSettled: () => {
      setIsLogging(false);
    },
  });

  const handleConfirmLog = () => {
    if (!selectedRecipe) return;
    setIsLogging(true);
    logMealMutation.mutate({
      recipeId: selectedRecipe.id,
      date: selectedDate,
      mealType: targetMealType,
      servings,
    });
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            {selectedRecipe ? (
              <TouchableOpacity onPress={() => setSelectedRecipe(null)} style={styles.backBtn}>
                <ChevronLeft size={22} color={theme.colors.neonCyan} />
              </TouchableOpacity>
            ) : (
              <View style={styles.chefIconCircle}>
                <ChefHat size={18} color={theme.colors.neonCyan} />
              </View>
            )}
            <View>
              <Text style={styles.headerTitle}>
                {selectedRecipe ? 'Detalle de la Receta' : 'Recetario Saludable'}
              </Text>
              <Text style={styles.headerSub}>
                {selectedRecipe ? selectedRecipe.name : 'Platos completos balanceados'}
              </Text>
            </View>
          </View>

          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={20} color={theme.colors.slate400} />
          </TouchableOpacity>
        </View>

        {selectedRecipe ? (
          // ================== DETALLE DE RECETA ==================
          <ScrollView style={styles.scrollContent} contentContainerStyle={{ paddingBottom: 40 }}>
            {selectedRecipe.imageUrl && (
              <Image source={{ uri: selectedRecipe.imageUrl }} style={styles.detailImage} contentFit="cover" />
            )}

            <View style={styles.detailBody}>
              <View style={styles.detailTitleRow}>
                <Text style={styles.detailTitle}>{selectedRecipe.name}</Text>
                {selectedRecipe.parentRecipeId && (
                  <View style={styles.variantBadge}>
                    <GitFork size={12} color={theme.colors.neonCyan} />
                    <Text style={styles.variantBadgeText}>Variante</Text>
                  </View>
                )}
              </View>

              <Text style={styles.detailDesc}>{selectedRecipe.description}</Text>

              {/* Meta tags & Time */}
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Clock size={13} color={theme.colors.slate400} />
                  <Text style={styles.metaItemText}>
                    {selectedRecipe.prepTimeMinutes + selectedRecipe.cookTimeMinutes} min
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={styles.metaItemText}>Dificultad: {selectedRecipe.difficulty}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={styles.metaItemText}>Porciones: {selectedRecipe.servings}</Text>
                </View>
              </View>

              {/* Macro Cards Grid */}
              <View style={styles.macroGrid}>
                <View style={styles.macroCard}>
                  <Text style={styles.macroLabel}>CALORÍAS</Text>
                  <Text style={[styles.macroVal, { color: theme.colors.text }]}>
                    {Math.round(selectedRecipe.totalCalories * servings)}
                  </Text>
                </View>
                <View style={styles.macroCard}>
                  <Text style={styles.macroLabel}>PROTEÍNA</Text>
                  <Text style={[styles.macroVal, { color: theme.colors.neonCyan }]}>
                    {Math.round(selectedRecipe.totalProtein * servings)}g
                  </Text>
                </View>
                <View style={styles.macroCard}>
                  <Text style={styles.macroLabel}>CARBOS</Text>
                  <Text style={[styles.macroVal, { color: theme.colors.warning }]}>
                    {Math.round(selectedRecipe.totalCarbs * servings)}g
                  </Text>
                </View>
                <View style={styles.macroCard}>
                  <Text style={styles.macroLabel}>GRASAS</Text>
                  <Text style={[styles.macroVal, { color: theme.colors.error }]}>
                    {Math.round(selectedRecipe.totalFat * servings)}g
                  </Text>
                </View>
              </View>

              {/* Ingredients List */}
              <Text style={styles.sectionHeader}>INGREDIENTES</Text>
              <View style={styles.ingredientsBox}>
                {selectedRecipe.ingredients.map((ing, i) => (
                  <View key={i} style={styles.ingredientLine}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.ingredientLineName}>{ing.customFoodName}</Text>
                      {ing.cookingState && ing.cookingState !== 'Raw' && (
                        <Text style={styles.cookingStateSub}>Cocción: {ing.cookingState}</Text>
                      )}
                    </View>
                    <Text style={styles.ingredientLineQty}>
                      {Math.round(ing.quantity * servings)} {ing.unit}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Steps List */}
              <Text style={styles.sectionHeader}>PREPARACIÓN PASO A PASO</Text>
              <View style={styles.stepsBox}>
                {selectedRecipe.steps.map((st, i) => (
                  <View key={i} style={styles.stepRow}>
                    <View style={styles.stepNumCircle}>
                      <Text style={styles.stepNumText}>{st.stepNumber || i + 1}</Text>
                    </View>
                    <Text style={styles.stepInstructionText}>{st.instruction}</Text>
                  </View>
                ))}
              </View>

              {/* Logging Section */}
              <View style={styles.logCard}>
                <Text style={styles.logCardTitle}>REGISTRAR EN DIARIO DE HOY</Text>
                <Text style={styles.logCardSub}>
                  Se agregará el plato completo pero podrás modificar los gramos de cualquier ingrediente.
                </Text>

                {/* Meal Type Selector */}
                <View style={styles.mealTypeRow}>
                  {(['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const).map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[styles.mealTypeChip, targetMealType === m && styles.mealTypeChipActive]}
                      onPress={() => setTargetMealType(m)}
                    >
                      <Text
                        style={[
                          styles.mealTypeChipText,
                          targetMealType === m && styles.mealTypeChipTextActive,
                        ]}
                      >
                        {m === 'Breakfast' ? 'Desayuno' : m === 'Lunch' ? 'Almuerzo' : m === 'Dinner' ? 'Cena' : 'Snack'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Servings Stepper */}
                <View style={styles.stepperRow}>
                  <Text style={styles.stepperLabel}>Porciones a consumir:</Text>
                  <View style={styles.stepperControls}>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => setServings(Math.max(0.5, servings - 0.5))}
                    >
                      <Text style={styles.stepperBtnText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.stepperValText}>{servings}</Text>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => setServings(servings + 0.5)}
                    >
                      <Text style={styles.stepperBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Confirm Button */}
                <TouchableOpacity
                  style={[styles.confirmLogBtn, isLogging && styles.confirmLogBtnDisabled]}
                  onPress={handleConfirmLog}
                  disabled={isLogging}
                  activeOpacity={0.8}
                >
                  {isLogging ? (
                    <ActivityIndicator color={theme.colors.obsidian} />
                  ) : (
                    <>
                      <Plus size={18} color={theme.colors.obsidian} />
                      <Text style={styles.confirmLogBtnText}>Añadir al Diario Nutricional</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        ) : (
          // ================== EXPLORADOR DE RECETAS ==================
          <View style={{ flex: 1 }}>
            {/* Search Input */}
            <View style={styles.searchContainer}>
              <View style={styles.searchInputRow}>
                <Search size={16} color={theme.colors.slate400} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar receta, ingrediente o tag..."
                  placeholderTextColor={theme.colors.slate600}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <X size={16} color={theme.colors.slate400} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabRow}>
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'all' && styles.tabBtnActive]}
                onPress={() => setActiveTab('all')}
              >
                <Text style={[styles.tabBtnText, activeTab === 'all' && styles.tabBtnTextActive]}>
                  Todas las Recetas
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'community' && styles.tabBtnActive]}
                onPress={() => setActiveTab('community')}
              >
                <Text style={[styles.tabBtnText, activeTab === 'community' && styles.tabBtnTextActive]}>
                  Comunitarias Nexodus
                </Text>
              </TouchableOpacity>
            </View>

            {/* Unified Single Filter Row */}
            <View style={styles.filtersContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.unifiedFilterScroll}
              >
                {UNIFIED_FILTERS.map((f) => {
                  const isActive = activeFilterId === f.id;
                  return (
                    <TouchableOpacity
                      key={f.id}
                      style={[styles.chipBtn, isActive && styles.chipBtnActive]}
                      onPress={() => setActiveFilterId(f.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.chipBtnText, isActive && styles.chipBtnTextActive]}>
                        {f.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Recipes List */}
            {isLoading ? (
              <View style={{ padding: 16, gap: 12 }}>
                <Skeleton width="100%" height={120} borderRadius={14} />
                <Skeleton width="100%" height={120} borderRadius={14} />
                <Skeleton width="100%" height={120} borderRadius={14} />
              </View>
            ) : recipes.length === 0 ? (
              <View style={styles.emptyContainer}>
                <ChefHat size={40} color={theme.colors.slate600} />
                <Text style={styles.emptyTitle}>No se encontraron recetas</Text>
                <Text style={styles.emptySub}>Prueba ajustando los filtros o el texto de búsqueda.</Text>
              </View>
            ) : (
              <ScrollView style={styles.scrollContent} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}>
                {recipes.map((recipe) => (
                  <TouchableOpacity
                    key={recipe.id}
                    style={styles.recipeCard}
                    onPress={() => {
                      setSelectedRecipe(recipe);
                      setServings(recipe.servings || 1);
                    }}
                    activeOpacity={0.8}
                  >
                    {recipe.imageUrl ? (
                      <Image source={{ uri: recipe.imageUrl }} style={styles.recipeCardImg} contentFit="cover" />
                    ) : (
                      <View style={styles.recipeCardImgPlaceholder}>
                        <ChefHat size={28} color={theme.colors.neonCyan} />
                      </View>
                    )}

                    <View style={styles.recipeCardBody}>
                      <View style={styles.cardHeaderRow}>
                        <Text style={styles.recipeCardName} numberOfLines={1}>
                          {recipe.name}
                        </Text>
                      </View>

                      <Text style={styles.recipeCardDesc} numberOfLines={2}>
                        {recipe.description}
                      </Text>

                      <View style={styles.cardMacrosRow}>
                        <Text style={styles.cardMacroItem}>
                          <Text style={{ color: theme.colors.text, fontFamily: 'JetBrainsMono_700Bold' }}>
                            {Math.round(recipe.totalCalories)}
                          </Text>{' '}
                          kcal
                        </Text>
                        <Text style={styles.cardMacroItem}>
                          P:{' '}
                          <Text style={{ color: theme.colors.neonCyan, fontFamily: 'JetBrainsMono_700Bold' }}>
                            {Math.round(recipe.totalProtein)}g
                          </Text>
                        </Text>
                        <Text style={styles.cardMacroItem}>
                          C:{' '}
                          <Text style={{ color: theme.colors.warning, fontFamily: 'JetBrainsMono_700Bold' }}>
                            {Math.round(recipe.totalCarbs)}g
                          </Text>
                        </Text>
                        <Text style={styles.cardMacroItem}>
                          G:{' '}
                          <Text style={{ color: theme.colors.error, fontFamily: 'JetBrainsMono_700Bold' }}>
                            {Math.round(recipe.totalFat)}g
                          </Text>
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        )}
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
    backBtn: {
      padding: 4,
    },
    chefIconCircle: {
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
      fontSize: 11,
      color: colors.mutedText,
    },
    closeBtn: {
      padding: 6,
    },
    searchContainer: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 8,
    },
    searchInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      paddingHorizontal: 12,
      height: 42,
      gap: 8,
    },
    searchInput: {
      flex: 1,
      fontFamily: 'Geist_400Regular',
      fontSize: 13,
      color: colors.text,
    },
    tabRow: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      marginBottom: 8,
      gap: 8,
    },
    tabBtn: {
      flex: 1,
      paddingVertical: 8,
      alignItems: 'center',
      borderRadius: 8,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderGlow,
    },
    tabBtnActive: {
      backgroundColor: 'rgba(56, 189, 248, 0.12)',
      borderColor: colors.neonCyan,
    },
    tabBtnText: {
      fontFamily: 'Geist_500Medium',
      fontSize: 12,
      color: colors.mutedText,
    },
    tabBtnTextActive: {
      fontFamily: 'Geist_700Bold',
      color: colors.neonCyan,
    },
    filtersContainer: {
      paddingHorizontal: 16,
      marginBottom: 10,
    },
    unifiedFilterScroll: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingRight: 16,
    },
    filterRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 6,
    },
    chipBtn: {
      paddingHorizontal: 11,
      paddingVertical: 5,
      borderRadius: 16,
      backgroundColor: colors.surfaceLight,
      borderWidth: 1,
      borderColor: colors.borderGlow,
    },
    chipBtnActive: {
      backgroundColor: colors.neonCyan,
      borderColor: colors.neonCyan,
    },
    chipBtnDietActive: {
      backgroundColor: colors.neonIce,
      borderColor: colors.neonIce,
    },
    chipBtnText: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 11,
      color: colors.slate400,
    },
    chipBtnTextActive: {
      fontFamily: 'JetBrainsMono_700Bold',
      fontSize: 11,
      color: colors.obsidian,
    },
    chipBtnDietTextActive: {
      fontFamily: 'JetBrainsMono_700Bold',
      fontSize: 11,
      color: colors.obsidian,
    },
    scrollContent: {
      flex: 1,
    },
    recipeCard: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      overflow: 'hidden',
    },
    recipeCardImg: {
      width: 100,
      height: '100%',
    },
    recipeCardImgPlaceholder: {
      width: 100,
      backgroundColor: colors.surfaceLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    recipeCardBody: {
      flex: 1,
      padding: 12,
    },
    cardHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    recipeCardName: {
      fontFamily: 'Geist_700Bold',
      fontSize: 14,
      color: colors.text,
      flex: 1,
    },
    recipeCardDesc: {
      fontFamily: 'Geist_400Regular',
      fontSize: 11,
      color: colors.mutedText,
      lineHeight: 16,
      marginBottom: 8,
    },
    cardMacrosRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    cardMacroItem: {
      fontFamily: 'JetBrainsMono_400Regular',
      fontSize: 10,
      color: colors.slate400,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
      paddingHorizontal: 20,
      gap: 8,
    },
    emptyTitle: {
      fontFamily: 'Geist_700Bold',
      fontSize: 16,
      color: colors.text,
      marginTop: 8,
    },
    emptySub: {
      fontFamily: 'Geist_400Regular',
      fontSize: 12,
      color: colors.mutedText,
      textAlign: 'center',
    },
    // Detail Styles
    detailImage: {
      width: '100%',
      height: 180,
    },
    detailBody: {
      padding: 16,
    },
    detailTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      marginBottom: 6,
    },
    detailTitle: {
      fontFamily: 'Geist_700Bold',
      fontSize: 20,
      color: colors.text,
      flex: 1,
    },
    variantBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      backgroundColor: 'rgba(56, 189, 248, 0.15)',
      borderWidth: 1,
      borderColor: colors.neonCyan,
    },
    variantBadgeText: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 10,
      color: colors.neonCyan,
    },
    detailDesc: {
      fontFamily: 'Geist_400Regular',
      fontSize: 13,
      color: colors.mutedText,
      lineHeight: 18,
      marginBottom: 12,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      marginBottom: 16,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    metaItemText: {
      fontFamily: 'JetBrainsMono_400Regular',
      fontSize: 11,
      color: colors.slate400,
    },
    macroGrid: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 20,
    },
    macroCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      paddingVertical: 10,
      alignItems: 'center',
    },
    macroLabel: {
      fontFamily: 'JetBrainsMono_700Bold',
      fontSize: 9,
      color: colors.slate500,
      marginBottom: 4,
    },
    macroVal: {
      fontFamily: 'JetBrainsMono_700Bold',
      fontSize: 14,
    },
    sectionHeader: {
      fontFamily: 'JetBrainsMono_700Bold',
      fontSize: 11,
      color: colors.slate400,
      marginBottom: 8,
      marginTop: 8,
      letterSpacing: 0.5,
    },
    ingredientsBox: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      padding: 12,
      marginBottom: 16,
      gap: 8,
    },
    ingredientLine: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 4,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255, 255, 255, 0.04)',
    },
    ingredientLineName: {
      fontFamily: 'Geist_500Medium',
      fontSize: 13,
      color: colors.text,
    },
    cookingStateSub: {
      fontFamily: 'JetBrainsMono_400Regular',
      fontSize: 9,
      color: colors.neonCyan,
      marginTop: 1,
    },
    ingredientLineQty: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 12,
      color: colors.slate400,
    },
    stepsBox: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      padding: 12,
      marginBottom: 20,
      gap: 12,
    },
    stepRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
    },
    stepNumCircle: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: 'rgba(56, 189, 248, 0.15)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.neonCyan,
    },
    stepNumText: {
      fontFamily: 'JetBrainsMono_700Bold',
      fontSize: 11,
      color: colors.neonCyan,
    },
    stepInstructionText: {
      flex: 1,
      fontFamily: 'Geist_400Regular',
      fontSize: 13,
      color: colors.text,
      lineHeight: 18,
    },
    logCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.neonCyan,
      padding: 16,
      marginTop: 8,
    },
    logCardTitle: {
      fontFamily: 'JetBrainsMono_700Bold',
      fontSize: 12,
      color: colors.neonCyan,
      marginBottom: 4,
    },
    logCardSub: {
      fontFamily: 'Geist_400Regular',
      fontSize: 11,
      color: colors.mutedText,
      marginBottom: 12,
    },
    mealTypeRow: {
      flexDirection: 'row',
      gap: 6,
      marginBottom: 14,
    },
    mealTypeChip: {
      flex: 1,
      paddingVertical: 7,
      alignItems: 'center',
      borderRadius: 8,
      backgroundColor: colors.surfaceLight,
      borderWidth: 1,
      borderColor: colors.borderGlow,
    },
    mealTypeChipActive: {
      backgroundColor: 'rgba(56, 189, 248, 0.15)',
      borderColor: colors.neonCyan,
    },
    mealTypeChipText: {
      fontFamily: 'Geist_500Medium',
      fontSize: 11,
      color: colors.slate400,
    },
    mealTypeChipTextActive: {
      fontFamily: 'Geist_700Bold',
      color: colors.neonCyan,
    },
    stepperRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    stepperLabel: {
      fontFamily: 'Geist_500Medium',
      fontSize: 13,
      color: colors.text,
    },
    stepperControls: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceLight,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.borderGlow,
    },
    stepperBtn: {
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    stepperBtnText: {
      fontFamily: 'JetBrainsMono_700Bold',
      fontSize: 16,
      color: colors.neonCyan,
    },
    stepperValText: {
      fontFamily: 'JetBrainsMono_700Bold',
      fontSize: 13,
      color: colors.text,
      paddingHorizontal: 8,
    },
    confirmLogBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.neonCyan,
      borderRadius: 10,
      paddingVertical: 12,
    },
    confirmLogBtnDisabled: {
      opacity: 0.6,
    },
    confirmLogBtnText: {
      fontFamily: 'Geist_700Bold',
      fontSize: 13,
      color: colors.obsidian,
    },
  });
