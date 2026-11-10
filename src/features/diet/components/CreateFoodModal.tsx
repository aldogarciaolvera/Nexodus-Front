import React, { useState, useEffect } from 'react';
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
import { X, Plus, Sparkles, UtensilsCrossed, Pencil, Check } from 'lucide-react-native';
import { useTheme } from '../../../utils/ThemeContext';
import { ThemeColors } from '../../../utils/theme';
import { dietService, Food, FoodCategory } from '../../../services/diet.service';
import { useAlertStore } from '../../../store/alertStore';

export interface InitialFoodData {
  id?: string;
  name?: string;
  brand?: string;
  barcode?: string;
  categoryId?: string;
  category?: string;
  servingSize?: number;
  servingUnit?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  sodiumMg?: number;
  potassiumMg?: number;
}

const DEFAULT_FOOD_CATEGORIES: FoodCategory[] = [
  { id: 'carnes', name: 'Carnes', description: 'Carne de res, pollo, pavo, cerdo y carnes rojas o blancas' },
  { id: 'pescados', name: 'Pescados y Mariscos', description: 'Pescados blancos, salmón, atún, camarones y mariscos' },
  { id: 'verduras', name: 'Verduras', description: 'Verduras, hortalizas y vegetales frescos o cocidos' },
  { id: 'frutas', name: 'Frutas', description: 'Frutas frescas, bayas, plátanos, manzanas y cítricos' },
  { id: 'lacteos', name: 'Lácteos y Huevos', description: 'Huevos, leche, quesos, yogur griego y requesón' },
  { id: 'cereales', name: 'Cereales y Granos', description: 'Arroz, avena, pasta, pan integral, quinoa y cereales' },
  { id: 'legumbres', name: 'Legumbres', description: 'Frijoles, lentejas, garbanzos, soya y habas' },
  { id: 'frutos_secos', name: 'Frutos Secos y Semillas', description: 'Nueces, almendras, cacahuates, chía y linaza' },
  { id: 'grasas', name: 'Grasas y Aceites', description: 'Aceite de oliva, aguacate, mantequilla y aceites saludables' },
  { id: 'bebidas', name: 'Bebidas', description: 'Agua, café, té, infusiones y bebidas sin azúcar' },
  { id: 'suplementos', name: 'Suplementos', description: 'Proteína en polvo (whey), creatina, multivitaminas y aminoácidos' },
  { id: 'snacks', name: 'Snacks y Dulces', description: 'Barras de proteína, botanas, galletas y chocolates' },
  { id: 'otros', name: 'Otros', description: 'Condimentos, especias, aderezos y alimentos varios' },
];

interface CreateFoodModalProps {
  visible: boolean;
  onClose: () => void;
  onFoodCreated: (food: Food) => void;
  initialBarcode?: string;
  initialData?: InitialFoodData | null;
}

