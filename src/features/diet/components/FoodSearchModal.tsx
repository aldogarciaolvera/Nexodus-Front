import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Search, ScanBarcode, Plus, Utensils, Check, Camera } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
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

export const FoodSearchModal: React.FC<FoodSearchModalProps> = ({
  visible,
  onClose,
  onSelectFood,
}) => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);
  const insets = useSafeAreaInsets();
  const showAlert = useAlertStore((state) => state.showAlert);

  const [query, setQuery] = useState('');
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

  // Consolidar catálogo completo deduplicando por ID o nombre
  const allAvailableFoods = useMemo(() => {
    const map = new Map<string, Food>();

    // Primero los añadidos en la sesión para que aparezcan arriba
    customAddedFoods.forEach((item) => {
      const key = item.id || item.name.toLowerCase();
      map.set(key, item);
    });

    // Luego los alimentos del catálogo de la BD
    catalogFoods.forEach((item) => {
      const key = item.id || item.name.toLowerCase();
      if (!map.has(key)) {
        map.set(key, item);
      }
    });

    return Array.from(map.values());
  }, [catalogFoods, customAddedFoods]);

  // Filtrado reactivo e instantáneo en memoria a 60 FPS
  const filteredNameFoods = useMemo(() => {
    const q = normalizeText(query);
    if (!q) {
      return allAvailableFoods;
    }
    return allAvailableFoods.filter((item) => {
      const nameMatch = normalizeText(item.name).includes(q);
      const brandMatch = item.brand ? normalizeText(item.brand).includes(q) : false;
      return nameMatch || brandMatch;
    });
  }, [query, allAvailableFoods]);

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
            const existingKeys = new Set(prev.map((p) => p.id || p.name.toLowerCase()));
            const toAdd = res.items.filter(
              (item) => !existingKeys.has(item.id || item.name.toLowerCase())
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
    if (selectedFood.id && item.id) return selectedFood.id === item.id;
    return selectedFood.name.toLowerCase() === item.name.toLowerCase();
  };

  const handleToggleSelect = (item: Food) => {
    if (isItemSelected(item)) {
      // Si ya está seleccionado, se desmarca
      setSelectedFood(null);
    } else {
      // Si no estaba seleccionado, se marca y se asigna su porción base
      setSelectedFood(item);
      setQuantity(item.servingSize?.toString() || '100');
    }
  };

  // Consulta por código de barras
  const processBarcodeLookup = async (code: string) => {
    const cleanCode = code.trim();
    if (!cleanCode) {
      showAlert('Código Requerido', 'Ingresa o escanea un código de barras para buscar.', 'info');
      return;
    }

    setBarcodeQuery(cleanCode);

    // 1. Caché local en memoria
    if (barcodeCacheRef.current.has(cleanCode)) {
      const cached = barcodeCacheRef.current.get(cleanCode)!;
      setBarcodeFoods([cached]);
      setSelectedFood(cached);
      setQuantity(cached.servingSize?.toString() || '100');
      showAlert('Alimento Encontrado', `Se encontró "${cached.name}".`, 'success');
      return;
    }

    try {
      setIsBarcodeLoading(true);

      // 2. Buscar en la BD interna
      const food = await dietService.getFoodByBarcode(cleanCode);
      if (food) {
        barcodeCacheRef.current.set(cleanCode, food);
        setBarcodeFoods([food]);
        setCustomAddedFoods((prev) => [food, ...prev]);
        setSelectedFood(food);
        setQuantity(food.servingSize?.toString() || '100');
        showAlert('Alimento Encontrado', `Se encontró "${food.name}".`, 'success');
        return;
      }

      // 3. Consultar Open Food Facts
      const offProduct = await openFoodFactsService.fetchByBarcode(cleanCode);
      if (offProduct) {
        setOpenFoodFactsData(offProduct);
        setShowCreateModal(true);
        showAlert(
          'Alimento en Open Food Facts',
          `Se encontraron los datos de "${offProduct.name}". Revisa los datos y guarda el alimento en tu catálogo.`,
          'info'
        );
      } else {
        setOpenFoodFactsData(null);
        setShowCreateModal(true);
        showAlert(
          'Código no registrado',
          'El alimento no se encontró en la base de datos ni en Open Food Facts. Puedes registrarlo manualmente.',
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
              onPress={() => setIsBarcodeSearch(true)}
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
                  placeholder="Ingresa código o escanea con cámara"
                  placeholderTextColor={theme.colors.mutedText}
                  value={barcodeQuery}
                  onChangeText={setBarcodeQuery}
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
                  style={styles.cameraIconBtn}
                  onPress={handleOpenScanner}
                  accessibilityRole="button"
                  accessibilityLabel="Abrir cámara para escanear código de barras"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Camera size={18} color={theme.colors.neonCyan} />
                </TouchableOpacity>
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
                  keyExtractor={(item, index) => item.id || item.barcode || index.toString()}
                  contentContainerStyle={styles.listContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode="on-drag"
                  extraData={selectedFood?.id || selectedFood?.name}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <ScanBarcode size={32} color={theme.colors.slate600} />
                      <Text style={styles.emptyTitle}>Escaneo por Código de Barras</Text>
                      <Text style={styles.emptyDesc}>
                        Ingresa el código numérico o presiona "Escanear" para abrir la cámara y detectarlo automáticamente.
                      </Text>
                    </View>
                  }
                  renderItem={({ item }) => {
                    const selected = isItemSelected(item);
                    return (
                      <TouchableOpacity
                        style={[styles.foodCard, selected && styles.foodCardSelected]}
                        onPress={() => handleToggleSelect(item)}
                        activeOpacity={0.7}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: selected }}
                        accessibilityLabel={`${item.name}, ${item.calories} calorías`}
                      >
                        <View style={{ flex: 1 }}>
                          <View style={styles.foodTitleRow}>
                            <Text style={styles.foodName}>{item.name}</Text>
                            {item.brand ? <Text style={styles.foodBrand}>• {item.brand}</Text> : null}
                          </View>

                          <Text style={styles.foodServing}>
                            Porción: {item.servingSize} {item.servingUnit}
                          </Text>

                          <View style={styles.macroPillsRow}>
                            <View style={styles.macroPill}>
                              <Text style={styles.macroPillText}>{item.calories} kcal</Text>
                            </View>
                            <View style={[styles.macroPill, { borderColor: 'rgba(56, 189, 248, 0.3)' }]}>
                              <Text style={[styles.macroPillText, { color: theme.colors.neonCyan }]}>
                                P: {item.protein}g
                              </Text>
                            </View>
                            <View style={[styles.macroPill, { borderColor: 'rgba(234, 179, 8, 0.3)' }]}>
                              <Text style={[styles.macroPillText, { color: theme.colors.warning }]}>
                                C: {item.carbs}g
                              </Text>
                            </View>
                            <View style={styles.macroPill}>
                              <Text style={[styles.macroPillText, { color: theme.colors.mutedText }]}>
                                G: {item.fat}g
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
                  }}
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
                keyExtractor={(item, index) => item.id || item.barcode || `${item.name}-${index}`}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                initialNumToRender={12}
                maxToRenderPerBatch={10}
                windowSize={5}
                extraData={selectedFood?.id || selectedFood?.name}
                ListHeaderComponent={
                  <View style={styles.resultsHeader}>
                    <Text style={styles.resultsCount}>
                      {filteredNameFoods.length}{' '}
                      {filteredNameFoods.length === 1 ? 'ALIMENTO DISPONIBLE' : 'ALIMENTOS DISPONIBLES'}
                    </Text>
                  </View>
                }
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Utensils size={32} color={theme.colors.slate600} />
                    <Text style={styles.emptyTitle}>No se encontraron alimentos</Text>
                    <Text style={styles.emptyDesc}>
                      {query
                        ? `No hay coincidencias para "${query}". Puedes crear un alimento personalizado.`
                        : 'No hay alimentos registrados en el catálogo.'}
                    </Text>
                  </View>
                }
                renderItem={({ item }) => {
                  const selected = isItemSelected(item);
                  return (
                    <TouchableOpacity
                      style={[styles.foodCard, selected && styles.foodCardSelected]}
                      onPress={() => handleToggleSelect(item)}
                      activeOpacity={0.7}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: selected }}
                      accessibilityLabel={`${item.name}, ${item.calories} calorías`}
                    >
                      <View style={{ flex: 1 }}>
                        <View style={styles.foodTitleRow}>
                          <Text style={styles.foodName}>{item.name}</Text>
                          {item.brand ? <Text style={styles.foodBrand}>• {item.brand}</Text> : null}
                        </View>

                        <Text style={styles.foodServing}>
                          Porción: {item.servingSize} {item.servingUnit}
                        </Text>

                        <View style={styles.macroPillsRow}>
                          <View style={styles.macroPill}>
                            <Text style={styles.macroPillText}>{item.calories} kcal</Text>
                          </View>
                          <View style={[styles.macroPill, { borderColor: 'rgba(56, 189, 248, 0.3)' }]}>
                            <Text style={[styles.macroPillText, { color: theme.colors.neonCyan }]}>
                              P: {item.protein}g
                            </Text>
                          </View>
                          <View style={[styles.macroPill, { borderColor: 'rgba(234, 179, 8, 0.3)' }]}>
                            <Text style={[styles.macroPillText, { color: theme.colors.warning }]}>
                              C: {item.carbs}g
                            </Text>
                          </View>
                          <View style={styles.macroPill}>
                            <Text style={[styles.macroPillText, { color: theme.colors.mutedText }]}>
                              G: {item.fat}g
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
                }}
              />
            )}
          </View>

          {/* Quantity Confirmation Footer */}
          {selectedFood && (
            <View style={[styles.footerSheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
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

                <View style={styles.qtyBox}>
                  <TextInput
                    style={styles.qtyInput}
                    value={quantity}
                    onChangeText={setQuantity}
                    keyboardType="decimal-pad"
                    selectTextOnFocus={true}
                    returnKeyType="done"
                    accessibilityLabel="Cantidad a consumir"
                  />
                  <Text style={styles.qtyUnit}>{selectedFood.servingUnit}</Text>
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
                    <Text style={styles.footerSummaryText}>
                      {totalKcal} kcal • P: {totalP}g C: {totalC}g G: {totalF}g
                    </Text>
                    <TouchableOpacity
                      style={styles.confirmSelectBtn}
                      onPress={handleConfirmSelect}
                      accessibilityRole="button"
                      accessibilityLabel="Añadir a la comida"
                    >
                      <Text style={styles.confirmSelectBtnText}>Añadir</Text>
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
          initialBarcode={barcodeQuery}
          initialData={openFoodFactsData}
          onFoodCreated={(created) => {
            setCustomAddedFoods((prev) => [created, ...prev]);
            if (created.barcode) {
              barcodeCacheRef.current.set(created.barcode, created);
              setBarcodeFoods((prev) => [created, ...prev]);
            }
            setSelectedFood(created);
            setQuantity(created.servingSize?.toString() || '100');
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
    cameraIconBtn: {
      padding: 6,
      borderRadius: 8,
      backgroundColor: 'rgba(0, 240, 255, 0.08)',
      alignItems: 'center',
      justifyContent: 'center',
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
    listContainer: {
      flex: 1,
    },
    listContent: {
      paddingHorizontal: 20,
      paddingBottom: 24,
      gap: 10,
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
