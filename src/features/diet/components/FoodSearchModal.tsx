import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Search, ScanBarcode, Plus, Sparkles, Utensils, Check } from 'lucide-react-native';
import { useTheme } from '../../../utils/ThemeContext';
import { ThemeColors } from '../../../utils/theme';
import { dietService, Food } from '../../../services/diet.service';
import { useAlertStore } from '../../../store/alertStore';
import { CreateFoodModal } from './CreateFoodModal';
import { Skeleton } from '../../../components/Skeleton';

interface FoodSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectFood: (food: Food, quantity: number) => void;
}

export const FoodSearchModal: React.FC<FoodSearchModalProps> = ({
  visible,
  onClose,
  onSelectFood,
}) => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);
  const showAlert = useAlertStore((state) => state.showAlert);

  const [query, setQuery] = useState('');
  const [foods, setFoods] = useState<Food[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBarcodeSearch, setIsBarcodeSearch] = useState(false);
  const [barcodeQuery, setBarcodeQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Selected food state for quantity confirmation
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState('100');

  // Debounced search
  useEffect(() => {
    if (!visible) return;
    if (isBarcodeSearch) return;

    if (!query.trim()) {
      // Default common foods query
      loadFoods('pollo');
      return;
    }

    const timer = setTimeout(() => {
      loadFoods(query);
    }, 350);

    return () => clearTimeout(timer);
  }, [query, visible, isBarcodeSearch]);

  const loadFoods = async (searchStr: string) => {
    try {
      setIsLoading(true);
      const res = await dietService.searchFoods(searchStr);
      setFoods(res.items);
    } catch {
      // Graceful fallback to empty or offline list
      setFoods([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBarcodeLookup = async () => {
    if (!barcodeQuery.trim()) {
      showAlert('Código Requerido', 'Ingresa un código de barras para buscar.', 'info');
      return;
    }

    try {
      setIsLoading(true);
      const food = await dietService.getFoodByBarcode(barcodeQuery.trim());
      if (food) {
        setFoods([food]);
        setSelectedFood(food);
        setQuantity(food.servingSize?.toString() || '100');
        showAlert('Alimento Encontrado', `Se encontró "${food.name}".`, 'success');
      } else {
        showAlert('No Encontrado', 'No se encontró un alimento con este código. ¿Deseas crearlo?', 'info');
        setShowCreateModal(true);
      }
    } catch (e: any) {
      showAlert('Error', e.message || 'Error al consultar código de barras.', 'error');
    } finally {
      setIsLoading(false);
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
      <SafeAreaView style={styles.safeArea}>
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
                placeholder="Ej. Pechuga, avena, huevo, proteína..."
                placeholderTextColor={theme.colors.mutedText}
                value={query}
                onChangeText={setQuery}
                autoFocus={true}
                accessibilityLabel="Buscar alimento por nombre"
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
                placeholder="Ingresa código (ej. 7501000111222)"
                placeholderTextColor={theme.colors.mutedText}
                value={barcodeQuery}
                onChangeText={setBarcodeQuery}
                keyboardType="numeric"
                accessibilityLabel="Buscar por código de barras"
              />
              <TouchableOpacity
                style={styles.searchActionBtn}
                onPress={handleBarcodeLookup}
                accessibilityRole="button"
                accessibilityLabel="Buscar código de barras"
              >
                <Text style={styles.searchActionBtnText}>Buscar</Text>
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
            <Text style={styles.createFoodBtnText}>+ Crear Alimento Personalizado</Text>
          </TouchableOpacity>
        </View>

        {/* Results List */}
        {isLoading ? (
          <View style={{ paddingHorizontal: 20, gap: 10 }}>
            <Skeleton width="100%" height={76} borderRadius={14} />
            <Skeleton width="100%" height={76} borderRadius={14} />
            <Skeleton width="100%" height={76} borderRadius={14} />
          </View>
        ) : (
          <FlatList
            data={foods}
            keyExtractor={(item, index) => item.id || item.barcode || index.toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Utensils size={32} color={theme.colors.slate600} />
                <Text style={styles.emptyTitle}>No se encontraron alimentos</Text>
                <Text style={styles.emptyDesc}>
                  Intenta con otro término o presiona el botón para crear un alimento personalizado.
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const isSelected = selectedFood?.id === item.id || selectedFood?.name === item.name;
              return (
                <TouchableOpacity
                  style={[styles.foodCard, isSelected && styles.foodCardSelected]}
                  onPress={() => {
                    setSelectedFood(item);
                    setQuantity(item.servingSize?.toString() || '100');
                  }}
                  activeOpacity={0.7}
                  accessibilityRole="button"
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

                  <View style={[styles.selectIndicator, isSelected && styles.selectIndicatorActive]}>
                    {isSelected ? <Check size={14} color={theme.colors.obsidian} /> : <Plus size={14} color={theme.colors.mutedText} />}
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}

        {/* Quantity Confirmation Footer */}
        {selectedFood && (
          <View style={styles.footerSheet}>
            <View style={styles.footerTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.footerFoodName} numberOfLines={1}>{selectedFood.name}</Text>
                <Text style={styles.footerFoodSub}>
                  Base: {selectedFood.calories} kcal por {selectedFood.servingSize}{selectedFood.servingUnit}
                </Text>
              </View>

              <View style={styles.qtyBox}>
                <TextInput
                  style={styles.qtyInput}
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="numeric"
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
                    <Text style={styles.confirmSelectBtnText}>Añadir Alimento</Text>
                  </TouchableOpacity>
                </View>
              );
            })()}
          </View>
        )}

        {/* Create Food Modal */}
        <CreateFoodModal
          visible={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          initialBarcode={barcodeQuery}
          onFoodCreated={(created) => {
            setFoods((prev) => [created, ...prev]);
            setSelectedFood(created);
            setQuantity(created.servingSize?.toString() || '100');
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
    listContent: {
      paddingHorizontal: 20,
      paddingBottom: 100,
      gap: 10,
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
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    },
    loadingText: {
      fontFamily: 'Geist_400Regular',
      fontSize: 13,
      color: colors.mutedText,
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
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.borderGlow,
      paddingHorizontal: 20,
      paddingTop: 14,
      paddingBottom: 24,
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
      width: 48,
      textAlign: 'center',
      fontFamily: 'JetBrainsMono_600SemiBold',
      fontSize: 14,
      color: colors.neonCyan,
      padding: 0,
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
