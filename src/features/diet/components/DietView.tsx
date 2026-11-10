import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../utils/ThemeContext';
import { ThemeColors } from '../../../utils/theme';
import { 
  Camera, 
  Target,
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Utensils 
} from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserService } from '../../../services/user.service';
import { queryKeys } from '../../../services/queryKeys';
import { useDietStore } from '../../../store/dietStore';
import { dietService, Meal, MealItem } from '../../../services/diet.service';
import { useAlertStore } from '../../../store/alertStore';
import { DietOnboardingView } from './DietOnboardingView';
import { Skeleton } from '../../../components/Skeleton';
import { MealFormModal } from './MealFormModal';
import { FastingCard } from './FastingCard';
import { DietMacrosCard } from './DietMacrosCard';
import { HydrationCard } from './HydrationCard';
import { MealItemCard } from './MealItemCard';
import { NexodusLensModal } from './NexodusLensModal';
import { NetCaloricBalanceCard } from './NetCaloricBalanceCard';

const getLocalDateString = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const DietView = () => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);
  const queryClient = useQueryClient();
  const showAlert = useAlertStore((state) => state.showAlert);

  const { dietProfile, consumedWaterMl, addWater } = useDietStore();

  // Selected Date Management (YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState(() => getLocalDateString());

  // Modals state
  const [showMealModal, setShowMealModal] = useState(false);
  const [mealToEdit, setMealToEdit] = useState<Meal | null>(null);
  const [initialMealItems, setInitialMealItems] = useState<MealItem[]>([]);
  const [showLensModal, setShowLensModal] = useState(false);

  // Profile Query
  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: queryKeys.user.profile,
    queryFn: UserService.getProfile,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const isDietActive = Boolean(profile?.dieta ?? (profile as any)?.Dieta);

  // Backend Target Query
  const { data: backendTarget } = useQuery({
    queryKey: queryKeys.diet.target,
    queryFn: dietService.getTarget,
    enabled: isDietActive,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  // Daily Summary Query
  const { data: dailySummary, isLoading: isDailyLoading } = useQuery({
    queryKey: queryKeys.diet.daily(selectedDate),
    queryFn: () => dietService.getDailySummary(selectedDate),
    enabled: isDietActive,
  });

  // Water Query
  const { data: waterData } = useQuery({
    queryKey: queryKeys.diet.water(selectedDate),
    queryFn: () => dietService.getWater(selectedDate),
    enabled: isDietActive,
  });

  // Water Mutation
  const addWaterMutation = useMutation({
    mutationFn: (amount: number) => dietService.addWater(selectedDate, amount),
    onSuccess: (_, amount) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.diet.water(selectedDate) });
      queryClient.invalidateQueries({ queryKey: queryKeys.diet.daily(selectedDate) });
      addWater(amount);
    },
    onError: (_, amount) => {
      addWater(amount); // Fallback local
    },
  });

  // Delete Meal Mutation
  const deleteMealMutation = useMutation({
    mutationFn: (mealId: string) => dietService.deleteMeal(mealId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.diet.daily(selectedDate) });
      showAlert('Comida Eliminada', 'Se eliminó el registro de la comida.', 'success');
    },
    onError: (e: any) => {
      showAlert('Error', e.message || 'No se pudo eliminar la comida.', 'error');
    },
  });

  if (isProfileLoading) {
    return (
      <View style={{ gap: 16 }}>
        <Skeleton width="50%" height={24} style={{ marginBottom: 8 }} />
        <Skeleton width="100%" height={160} borderRadius={16} />
        <Skeleton width="100%" height={80} borderRadius={16} />
        <Skeleton width="100%" height={120} borderRadius={16} />
      </View>
    );
  }

  // Si la dieta está en false en el perfil del usuario, mostrar pantalla de onboarding / creación de plan
  if (!isDietActive) {
    return (
      <DietOnboardingView 
        profile={profile} 
        isEditing={false} 
        onCompleted={() => {
          queryClient.invalidateQueries({ queryKey: queryKeys.user.profile });
          queryClient.invalidateQueries({ queryKey: queryKeys.diet.target });
          queryClient.invalidateQueries({ queryKey: queryKeys.diet.daily(selectedDate) });
        }} 
      />
    );
  }

  // Consolidated Targets
  const targetCals = backendTarget?.targetCalories || dietProfile?.targetCalories || 2200;
  const targetProtein = backendTarget?.proteinGrams || dietProfile?.proteinGrams || 160;
  const targetCarbs = backendTarget?.carbsGrams || dietProfile?.carbsGrams || 220;
  const targetFat = backendTarget?.fatGrams || dietProfile?.fatGrams || 70;
  const targetWaterMl = backendTarget?.waterTargetMl || dietProfile?.waterTargetMl || 3000;

  // Protocolo de Ayuno Intermitente (mostrar tarjeta solo si está configurado y no es tradicional)
  const rawFastingProtocol = dietProfile?.fastingProtocol || backendTarget?.fastingProtocol;
  const isFastingConfigured = Boolean(
    rawFastingProtocol &&
    rawFastingProtocol.trim().toLowerCase() !== 'none' &&
    rawFastingProtocol.trim().toLowerCase() !== 'tradicional' &&
    rawFastingProtocol.trim().toLowerCase() !== 'traditional' &&
    rawFastingProtocol.trim().toLowerCase() !== 'sin ayuno'
  );

  // Daily Consumed Metrics
  const meals: Meal[] = dailySummary?.meals || [];
  const consumedCals = dailySummary?.consumedCalories ?? meals.reduce((sum, m) => sum + (m.calories || 0), 0);
  const consumedProtein = dailySummary?.consumedProtein ?? meals.reduce((sum, m) => sum + (m.protein || 0), 0);
  const consumedCarbs = dailySummary?.consumedCarbs ?? meals.reduce((sum, m) => sum + (m.carbs || 0), 0);
  const consumedFat = dailySummary?.consumedFat ?? meals.reduce((sum, m) => sum + (m.fat || 0), 0);

  const currentWater = waterData?.consumedWaterMl ?? waterData?.totalMl ?? dailySummary?.consumedWaterMl ?? consumedWaterMl;

  // Date Navigation Handlers
  const handleShiftDate = (days: number) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d + days);
    setSelectedDate(getLocalDateString(dateObj));
  };

  const isToday = selectedDate === getLocalDateString();

  const formatDisplayDate = (dateStr: string) => {
    if (dateStr === getLocalDateString()) return 'Hoy';
    const [y, m, d] = dateStr.split('-');
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${d} ${months[parseInt(m, 10) - 1]}`;
  };

  const handleToggleMealComplete = async (meal: Meal) => {
    try {
      await dietService.updateMeal(meal.id, {
        isCompleted: !meal.isCompleted,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.diet.daily(selectedDate) });
    } catch (e: any) {
      showAlert('Error', e.message || 'No se pudo actualizar el estado de la comida.', 'error');
    }
  };

  const handleDeleteMeal = (meal: Meal) => {
    showAlert({
      title: '¿Eliminar Comida?',
      message: `¿Deseas eliminar "${meal.name}" del registro?`,
      type: 'error',
      buttons: [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => deleteMealMutation.mutate(meal.id) },
      ],
    });
  };

  const getGoalLabel = () => {
    if (dietProfile?.goal === 'fat_loss') return 'DEFINICIÓN';
    if (dietProfile?.goal === 'muscle_gain') return 'VOLUMEN';
    return 'MANTENIMIENTO';
  };

  return (
    <View style={styles.container}>
      {/* Top Header Actions (Date selector + Goal pill, sin botón de metas) */}
      <View style={styles.topBarActions}>
        {/* Date Selector Pill */}
        <View style={styles.dateSelector}>
          <TouchableOpacity 
            style={styles.dateArrow}
            onPress={() => handleShiftDate(-1)}
            accessibilityRole="button"
            accessibilityLabel="Día anterior"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ChevronLeft size={16} color={theme.colors.mutedText} />
          </TouchableOpacity>

          <Text style={styles.dateText}>{formatDisplayDate(selectedDate)}</Text>

          <TouchableOpacity 
            style={styles.dateArrow}
            onPress={() => handleShiftDate(1)}
            accessibilityRole="button"
            accessibilityLabel="Día siguiente"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ChevronRight size={16} color={theme.colors.mutedText} />
          </TouchableOpacity>
        </View>

        {/* Goal Badge Pill */}
        <View style={styles.goalBadge}>
          <Target size={12} color={theme.colors.neonCyan} />
          <Text style={styles.goalBadgeText}>{getGoalLabel()}</Text>
        </View>
      </View>

      {/* Main Diet Actions: Agregar Comida & Nexodus Lens (Acceso Rápido Superior) */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.addMealActionBtn}
          onPress={() => {
            setMealToEdit(null);
            setShowMealModal(true);
          }}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Registrar nueva comida"
        >
          <Plus size={16} color={theme.colors.obsidian} />
          <Text style={styles.addMealActionText}>Agregar Comida</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.lensTriggerBtn}
          onPress={() => setShowLensModal(true)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Abrir Nexodus Lens para escaneo de comida con IA"
        >
          <Camera color={theme.colors.neonCyan} size={16} />
          <Text style={styles.lensTriggerText}>Nexodus Lens</Text>
        </TouchableOpacity>
      </View>

      {/* 1. Macros & Calories Summary Card */}
      <DietMacrosCard
        targetCals={targetCals}
        consumedCals={consumedCals}
        targetProtein={targetProtein}
        consumedProtein={consumedProtein}
        targetCarbs={targetCarbs}
        consumedCarbs={consumedCarbs}
        targetFat={targetFat}
        consumedFat={consumedFat}
      />

      {/* 3. Hydration Dedicated Card */}
      <HydrationCard
        currentWaterMl={currentWater}
        targetWaterMl={targetWaterMl}
        onAddWater={(amount) => addWaterMutation.mutate(amount)}
        isPending={addWaterMutation.isPending}
        pendingAmount={addWaterMutation.variables}
      />

      {/* 2. Net Caloric Balance Card (Ingesta - Entreno = Balance Neto) */}
      <NetCaloricBalanceCard
        consumedCals={consumedCals}
        burnedCals={dailySummary?.burnedCalories || 0}
        targetCals={targetCals}
      />

      {/* 4. Intermittent Fasting Widget (Solo visible si el plan de dieta tiene una meta de ayuno configurada) */}
      {isFastingConfigured && (
        <FastingCard fastingProtocol={rawFastingProtocol || '16:8'} />
      )}

      {/* 5. Scheduled Feedings Header */}
      <View style={styles.feedingsHeader}>
        <View>
          <Text style={styles.sectionTitle}>COMIDAS DEL DÍA</Text>
          <Text style={styles.feedingsSummary}>
            {meals.filter((m) => m.isCompleted).length} Completadas • {meals.filter((m) => !m.isCompleted).length} Planeadas
          </Text>
        </View>
      </View>

      {/* 6. Meals List */}
      {isDailyLoading ? (
        <View style={{ gap: 12 }}>
          <Skeleton width="100%" height={90} borderRadius={14} />
          <Skeleton width="100%" height={90} borderRadius={14} />
        </View>
      ) : meals.length === 0 ? (
        <View style={styles.emptyMealsCard}>
          <Utensils size={32} color={theme.colors.neonCyan} />
          <Text style={styles.emptyMealsTitle}>Sin comidas registradas</Text>
          <Text style={styles.emptyMealsSub}>
            No has registrado alimentos para {isToday ? 'el día de hoy' : selectedDate}. Presiona el botón para agregar una comida.
          </Text>
        </View>
      ) : (
        <View style={styles.mealsList}>
          {meals.map((meal) => (
            <MealItemCard
              key={meal.id}
              meal={meal}
              onToggleComplete={handleToggleMealComplete}
              onEdit={(m) => {
                setMealToEdit(m);
                setShowMealModal(true);
              }}
              onDelete={handleDeleteMeal}
            />
          ))}
        </View>
      )}

      {/* Modals */}
      <MealFormModal
        visible={showMealModal}
        onClose={() => {
          setShowMealModal(false);
          setMealToEdit(null);
          setInitialMealItems([]);
        }}
        onMealSaved={() => {
          queryClient.invalidateQueries({ queryKey: queryKeys.diet.daily(selectedDate) });
        }}
        mealToEdit={mealToEdit}
        initialDate={selectedDate}
        initialItems={initialMealItems}
      />

      {/* Nexodus Lens (AI Vision Modal) */}
      <NexodusLensModal
        visible={showLensModal}
        onClose={() => setShowLensModal(false)}
        onAddAnalyzedMeal={(items, mealName) => {
          setInitialMealItems(items);
          setMealToEdit({
            id: '',
            date: selectedDate,
            mealType: 'Lunch',
            name: mealName,
            time: new Date().toTimeString().slice(0, 5),
            isCompleted: true,
            items,
          });
          setShowMealModal(true);
        }}
      />
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      width: '100%',
      paddingBottom: 40,
    },
    topBarActions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    dateSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      paddingHorizontal: 6,
      paddingVertical: 5,
      gap: 12,
    },
    dateArrow: {
      padding: 4,
    },
    dateText: {
      fontFamily: 'JetBrainsMono_600SemiBold',
      fontSize: 12,
      color: colors.text,
      minWidth: 64,
      textAlign: 'center',
    },
    goalBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: 'rgba(0, 240, 255, 0.08)',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'rgba(0, 240, 255, 0.25)',
    },
    goalBadgeText: {
      fontFamily: 'JetBrainsMono_600SemiBold',
      fontSize: 10,
      color: colors.neonCyan,
      letterSpacing: 0.5,
    },
    actionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 20,
    },
    addMealActionBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.neonCyan,
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 14,
    },
    addMealActionText: {
      fontFamily: 'Geist_700Bold',
      fontSize: 13,
      color: colors.obsidian,
    },
    lensTriggerBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.surfaceLight,
      borderWidth: 1,
      borderColor: 'rgba(0, 240, 255, 0.25)',
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 14,
    },
    lensTriggerText: {
      fontFamily: 'Geist_700Bold',
      fontSize: 13,
      color: colors.neonCyan,
    },
    feedingsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    sectionTitle: {
      fontFamily: 'JetBrainsMono_600SemiBold',
      fontSize: 12,
      color: colors.text,
      letterSpacing: 0.8,
    },
    feedingsSummary: {
      fontFamily: 'Geist_400Regular',
      fontSize: 11,
      color: colors.mutedText,
      marginTop: 2,
    },
    emptyMealsCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      padding: 28,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    emptyMealsTitle: {
      fontFamily: 'Geist_600SemiBold',
      fontSize: 14,
      color: colors.text,
      marginTop: 4,
    },
    emptyMealsSub: {
      fontFamily: 'Geist_400Regular',
      fontSize: 12,
      color: colors.mutedText,
      textAlign: 'center',
      lineHeight: 18,
    },
    mealsList: {
      gap: 2,
    },
  });
