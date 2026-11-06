import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Activity, ShieldCheck, Clock, Zap } from 'lucide-react-native';
import { gymService, MuscleRecoveryDto } from '../../../services/gym.service';
import { queryKeys } from '../../../services/queryKeys';
import { useTheme } from '../../../utils/ThemeContext';
import { ThemeColors } from '../../../utils/theme';
import { Skeleton } from '../../../components/Skeleton';

const MUSCLE_NAMES_ES: Record<string, string> = {
  Chest: 'Pecho',
  Back: 'Espalda',
  Shoulders: 'Hombros',
  Legs: 'Piernas',
  Arms: 'Brazos',
  Core: 'Core',
};

export const MuscleRecoveryCard = React.memo(() => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);

  const { data: recoveryList, isLoading } = useQuery({
    queryKey: queryKeys.gym.muscleRecovery,
    queryFn: gymService.getMuscleRecoveryStatus,
    staleTime: 60 * 1000,
  });

  if (isLoading) {
    return (
      <View style={styles.card}>
        <Skeleton width="40%" height={20} style={{ marginBottom: 12 }} />
        <View style={{ gap: 10 }}>
          <Skeleton width="100%" height={24} borderRadius={6} />
          <Skeleton width="100%" height={24} borderRadius={6} />
          <Skeleton width="100%" height={24} borderRadius={6} />
        </View>
      </View>
    );
  }

  if (!recoveryList || recoveryList.length === 0) {
    return null;
  }

  const getStatusColor = (percentage: number) => {
    if (percentage >= 80) return theme.colors.neonCyan;
    if (percentage >= 50) return theme.colors.warning;
    return theme.colors.error;
  };

  const getStatusLabel = (item: MuscleRecoveryDto) => {
    if (item.recoveryPercentage >= 80) return 'Listo';
    if (item.recoveryPercentage >= 50) return 'Recuperando';
    return 'Fatigado';
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconCircle}>
            <Zap size={14} color={theme.colors.neonCyan} />
          </View>
          <Text style={styles.title}>Recuperación Muscular</Text>
        </View>
        <Text style={styles.headerSub}>Modelo 48-72h</Text>
      </View>

      <View style={styles.grid}>
        {recoveryList.map((item) => {
          const displayName = MUSCLE_NAMES_ES[item.muscleGroup] || item.muscleGroup;
          const color = getStatusColor(item.recoveryPercentage);
          const statusLabel = getStatusLabel(item);

          return (
            <View key={item.muscleGroup} style={styles.muscleRow}>
              <View style={styles.muscleLabelRow}>
                <Text style={styles.muscleName}>{displayName}</Text>
                <View style={styles.muscleMeta}>
                  <Text style={[styles.statusBadgeText, { color }]}>
                    {statusLabel}
                  </Text>
                  <Text style={styles.percentageText}>
                    {item.recoveryPercentage}%
                  </Text>
                </View>
              </View>

              {/* Progress Track */}
              <View style={styles.track}>
                <View
                  style={[
                    styles.fill,
                    {
                      width: `${Math.max(5, Math.min(100, item.recoveryPercentage))}%`,
                      backgroundColor: color,
                    },
                  ]}
                />
              </View>

              {item.hoursSinceLastTrained !== undefined && item.hoursSinceLastTrained !== null ? (
                <Text style={styles.hoursSinceText}>
                  Entrenado hace {item.hoursSinceLastTrained}h
                  {item.estimatedFullRecoveryHours > 0
                    ? ` • Listo en ~${item.estimatedFullRecoveryHours}h`
                    : ''}
                </Text>
              ) : (
                <Text style={styles.hoursSinceText}>Sin fatiga reciente</Text>
              )}
            </View>
          );
        })}
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
      marginBottom: 20,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    iconCircle: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: 'rgba(56, 189, 248, 0.15)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontFamily: 'Geist_700Bold',
      fontSize: 14,
      color: colors.text,
    },
    headerSub: {
      fontFamily: 'JetBrainsMono_400Regular',
      fontSize: 10,
      color: colors.mutedText,
    },
    grid: {
      gap: 12,
    },
    muscleRow: {
      gap: 4,
    },
    muscleLabelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    muscleName: {
      fontFamily: 'Geist_500Medium',
      fontSize: 13,
      color: colors.text,
    },
    muscleMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    statusBadgeText: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 10,
    },
    percentageText: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 12,
      color: colors.text,
      minWidth: 34,
      textAlign: 'right',
    },
    track: {
      width: '100%',
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.surfaceLight,
      overflow: 'hidden',
    },
    fill: {
      height: '100%',
      borderRadius: 3,
    },
    hoursSinceText: {
      fontFamily: 'JetBrainsMono_400Regular',
      fontSize: 9,
      color: colors.slate500,
    },
  });

