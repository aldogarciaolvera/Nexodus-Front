import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Wallet, Settings2, X, Check } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../../utils/ThemeContext';
import { ThemeColors } from '../../../utils/theme';
import { dietService, DietTarget } from '../../../services/diet.service';
import { CategoryService, Category } from '../../../services/category.service';
import { useAlertStore } from '../../../store/alertStore';
import { queryKeys } from '../../../services/queryKeys';
import { Skeleton } from '../../../components/Skeleton';

interface FoodBudgetCardProps {
  currentTarget?: DietTarget;
}

const PERIOD_OPTIONS = [
  { label: 'Semanal', value: 'Weekly' },
  { label: 'Quincenal', value: 'Biweekly' },
  { label: 'Mensual', value: 'Monthly' },
];

const translatePeriod = (p?: string) => {
  if (p === 'Monthly') return 'Mensual';
  if (p === 'Biweekly') return 'Quincenal';
  return 'Semanal';
};

export const FoodBudgetCard: React.FC<FoodBudgetCardProps> = ({ currentTarget }) => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);
  const queryClient = useQueryClient();
  const showAlert = useAlertStore((s) => s.showAlert);
  const scrollViewRef = useRef<React.ComponentRef<typeof ScrollView>>(null);

  const [showConfig, setShowConfig] = useState(false);
  const [amountText, setAmountText] = useState('');
  const [period, setPeriod] = useState<string>('Weekly');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const { data: budget, isLoading } = useQuery({
    queryKey: ['diet', 'budgetSummary'],
    queryFn: dietService.getFoodBudgetSummary,
    staleTime: 2 * 60 * 1000,
  });

  const { data: categories = [] } = useQuery({
    queryKey: queryKeys.finance.categories,
    queryFn: () => CategoryService.getAll(),
    enabled: showConfig,
  });

  useEffect(() => {
    if (showConfig) {
      setAmountText(budget?.budgetAmount ? String(budget.budgetAmount) : '');
      setPeriod(budget?.period || 'Weekly');
      setSelectedCategoryId(budget?.linkedCategoryId || null);
    }
  }, [showConfig, budget]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (e) => setKeyboardHeight(e.endCoordinates.height));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const parsedAmount = parseFloat(amountText.replace(',', '.'));
      const baseTarget: DietTarget = currentTarget || {
        targetCalories: 2000,
        proteinGrams: 150,
        carbsGrams: 200,
        fatGrams: 65,
        waterTargetMl: 2500,
        fastingProtocol: '16:8',
      };
      return dietService.updateTarget({
        ...baseTarget,
        foodBudgetAmount: !isNaN(parsedAmount) && parsedAmount > 0 ? parsedAmount : null,
        foodBudgetPeriod: period,
        foodBudgetCategoryId: selectedCategoryId,
        foodBudgetCurrency: budget?.currency || 'MXN',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.diet.target });
      queryClient.invalidateQueries({ queryKey: ['diet', 'budgetSummary'] });
      showAlert('Presupuesto Guardado', 'Tu presupuesto de comidas ha sido actualizado.', 'success');
      setShowConfig(false);
    },
    onError: (e: Error) => {
      showAlert('Error', e.message || 'No se pudo guardar el presupuesto.', 'error');
    },
  });

  if (isLoading) {
    return <Skeleton width="100%" height={104} borderRadius={16} style={{ marginBottom: 16 }} />;
  }

  const hasBudget = Boolean(budget?.budgetAmount && budget.budgetAmount > 0);
  const progressPct = Math.min(100, Math.max(0, budget?.percentageUsed || 0));
  const isOverBudget = (budget?.percentageUsed || 0) >= 100;

  return (
    <>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.titleWrap}>
            <View style={styles.iconBox}>
              <Wallet color={theme.colors.neonCyan} size={16} />
            </View>
            <View>
              <Text style={styles.eyebrow}>
                PRESUPUESTO DE COMIDAS • {translatePeriod(budget?.period).toUpperCase()}
              </Text>
              <Text style={styles.title}>
                {hasBudget
                  ? `$${budget!.spentAmount.toFixed(0)} / $${budget!.budgetAmount!.toFixed(0)} ${budget!.currency}`
                  : 'Configura tu presupuesto'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.configBtn}
            onPress={() => setShowConfig(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Settings2 color={theme.colors.neonCyan} size={16} />
          </TouchableOpacity>
        </View>

        {hasBudget ? (
          <>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progressPct}%`,
                    backgroundColor: isOverBudget ? theme.colors.error : theme.colors.neonCyan,
                  },
                ]}
              />
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaText}>
                Disponible: <Text style={styles.metaValue}>${budget!.remainingAmount.toFixed(0)}</Text>
              </Text>
              {budget?.suggestedPerMealBudget ? (
                <Text style={styles.metaText}>
                  Chef IA: <Text style={styles.metaValue}>~${budget.suggestedPerMealBudget.toFixed(0)}/comida</Text>
                </Text>
              ) : null}
            </View>
            {budget?.linkedCategoryName ? (
              <Text style={styles.linkedCatText}>
                Sincronizado con Finanzas: {budget.linkedCategoryName}
              </Text>
            ) : null}
          </>
        ) : (
          <Text style={styles.emptySub}>
            Define tu tope semanal, quincenal o mensual y vincúlalo con Finanzas para que Chef IA ajuste tus recetas sin ingredientes caros.
          </Text>
        )}
      </View>

      <Modal visible={showConfig} animationType="slide" transparent={false} onRequestClose={() => setShowConfig(false)}>
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Presupuesto de Comidas</Text>
            <TouchableOpacity onPress={() => setShowConfig(false)} style={{ padding: 6 }}>
              <X color={theme.colors.mutedText} size={22} />
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView
              ref={scrollViewRef}
              contentContainerStyle={[
                styles.modalScroll,
                { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 80 : 40 },
              ]}
              keyboardShouldPersistTaps="handled"
              automaticallyAdjustKeyboardInsets={true}
              keyboardDismissMode="on-drag"
            >
              <Text style={styles.label}>PERIODICIDAD</Text>
              <View style={styles.pillsRow}>
                {PERIOD_OPTIONS.map((opt) => {
                  const active = period === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[styles.pill, active && styles.pillActive]}
                      onPress={() => setPeriod(opt.value)}
                    >
                      <Text style={[styles.pillText, active && styles.pillTextActive]}>{opt.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.label}>MONTO DEL PRESUPUESTO ({budget?.currency || 'MXN'})</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. 1500"
                placeholderTextColor={theme.colors.mutedText}
                keyboardType="numeric"
                value={amountText}
                onChangeText={setAmountText}
                onFocus={() => setTimeout(() => scrollViewRef.current?.scrollTo({ y: 80, animated: true }), 120)}
              />

              <Text style={styles.label}>CATEGORÍA DE FINANZAS VINCULADA (OPCIONAL)</Text>
              <Text style={styles.helperText}>
                Los gastos registrados en esta categoría se descontarán automáticamente de tu presupuesto de comidas.
              </Text>
              <View style={styles.categoriesWrap}>
                <TouchableOpacity
                  style={[styles.catChip, selectedCategoryId === null && styles.pillActive]}
                  onPress={() => setSelectedCategoryId(null)}
                >
                  <Text style={[styles.pillText, selectedCategoryId === null && styles.pillTextActive]}>
                    Detectar automáticamente
                  </Text>
                </TouchableOpacity>
                {categories.map((cat: Category) => {
                  const active = selectedCategoryId === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.catChip, active && styles.pillActive]}
                      onPress={() => setSelectedCategoryId(cat.id)}
                    >
                      <Text style={[styles.pillText, active && styles.pillTextActive]}>{cat.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                style={[styles.saveBtn, saveMutation.isPending && { opacity: 0.7 }]}
                onPress={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? (
                  <ActivityIndicator color={theme.colors.obsidian} />
                ) : (
                  <>
                    <Check color={theme.colors.obsidian} size={18} />
                    <Text style={styles.saveBtnText}>Guardar Presupuesto</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      padding: 16,
      marginBottom: 16,
      gap: 10,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    titleWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
    },
    iconBox: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: 'rgba(0, 240, 255, 0.1)',
      borderWidth: 1,
      borderColor: 'rgba(0, 240, 255, 0.3)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    eyebrow: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 10,
      color: colors.neonCyan,
      letterSpacing: 0.6,
    },
    title: {
      fontFamily: 'JetBrainsMono_600SemiBold',
      fontSize: 15,
      color: colors.text,
      marginTop: 2,
    },
    configBtn: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: colors.surfaceLight,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      alignItems: 'center',
      justifyContent: 'center',
    },
    progressTrack: {
      height: 6,
      borderRadius: 999,
      backgroundColor: colors.borderGlow,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 999,
    },
    metaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    metaText: {
      fontFamily: 'Geist_400Regular',
      fontSize: 12,
      color: colors.mutedText,
    },
    metaValue: {
      fontFamily: 'JetBrainsMono_600SemiBold',
      color: colors.text,
    },
    linkedCatText: {
      fontFamily: 'Geist_400Regular',
      fontSize: 11,
      color: colors.mutedText,
    },
    emptySub: {
      fontFamily: 'Geist_400Regular',
      fontSize: 12,
      color: colors.mutedText,
      lineHeight: 18,
    },
    modalSafe: {
      flex: 1,
      backgroundColor: colors.obsidian,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderGlow,
    },
    modalTitle: {
      fontFamily: 'Geist_700Bold',
      fontSize: 18,
      color: colors.text,
    },
    modalScroll: {
      padding: 20,
      gap: 14,
    },
    label: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 11,
      color: colors.mutedText,
      letterSpacing: 0.8,
      marginTop: 6,
    },
    helperText: {
      fontFamily: 'Geist_400Regular',
      fontSize: 12,
      color: colors.mutedText,
      lineHeight: 17,
    },
    pillsRow: {
      flexDirection: 'row',
      gap: 8,
    },
    pill: {
      flex: 1,
      paddingVertical: 11,
      borderRadius: 999,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      alignItems: 'center',
    },
    catChip: {
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 999,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderGlow,
    },
    pillActive: {
      backgroundColor: 'rgba(0, 240, 255, 0.12)',
      borderColor: colors.neonCyan,
    },
    pillText: {
      fontFamily: 'Geist_600SemiBold',
      fontSize: 13,
      color: colors.mutedText,
    },
    pillTextActive: {
      color: colors.neonCyan,
    },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      borderRadius: 12,
      padding: 14,
      color: colors.text,
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 16,
    },
    categoriesWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    saveBtn: {
      backgroundColor: colors.neonCyan,
      borderRadius: 12,
      paddingVertical: 15,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: 12,
    },
    saveBtnText: {
      fontFamily: 'Geist_700Bold',
      fontSize: 15,
      color: colors.obsidian,
    },
  });
