import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../utils/ThemeContext';
import { ThemeColors } from '../../../utils/theme';
import { AppNavigationProp } from '../../../utils/navigation';
import { useDietStore } from '../../../store/dietStore';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../services/queryKeys';
import { dietService } from '../../../services/diet.service';
import { Flame } from 'lucide-react-native';
import { useCarouselNavStore } from '../../../store/carouselNavStore';
import { UserService } from '../../../services/user.service';

export const DietCard = () => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);
  const navigation = useNavigation<AppNavigationProp>();
  const { dietProfile, isConfigured } = useDietStore();

  const { data: profile } = useQuery({
    queryKey: queryKeys.user.profile,
    queryFn: UserService.getProfile,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const isDietActive = Boolean(profile?.dieta ?? (profile as any)?.Dieta ?? isConfigured);

  const today = (() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  })();

  const { data: dailySummary } = useQuery({
    queryKey: queryKeys.diet.daily(today),
    queryFn: () => dietService.getDailySummary(today),
    enabled: isDietActive,
    staleTime: 60 * 1000,
  });

  if (!isDietActive) {
    return (
      <TouchableOpacity 
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => useCarouselNavStore.getState().navigateToTab('Fit', 'diet')}
        accessibilityRole="button"
        accessibilityLabel="Configurar plan de dieta y macronutrientes"
      >
        <View>
          <View style={styles.header}>
            <Flame size={14} color={theme.colors.neonCyan} />
            <Text style={styles.headerTitle} numberOfLines={1}>Dieta & Macros</Text>
          </View>

          <Text style={styles.subtitle} numberOfLines={1}>Sin Plan Alimenticio</Text>

          <Text style={styles.emptyLegend}>
            Toca para configurar tus metas calóricas y biométricas
          </Text>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerLabel}>Estado</Text>
          <Text style={[styles.footerValue, { color: theme.colors.neonCyan }]}>Pendiente</Text>
        </View>
      </TouchableOpacity>
    );
  }

  const meals = dailySummary?.meals || [];
  const targetCals = Math.round(dailySummary?.targetCalories || dietProfile?.targetCalories || 2200);
  const consumedCals = Math.round(dailySummary?.consumedCalories ?? meals.reduce((sum, m) => sum + (m.calories || 0), 0));
  const pct = targetCals > 0 ? Math.min(1, Math.max(0, consumedCals / targetCals)) : 0;
  const strokeDashoffset = 176 * (1 - pct);
  const targetReachedPct = Math.round(pct * 100);

  const targetProtein = Math.round(dailySummary?.targetProtein || dietProfile?.proteinGrams || 160);
  const consumedProtein = Math.round(dailySummary?.consumedProtein ?? meals.reduce((sum, m) => sum + (m.protein || 0), 0));
  const proteinPct = targetProtein > 0 ? Math.min(100, Math.round((consumedProtein / targetProtein) * 100)) : 0;

  const targetCarbs = Math.round(dailySummary?.targetCarbs || dietProfile?.carbsGrams || 220);
  const consumedCarbs = Math.round(dailySummary?.consumedCarbs ?? meals.reduce((sum, m) => sum + (m.carbs || 0), 0));
  const carbsPct = targetCarbs > 0 ? Math.min(100, Math.round((consumedCarbs / targetCarbs) * 100)) : 0;

  const targetFat = Math.round(dailySummary?.targetFat || dietProfile?.fatGrams || 70);
  const consumedFat = Math.round(dailySummary?.consumedFat ?? meals.reduce((sum, m) => sum + (m.fat || 0), 0));
  const fatPct = targetFat > 0 ? Math.min(100, Math.round((consumedFat / targetFat) * 100)) : 0;

  return (
    <TouchableOpacity 
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => useCarouselNavStore.getState().navigateToTab('Fit', 'diet')}
      accessibilityRole="button"
      accessibilityLabel={`Ver sección de Dieta y Macros: ${consumedCals} de ${targetCals} kilocalorías consumidas`}
    >
      <View>
        <View style={styles.header}>
          <Flame size={14} color={theme.colors.neonCyan} />
          <Text style={styles.headerTitle} numberOfLines={1}>Dieta & Macros</Text>
        </View>

        {/* Círculo Centrado */}
        <View style={styles.gaugeContainer}>
          <Svg width={68} height={68} viewBox="0 0 68 68" style={{ transform: [{ rotate: '-90deg' }] }}>
            <Circle 
              cx={34} 
              cy={34} 
              r={28} 
              fill="none" 
              stroke={theme.colors.surfaceLight} 
              strokeWidth={3.8} 
            />
            <Circle 
              cx={34} 
              cy={34} 
              r={28} 
              fill="none" 
              stroke={theme.colors.neonCyan} 
              strokeWidth={3.8} 
              strokeLinecap="round"
              strokeDasharray={176} 
              strokeDashoffset={strokeDashoffset} 
            />
          </Svg>
          <View style={styles.gaugeTextContainer}>
            <Text style={styles.gaugeValue}>{targetReachedPct}%</Text>
            <Text style={styles.gaugeLabel}>KCAL</Text>
          </View>
        </View>

        {/* Textos Por Debajo: Resumen Calórico */}
        <View style={styles.caloricSummaryContainer}>
          <Text style={styles.caloricSummaryText} numberOfLines={1}>
            <Text style={styles.caloricConsumed}>{consumedCals.toLocaleString()}</Text>
            <Text style={styles.caloricTarget}> / {targetCals.toLocaleString()} kcal</Text>
          </Text>
        </View>
        
        {/* Desglose de Macronutrientes */}
        <View style={styles.macrosList}>
          {/* Proteína */}
          <View style={styles.macroItemContainer}>
            <View style={styles.macroRow}>
              <View style={styles.macroLabelGroup}>
                <View style={[styles.macroBullet, { backgroundColor: theme.colors.neonCyan }]} />
                <Text style={styles.macroLabel}>Prot</Text>
              </View>
              <Text style={styles.macroValue} numberOfLines={1}>
                {consumedProtein}<Text style={styles.macroTarget}>/{targetProtein}g</Text>
              </Text>
            </View>
            <View style={styles.macroTrack}>
              <View style={[styles.macroFill, { width: `${proteinPct}%`, backgroundColor: theme.colors.neonCyan }]} />
            </View>
          </View>

          {/* Carbos */}
          <View style={styles.macroItemContainer}>
            <View style={styles.macroRow}>
              <View style={styles.macroLabelGroup}>
                <View style={[styles.macroBullet, { backgroundColor: theme.colors.warning }]} />
                <Text style={styles.macroLabel}>Carb</Text>
              </View>
              <Text style={styles.macroValue} numberOfLines={1}>
                {consumedCarbs}<Text style={styles.macroTarget}>/{targetCarbs}g</Text>
              </Text>
            </View>
            <View style={styles.macroTrack}>
              <View style={[styles.macroFill, { width: `${carbsPct}%`, backgroundColor: theme.colors.warning }]} />
            </View>
          </View>

          {/* Grasas */}
          <View style={styles.macroItemContainer}>
            <View style={styles.macroRow}>
              <View style={styles.macroLabelGroup}>
                <View style={[styles.macroBullet, { backgroundColor: theme.colors.slate400 }]} />
                <Text style={styles.macroLabel}>Gras</Text>
              </View>
              <Text style={styles.macroValue} numberOfLines={1}>
                {consumedFat}<Text style={styles.macroTarget}>/{targetFat}g</Text>
              </Text>
            </View>
            <View style={styles.macroTrack}>
              <View style={[styles.macroFill, { width: `${fatPct}%`, backgroundColor: theme.colors.slate400 }]} />
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.borderGlow,
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 10.5,
    letterSpacing: 0.5,
    color: colors.mutedText,
    textTransform: 'uppercase',
    fontFamily: 'JetBrainsMono_500Medium',
  },
  subtitle: {
    fontSize: 13,
    color: colors.white,
    letterSpacing: -0.5,
    marginBottom: 8,
    fontFamily: 'Geist_500Medium',
  },
  emptyLegend: {
    fontFamily: 'Geist_400Regular',
    fontSize: 12,
    color: colors.mutedText,
    lineHeight: 18,
    marginTop: 2,
    marginBottom: 4,
  },
  gaugeContainer: {
    width: 68,
    height: 68,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 4,
  },
  gaugeTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  gaugeLabel: {
    fontSize: 7.5,
    textTransform: 'uppercase',
    color: colors.mutedText,
    fontFamily: 'JetBrainsMono_500Medium',
    letterSpacing: 0.5,
    marginTop: 1,
  },
  gaugeValue: {
    fontSize: 13,
    color: colors.white,
    fontFamily: 'JetBrainsMono_700Bold',
    lineHeight: 16,
  },
  caloricSummaryContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    marginBottom: 8,
  },
  caloricSummaryText: {
    textAlign: 'center',
  },
  caloricConsumed: {
    fontSize: 11.5,
    color: colors.white,
    fontFamily: 'JetBrainsMono_600SemiBold',
  },
  caloricTarget: {
    fontSize: 10,
    color: colors.slate400,
    fontFamily: 'JetBrainsMono_500Medium',
  },
  macrosList: {
    borderTopWidth: 1,
    borderTopColor: colors.borderGlow,
    paddingTop: 8,
    gap: 6,
  },
  macroItemContainer: {
    gap: 3,
  },
  macroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  macroLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  macroBullet: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  macroLabel: {
    fontSize: 10,
    color: colors.slate300,
    fontFamily: 'JetBrainsMono_500Medium',
  },
  macroValue: {
    fontSize: 10,
    color: colors.white,
    fontFamily: 'JetBrainsMono_500Medium',
  },
  macroTarget: {
    fontSize: 9,
    color: colors.slate400,
    fontFamily: 'JetBrainsMono_400Regular',
  },
  macroTrack: {
    height: 2.5,
    width: '100%',
    backgroundColor: colors.surfaceLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  macroFill: {
    height: '100%',
    borderRadius: 2,
  },
  footer: {
    marginTop: 12,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: colors.borderGlow,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerLabel: {
    fontSize: 10,
    color: colors.mutedText,
    fontFamily: 'Geist_400Regular',
  },
  footerValue: {
    fontSize: 10,
    color: colors.neonCyan,
    fontFamily: 'JetBrainsMono_500Medium',
  },
});