export const CreateFoodModal: React.FC<CreateFoodModalProps> = ({
  visible,
  onClose,
  onFoodCreated,
  initialBarcode = '',
  initialData = null,
}) => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);
  const showAlert = useAlertStore((state) => state.showAlert);

  const [name, setName] = useState(initialData?.name || '');
  const [brand, setBrand] = useState(initialData?.brand || '');
  const [barcode, setBarcode] = useState(initialData?.barcode || initialBarcode);
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || '');
  const [category, setCategory] = useState(initialData?.category || '');
  const [categoriesList, setCategoriesList] = useState<FoodCategory[]>(DEFAULT_FOOD_CATEGORIES);
  const [servingSize, setServingSize] = useState(
    initialData?.servingSize != null ? String(initialData.servingSize) : '100'
  );
  const [servingUnit, setServingUnit] = useState(initialData?.servingUnit || 'g');
  const [calories, setCalories] = useState(
    initialData?.calories != null && Number(initialData.calories) > 0 ? String(initialData.calories) : ''
  );
  const [protein, setProtein] = useState(
    initialData?.protein != null && Number(initialData.protein) > 0 ? String(initialData.protein) : ''
  );
  const [carbs, setCarbs] = useState(
    initialData?.carbs != null && Number(initialData.carbs) > 0 ? String(initialData.carbs) : ''
  );
  const [fat, setFat] = useState(
    initialData?.fat != null && Number(initialData.fat) > 0 ? String(initialData.fat) : ''
  );
  const [sodiumMg, setSodiumMg] = useState(
    initialData?.sodiumMg != null ? String(initialData.sodiumMg) : ''
  );
  const [potassiumMg, setPotassiumMg] = useState(
    initialData?.potassiumMg != null ? String(initialData.potassiumMg) : ''
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    dietService
      .getFoodCategories()
      .then((cats) => {
        if (isMounted && cats && cats.length > 0) {
          setCategoriesList(cats);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (visible) {
      setName(initialData?.name || '');
      setBrand(initialData?.brand || '');
      setCategoryId(initialData?.categoryId || '');
      setCategory(initialData?.category || '');
      // Solo usar initialBarcode al crear un alimento nuevo desde la vista de código de barras
      const effectiveBarcode = initialData ? (initialData.barcode || '') : (initialBarcode || '');
      setBarcode(effectiveBarcode);
      setServingSize(
        initialData?.servingSize != null ? String(initialData.servingSize) : '100'
      );
      setServingUnit(initialData?.servingUnit || 'g');
      setCalories(
        initialData?.calories != null && Number(initialData.calories) > 0 ? String(initialData.calories) : ''
      );
      setProtein(
        initialData?.protein != null && Number(initialData.protein) > 0 ? String(initialData.protein) : ''
      );
      setCarbs(
        initialData?.carbs != null && Number(initialData.carbs) > 0 ? String(initialData.carbs) : ''
      );
      setFat(
        initialData?.fat != null && Number(initialData.fat) > 0 ? String(initialData.fat) : ''
      );
      setSodiumMg(
        initialData?.sodiumMg != null ? String(initialData.sodiumMg) : ''
      );
      setPotassiumMg(
        initialData?.potassiumMg != null ? String(initialData.potassiumMg) : ''
      );
    }
  }, [visible, initialBarcode, initialData]);

  const handleSave = async () => {
    if (!name.trim()) {
      showAlert('Campo Requerido', 'Ingresa el nombre del alimento.', 'error');
      return;
    }
    const numCalories = parseFloat(calories);
    const numServingSize = parseFloat(servingSize) || 100;
    const numProtein = parseFloat(protein) || 0;
    const numCarbs = parseFloat(carbs) || 0;
    const numFat = parseFloat(fat) || 0;

    if (isNaN(numCalories) || numCalories < 0) {
      showAlert('Calorías Requeridas', 'Ingresa las calorías por porción.', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: Omit<Food, 'id'> = {
        name: name.trim(),
        brand: brand.trim() || undefined,
        barcode: barcode.trim() || undefined,
        categoryId: categoryId.trim() || undefined,
        category: category.trim() || undefined,
        servingSize: numServingSize,
        servingUnit: servingUnit.trim() || 'g',
        calories: numCalories,
        protein: numProtein,
        carbs: numCarbs,
        fat: numFat,
        sodiumMg: sodiumMg ? parseFloat(sodiumMg) : undefined,
        potassiumMg: potassiumMg ? parseFloat(potassiumMg) : undefined,
      };

      let savedFood: Food;
      if (initialData?.id) {
        try {
          savedFood = await dietService.updateFood(initialData.id, payload);
        } catch {
          savedFood = await dietService.createFood(payload);
        }
      } else {
        savedFood = await dietService.createFood(payload);
      }

      showAlert(
        initialData?.id ? 'Alimento Actualizado' : 'Alimento Guardado',
        initialData?.id
          ? `Se guardaron los cambios de "${name}".`
          : `Se registró "${name}" en el catálogo.`,
        'success'
      );
      onFoodCreated(savedFood);
      onClose();
    } catch (e: any) {
      showAlert('Error', e.message || 'No se pudo guardar el alimento.', 'error');
    } finally {
      setIsSubmitting(false);
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
              {initialData?.id ? (
                <Pencil size={18} color={theme.colors.neonCyan} />
              ) : (
                <UtensilsCrossed size={18} color={theme.colors.neonCyan} />
              )}
              <View>
                <Text style={styles.headerTitle}>
                  {initialData?.id ? 'Editar Alimento' : 'Crear Alimento'}
                </Text>
                <Text style={styles.headerSubtitle}>
                  {initialData?.id
                    ? 'Modificar datos nutricionales y porción base'
                    : 'Agregar al catálogo personalizado'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Cerrar modal de crear alimento"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={20} color={theme.colors.mutedText} />
            </TouchableOpacity>
          </View>

          {initialData?.id ? (
            <View style={styles.autofillBanner}>
              <Pencil size={14} color={theme.colors.neonCyan} />
              <Text style={styles.autofillBannerText}>Editando alimento del catálogo</Text>
            </View>
          ) : initialData?.name ? (
            <View style={styles.autofillBanner}>
              <Sparkles size={14} color={theme.colors.neonCyan} />
              <Text style={styles.autofillBannerText}>
                {initialData.calories && Number(initialData.calories) > 0
                  ? 'Datos autocompletados desde la API'
                  : 'Datos básicos de la API (Completa las calorías y macronutrientes)'}
              </Text>
            </View>
          ) : null}

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Nombre y Marca */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>INFORMACIÓN BÁSICA</Text>

              <Text style={styles.inputLabel}>NOMBRE DEL ALIMENTO *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Ej. Pechuga de pollo cocida"
                placeholderTextColor={theme.colors.mutedText}
                accessibilityLabel="Nombre del alimento"
              />

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.inputLabel}>MARCA (OPCIONAL)</Text>
                  <TextInput
                    style={styles.input}
                    value={brand}
                    onChangeText={setBrand}
                    placeholder="Ej. Bachoco"
                    placeholderTextColor={theme.colors.mutedText}
                    accessibilityLabel="Marca"
                  />
                </View>

                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.inputLabel}>CÓDIGO DE BARRAS</Text>
                  <TextInput
                    style={styles.input}
                    value={barcode}
                    onChangeText={setBarcode}
                    placeholder="Ej. 7501000111222"
                    placeholderTextColor={theme.colors.mutedText}
                    keyboardType="numeric"
                    accessibilityLabel="Código de barras"
                  />
                </View>
              </View>

              {/* Categoría Predefinida */}
              <View style={styles.categorySection}>
                <View style={styles.categoryHeaderRow}>
                  <Text style={styles.inputLabel}>CATEGORÍA *</Text>
                  <View style={styles.categorySystemBadge}>
                    <Text style={styles.categorySystemBadgeText}>OFICIAL</Text>
                  </View>
                </View>
                <Text style={styles.categorySubtitle}>
                  Selecciona el concepto general al que pertenece este alimento:
                </Text>

                <View style={styles.categoryChipsContainer}>
                  {categoriesList.map((catItem) => {
                    const isSelected =
                      (categoryId && catItem.id && categoryId.toLowerCase() === catItem.id.toLowerCase()) ||
                      (category && catItem.name && category.toLowerCase() === catItem.name.toLowerCase());

                    return (
                      <TouchableOpacity
                        key={catItem.id || catItem.name}
                        style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
                        onPress={() => {
                          if (isSelected) {
                            setCategoryId('');
                            setCategory('');
                          } else {
                            setCategoryId(catItem.id || '');
                            setCategory(catItem.name);
                          }
                        }}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel={`Categoría ${catItem.name}`}
                      >
                        {isSelected && (
                          <Check size={11} color={theme.colors.neonCyan} style={{ marginRight: 4 }} />
                        )}
                        <Text
                          style={[
                            styles.categoryChipText,
                            isSelected && styles.categoryChipTextSelected,
                          ]}
                        >
                          {catItem.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* Porción */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>TAMAÑO DE PORCIÓN</Text>
              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.inputLabel}>CANTIDAD BASE</Text>
                  <TextInput
                    style={styles.input}
                    value={servingSize}
                    onChangeText={setServingSize}
                    placeholder="100"
                    placeholderTextColor={theme.colors.mutedText}
                    keyboardType="numeric"
                    accessibilityLabel="Cantidad base de porción"
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.inputLabel}>UNIDAD</Text>
                  <TextInput
                    style={styles.input}
                    value={servingUnit}
                    onChangeText={setServingUnit}
                    placeholder="g, ml, pieza"
                    placeholderTextColor={theme.colors.mutedText}
                    accessibilityLabel="Unidad de porción"
                  />
                </View>
              </View>
            </View>

            {/* Macros */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>MACRONUTRIENTES (POR PORCIÓN)</Text>

              <Text style={styles.inputLabel}>CALORÍAS (KCAL) *</Text>
              <TextInput
                style={[styles.input, styles.inputHighlight]}
                value={calories}
                onChangeText={setCalories}
                placeholder="0"
                placeholderTextColor={theme.colors.mutedText}
                keyboardType="numeric"
                accessibilityLabel="Calorías"
              />

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 6 }}>
                  <Text style={styles.inputLabel}>PROTEÍNA (G)</Text>
                  <TextInput
                    style={styles.input}
                    value={protein}
                    onChangeText={setProtein}
                    placeholder="0"
                    placeholderTextColor={theme.colors.mutedText}
                    keyboardType="numeric"
                    accessibilityLabel="Proteína"
                  />
                </View>

                <View style={{ flex: 1, marginHorizontal: 6 }}>
                  <Text style={styles.inputLabel}>CARBOS (G)</Text>
                  <TextInput
                    style={styles.input}
                    value={carbs}
                    onChangeText={setCarbs}
                    placeholder="0"
                    placeholderTextColor={theme.colors.mutedText}
                    keyboardType="numeric"
                    accessibilityLabel="Carbohidratos"
                  />
                </View>

                <View style={{ flex: 1, marginLeft: 6 }}>
                  <Text style={styles.inputLabel}>GRASAS (G)</Text>
                  <TextInput
                    style={styles.input}
                    value={fat}
                    onChangeText={setFat}
                    placeholder="0"
                    placeholderTextColor={theme.colors.mutedText}
                    keyboardType="numeric"
                    accessibilityLabel="Grasas"
                  />
                </View>
              </View>
            </View>

            {/* Micronutrientes opcionales */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>MICRONUTRIENTES (OPCIONAL)</Text>
              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.inputLabel}>SODIO (MG)</Text>
                  <TextInput
                    style={styles.input}
                    value={sodiumMg}
                    onChangeText={setSodiumMg}
                    placeholder="0"
                    placeholderTextColor={theme.colors.mutedText}
                    keyboardType="numeric"
                    accessibilityLabel="Sodio en miligramos"
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.inputLabel}>POTASIO (MG)</Text>
                  <TextInput
                    style={styles.input}
                    value={potassiumMg}
                    onChangeText={setPotassiumMg}
                    placeholder="0"
                    placeholderTextColor={theme.colors.mutedText}
                    keyboardType="numeric"
                    accessibilityLabel="Potasio en miligramos"
                  />
                </View>
              </View>
            </View>

            {/* Botón Guardar */}
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSave}
              disabled={isSubmitting}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Guardar alimento"
            >
              {isSubmitting ? (
                <ActivityIndicator color={theme.colors.obsidian} />
              ) : (
                <>
                  {initialData?.id ? (
                    <Check size={16} color={theme.colors.obsidian} />
                  ) : (
                    <Plus size={16} color={theme.colors.obsidian} />
                  )}
                  <Text style={styles.saveBtnText}>
                    {initialData?.id ? 'Guardar Cambios' : 'Guardar en Catálogo'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
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
      fontFamily: 'Geist_400Regular',
      fontSize: 12,
      color: colors.mutedText,
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
    inputHighlight: {
      fontFamily: 'JetBrainsMono_600SemiBold',
      borderColor: 'rgba(0, 240, 255, 0.4)',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
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
    autofillBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: 'rgba(0, 240, 255, 0.08)',
      borderWidth: 1,
      borderColor: 'rgba(0, 240, 255, 0.25)',
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginHorizontal: 20,
      marginTop: 10,
    },
    autofillBannerText: {
      fontFamily: 'Geist_600SemiBold',
      fontSize: 11,
      color: colors.neonCyan,
    },
    categorySection: {
      marginTop: 4,
      marginBottom: 4,
    },
    categoryHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 2,
    },
    categorySystemBadge: {
      backgroundColor: 'rgba(0, 240, 255, 0.1)',
      borderColor: 'rgba(0, 240, 255, 0.3)',
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 6,
      paddingVertical: 1,
    },
    categorySystemBadgeText: {
      fontFamily: 'JetBrainsMono_600SemiBold',
      fontSize: 9,
      color: colors.neonCyan,
      letterSpacing: 0.5,
    },
    categorySubtitle: {
      fontFamily: 'Geist_400Regular',
      fontSize: 11,
      color: colors.mutedText,
      marginBottom: 8,
    },
    categoryChipsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    categoryChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceLight,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    categoryChipSelected: {
      backgroundColor: 'rgba(0, 240, 255, 0.12)',
      borderColor: colors.neonCyan,
    },
    categoryChipText: {
      fontFamily: 'Geist_500Medium',
      fontSize: 12,
      color: colors.mutedText,
    },
    categoryChipTextSelected: {
      fontFamily: 'Geist_600SemiBold',
      color: colors.neonCyan,
    },
  });
