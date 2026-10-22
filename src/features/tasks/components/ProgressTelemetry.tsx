import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../../utils/ThemeContext';
import { ThemeColors, ThemeTypography } from '../../../utils/theme';

interface ProgressTelemetryProps {
  completed: number;
  total: number;
  urgent: number;
  activeHabits: number;
}

export const ProgressTelemetry: React.FC<ProgressTelemetryProps> = ({ 
  completed, 
  total, 
  urgent,
  activeHabits
}) => {
  const theme = useTheme();
  const styles = createStyles(theme.colors, theme.typography);
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.dot} />
          <Text style={styles.title}>PROGRESO</Text>
        </View>
        <Text style={styles.progressText}>
          <Text style={styles.progressFraction}>{completed} de {total} Listos</Text>
          <Text style={styles.progressDot}> • </Text>
          <Text style={styles.progressPercentage}>{percentage}%</Text>
        </Text>
      </View>

      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBarFill, { width: `${percentage}%` }]} />
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>COMPLETOS</Text>
          <Text style={styles.statValue}>{completed}</Text>
        </View>
        
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>PENDIENTE</Text>
          <Text style={styles.statValue}>{total - completed}</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={[styles.statLabel, { color: theme.colors.error }]}>URGENTES</Text>
          <Text style={[styles.statValue, { color: theme.colors.error }]}>{urgent}</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statLabel}>HÁBITOS</Text>
          <Text style={styles.statValue}>{activeHabits}</Text>
        </View>
      </View>
    </View>
  );
};

const createStyles = (colors: ThemeColors, typography: ThemeTypography) => StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.neonCyan,
    marginRight: 8,
  },
  title: {
    color: colors.slate400,
    fontFamily: typography.fontMono,
    fontSize: 11,
    letterSpacing: 1,
  },
  progressText: {
    fontFamily: typography.fontMono,
    fontSize: 12,
  },
  progressFraction: {
    color: colors.neonCyan,
  },
  progressDot: {
    color: colors.slate500,
  },
  progressPercentage: {
    color: colors.neonCyan,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: colors.surfaceLight,
    borderRadius: 3,
    marginBottom: 24,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.neonCyan,
    borderRadius: 3,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    flex: 1,
  },
  statLabel: {
    color: colors.slate500,
    fontFamily: typography.fontMono,
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 4,
    textAlign: "center",
  },
  statValue: {
    color: colors.text,
    fontFamily: typography.fontMonoMedium,
    fontSize: 22,
    textAlign: "center",
  },
});
