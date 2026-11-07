import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Flame, Dumbbell, Equal, ArrowRight, Activity } from 'lucide-react-native';
import { useTheme } from '../../../utils/ThemeContext';
import { ThemeColors } from '../../../utils/theme';

interface NetCaloricBalanceCardProps {
  consumedCals: number;
  burnedCals: number;
  targetCals: number;
}

export const NetCaloricBalanceCard: React.FC<NetCaloricBalanceCardProps> = React.memo(({
  consumedCals,
  burnedCals,
  targetCals,
}) => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);

  const netCals = Math.round(consumedCals - burnedCals);
  const diffFromTarget = Math.round(netCals - targetCals);

  const getBalanceStatus = () => {
    if (burnedCals === 0 && consumedCals === 0) {
      return { text: 'Sin Registro Hoy', color: theme.colors.slate400 };
    }
    if (Math.abs(diffFromTarget) <= 100) {
      return { text: 'En Rango Óptimo', color: theme.colors.neonCyan };
    }
    if (diffFromTarget < 0) {
      return { text: `Déficit de ${Math.abs(diffFromTarget)} kcal`, color: theme.colors.neonCyan };
    }
    return { text: `Superávit de +${diffFromTarget} kcal`, color: theme.colors.warning };
  };

  const status = getBalanceStatus();

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <Activity size={14} color={theme.colors.neonCyan} />
          <Text style={styles.headerTitle}>BALANCE CALÓRICO NETO</Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={[styles.statusText, { color: status.color }]}>
            {status.text}
          </Text>
        </View>
      </View>

      <View style={styles.equationRow}>
        {/* Consumed */}
        <View style={styles.col}>
          <View style={styles.colHeader}>
            <Flame size={12} color={theme.colors.warning} />
            <Text style={styles.colLabel}>INGESTA</Text>
          </View>
          <Text style={styles.colVal}>
            {Math.round(consumedCals)} <Text style={styles.unitText}>kcal</Text>
          </Text>
        </View>

        <Text style={styles.operatorText}>−</Text>

        {/* Burned */}
        <View style={styles.col}>
          <View style={styles.colHeader}>
            <Dumbbell size={12} color={theme.colors.neonCyan} />
            <Text style={styles.colLabel}>ENTRENO</Text>
          </View>
          <Text style={[styles.colVal, { color: theme.colors.neonCyan }]}>
            {Math.round(burnedCals)} <Text style={styles.unitText}>kcal</Text>
          </Text>
        </View>

        <Text style={styles.operatorText}>=</Text>

        {/* Net Balance */}
        <View style={[styles.col, styles.netCol]}>
          <Text style={styles.colLabel}>NETO</Text>
          <Text style={[styles.colVal, styles.netVal]}>
            {netCals} <Text style={styles.unitText}>kcal</Text>
          </Text>
        </View>
      </View>
    </View>
  );
});

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
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    titleGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    headerTitle: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 10,
      color: colors.slate400,
      letterSpacing: 0.8,
    },
    statusBadge: {
      backgroundColor: colors.surfaceLight,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.borderGlow,
    },
    statusText: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 10,
    },
    equationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surfaceLight,
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.borderGlow,
    },
    col: {
      alignItems: 'center',
      flex: 1,
    },
    netCol: {
      backgroundColor: 'rgba(56, 189, 248, 0.08)',
      paddingVertical: 4,
      borderRadius: 8,
    },
    colHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginBottom: 4,
    },
    colLabel: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 9,
      color: colors.slate400,
    },
    colVal: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 14,
      color: colors.text,
      fontWeight: '700',
    },
    netVal: {
      color: colors.neonCyan,
      fontSize: 15,
    },
    unitText: {
      fontFamily: 'Geist_400Regular',
      fontSize: 10,
      color: colors.mutedText,
    },
    operatorText: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 16,
      color: colors.slate600,
      marginHorizontal: 4,
    },
  });
