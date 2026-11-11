import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Search, ScanBarcode, Plus, Utensils, Check, Camera, Pencil, Scale } from 'lucide-react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../../utils/ThemeContext';
import { ThemeColors } from '../../../utils/theme';
import { dietService, Food } from '../../../services/diet.service';
import { openFoodFactsService } from '../../../services/openFoodFacts.service';
import { queryKeys } from '../../../services/queryKeys';
import { useAlertStore } from '../../../store/alertStore';
import { requestCameraPermissions } from '../../../utils/camera';
import { CreateFoodModal, InitialFoodData } from './CreateFoodModal';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { Skeleton } from '../../../components/Skeleton';

interface FoodSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectFood: (food: Food, quantity: number) => void;
}

const normalizeText = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

// Genera una clave canónica única por alimento (código de barras o nombre normalizado + marca)
const getFoodKey = (f: Partial<Food>): string => {
  if (f.barcode && f.barcode.trim()) {
    return `barcode:${f.barcode.trim().toLowerCase()}`;
  }
  const normName = normalizeText(f.name || '');
  const normBrand = normalizeText(f.brand || '');
  return `name:${normName}::brand:${normBrand}`;
};

export interface CategoryFilterOption {
  id: string;
  label: string;
}

export const CATEGORY_FILTERS: CategoryFilterOption[] = [
  { id: 'all', label: 'Todos' },
  { id: 'custom', label: 'Mis Alimentos' },
  { id: 'recipes', label: 'Recetas y Platos' },
  { id: 'carnes', label: 'Carnes' },
  { id: 'pescados', label: 'Pescados' },
  { id: 'verduras', label: 'Verduras' },
  { id: 'frutas', label: 'Frutas' },
  { id: 'lacteos', label: 'Lácteos y Huevos' },
  { id: 'cereales', label: 'Cereales y Granos' },
  { id: 'legumbres', label: 'Legumbres' },
  { id: 'grasas', label: 'Grasas y Aceites' },
  { id: 'suplementos', label: 'Suplementos' },
  { id: 'snacks', label: 'Snacks' },
  { id: 'bebidas', label: 'Bebidas' },
];

const matchesCategory = (item: Food, catId: string): boolean => {
  if (catId === 'all') return true;
  if (catId === 'custom') return !!item.isCustom;

  const itemCat = normalizeText(item.category || '');
  const itemCatId = normalizeText(item.categoryId || '');

  switch (catId) {
    case 'recipes':
      return (
        itemCat.includes('receta') ||
        itemCat.includes('plato') ||
        itemCat.includes('preparado') ||
        itemCatId.includes('receta')
      );
    case 'carnes':
      return (
        itemCat.includes('carne') ||
        itemCat.includes('pollo') ||
        itemCat.includes('pavo') ||
        itemCat.includes('res') ||
        itemCat.includes('cerdo') ||
        itemCatId === 'carnes'
      );
    case 'pescados':
      return (
        itemCat.includes('pescado') ||
        itemCat.includes('marisco') ||
        itemCat.includes('atun') ||
        itemCat.includes('salmon') ||
        itemCatId === 'pescados'
      );
    case 'verduras':
      return (
        itemCat.includes('verdura') ||
        itemCat.includes('vegetal') ||
        itemCat.includes('hortaliza') ||
        itemCatId === 'verduras'
      );
    case 'frutas':
      return itemCat.includes('fruta') || itemCatId === 'frutas';
    case 'lacteos':
      return (
        itemCat.includes('lacteo') ||
        itemCat.includes('leche') ||
        itemCat.includes('queso') ||
        itemCat.includes('yogur') ||
        itemCat.includes('huevo') ||
        itemCatId === 'lacteos'
      );
    case 'cereales':
      return (
        itemCat.includes('cereal') ||
        itemCat.includes('grano') ||
        itemCat.includes('arroz') ||
        itemCat.includes('avena') ||
        itemCat.includes('pasta') ||
        itemCat.includes('pan') ||
        itemCatId === 'cereales'
      );
    case 'legumbres':
      return (
        itemCat.includes('legumbre') ||
        itemCat.includes('frijol') ||
        itemCat.includes('lenteja') ||
        itemCat.includes('garbanzo') ||
        itemCatId === 'legumbres'
      );
    case 'grasas':
      return (
        itemCat.includes('grasa') ||
        itemCat.includes('aceite') ||
        itemCat.includes('mantequilla') ||
        itemCat.includes('aguacate') ||
        itemCatId === 'grasas'
      );
    case 'suplementos':
      return (
        itemCat.includes('suplemento') ||
        itemCat.includes('proteina') ||
        itemCat.includes('whey') ||
        itemCat.includes('creatina') ||
        itemCatId === 'suplementos'
      );
    case 'snacks':
      return (
        itemCat.includes('snack') ||
        itemCat.includes('dulce') ||
        itemCat.includes('barra') ||
        itemCat.includes('galleta') ||
        itemCatId === 'snacks'
      );
    case 'bebidas':
      return (
        itemCat.includes('bebida') ||
        itemCat.includes('agua') ||
        itemCat.includes('cafe') ||
        itemCat.includes('te') ||
        itemCatId === 'bebidas'
      );
    default:
      return itemCat.includes(catId) || itemCatId.includes(catId);
  }
};

