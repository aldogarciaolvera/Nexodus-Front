import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../../../utils/ThemeContext';
import { ThemeColors } from '../../../utils/theme';
import { useQuery } from '@tanstack/react-query';
import { HabitService, HabitDto, getHabitTodayStatus } from '../../../services/habit.service';
import { queryKeys } from '../../../services/queryKeys';
import { Skeleton } from '../../../components/Skeleton';
import { useCarouselNavStore } from '../../../store/carouselNavStore';
import { Sparkles, Flame, Check } from 'lucide-react-native';

const EMPTY_HABITS: HabitDto[] = [];

export const HabitsCard: React.FC = () => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);

  const { data: habits = EMPTY_HABITS, isLoading } = useQuery<HabitDto[]>({
    queryKey: queryKeys.habits.all,
    queryFn: () => HabitService.getAll(false, 14),
    staleTime: 60 * 1000,
  });

  const { totalHabits, completedHabits, progressPercent, strokeDashoffset, displayHabits } = useMemo(() => {
    const total = habits.length;
    const completed = habits.filter(h => getHabitTodayStatus(h).isCompleted).length;
    const progress = total > 0 ? (completed / total) * 100 : 0;
    const dashOffset = 106 - (106 * progress) / 100;

    // Prioritize pending habits first, then completed habits
    const sorted = [...habits].sort((a, b) => {
      const aDone = getHabitTodayStatus(a).isCompleted ? 1 : 0;
      const bDone = getHabitTodayStatus(b).isCompleted ? 1 : 0;
      if (aDone !== bDone) return aDone - bDone;
      // If same status, sort by current streak descending
      return (b.currentStreak || 0) - (a.currentStreak || 0);
    });

    return {
      totalHabits: total,
      completedHabits: completed,
      progressPercent: progress,
      strokeDashoffset: dashOffset,
      displayHabits: sorted.slice(0, 3),
    };
  }, [habits]);

  const handlePressCard = () => {
    useCarouselNavStore.getState().navigateToTab('Tasks', 'habits');
  };

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={handlePressCard}
      accessibilityRole="button"
      accessibilityLabel={`Tarjeta de hábitos: ${completedHabits} de ${totalHabits} completados hoy. Toca para ver tus hábitos.`}
    >
      <View>
        <View style={styles.header}>
          <Sparkles size={16} color={theme.colors.neonCyan} />
          <Text style={styles.headerTitle} numberOfLines={1}>Hábitos</Text>
        </View>

        {isLoading ? (
          <Skeleton width={120} height={18} style={{ marginBottom: 8, borderRadius: 4 }} />
        ) : (
          <Text style={styles.subtitle} numberOfLines={1}>
            {totalHabits === 0
              ? 'Sin Hábitos'
              : progressPercent === 100
                ? 'Todos Listos'
                : `${completedHabits}/${totalHabits} Completados`}
          </Text>
        )}

        <View style={styles.contentRow}>
          <View style={styles.habitList}>
            {isLoading ? (
              <>
                <Skeleton width={80} height={14} style={{ marginBottom: 4, borderRadius: 4 }} />
                <Skeleton width={95} height={14} style={{ marginBottom: 4, borderRadius: 4 }} />
                <Skeleton width={70} height={14} style={{ borderRadius: 4 }} />
              </>
            ) : displayHabits.length > 0 ? (
              displayHabits.map((habit) => {
                const isDone = getHabitTodayStatus(habit).isCompleted;
                const habitColor = habit.color || theme.colors.neonCyan;
                return (
                  <View key={habit.id} style={styles.habitItem}>
                    <View
                      style={[
                        styles.bullet,
                        isDone
                          ? { backgroundColor: habitColor, borderColor: habitColor }
                          : { borderColor: theme.colors.borderGlow, backgroundColor: 'transparent' },
                      ]}
                    >
                      {isDone ? (
                        <Check size={8} color={theme.colors.obsidian} strokeWidth={3} />
                      ) : null}
                    </View>

                    <Text
                      style={[
                        styles.habitText,
                        isDone && { color: theme.colors.slate400, textDecorationLine: 'line-through' },
                      ]}
                      numberOfLines={1}
                    >
                      {habit.name}
                    </Text>

                    {habit.currentStreak > 0 ? (
                      <View style={styles.streakBadge}>
                        <Flame size={10} color={theme.colors.warning} />
                        <Text style={styles.streakText}>{habit.currentStreak}</Text>
                      </View>
                    ) : null}
                  </View>
                );
              })
            ) : (
              <Text style={styles.emptyText}>Crea tus primeros hábitos</Text>
            )}
          </View>

          <View style={styles.gaugeContainer}>
            <Svg width={48} height={48} viewBox="0 0 44 44" style={{ transform: [{ rotate: '-90deg' }] }}>
              <Circle cx={22} cy={22} r={17} fill="none" stroke={theme.colors.surfaceLight} strokeWidth={3} />
              <Circle
                cx={22}
                cy={22}
                r={17}
                fill="none"
                stroke={totalHabits > 0 ? theme.colors.neonCyan : theme.colors.surfaceLight}
                strokeWidth={3}
                strokeLinecap="round"
                strokeDasharray={106}
                strokeDashoffset={totalHabits > 0 ? strokeDashoffset : 106}
              />
            </Svg>
            {totalHabits > 0 ? (
              <View style={styles.gaugeCenterText}>
                <Text style={styles.gaugeText}>{Math.round(progressPercent)}%</Text>
              </View>
            ) : (
              <View style={styles.gaugeCenterText}>
                <Text style={[styles.gaugeText, { color: theme.colors.slate400, fontSize: 11 }]}>0</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
      gap: 8,
      marginBottom: 10,
    },
    headerTitle: {
      fontSize: 10.5,
      letterSpacing: 0.5,
      color: colors.mutedText,
      textTransform: 'uppercase',
      fontFamily: 'JetBrainsMono_500Medium',
      flex: 1,
    },
    subtitle: {
      fontSize: 13,
      color: colors.white,
      letterSpacing: -0.5,
      marginBottom: 8,
      fontFamily: 'Geist_500Medium',
    },
    contentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 4,
    },
    habitList: {
      flex: 1,
      gap: 5,
      paddingRight: 6,
    },
    habitItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    bullet: {
      width: 12,
      height: 12,
      borderRadius: 6,
      borderWidth: 1.5,
      alignItems: 'center',
      justifyContent: 'center',
    },
    habitText: {
      flex: 1,
      fontSize: 11.5,
      color: colors.slate200,
      fontFamily: 'Geist_400Regular',
    },
    streakBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      backgroundColor: 'rgba(245, 158, 11, 0.1)',
      paddingHorizontal: 4,
      paddingVertical: 1,
      borderRadius: 4,
    },
    streakText: {
      fontSize: 9.5,
      color: colors.warning,
      fontFamily: 'JetBrainsMono_600SemiBold',
    },
    emptyText: {
      fontSize: 11,
      color: colors.slate400,
      fontFamily: 'Geist_400Regular',
      fontStyle: 'italic',
    },
    gaugeContainer: {
      position: 'relative',
      width: 48,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
    },
    gaugeCenterText: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
    },
    gaugeText: {
      fontSize: 10,
      fontFamily: 'JetBrainsMono_600SemiBold',
      color: colors.white,
    },
  });
