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
  Refrigerator,
  Sparkles,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  Clock,
  ChevronRight,
} from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../../utils/ThemeContext';
import { ThemeColors } from '../../../utils/theme';
import { useAlertStore } from '../../../store/alertStore';
import { queryKeys } from '../../../services/queryKeys';
import {
  recipeService,
  PantryItem,
  PantryCookSuggestion,
  PantryCookRequest,
} from '../../../services/recipe.service';
import { Skeleton } from '../../../components/Skeleton';

interface PantryModalProps {
  visible: boolean;
  onClose: () => void;
  selectedDate: string;
}

export const PantryModal: React.FC<PantryModalProps> = ({
  visible,
  onClose,
  selectedDate,
}) => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);
  const showAlert = useAlertStore((state) => state.showAlert);
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'cook' | 'inventory'>('cook');
  const [freeText, setFreeText] = useState('');
  const [useStoredPantry, setUseStoredPantry] = useState(true);
  const [selectedMealType, setSelectedMealType] = useState('Lunch');

  // New Pantry item inputs
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('100');
  const [newItemUnit, setNewItemUnit] = useState('g');
  const [newItemCat, setNewItemCat] = useState('Protein');

  const [suggestions, setSuggestions] = useState<PantryCookSuggestion[]>([]);

  // Query Pantry items
  const { data: pantryItems = [], isLoading: isPantryLoading } = useQuery({
    queryKey: queryKeys.diet.pantry,
    queryFn: () => recipeService.getPantry(),
    enabled: visible,
  });

  // Add Item Mutation
  const addItemMutation = useMutation({
    mutationFn: (data: { name: string; quantity: number; unit: string; category: string }) =>
      recipeService.addPantryItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.diet.pantry });
      setNewItemName('');
      showAlert('Ingrediente Guardado', 'Se añadió a tu despensa.', 'success');
    },
    onError: (e: any) => {
      showAlert('Error', e?.message || 'No se pudo guardar el ingrediente.', 'error');
    },
  });

  // Delete Item Mutation
  const deleteItemMutation = useMutation({
    mutationFn: (id: string) => recipeService.deletePantryItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.diet.pantry });
    },
  });

  // Cook with AI Mutation
  const cookAiMutation = useMutation({
    mutationFn: (req: PantryCookRequest) => recipeService.suggestFromPantry(req),
    onSuccess: (data) => {
      setSuggestions(data);
      if (data.length > 0) {
        showAlert('Recetas Encontradas', `Chef IA creó ${data.length} opciones con tu despensa.`, 'success');
      }
    },
    onError: (e: any) => {
      showAlert('Error de Sugerencias', e?.message || 'No se pudo generar con Gemini.', 'error');
    },
  });

  // Log Suggestion as Meal (Option A)
  const logSuggestionMutation = useMutation({
    mutationFn: async (sug: PantryCookSuggestion) => {
      // 1. Create recipe first
      const created = await recipeService.createRecipe({
        name: sug.name,
        description: sug.description,
        mealType: sug.mealType || selectedMealType,
        dietType: sug.dietType || 'Standard',
        prepTimeMinutes: sug.prepTimeMinutes || 10,
        cookTimeMinutes: sug.cookTimeMinutes || 15,
        servings: 1,
        difficulty: sug.difficulty || 'Easy',
        isCommunity: false,
        tags: ['ModoDespensa'],
        ingredients: sug.ingredients,
        steps: sug.steps,
      });

      // 2. Log as meal in daily diary
      return await recipeService.logRecipeAsMeal({
        recipeId: created.id,
        date: selectedDate,
        mealType: selectedMealType,
        servings: 1,
      });
    },
    onSuccess: (_, sug) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.diet.daily(selectedDate) });
      showAlert('Plato Registrado', `"${sug.name}" añadido a tu diario con sus ingredientes desglosados.`, 'success');
      onClose();
    },
    onError: (e: any) => {
      showAlert('Error', e?.message || 'No se pudo registrar la comida.', 'error');
    },
  });

  const handleAddItem = (nameOverride?: string) => {
    const name = (nameOverride || newItemName).trim();
    if (!name) return;
    addItemMutation.mutate({
      name,
      quantity: parseFloat(newItemQty) || 100,
      unit: newItemUnit,
      category: newItemCat,
    });
  };

  const handleSearchCook = () => {
    cookAiMutation.mutate({
      freeTextIngredients: freeText.trim() || undefined,
      useUserPantry: useStoredPantry,
      mealType: selectedMealType,
      dietType: 'Standard',
      maxPrepTimeMinutes: 35,
    });
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View style={styles.iconCircle}>
              <Refrigerator size={18} color={theme.colors.neonCyan} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Modo Despensa</Text>
              <Text style={styles.headerSub}>Cocina con lo que tienes a la mano</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={20} color={theme.colors.slate400} />
          </TouchableOpacity>
        </View>

        {/* Tab Selector */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'cook' && styles.tabBtnActive]}
            onPress={() => setActiveTab('cook')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'cook' && styles.tabBtnTextActive]}>
              🍲 Cocinar con IA
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'inventory' && styles.tabBtnActive]}
            onPress={() => setActiveTab('inventory')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'inventory' && styles.tabBtnTextActive]}>
              📦 Mi Despensa ({pantryItems.length})
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollContent} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          {activeTab === 'cook' ? (
            // ================== MODO COCINAR CON IA ==================
            <View style={{ gap: 14 }}>
              {/* Free Text Input (Option A) */}
              <View style={styles.card}>
                <Text style={styles.cardSectionLabel}>¿QUÉ TIENES EN TU COCINA HOY?</Text>
                <TextInput
                  style={styles.textArea}
                  placeholder="Ej. Tengo 2 huevos, pechuga de pollo, arroz ya cocido y un jitomate..."
                  placeholderTextColor={theme.colors.slate600}
                  value={freeText}
                  onChangeText={setFreeText}
                  multiline
                  numberOfLines={3}
                />

                {/* Stored Pantry Toggle */}
                <TouchableOpacity
                  style={styles.toggleRow}
                  onPress={() => setUseStoredPantry(!useStoredPantry)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.checkbox, useStoredPantry && styles.checkboxActive]}>
                    {useStoredPantry && <Check size={12} color={theme.colors.obsidian} />}
                  </View>
                  <Text style={styles.toggleText}>
                    Incluir ingredientes de Mi Despensa guardada ({pantryItems.length} items)
                  </Text>
                </TouchableOpacity>

                {/* Meal Type Row */}
                <View style={styles.mealTypeRow}>
                  {['Breakfast', 'Lunch', 'Dinner'].map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[styles.chip, selectedMealType === m && styles.chipActive]}
                      onPress={() => setSelectedMealType(m)}
                    >
                      <Text style={[styles.chipText, selectedMealType === m && styles.chipTextActive]}>
                        {m === 'Breakfast' ? 'Desayuno' : m === 'Lunch' ? 'Almuerzo' : 'Cena'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Action Button */}
                <TouchableOpacity
                  style={[styles.searchBtn, cookAiMutation.isPending && styles.searchBtnDisabled]}
                  onPress={handleSearchCook}
                  disabled={cookAiMutation.isPending}
                  activeOpacity={0.8}
                >
                  {cookAiMutation.isPending ? (
                    <View style={styles.btnRow}>
                      <ActivityIndicator color={theme.colors.obsidian} />
                      <Text style={styles.searchBtnText}>Buscando recetas con Gemini...</Text>
                    </View>
                  ) : (
                    <View style={styles.btnRow}>
                      <Sparkles size={16} color={theme.colors.obsidian} />
                      <Text style={styles.searchBtnText}>Crear Recetas con lo que Tengo</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {/* Suggestions List */}
              {suggestions.length > 0 && (
                <View style={{ gap: 12 }}>
                  <Text style={styles.sectionTitle}>RECETAS SUGERIDAS ({suggestions.length})</Text>

                  {suggestions.map((sug, i) => (
                    <View key={i} style={styles.sugCard}>
                      <View style={styles.sugHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.sugName}>{sug.name}</Text>
                          <Text style={styles.sugDesc}>{sug.description}</Text>
                        </View>
                        <View style={styles.matchBadge}>
                          <Text style={styles.matchBadgeText}>{Math.round(sug.matchPercentage)}% Coincidencia</Text>
                        </View>
                      </View>

                      {/* Macros row */}
                      <View style={styles.sugMacrosRow}>
                        <Text style={styles.sugMacroItem}>
                          <Text style={{ color: theme.colors.text, fontFamily: 'JetBrainsMono_700Bold' }}>
                            {Math.round(sug.totalCalories)}
                          </Text>{' '}
                          kcal
                        </Text>
                        <Text style={styles.sugMacroItem}>
                          P:{' '}
                          <Text style={{ color: theme.colors.neonCyan, fontFamily: 'JetBrainsMono_700Bold' }}>
                            {Math.round(sug.totalProtein)}g
                          </Text>
                        </Text>
                        <Text style={styles.sugMacroItem}>
                          C:{' '}
                          <Text style={{ color: theme.colors.warning, fontFamily: 'JetBrainsMono_700Bold' }}>
                            {Math.round(sug.totalCarbs)}g
                          </Text>
                        </Text>
                        <Text style={styles.sugMacroItem}>
                          G:{' '}
                          <Text style={{ color: theme.colors.error, fontFamily: 'JetBrainsMono_700Bold' }}>
                            {Math.round(sug.totalFat)}g
                          </Text>
                        </Text>
                      </View>

                      {/* Missing Ingredients Warning (Option A) */}
                      {sug.missingIngredients && sug.missingIngredients.length > 0 && (
                        <View style={styles.missingBox}>
                          <AlertCircle size={14} color={theme.colors.warning} />
                          <Text style={styles.missingText}>
                            Falta para compras: {sug.missingIngredients.join(', ')}
                          </Text>
                        </View>
                      )}

                      {/* Cook & Log Button */}
                      <TouchableOpacity
                        style={styles.logSugBtn}
                        onPress={() => logSuggestionMutation.mutate(sug)}
                        disabled={logSuggestionMutation.isPending}
                        activeOpacity={0.8}
                      >
                        <Plus size={15} color={theme.colors.obsidian} />
                        <Text style={styles.logSugBtnText}>Cocinar y Registrar en Diario</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ) : (
            // ================== GESTIÓN DE DESPENSA ==================
            <View style={{ gap: 14 }}>
              {/* Add Ingredient Card */}
              <View style={styles.card}>
                <Text style={styles.cardSectionLabel}>AGREGAR INGREDIENTE A TU DESPENSA</Text>

                <View style={styles.inputRow}>
                  <TextInput
                    style={[styles.textInput, { flex: 2 }]}
                    placeholder="Nombre (ej. Pechuga de pollo)"
                    placeholderTextColor={theme.colors.slate600}
                    value={newItemName}
                    onChangeText={setNewItemName}
                  />
                  <TextInput
                    style={[styles.textInput, { flex: 1 }]}
                    placeholder="Cant."
                    placeholderTextColor={theme.colors.slate600}
                    value={newItemQty}
                    onChangeText={setNewItemQty}
                    keyboardType="numeric"
                  />
                  <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => handleAddItem()}
                    disabled={addItemMutation.isPending}
                    activeOpacity={0.8}
                  >
                    <Plus size={18} color={theme.colors.obsidian} />
                  </TouchableOpacity>
                </View>

                {/* Quick Add Chips */}
                <Text style={[styles.cardSectionLabel, { marginTop: 12 }]}>AGREGADO RÁPIDO FRECUENTE</Text>
                <View style={styles.quickChipsRow}>
                  {['Pechuga de pollo', 'Huevos', 'Arroz blanco', 'Avena', 'Aguacate', 'Atún en lata', 'Papas'].map((ing) => (
                    <TouchableOpacity
                      key={ing}
                      style={styles.quickChip}
                      onPress={() => handleAddItem(ing)}
                    >
                      <Plus size={11} color={theme.colors.neonCyan} />
                      <Text style={styles.quickChipText}>{ing}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Items List */}
              <Text style={styles.sectionTitle}>INGREDIENTES GUARDADOS ({pantryItems.length})</Text>

              {isPantryLoading ? (
                <View style={{ gap: 8 }}>
                  <Skeleton width="100%" height={50} borderRadius={10} />
                  <Skeleton width="100%" height={50} borderRadius={10} />
                </View>
              ) : pantryItems.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Refrigerator size={32} color={theme.colors.slate600} />
                  <Text style={styles.emptyTitle}>Tu despensa está vacía</Text>
                  <Text style={styles.emptySub}>Añade ingredientes frecuentes arriba para que el Chef IA los aproveche.</Text>
                </View>
              ) : (
                <View style={styles.inventoryList}>
                  {pantryItems.map((item) => (
                    <View key={item.id} style={styles.inventoryRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.inventoryName}>{item.name}</Text>
                        <Text style={styles.inventorySub}>
                          {item.quantity} {item.unit} • {item.category}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => deleteItemMutation.mutate(item.id)}
                      >
                        <Trash2 size={16} color={theme.colors.error} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </ScrollView>
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
    tabRow: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 10,
      gap: 8,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderGlow,
    },
    tabBtn: {
      flex: 1,
      paddingVertical: 8,
      alignItems: 'center',
      borderRadius: 8,
      backgroundColor: colors.surfaceLight,
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
    scrollContent: {
      flex: 1,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      padding: 14,
    },
    cardSectionLabel: {
      fontFamily: 'JetBrainsMono_700Bold',
      fontSize: 10,
      color: colors.slate400,
      marginBottom: 8,
      letterSpacing: 0.5,
    },
    textArea: {
      backgroundColor: colors.surfaceLight,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      padding: 12,
      fontFamily: 'Geist_400Regular',
      fontSize: 13,
      color: colors.text,
      textAlignVertical: 'top',
      minHeight: 70,
      marginBottom: 10,
    },
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 12,
    },
    checkbox: {
      width: 18,
      height: 18,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: colors.slate500,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxActive: {
      backgroundColor: colors.neonCyan,
      borderColor: colors.neonCyan,
    },
    toggleText: {
      fontFamily: 'Geist_400Regular',
      fontSize: 12,
      color: colors.slate400,
    },
    mealTypeRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 14,
    },
    chip: {
      flex: 1,
      paddingVertical: 7,
      alignItems: 'center',
      borderRadius: 8,
      backgroundColor: colors.surfaceLight,
      borderWidth: 1,
      borderColor: colors.borderGlow,
    },
    chipActive: {
      backgroundColor: 'rgba(56, 189, 248, 0.15)',
      borderColor: colors.neonCyan,
    },
    chipText: {
      fontFamily: 'Geist_500Medium',
      fontSize: 11,
      color: colors.slate400,
    },
    chipTextActive: {
      fontFamily: 'Geist_700Bold',
      color: colors.neonCyan,
    },
    searchBtn: {
      backgroundColor: colors.neonCyan,
      borderRadius: 10,
      paddingVertical: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    searchBtnDisabled: {
      opacity: 0.6,
    },
    btnRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    searchBtnText: {
      fontFamily: 'Geist_700Bold',
      fontSize: 13,
      color: colors.obsidian,
    },
    sectionTitle: {
      fontFamily: 'JetBrainsMono_700Bold',
      fontSize: 11,
      color: colors.slate400,
      letterSpacing: 0.5,
      marginTop: 4,
    },
    sugCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      padding: 14,
      gap: 10,
    },
    sugHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
    },
    sugName: {
      fontFamily: 'Geist_700Bold',
      fontSize: 15,
      color: colors.text,
      marginBottom: 4,
    },
    sugDesc: {
      fontFamily: 'Geist_400Regular',
      fontSize: 11,
      color: colors.mutedText,
      lineHeight: 16,
    },
    matchBadge: {
      backgroundColor: 'rgba(56, 189, 248, 0.15)',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.neonCyan,
    },
    matchBadgeText: {
      fontFamily: 'JetBrainsMono_700Bold',
      fontSize: 10,
      color: colors.neonCyan,
    },
    sugMacrosRow: {
      flexDirection: 'row',
      gap: 12,
    },
    sugMacroItem: {
      fontFamily: 'JetBrainsMono_400Regular',
      fontSize: 11,
      color: colors.slate400,
    },
    missingBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(234, 179, 8, 0.1)',
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: 'rgba(234, 179, 8, 0.3)',
    },
    missingText: {
      fontFamily: 'Geist_400Regular',
      fontSize: 11,
      color: colors.warning,
      flex: 1,
    },
    logSugBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: colors.neonCyan,
      borderRadius: 8,
      paddingVertical: 10,
      marginTop: 4,
    },
    logSugBtnText: {
      fontFamily: 'Geist_700Bold',
      fontSize: 12,
      color: colors.obsidian,
    },
    inputRow: {
      flexDirection: 'row',
      gap: 8,
    },
    textInput: {
      backgroundColor: colors.surfaceLight,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontFamily: 'Geist_400Regular',
      fontSize: 13,
      color: colors.text,
    },
    addBtn: {
      width: 40,
      height: 40,
      backgroundColor: colors.neonCyan,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    quickChipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    quickChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.surfaceLight,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    quickChipText: {
      fontFamily: 'Geist_400Regular',
      fontSize: 11,
      color: colors.slate400,
    },
    inventoryList: {
      gap: 8,
    },
    inventoryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    inventoryName: {
      fontFamily: 'Geist_500Medium',
      fontSize: 13,
      color: colors.text,
    },
    inventorySub: {
      fontFamily: 'JetBrainsMono_400Regular',
      fontSize: 10,
      color: colors.slate500,
      marginTop: 2,
    },
    deleteBtn: {
      padding: 6,
    },
    emptyBox: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
      gap: 8,
    },
    emptyTitle: {
      fontFamily: 'Geist_700Bold',
      fontSize: 14,
      color: colors.text,
    },
    emptySub: {
      fontFamily: 'Geist_400Regular',
      fontSize: 11,
      color: colors.mutedText,
      textAlign: 'center',
      paddingHorizontal: 30,
    },
  });

