import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../utils/ThemeContext';
import { ThemeColors } from '../../../utils/theme';
import { AppNavigationProp } from '../../../utils/navigation';
import { useDietStore } from '../../../store/dietStore';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../services/queryKeys';
import { dietService } from '../../../services/diet.service';
import { Flame } from 'lucide-react-native';
import { UserService } from '../../../services/user.service';

export const DietCard = () => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);
  const navigation = useNavigation<AppNavigationProp>();
  const { dietProfile, isConfigured } = useDietStore();

  const { data: profile } = useQuery({
    queryKey: queryKeys.user.profile,
    queryFn: UserService.getProfile,
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
  });

  if (!isDietActive) {
    return (
      <TouchableOpacity 
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('Fit', { initialTab: 'diet' })}
        accessibilityRole="button"
        accessibilityLabel="Configurar plan de dieta y macronutrientes"
      >
        <View>
          <View style={styles.header}>
            <Flame size={16} color={theme.colors.neonCyan} />
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
  const targetCals = dailySummary?.targetCalories || dietProfile?.targetCalories || 2200;
  const consumedCals = dailySummary?.consumedCalories ?? meals.reduce((sum, m) => sum + (m.calories || 0), 0);
  const pct = targetCals > 0 ? Math.min(1, consumedCals / targetCals) : 0;
  const strokeDashoffset = 150 * (1 - pct);
  const targetReachedPct = Math.round(pct * 100);

  const targetProtein = dailySummary?.targetProtein || dietProfile?.proteinGrams || 160;
  const consumedProtein = dailySummary?.consumedProtein ?? meals.reduce((sum, m) => sum + (m.protein || 0), 0);

  const targetCarbs = dailySummary?.targetCarbs || dietProfile?.carbsGrams || 220;
  const consumedCarbs = dailySummary?.consumedCarbs ?? meals.reduce((sum, m) => sum + (m.carbs || 0), 0);

  const targetFat = dailySummary?.targetFat || dietProfile?.fatGrams || 70;
  const consumedFat = dailySummary?.consumedFat ?? meals.reduce((sum, m) => sum + (m.fat || 0), 0);

  return (
    <TouchableOpacity 
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => navigation.navigate('Fit', { initialTab: 'diet' })}
      accessibilityRole="button"
      accessibilityLabel="Ver sección de Dieta y Macros"
    >
      <View>
        <View style={styles.header}>
          <Flame size={16} color={theme.colors.neonCyan} />
          <Text style={styles.headerTitle} numberOfLines={1}>Dieta & Macros</Text>
        </View>

        <Text style={styles.subtitle} numberOfLines={1}>
          Hoy: {consumedCals.toLocaleString()} / {targetCals.toLocaleString()} kcal
        </Text>
        
        <View style={styles.contentRow}>
          <View style={styles.gaugeContainer}>
            <Svg width={54} height={54} viewBox="0 0 60 60" style={{ transform: [{ rotate: '-90deg' }] }}>
              <Circle cx={30} cy={30} r={24} fill="none" stroke={theme.colors.surfaceLight} strokeWidth={3.5} />
              <Circle 
                cx={30} cy={30} r={24} fill="none" 
                stroke={theme.colors.neonCyan} 
                strokeWidth={3.5} 
                strokeLinecap="round"
                strokeDasharray={150} 
                strokeDashoffset={strokeDashoffset} 
              />
            </Svg>
            <View style={styles.gaugeTextContainer}>
              <Text style={styles.gaugeLabel}>Kcal</Text>
              <Text style={styles.gaugeValue}>{targetReachedPct}%</Text>
            </View>
          </View>
          
          <View style={styles.macrosList}>
            <View style={styles.macroItem}>
              <View style={[styles.macroBullet, { backgroundColor: theme.colors.neonCyan }]} />
              <Text style={[styles.macroText, { color: theme.colors.slate200 }]}>P: {consumedProtein}/{targetProtein}g</Text>
            </View>
            <View style={styles.macroItem}>
              <View style={[styles.macroBullet, { backgroundColor: theme.colors.slate400 }]} />
              <Text style={[styles.macroText, { color: theme.colors.slate300 }]}>C: {consumedCarbs}/{targetCarbs}g</Text>
            </View>
            <View style={styles.macroItem}>
              <View style={[styles.macroBullet, { backgroundColor: theme.colors.slate600 }]} />
              <Text style={[styles.macroText, { color: theme.colors.slate400 }]}>F: {consumedFat}/{targetFat}g</Text>
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
    padding: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
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
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
    marginTop: 4,
  },
  gaugeContainer: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  gaugeTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  gaugeLabel: {
    fontSize: 8,
    textTransform: 'uppercase',
    color: colors.mutedText,
    fontFamily: 'JetBrainsMono_500Medium',
  },
  gaugeValue: {
    fontSize: 10,
    color: colors.white,
    fontFamily: 'JetBrainsMono_500Medium',
    lineHeight: 12,
  },
  gaugeTotal: {
    fontSize: 7.5,
    color: colors.slate400,
    fontFamily: 'JetBrainsMono_500Medium',
  },
  macrosList: {
    flexDirection: 'column',
    gap: 4,
    paddingLeft: 4,
  },
  macroItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  macroBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  macroText: {
    fontSize: 11,
    fontFamily: 'JetBrainsMono_500Medium',
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
