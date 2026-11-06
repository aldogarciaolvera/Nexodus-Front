import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Plus, Trash2, Clock, Check, Utensils, Sparkles } from 'lucide-react-native';
import { useTheme } from '../../../utils/ThemeContext';
import { ThemeColors } from '../../../utils/theme';
import { dietService, Meal, MealItem, Food, CreateMealRequest } from '../../../services/diet.service';
import { useAlertStore } from '../../../store/alertStore';
import { FoodSearchModal } from './FoodSearchModal';

interface MealFormModalProps {
  visible: boolean;
  onClose: () => void;
  onMealSaved: () => void;
  mealToEdit?: Meal | null;
  initialDate?: string;
  initialMealType?: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  initialItems?: MealItem[];
}

const MEAL_TYPES: { key: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'; label: string }[] = [
  { key: 'Breakfast', label: 'Desayuno' },
  { key: 'Lunch', label: 'Comida' },
  { key: 'Dinner', label: 'Cena' },
  { key: 'Snack', label: 'Snack' },
];

const getLocalDateString = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const MealFormModal: React.FC<MealFormModalProps> = ({
  visible,
  onClose,
  onMealSaved,
  mealToEdit,
  initialDate,
  initialMealType = 'Breakfast',
  initialItems,
}) => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);
  const showAlert = useAlertStore((state) => state.showAlert);

  const [date, setDate] = useState(
    initialDate || getLocalDateString()
  );
  const [mealType, setMealType] = useState<'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'>(
    initialMealType
  );
  const [name, setName] = useState('');
  const [time, setTime] = useState('');
  const [isCompleted, setIsCompleted] = useState(true);
  const [items, setItems] = useState<MealItem[]>([]);

  const [showFoodSearch, setShowFoodSearch] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      if (mealToEdit) {
        setDate(mealToEdit.date);
        setMealType(mealToEdit.mealType);
        setName(mealToEdit.name);
        setTime(mealToEdit.time);
        setIsCompleted(mealToEdit.isCompleted);
        setItems(mealToEdit.items || []);
      } else {
        setDate(initialDate || new Date().toISOString().split('T')[0]);
        setMealType(initialMealType);
        setName(initialItems && initialItems.length > 0 ? initialItems[0].foodName : '');
        // Current time format HH:mm
        const now = new Date();
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        setTime(`${hh}:${mm}`);
        setIsCompleted(true);
        setItems(initialItems && initialItems.length > 0 ? initialItems : []);
      }
    }
  }, [visible, mealToEdit, initialDate, initialMealType, initialItems]);

  // Aggregate totals
  const totals = useMemo(() => {
    return items.reduce(
      (acc, item) => ({
        calories: acc.calories + (item.calories || 0),
        protein: Math.round((acc.protein + (item.protein || 0)) * 10) / 10,
        carbs: Math.round((acc.carbs + (item.carbs || 0)) * 10) / 10,
        fat: Math.round((acc.fat + (item.fat || 0)) * 10) / 10,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [items]);

  const handleAddFoodFromSearch = (food: Food, quantity: number) => {
    const ratio = quantity / (food.servingSize || 100);
    const newItem: MealItem = {
      foodId: food.id || null,
      foodName: food.name,
      quantity,
      unit: food.servingUnit || 'g',
      calories: Math.round(food.calories * ratio),
      protein: Math.round(food.protein * ratio * 10) / 10,
      carbs: Math.round(food.carbs * ratio * 10) / 10,
      fat: Math.round(food.fat * ratio * 10) / 10,
    };

    setItems((prev) => [...prev, newItem]);

    if (!name.trim()) {
      setName(food.name);
    }
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showAlert('Nombre Requerido', 'Asigna un nombre a la comida.', 'error');
      return;
    }
    if (items.length === 0) {
      showAlert('Alimentos Requeridos', 'Agrega al menos un alimento a la comida.', 'error');
      return;
    }

    try {
      setIsSaving(true);
      const payload: CreateMealRequest = {
        date,
        mealType,
        name: name.trim(),
        time: time.trim() || '12:00',
        isCompleted,
        items,
      };

      if (mealToEdit?.id) {
        await dietService.updateMeal(mealToEdit.id, payload);
        showAlert('Comida Actualizada', `Se guardaron los cambios de "${payload.name}".`, 'success');
      } else {
        await dietService.createMeal(payload);
        showAlert('Comida Registrada', `Se registró "${payload.name}" con éxito.`, 'success');
      }

      onMealSaved();
      onClose();
    } catch (e: any) {
      showAlert('Error', e.message || 'No se pudo guardar la comida.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Utensils size={18} color={theme.colors.neonCyan} />
              <View>
                <Text style={styles.headerTitle}>
                  {mealToEdit ? 'Editar Comida' : 'Registrar Comida'}
                </Text>
                <Text style={styles.headerSubtitle}>
                  {date} • {totals.calories} kcal calculadas
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Cerrar formulario de comida"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={20} color={theme.colors.mutedText} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Meal Type Pills */}
            <View style={styles.pillsContainer}>
              {MEAL_TYPES.map((type) => {
                const isActive = mealType === type.key;
                return (
                  <TouchableOpacity
                    key={type.key}
                    style={[styles.pill, isActive && styles.pillActive]}
                    onPress={() => setMealType(type.key)}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: isActive }}
                    accessibilityLabel={type.label}
                  >
                    <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Meal Info Card */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>DETALLES DE LA COMIDA</Text>

              <Text style={styles.inputLabel}>NOMBRE DE LA COMIDA *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Ej. Pechuga con arroz y aguacate"
                placeholderTextColor={theme.colors.mutedText}
                accessibilityLabel="Nombre de la comida"
              />

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.inputLabel}>HORA (HH:MM)</Text>
                  <TextInput
                    style={styles.input}
                    value={time}
                    onChangeText={setTime}
                    placeholder="13:30"
                    placeholderTextColor={theme.colors.mutedText}
                    accessibilityLabel="Hora de consumo"
                  />
                </View>

                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.inputLabel}>ESTADO</Text>
                  <TouchableOpacity
                    style={[styles.statusToggle, isCompleted && styles.statusToggleActive]}
                    onPress={() => setIsCompleted(!isCompleted)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isCompleted }}
                    accessibilityLabel={isCompleted ? 'Completado' : 'Planeado'}
                  >
                    <View
                      style={[
                        styles.statusCheck,
                        isCompleted && { backgroundColor: theme.colors.neonCyan },
                      ]}
                    >
                      {isCompleted && <Check size={12} color={theme.colors.obsidian} />}
                    </View>
                    <Text style={[styles.statusText, isCompleted && { color: theme.colors.text }]}>
                      {isCompleted ? 'Completado' : 'Planeado'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Food Items Section */}
            <View style={styles.card}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>ALIMENTOS ({items.length})</Text>
                <TouchableOpacity
                  style={styles.addFoodBtn}
                  onPress={() => setShowFoodSearch(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Buscar y agregar alimento"
                >
                  <Plus size={14} color={theme.colors.neonCyan} />
                  <Text style={styles.addFoodBtnText}>Añadir Alimento</Text>
                </TouchableOpacity>
              </View>

              {items.length === 0 ? (
                <TouchableOpacity
                  style={styles.emptyAddBox}
                  onPress={() => setShowFoodSearch(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Presiona para buscar en el catálogo"
                >
                  <Utensils size={24} color={theme.colors.mutedText} />
                  <Text style={styles.emptyAddText}>No has agregado alimentos</Text>
                  <Text style={styles.emptyAddSub}>
                    Toca aquí o en "Añadir Alimento" para buscar en el catálogo o escanear código de barras.
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.itemsList}>
                  {items.map((item, index) => (
                    <View key={index} style={styles.itemRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemName}>{item.foodName}</Text>
                        <Text style={styles.itemQuantity}>
                          {item.quantity} {item.unit} • {item.calories} kcal
                        </Text>
                        <Text style={styles.itemMacros}>
                          P: {item.protein}g   C: {item.carbs}g   G: {item.fat}g
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={styles.deleteItemBtn}
                        onPress={() => handleRemoveItem(index)}
                        accessibilityRole="button"
                        accessibilityLabel={`Eliminar ${item.foodName}`}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Trash2 size={16} color={theme.colors.error} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Total Macros Live Card */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>TOTALES DE ESTA COMIDA</Text>
              <View style={styles.totalsRow}>
                <View style={styles.totalCol}>
                  <Text style={styles.totalValKcal}>{totals.calories}</Text>
                  <Text style={styles.totalLbl}>KCAL</Text>
                </View>
                <View style={styles.totalCol}>
                  <Text style={[styles.totalVal, { color: theme.colors.neonCyan }]}>
                    {totals.protein}g
                  </Text>
                  <Text style={styles.totalLbl}>PROTEÍNA</Text>
                </View>
                <View style={styles.totalCol}>
                  <Text style={[styles.totalVal, { color: theme.colors.warning }]}>
                    {totals.carbs}g
                  </Text>
                  <Text style={styles.totalLbl}>CARBOS</Text>
                </View>
                <View style={styles.totalCol}>
                  <Text style={[styles.totalVal, { color: theme.colors.mutedText }]}>
                    {totals.fat}g
                  </Text>
                  <Text style={styles.totalLbl}>GRASAS</Text>
                </View>
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSave}
              disabled={isSaving}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Guardar comida"
            >
              {isSaving ? (
                <ActivityIndicator color={theme.colors.obsidian} />
              ) : (
                <>
                  <Check size={18} color={theme.colors.obsidian} />
                  <Text style={styles.saveBtnText}>
                    {mealToEdit ? 'Guardar Cambios' : 'Registrar Comida'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Food Search Modal */}
        <FoodSearchModal
          visible={showFoodSearch}
          onClose={() => setShowFoodSearch(false)}
          onSelectFood={handleAddFoodFromSearch}
        />
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
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderGlow,
    },
    headerTitle: {
      fontFamily: 'Geist_700Bold',
      fontSize: 17,
      color: colors.text,
    },
    headerSubtitle: {
      fontFamily: 'JetBrainsMono_400Regular',
      fontSize: 11,
      color: colors.neonCyan,
      marginTop: 1,
    },
    closeBtn: {
      padding: 6,
      backgroundColor: colors.surfaceLight,
      borderRadius: 8,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      padding: 20,
      gap: 16,
      paddingBottom: 40,
    },
    pillsContainer: {
      flexDirection: 'row',
      gap: 8,
    },
    pill: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 10,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderGlow,
    },
    pillActive: {
      backgroundColor: 'rgba(0, 240, 255, 0.12)',
      borderColor: colors.neonCyan,
    },
    pillText: {
      fontFamily: 'Geist_500Medium',
      fontSize: 12,
      color: colors.mutedText,
    },
    pillTextActive: {
      color: colors.neonCyan,
      fontFamily: 'Geist_600SemiBold',
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.borderGlow,
    },
    sectionTitle: {
      fontFamily: 'JetBrainsMono_600SemiBold',
      fontSize: 11,
      color: colors.neonCyan,
      letterSpacing: 0.8,
      marginBottom: 12,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    addFoodBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'rgba(0, 240, 255, 0.1)',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: 'rgba(0, 240, 255, 0.25)',
    },
    addFoodBtnText: {
      fontFamily: 'Geist_600SemiBold',
      fontSize: 11,
      color: colors.neonCyan,
    },
    inputLabel: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 10,
      color: colors.mutedText,
      letterSpacing: 0.8,
      marginBottom: 6,
    },
    input: {
      backgroundColor: colors.surfaceLight,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      color: colors.text,
      fontFamily: 'Geist_500Medium',
      fontSize: 14,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 12,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statusToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colors.surfaceLight,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      paddingHorizontal: 12,
      paddingVertical: 11,
    },
    statusToggleActive: {
      borderColor: 'rgba(0, 240, 255, 0.3)',
    },
    statusCheck: {
      width: 18,
      height: 18,
      borderRadius: 4,
      backgroundColor: colors.slate600,
      alignItems: 'center',
      justifyContent: 'center',
    },
    statusText: {
      fontFamily: 'Geist_500Medium',
      fontSize: 13,
      color: colors.mutedText,
    },
    emptyAddBox: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 24,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      borderStyle: 'dashed',
      borderRadius: 12,
      gap: 6,
    },
    emptyAddText: {
      fontFamily: 'Geist_600SemiBold',
      fontSize: 13,
      color: colors.text,
    },
    emptyAddSub: {
      fontFamily: 'Geist_400Regular',
      fontSize: 11,
      color: colors.mutedText,
      textAlign: 'center',
    },
    itemsList: {
      gap: 8,
    },
    itemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceLight,
      borderRadius: 10,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.borderGlow,
    },
    itemName: {
      fontFamily: 'Geist_600SemiBold',
      fontSize: 14,
      color: colors.text,
    },
    itemQuantity: {
      fontFamily: 'JetBrainsMono_400Regular',
      fontSize: 11,
      color: colors.mutedText,
      marginTop: 2,
    },
    itemMacros: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 10,
      color: colors.neonCyan,
      marginTop: 3,
    },
    deleteItemBtn: {
      padding: 8,
    },
    summaryCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.borderGlow,
    },
    summaryTitle: {
      fontFamily: 'JetBrainsMono_600SemiBold',
      fontSize: 11,
      color: colors.mutedText,
      letterSpacing: 0.8,
      marginBottom: 12,
      textAlign: 'center',
    },
    totalsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
    },
    totalCol: {
      alignItems: 'center',
    },
    totalValKcal: {
      fontFamily: 'JetBrainsMono_700Bold',
      fontSize: 18,
      color: colors.text,
    },
    totalVal: {
      fontFamily: 'JetBrainsMono_600SemiBold',
      fontSize: 15,
    },
    totalLbl: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 9,
      color: colors.mutedText,
      marginTop: 2,
      letterSpacing: 0.6,
    },
    saveBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.neonCyan,
      paddingVertical: 14,
      borderRadius: 12,
      marginTop: 8,
    },
    saveBtnText: {
      fontFamily: 'Geist_600SemiBold',
      fontSize: 14,
      color: colors.obsidian,
    },
  });
