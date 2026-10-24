import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../../../utils/ThemeContext';
import { ThemeColors } from '../../../utils/theme';

interface DietMacrosCardProps {
  targetCals: number;
  consumedCals: number;
  targetProtein: number;
  consumedProtein: number;
  targetCarbs: number;
  consumedCarbs: number;
  targetFat: number;
  consumedFat: number;
}

export const DietMacrosCard: React.FC<DietMacrosCardProps> = ({
  targetCals,
  consumedCals,
  targetProtein,
  consumedProtein,
  targetCarbs,
  consumedCarbs,
  targetFat,
  consumedFat,
}) => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);

  const remainingCals = Math.max(0, targetCals - consumedCals);
  const consumedPct = targetCals > 0 ? Math.min(100, Math.round((consumedCals / targetCals) * 100)) : 0;
  const strokeDashoffset = 150 * (1 - (targetCals > 0 ? Math.min(1, consumedCals / targetCals) : 0));

  const proteinPct = targetProtein > 0 ? Math.min(100, Math.round((consumedProtein / targetProtein) * 100)) : 0;
  const carbsPct = targetCarbs > 0 ? Math.min(100, Math.round((consumedCarbs / targetCarbs) * 100)) : 0;
  const fatPct = targetFat > 0 ? Math.min(100, Math.round((consumedFat / targetFat) * 100)) : 0;

  return (
    <View style={styles.card}>
      {/* Top Calories & Progress Row */}
      <View style={styles.topRow}>
        <View style={styles.gaugeContainer}>
          <Svg width={76} height={76} viewBox="0 0 60 60" style={{ transform: [{ rotate: '-90deg' }] }}>
            <Circle cx={30} cy={30} r={24} fill="none" stroke={theme.colors.surfaceLight} strokeWidth={3.8} />
            <Circle
              cx={30}
              cy={30}
              r={24}
              fill="none"
              stroke={theme.colors.neonCyan}
              strokeWidth={3.8}
              strokeLinecap="round"
              strokeDasharray={150}
              strokeDashoffset={strokeDashoffset}
            />
          </Svg>
          <View style={styles.gaugeTextContainer}>
            <Text style={styles.gaugeLabel}>KCAL</Text>
            <Text style={styles.gaugeValue}>{consumedPct}%</Text>
          </View>
        </View>

        <View style={styles.caloriesInfo}>
          <View style={styles.calRow}>
            <Text style={styles.calLabel}>META DIARIA</Text>
            <Text style={styles.calValue}>
              {targetCals.toLocaleString()} <Text style={styles.calUnit}>kcal</Text>
            </Text>
          </View>

          <View style={styles.calRow}>
            <Text style={styles.calLabel}>CONSUMIDAS</Text>
            <Text style={styles.calValueHighlight}>
              {consumedCals.toLocaleString()} <Text style={styles.calUnit}>kcal</Text>
            </Text>
          </View>

          <View style={styles.calRow}>
            <Text style={styles.calLabel}>RESTANTES</Text>
            <Text style={styles.calValueCyan}>
              {remainingCals.toLocaleString()} <Text style={styles.calUnit}>kcal</Text>
            </Text>
          </View>
        </View>
      </View>

      {/* Macro Breakdown Bars */}
      <View style={styles.macrosContainer}>
        {/* Protein Column */}
        <View style={styles.macroCol}>
          <View style={styles.macroHeader}>
            <Text style={styles.macroTitle}>PROTEÍNA</Text>
            <Text style={[styles.macroPct, { color: theme.colors.neonCyan }]}>{proteinPct}%</Text>
          </View>
          <Text style={styles.macroNumbers}>
            {consumedProtein}<Text style={styles.macroTarget}>/{targetProtein}g</Text>
          </Text>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${proteinPct}%`, backgroundColor: theme.colors.neonCyan }]} />
          </View>
        </View>

        {/* Carbs Column */}
        <View style={styles.macroCol}>
          <View style={styles.macroHeader}>
            <Text style={styles.macroTitle}>CARBOS</Text>
            <Text style={[styles.macroPct, { color: theme.colors.warning }]}>{carbsPct}%</Text>
          </View>
          <Text style={styles.macroNumbers}>
            {consumedCarbs}<Text style={styles.macroTarget}>/{targetCarbs}g</Text>
          </Text>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${carbsPct}%`, backgroundColor: theme.colors.warning }]} />
          </View>
        </View>

        {/* Fats Column */}
        <View style={styles.macroCol}>
          <View style={styles.macroHeader}>
            <Text style={styles.macroTitle}>GRASAS</Text>
            <Text style={[styles.macroPct, { color: theme.colors.slate400 }]}>{fatPct}%</Text>
          </View>
          <Text style={styles.macroNumbers}>
            {consumedFat}<Text style={styles.macroTarget}>/{targetFat}g</Text>
          </Text>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${fatPct}%`, backgroundColor: theme.colors.slate400 }]} />
          </View>
        </View>
      </View>
    </View>
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
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderGlow,
    },
    gaugeContainer: {
      width: 76,
      height: 76,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    gaugeTextContainer: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
    },
    gaugeLabel: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 8.5,
      color: colors.mutedText,
      letterSpacing: 0.5,
    },
    gaugeValue: {
      fontFamily: 'JetBrainsMono_700Bold',
      fontSize: 13,
      color: colors.neonCyan,
      marginTop: 1,
    },
    caloriesInfo: {
      flex: 1,
      gap: 6,
    },
    calRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    calLabel: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 9.5,
      color: colors.mutedText,
      letterSpacing: 0.6,
    },
    calValue: {
      fontFamily: 'JetBrainsMono_600SemiBold',
      fontSize: 12,
      color: colors.slate300,
    },
    calValueHighlight: {
      fontFamily: 'JetBrainsMono_700Bold',
      fontSize: 13,
      color: colors.text,
    },
    calValueCyan: {
      fontFamily: 'JetBrainsMono_700Bold',
      fontSize: 13,
      color: colors.neonCyan,
    },
    calUnit: {
      fontSize: 10,
      fontFamily: 'JetBrainsMono_400Regular',
      color: colors.mutedText,
    },
    macrosContainer: {
      flexDirection: 'row',
      gap: 12,
      paddingTop: 14,
    },
    macroCol: {
      flex: 1,
    },
    macroHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 3,
    },
    macroTitle: {
      fontFamily: 'JetBrainsMono_600SemiBold',
      fontSize: 9.5,
      color: colors.mutedText,
      letterSpacing: 0.5,
    },
    macroPct: {
      fontFamily: 'JetBrainsMono_600SemiBold',
      fontSize: 10,
    },
    macroNumbers: {
      fontFamily: 'JetBrainsMono_600SemiBold',
      fontSize: 12,
      color: colors.text,
      marginBottom: 6,
    },
    macroTarget: {
      fontFamily: 'JetBrainsMono_400Regular',
      fontSize: 10,
      color: colors.mutedText,
    },
    barTrack: {
      height: 4,
      backgroundColor: colors.surfaceLight,
      borderRadius: 2,
      overflow: 'hidden',
    },
    barFill: {
      height: '100%',
      borderRadius: 2,
    },
  });