export const FoodSearchModal: React.FC<FoodSearchModalProps> = ({
  visible,
  onClose,
  onSelectFood,
}) => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);
  const insets = useSafeAreaInsets();
  const showAlert = useAlertStore((state) => state.showAlert);
  const queryClient = useQueryClient();

  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isBarcodeSearch, setIsBarcodeSearch] = useState(false);
  const [barcodeQuery, setBarcodeQuery] = useState('');
  const [barcodeFoods, setBarcodeFoods] = useState<Food[]>([]);
  const [isBarcodeLoading, setIsBarcodeLoading] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [openFoodFactsData, setOpenFoodFactsData] = useState<InitialFoodData | null>(null);

  // Alimentos añadidos o sincronizados durante la sesión activa
  const [customAddedFoods, setCustomAddedFoods] = useState<Food[]>([]);

  // Caché de códigos de barras en memoria
  const barcodeCacheRef = useRef<Map<string, Food>>(new Map());

  // Alimento seleccionado para confirmar porción
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState('100');
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Consulta optimizada del catálogo general de alimentos de la BD con React Query
  const { data: catalogFoods = [], isLoading: isLoadingCatalog } = useQuery({
    queryKey: queryKeys.diet.foods('all'),
    queryFn: async () => {
      const res = await dietService.searchFoods('', 1, 100);
      return res.items || [];
    },
    enabled: visible,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  // Consolidar catálogo completo deduplicando por código de barras o nombre normalizado
  const allAvailableFoods = useMemo(() => {
    const map = new Map<string, Food>();

    // 1. Primero los añadidos/editados en la sesión activa (máxima prioridad)
    customAddedFoods.forEach((item) => {
      const key = getFoodKey(item);
      map.set(key, item);
    });

    // 2. Luego los alimentos del catálogo general de la BD
    catalogFoods.forEach((item) => {
      const key = getFoodKey(item);
      if (!map.has(key)) {
        map.set(key, item);
      } else {
        const existing = map.get(key)!;
        // Si el que estaba registrado no es personalizado y este sí lo es, priorizamos el personalizado
        if (!existing.isCustom && item.isCustom) {
          map.set(key, item);
        }
      }
    });

    return Array.from(map.values());
  }, [catalogFoods, customAddedFoods]);

  // Filtrado reactivo e instantáneo en memoria a 60 FPS por categoría y texto
  const filteredNameFoods = useMemo(() => {
    const q = normalizeText(query);
    return allAvailableFoods.filter((item) => {
      // 1. Filtro por categoría seleccionada
      if (!matchesCategory(item, selectedCategory)) {
        return false;
      }

      // 2. Filtro por consulta de texto si existe
      if (!q) {
        return true;
      }
      const nameMatch = normalizeText(item.name).includes(q);
      const brandMatch = item.brand ? normalizeText(item.brand).includes(q) : false;
      const categoryMatch = item.category ? normalizeText(item.category).includes(q) : false;
      return nameMatch || brandMatch || categoryMatch;
    });
  }, [query, selectedCategory, allAvailableFoods]);

  // Búsqueda remota complementaria si se escribe un término poco común
  useEffect(() => {
    if (!visible || isBarcodeSearch) return;
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) return;

    // Si ya contamos con suficientes coincidencias locales, no saturamos la red
    if (filteredNameFoods.length >= 4) return;

    const timer = setTimeout(async () => {
      try {
        const res = await dietService.searchFoods(trimmed, 1, 30);
        if (res.items && res.items.length > 0) {
          setCustomAddedFoods((prev) => {
            const existingKeys = new Set(prev.map(getFoodKey));
            const toAdd = res.items.filter(
              (item) => !existingKeys.has(getFoodKey(item))
            );
            return toAdd.length > 0 ? [...toAdd, ...prev] : prev;
          });
        }
      } catch {
        // Fallback silencioso
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query, visible, isBarcodeSearch, filteredNameFoods.length]);

  // Reset al cerrar o cambiar visibilidad
  useEffect(() => {
    if (!visible) {
      setSelectedFood(null);
      setQuantity('100');
      setQuery('');
      setSelectedCategory('all');
      setBarcodeQuery('');
      setBarcodeFoods([]);
      setIsBarcodeSearch(false);
    }
  }, [visible]);

  // Validación de permisos de cámara antes de abrir el escáner
  const handleOpenScanner = async () => {
    const granted = await requestCameraPermissions();
    if (!granted) {
      showAlert(
        'Permiso de Cámara',
        'Se requiere acceso a la cámara para escanear códigos de barra. Puedes activarlo en los ajustes de tu dispositivo.',
        'info'
      );
      return;
    }
    setShowScannerModal(true);
  };

  // Verificación y alternancia de selección (marcar / desmarcar)
  const isItemSelected = (item: Food) => {
    if (!selectedFood) return false;
    return getFoodKey(selectedFood) === getFoodKey(item);
  };

  const handleToggleSelect = (item: Food) => {
    if (isItemSelected(item)) {
      // Si ya está seleccionado, se desmarca
      setSelectedFood(null);
    } else {
      // Si no estaba seleccionado, se marca y se asigna su porción base
      setSelectedFood(item);
      setQuantity(item.servingSize != null ? String(item.servingSize) : '100');
    }
  };

  // Abrir modal de edición para modificar datos o porción del alimento
  const handleEditFood = (item: Food) => {
    setOpenFoodFactsData({
      id: item.id,
      name: item.name,
      brand: item.brand,
      barcode: item.barcode,
      categoryId: item.categoryId,
      category: item.category,
      servingSize: item.servingSize != null ? Number(item.servingSize) : 100,
      servingUnit: item.servingUnit || 'g',
      calories: item.calories != null ? Number(item.calories) : 0,
      protein: item.protein != null ? Number(item.protein) : 0,
      carbs: item.carbs != null ? Number(item.carbs) : 0,
      fat: item.fat != null ? Number(item.fat) : 0,
      sodiumMg: item.sodiumMg != null ? Number(item.sodiumMg) : undefined,
      potassiumMg: item.potassiumMg != null ? Number(item.potassiumMg) : undefined,
    });
    setShowCreateModal(true);
  };

  // Consulta por código de barras
  const processBarcodeLookup = async (code: string) => {
    const cleanCode = code.trim();
    if (!cleanCode) {
      showAlert('Código Requerido', 'Ingresa o escanea un código de barras para buscar.', 'info');
      return;
    }

    setBarcodeQuery(cleanCode);

    // Helper para verificar si un alimento cuenta con datos nutricionales reales (no todo en 0 o vacío)
    const hasValidNutrition = (f: { calories?: number; protein?: number; carbs?: number; fat?: number }) => {
      const c = f.calories ?? 0;
      const p = f.protein ?? 0;
      const cb = f.carbs ?? 0;
      const ft = f.fat ?? 0;
      return c > 0 || p > 0 || cb > 0 || ft > 0;
    };

    // 1. Caché local en memoria
    if (barcodeCacheRef.current.has(cleanCode)) {
      const cached = barcodeCacheRef.current.get(cleanCode)!;
      if (hasValidNutrition(cached)) {
        setBarcodeFoods([cached]);
        setSelectedFood(cached);
        setQuantity(cached.servingSize != null ? String(cached.servingSize) : '100');
        showAlert('Alimento Encontrado', `Se encontró "${cached.name}".`, 'success');
        return;
      }
    }

    try {
      setIsBarcodeLoading(true);

      // 2. Buscar en la BD interna
      const food = await dietService.getFoodByBarcode(cleanCode);

      // Si existe en la BD y tiene macronutrientes válidos, se agrega y selecciona directamente
      if (food && hasValidNutrition(food)) {
        barcodeCacheRef.current.set(cleanCode, food);
        setBarcodeFoods([food]);
        const foodKey = getFoodKey(food);
        setCustomAddedFoods((prev) => [food, ...prev.filter((p) => getFoodKey(p) !== foodKey)]);
        setSelectedFood(food);
        setQuantity(food.servingSize != null ? String(food.servingSize) : '100');
        showAlert('Alimento Encontrado', `Se encontró "${food.name}".`, 'success');
        return;
      }

      // Si no existe en la BD, o si la BD devolvió un registro con datos vacíos/en cero (ej. Clorets)
      // Consultamos Open Food Facts para obtener la información disponible
      const offProduct = await openFoodFactsService.fetchByBarcode(cleanCode);

      const baseName = food?.name || offProduct?.name || 'Alimento Escaneado';
      const baseBrand = food?.brand || offProduct?.brand;
      const baseServingSize = food?.servingSize != null ? Number(food.servingSize) : (offProduct?.servingSize != null ? Number(offProduct.servingSize) : 100);
      const baseServingUnit = food?.servingUnit || offProduct?.servingUnit || 'g';

      const offHasNutrition = offProduct ? hasValidNutrition(offProduct) : false;
      const calories = offHasNutrition
        ? offProduct!.calories
        : food?.calories && food.calories > 0
        ? food.calories
        : undefined;
      const protein = offHasNutrition
        ? offProduct!.protein
        : food?.protein && food.protein > 0
        ? food.protein
        : undefined;
      const carbs = offHasNutrition
        ? offProduct!.carbs
        : food?.carbs && food.carbs > 0
        ? food.carbs
        : undefined;
      const fat = offHasNutrition
        ? offProduct!.fat
        : food?.fat && food.fat > 0
        ? food.fat
        : undefined;
      const sodiumMg = offProduct?.sodiumMg ?? (food?.sodiumMg != null ? food.sodiumMg : undefined);
      const potassiumMg = offProduct?.potassiumMg ?? (food?.potassiumMg != null ? food.potassiumMg : undefined);

      const prefilledData: InitialFoodData = {
        id: food?.id,
        name: baseName,
        brand: baseBrand,
        barcode: cleanCode,
        servingSize: baseServingSize,
        servingUnit: baseServingUnit,
        calories,
        protein,
        carbs,
        fat,
        sodiumMg,
        potassiumMg,
      };

      setOpenFoodFactsData(prefilledData);
      setShowCreateModal(true);

      if (calories !== undefined && calories > 0) {
        showAlert(
          'Revisa y Guarda',
          `Se obtuvieron los datos de "${baseName}". Verifica los macronutrientes y guarda el alimento.`,
          'info'
        );
      } else {
        showAlert(
          'Datos Incompletos en API',
          `Se detectó "${baseName}", pero la API no contiene sus calorías ni macronutrientes. Ingresa los datos de la etiqueta para registrarlo con exactitud.`,
          'info'
        );
      }
    } catch (e: any) {
      showAlert('Error', e.message || 'Error al consultar código de barras.', 'error');
    } finally {
      setIsBarcodeLoading(false);
    }
  };

  const handleConfirmSelect = () => {
    if (!selectedFood) return;
    const qty = parseFloat(quantity) || selectedFood.servingSize || 100;
    onSelectFood(selectedFood, qty);
    setSelectedFood(null);
    onClose();
  };

  const renderFoodItem = ({ item }: { item: Food }) => {
    const selected = isItemSelected(item);
    const qtyNum = selected ? parseFloat(quantity) || item.servingSize || 100 : item.servingSize || 100;
    const ratio = selected ? qtyNum / (item.servingSize || 100) : 1;
    const displayCalories = Math.round(item.calories * ratio);
    const displayProtein = Math.round(item.protein * ratio * 10) / 10;
    const displayCarbs = Math.round(item.carbs * ratio * 10) / 10;
    const displayFat = Math.round(item.fat * ratio * 10) / 10;

    return (
      <TouchableOpacity
        style={[styles.foodCard, selected && styles.foodCardSelected]}
        onPress={() => handleToggleSelect(item)}
        onLongPress={() => handleEditFood(item)}
        delayLongPress={400}
        activeOpacity={0.7}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: selected }}
        accessibilityLabel={`${item.name}, ${displayCalories} calorías`}
        accessibilityHint="Mantén presionado para editar este alimento"
      >
        <View style={{ flex: 1 }}>
          <View style={styles.foodTitleRow}>
            <Text style={styles.foodName}>{item.name}</Text>
            {item.brand ? <Text style={styles.foodBrand}>• {item.brand}</Text> : null}
            {item.category ? (
              <View style={styles.cardCategoryBadge}>
                <Text style={styles.cardCategoryBadgeText}>{item.category}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.servingRow}>
            <Text style={[styles.foodServing, selected && styles.foodServingActive]}>
              {selected
                ? `Porción seleccionada: ${quantity || item.servingSize} ${item.servingUnit}`
                : `Porción base: ${item.servingSize} ${item.servingUnit}`}
            </Text>
            <TouchableOpacity
              style={styles.cardEditPill}
              onPress={() => handleEditFood(item)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel={`Editar ${item.name}`}
            >
              <Pencil size={11} color={theme.colors.mutedText} />
              <Text style={styles.cardEditPillText}>Editar</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.macroPillsRow}>
            <View style={[styles.macroPill, selected && styles.macroPillSelected]}>
              <Text style={[styles.macroPillText, selected && { color: theme.colors.neonCyan }]}>
                {displayCalories} kcal
              </Text>
            </View>
            <View style={[styles.macroPill, { borderColor: 'rgba(56, 189, 248, 0.3)' }]}>
              <Text style={[styles.macroPillText, { color: theme.colors.neonCyan }]}>
                P: {displayProtein}g
              </Text>
            </View>
            <View style={[styles.macroPill, { borderColor: 'rgba(234, 179, 8, 0.3)' }]}>
              <Text style={[styles.macroPillText, { color: theme.colors.warning }]}>
                C: {displayCarbs}g
              </Text>
            </View>
            <View style={styles.macroPill}>
              <Text style={[styles.macroPillText, { color: theme.colors.mutedText }]}>
                G: {displayFat}g
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.selectIndicator, selected && styles.selectIndicatorActive]}
          onPress={() => handleToggleSelect(item)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={selected ? `Desmarcar ${item.name}` : `Marcar ${item.name}`}
        >
          {selected ? (
            <Check size={14} color={theme.colors.obsidian} />
          ) : (
            <Plus size={14} color={theme.colors.mutedText} />
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Utensils size={18} color={theme.colors.neonCyan} />
              <Text style={styles.headerTitle}>Catálogo de Alimentos</Text>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Cerrar catálogo de alimentos"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={20} color={theme.colors.mutedText} />
            </TouchableOpacity>
          </View>

          {/* Search Mode Bar */}
          <View style={styles.modeTabs}>
            <TouchableOpacity
              style={[styles.modeTab, !isBarcodeSearch && styles.modeTabActive]}
              onPress={() => setIsBarcodeSearch(false)}
              accessibilityRole="tab"
              accessibilityState={{ selected: !isBarcodeSearch }}
            >
              <Search size={14} color={!isBarcodeSearch ? theme.colors.neonCyan : theme.colors.mutedText} />
              <Text style={[styles.modeTabText, !isBarcodeSearch && styles.modeTabTextActive]}>
                Buscar por Nombre
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeTab, isBarcodeSearch && styles.modeTabActive]}
              onPress={() => {
                setIsBarcodeSearch(true);
                if (!barcodeQuery.trim()) {
                  setBarcodeFoods([]);
                } else if (barcodeFoods.length > 0 && barcodeFoods[0].barcode !== barcodeQuery.trim()) {
                  setBarcodeFoods([]);
                }
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: isBarcodeSearch }}
            >
              <ScanBarcode size={14} color={isBarcodeSearch ? theme.colors.neonCyan : theme.colors.mutedText} />
              <Text style={[styles.modeTabText, isBarcodeSearch && styles.modeTabTextActive]}>
                Código de Barras
              </Text>
            </TouchableOpacity>
          </View>

          {/* Search Input Container */}
          <View style={styles.searchBarContainer}>
            {!isBarcodeSearch ? (
              <View style={styles.searchInputRow}>
                <Search size={16} color={theme.colors.mutedText} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar en todos los alimentos..."
                  placeholderTextColor={theme.colors.mutedText}
                  value={query}
                  onChangeText={setQuery}
                  accessibilityLabel="Buscar alimento por nombre"
                  returnKeyType="search"
                />
                {query.length > 0 && (
                  <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <X size={16} color={theme.colors.mutedText} />
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.searchInputRow}>
                <ScanBarcode size={16} color={theme.colors.neonCyan} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Ingresa el código"
                  placeholderTextColor={theme.colors.mutedText}
                  value={barcodeQuery}
                  onChangeText={(text) => {
                    setBarcodeQuery(text);
                    if (!text.trim()) {
                      setBarcodeFoods([]);
                    }
                  }}
                  keyboardType="numeric"
                  accessibilityLabel="Buscar por código de barras"
                  returnKeyType="search"
                  onSubmitEditing={() => {
                    if (barcodeQuery.trim()) {
                      processBarcodeLookup(barcodeQuery);
                    }
                  }}
                />
                <TouchableOpacity
                  style={styles.searchActionBtn}
                  onPress={() => {
                    if (barcodeQuery.trim()) {
                      processBarcodeLookup(barcodeQuery);
                    } else {
                      handleOpenScanner();
                    }
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Buscar o escanear código de barras"
                >
                  <Text style={styles.searchActionBtnText}>
                    {barcodeQuery.trim() ? 'Buscar' : 'Escanear'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Quick Add Custom Food Button */}
            <TouchableOpacity
              style={styles.createFoodBtn}
              onPress={() => setShowCreateModal(true)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Crear nuevo alimento en el catálogo"
            >
              <Plus size={14} color={theme.colors.neonCyan} />
              <Text style={styles.createFoodBtnText}>Crear Alimento Personalizado</Text>
            </TouchableOpacity>
          </View>

          {/* Category Filter Chips Bar */}
          {!isBarcodeSearch && (
            <View style={styles.categoryFiltersContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryFiltersScroll}
                keyboardShouldPersistTaps="handled"
              >
                {CATEGORY_FILTERS.map((cat) => {
                  const isActive = selectedCategory === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.categoryChip, isActive && styles.categoryChipActive]}
                      onPress={() => setSelectedCategory(cat.id)}
                      activeOpacity={0.7}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: isActive }}
                      accessibilityLabel={`Filtrar por categoría ${cat.label}`}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          isActive && styles.categoryChipTextActive,
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Results List Container */}
          <View style={styles.listContainer}>
            {isBarcodeSearch ? (
              isBarcodeLoading ? (
                <View style={{ paddingHorizontal: 20, gap: 10 }}>
                  <Skeleton width="100%" height={76} borderRadius={14} />
                  <Skeleton width="100%" height={76} borderRadius={14} />
                </View>
              ) : (
                <FlatList
                  data={barcodeFoods}
                  keyExtractor={(item, index) => item.id || getFoodKey(item) || index.toString()}
                  contentContainerStyle={styles.listContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode="on-drag"
                  extraData={{ selectedKey: selectedFood ? getFoodKey(selectedFood) : null, quantity }}
                  ListHeaderComponent={
                    barcodeFoods.length > 0 ? (
                      <View style={styles.portionNoticeCard}>
                        <View style={styles.portionNoticeHeader}>
                          <Scale size={13} color={theme.colors.neonCyan} />
                          <Text style={styles.portionNoticeTitle}>AJUSTE Y CÁLCULO DE PORCIÓN</Text>
                        </View>
                        <Text style={styles.portionNoticeText}>
                          Al seleccionar el alimento puedes cambiar los gramos o porción a consumir; las calorías y macronutrientes se calcularán automáticamente según la cantidad que ingreses.
                        </Text>
                      </View>
                    ) : undefined
                  }
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <ScanBarcode size={32} color={theme.colors.slate600} />
                      <Text style={styles.emptyTitle}>Escaneo por Código de Barras</Text>
                      <Text style={styles.emptyDesc}>
                        Ingresa el código numérico o presiona "Escanear" para abrir la cámara y detectarlo automáticamente.
                      </Text>
                    </View>
                  }
                  renderItem={renderFoodItem}
                />
              )
            ) : isLoadingCatalog && allAvailableFoods.length === 0 ? (
              <View style={{ paddingHorizontal: 20, gap: 10 }}>
                <Skeleton width="100%" height={76} borderRadius={14} />
                <Skeleton width="100%" height={76} borderRadius={14} />
                <Skeleton width="100%" height={76} borderRadius={14} />
                <Skeleton width="100%" height={76} borderRadius={14} />
              </View>
            ) : (
              <FlatList
                data={filteredNameFoods}
                keyExtractor={(item, index) => item.id || getFoodKey(item) || `${item.name}-${index}`}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                initialNumToRender={12}
                maxToRenderPerBatch={10}
                windowSize={5}
                extraData={{ selectedKey: selectedFood ? getFoodKey(selectedFood) : null, quantity }}
                ListHeaderComponent={
                  <View>
                    <View style={styles.portionNoticeCard}>
                      <View style={styles.portionNoticeHeader}>
                        <Scale size={13} color={theme.colors.neonCyan} />
                        <Text style={styles.portionNoticeTitle}>AJUSTE Y CÁLCULO DE PORCIÓN</Text>
                      </View>
                      <Text style={styles.portionNoticeText}>
                        Puedes seleccionar cualquier alimento y cambiar su porción en gramos o mililitros; sus calorías y macronutrientes se calcularán automáticamente según la cantidad que tomes. Para modificar la porción base de forma permanente, mantén presionado el alimento o toca "Editar".
                      </Text>
                    </View>

                    <View style={styles.resultsHeaderRow}>
                      <Text style={styles.resultsCount}>
                        {filteredNameFoods.length}{' '}
                        {filteredNameFoods.length === 1 ? 'ALIMENTO DISPONIBLE' : 'ALIMENTOS DISPONIBLES'}
                        {selectedCategory !== 'all'
                          ? ` • ${CATEGORY_FILTERS.find((c) => c.id === selectedCategory)?.label.toUpperCase()}`
                          : ''}
                      </Text>
                    </View>
                  </View>
                }
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Utensils size={32} color={theme.colors.slate600} />
                    <Text style={styles.emptyTitle}>No se encontraron alimentos</Text>
                    <Text style={styles.emptyDesc}>
                      {query
                        ? `No hay coincidencias para "${query}". Puedes crear un alimento personalizado.`
                        : selectedCategory !== 'all'
                        ? 'No hay alimentos registrados en esta categoría. Puedes seleccionar "Todos" o crear un nuevo alimento.'
                        : 'No hay alimentos registrados en el catálogo.'}
                    </Text>
                  </View>
                }
                renderItem={renderFoodItem}
              />
            )}
          </View>

          {/* Quantity Confirmation Footer */}
          {selectedFood && (
            <View
              style={[
                styles.footerSheet,
                {
                  paddingBottom:
                    Platform.OS === 'android'
                      ? (keyboardHeight > 0 ? keyboardHeight + 12 : Math.max(insets.bottom, 16))
                      : (keyboardHeight > 0 ? 12 : Math.max(insets.bottom, 16)),
                },
              ]}
            >
              <View style={styles.footerTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.footerFoodName} numberOfLines={1}>
                    {selectedFood.name}
                  </Text>
                  <Text style={styles.footerFoodSub}>
                    Base: {selectedFood.calories} kcal por {selectedFood.servingSize}
                    {selectedFood.servingUnit}
                  </Text>
                </View>

                <View style={styles.qtyContainer}>
                  <Text style={styles.qtyLabel}>CANTIDAD A CONSUMIR</Text>
                  <View style={styles.qtyBox}>
                    <TextInput
                      style={styles.qtyInput}
                      value={quantity}
                      onChangeText={setQuantity}
                      keyboardType="numeric"
                      selectTextOnFocus={true}
                      returnKeyType="done"
                      accessibilityLabel="Cantidad a consumir"
                    />
                    <Text style={styles.qtyUnit}>{selectedFood.servingUnit}</Text>
                  </View>
                </View>
              </View>

              {/* Calculated Macros for selected quantity */}
              {(() => {
                const qtyNum = parseFloat(quantity) || selectedFood.servingSize || 100;
                const ratio = qtyNum / (selectedFood.servingSize || 100);
                const totalKcal = Math.round(selectedFood.calories * ratio);
                const totalP = Math.round(selectedFood.protein * ratio * 10) / 10;
                const totalC = Math.round(selectedFood.carbs * ratio * 10) / 10;
                const totalF = Math.round(selectedFood.fat * ratio * 10) / 10;

                return (
                  <View style={styles.footerSummaryRow}>
                    <View style={styles.footerMacroPills}>
                      <View style={styles.footerMacroBadgeKcal}>
                        <Text style={styles.footerMacroKcalText}>{totalKcal} kcal</Text>
                      </View>
                      <View style={styles.footerMacroBadge}>
                        <Text style={[styles.footerMacroBadgeText, { color: theme.colors.neonCyan }]}>
                          P: {totalP}g
                        </Text>
                      </View>
                      <View style={styles.footerMacroBadge}>
                        <Text style={[styles.footerMacroBadgeText, { color: theme.colors.warning }]}>
                          C: {totalC}g
                        </Text>
                      </View>
                      <View style={styles.footerMacroBadge}>
                        <Text style={[styles.footerMacroBadgeText, { color: theme.colors.mutedText }]}>
                          G: {totalF}g
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.confirmSelectBtn}
                      onPress={handleConfirmSelect}
                      accessibilityRole="button"
                      accessibilityLabel={`Añadir ${selectedFood.name} a la comida`}
                    >
                      <Text style={styles.confirmSelectBtnText}>Añadir ({totalKcal} kcal)</Text>
                    </TouchableOpacity>
                  </View>
                );
              })()}
            </View>
          )}
        </KeyboardAvoidingView>

        {/* Create Food Modal */}
        <CreateFoodModal
          visible={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setOpenFoodFactsData(null);
          }}
          initialBarcode={isBarcodeSearch ? barcodeQuery : undefined}
          initialData={openFoodFactsData}
          onFoodCreated={(created) => {
            const key = getFoodKey(created);
            setCustomAddedFoods((prev) => {
              const filtered = prev.filter((f) => getFoodKey(f) !== key);
              return [created, ...filtered];
            });
            if (created.barcode) {
              barcodeCacheRef.current.set(created.barcode, created);
              if (isBarcodeSearch && barcodeQuery.trim() === created.barcode) {
                setBarcodeFoods([created]);
              }
            }
            queryClient.invalidateQueries({ queryKey: queryKeys.diet.foods('all') });
            setSelectedFood(created);
            setQuantity(created.servingSize != null ? String(created.servingSize) : '100');
            setOpenFoodFactsData(null);
          }}
        />

        {/* Barcode Scanner Camera Modal */}
        <BarcodeScannerModal
          visible={showScannerModal}
          onClose={() => setShowScannerModal(false)}
          onBarcodeScanned={(scannedCode) => {
            processBarcodeLookup(scannedCode);
          }}
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
    keyboardAvoid: {
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
    headerTitle: {
      fontFamily: 'Geist_700Bold',
      fontSize: 17,
      color: colors.text,
    },
    closeBtn: {
      padding: 6,
      backgroundColor: colors.surfaceLight,
      borderRadius: 8,
    },
    modeTabs: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingTop: 12,
      gap: 10,
    },
    modeTab: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderGlow,
    },
    modeTabActive: {
      backgroundColor: 'rgba(0, 240, 255, 0.1)',
      borderColor: colors.neonCyan,
    },
    modeTabText: {
      fontFamily: 'Geist_500Medium',
      fontSize: 12,
      color: colors.mutedText,
    },
    modeTabTextActive: {
      color: colors.neonCyan,
    },
    searchBarContainer: {
      paddingHorizontal: 20,
      paddingVertical: 12,
      gap: 10,
    },
    searchInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      paddingHorizontal: 14,
      paddingVertical: 8,
      gap: 10,
    },
    searchInput: {
      flex: 1,
      color: colors.text,
      fontFamily: 'Geist_500Medium',
      fontSize: 14,
      paddingVertical: 4,
    },
    searchActionBtn: {
      backgroundColor: colors.neonCyan,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
    },
    searchActionBtnText: {
      fontFamily: 'Geist_600SemiBold',
      fontSize: 12,
      color: colors.obsidian,
    },
    createFoodBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: 'rgba(0, 240, 255, 0.08)',
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: 'rgba(0, 240, 255, 0.25)',
    },
    createFoodBtnText: {
      fontFamily: 'Geist_600SemiBold',
      fontSize: 12,
      color: colors.neonCyan,
    },
    categoryFiltersContainer: {
      paddingBottom: 8,
    },
    categoryFiltersScroll: {
      paddingHorizontal: 20,
      gap: 8,
      flexDirection: 'row',
      alignItems: 'center',
    },
    categoryChip: {
      paddingHorizontal: 13,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: colors.surfaceLight,
      borderWidth: 1,
      borderColor: colors.borderGlow,
    },
    categoryChipActive: {
      backgroundColor: colors.neonCyan,
      borderColor: colors.neonCyan,
    },
    categoryChipText: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 11,
      color: colors.slate400,
    },
    categoryChipTextActive: {
      fontFamily: 'JetBrainsMono_700Bold',
      color: colors.obsidian,
    },
    listContainer: {
      flex: 1,
    },
    listContent: {
      paddingHorizontal: 20,
      paddingBottom: 24,
      gap: 10,
    },
    resultsHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 8,
      paddingHorizontal: 2,
    },
    resultsHeader: {
      paddingVertical: 8,
    },
    resultsCount: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 11,
      color: colors.mutedText,
      letterSpacing: 0.5,
    },
    portionNoticeCard: {
      backgroundColor: 'rgba(56, 189, 248, 0.05)',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'rgba(56, 189, 248, 0.2)',
      padding: 12,
      marginBottom: 10,
    },
    portionNoticeHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 4,
    },
    portionNoticeTitle: {
      fontFamily: 'Geist_700Bold',
      fontSize: 11,
      color: colors.neonCyan,
      letterSpacing: 0.5,
    },
    portionNoticeText: {
      fontFamily: 'Geist_400Regular',
      fontSize: 11,
      color: colors.mutedText,
      lineHeight: 16,
    },
    servingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    foodServingActive: {
      color: colors.neonCyan,
      fontFamily: 'Geist_600SemiBold',
    },
    macroPillSelected: {
      borderColor: colors.neonCyan,
      backgroundColor: 'rgba(0, 240, 255, 0.1)',
    },
    cardEditPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 6,
      backgroundColor: 'rgba(255, 255, 255, 0.04)',
      borderWidth: 1,
      borderColor: colors.borderGlow,
    },
    cardEditPillText: {
      fontFamily: 'Geist_500Medium',
      fontSize: 10,
      color: colors.mutedText,
    },
    foodCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.borderGlow,
    },
    foodCardSelected: {
      borderColor: colors.neonCyan,
      backgroundColor: 'rgba(0, 240, 255, 0.05)',
    },
    foodTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 3,
      flexWrap: 'wrap',
    },
    foodName: {
      fontFamily: 'Geist_600SemiBold',
      fontSize: 15,
      color: colors.text,
    },
    foodBrand: {
      fontFamily: 'Geist_400Regular',
      fontSize: 12,
      color: colors.mutedText,
    },
    cardCategoryBadge: {
      backgroundColor: 'rgba(56, 189, 248, 0.1)',
      borderWidth: 1,
      borderColor: 'rgba(56, 189, 248, 0.3)',
      borderRadius: 12,
      paddingHorizontal: 7,
      paddingVertical: 1,
    },
    cardCategoryBadgeText: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 10,
      color: colors.neonCyan,
    },
    foodServing: {
      fontFamily: 'JetBrainsMono_400Regular',
      fontSize: 11,
      color: colors.mutedText,
      marginBottom: 8,
    },
    macroPillsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    macroPill: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      backgroundColor: colors.surfaceLight,
      borderWidth: 1,
      borderColor: colors.borderGlow,
    },
    macroPillText: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 10,
      color: colors.text,
    },
    selectIndicator: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.surfaceLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 12,
      borderWidth: 1,
      borderColor: colors.borderGlow,
    },
    selectIndicatorActive: {
      backgroundColor: colors.neonCyan,
      borderColor: colors.neonCyan,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 50,
      gap: 10,
    },
    emptyTitle: {
      fontFamily: 'Geist_600SemiBold',
      fontSize: 15,
      color: colors.text,
    },
    emptyDesc: {
      fontFamily: 'Geist_400Regular',
      fontSize: 12,
      color: colors.mutedText,
      textAlign: 'center',
      maxWidth: 260,
    },
    footerSheet: {
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.borderGlow,
      paddingHorizontal: 20,
      paddingTop: 12,
      gap: 10,
    },
    footerTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    footerFoodName: {
      fontFamily: 'Geist_600SemiBold',
      fontSize: 15,
      color: colors.text,
    },
    footerFoodSub: {
      fontFamily: 'JetBrainsMono_400Regular',
      fontSize: 11,
      color: colors.mutedText,
      marginTop: 2,
    },
    qtyContainer: {
      alignItems: 'flex-end',
      gap: 3,
    },
    qtyLabel: {
      fontFamily: 'JetBrainsMono_600SemiBold',
      fontSize: 9,
      color: colors.mutedText,
      letterSpacing: 0.5,
    },
    qtyBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceLight,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      paddingHorizontal: 8,
      paddingVertical: 4,
      gap: 4,
    },
    qtyInput: {
      minWidth: 54,
      textAlign: 'center',
      fontFamily: 'JetBrainsMono_600SemiBold',
      fontSize: 15,
      color: colors.neonCyan,
      paddingVertical: 2,
      paddingHorizontal: 4,
    },
    qtyUnit: {
      fontFamily: 'JetBrainsMono_400Regular',
      fontSize: 12,
      color: colors.mutedText,
    },
    footerSummaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: colors.borderGlow,
    },
    footerMacroPills: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flexWrap: 'wrap',
      flex: 1,
    },
    footerMacroBadgeKcal: {
      backgroundColor: 'rgba(0, 240, 255, 0.15)',
      borderColor: colors.neonCyan,
      borderWidth: 1,
      borderRadius: 6,
      paddingHorizontal: 7,
      paddingVertical: 3,
    },
    footerMacroKcalText: {
      fontFamily: 'JetBrainsMono_700Bold',
      fontSize: 11,
      color: colors.neonCyan,
    },
    footerMacroBadge: {
      backgroundColor: colors.surfaceLight,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      paddingHorizontal: 6,
      paddingVertical: 3,
    },
    footerMacroBadgeText: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 10,
    },
    footerSummaryText: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 12,
      color: colors.text,
    },
    confirmSelectBtn: {
      backgroundColor: colors.neonCyan,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
    },
    confirmSelectBtnText: {
      fontFamily: 'Geist_600SemiBold',
      fontSize: 12,
      color: colors.obsidian,
    },
  });
