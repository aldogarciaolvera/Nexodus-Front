import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTheme } from '../../../utils/ThemeContext';
import { ThemeColors } from '../../../utils/theme';
import { useWorkoutStore } from '../../../store/workoutStore';
import { useQuery } from '@tanstack/react-query';
import { gymService, Routine } from '../../../services/gym.service';
import { Skeleton } from '../../../components/Skeleton';
import { AppNavigationProp } from '../../../utils/navigation';
import { Dumbbell } from 'lucide-react-native';
import { queryKeys } from '../../../services/queryKeys';

const EMPTY_ROUTINES: Routine[] = [];

export const WorkoutCard = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const theme = useTheme();
  const styles = createStyles(theme.colors);

  const { isActive, activeRoutine, completedSets } = useWorkoutStore();

  const { data: routines = EMPTY_ROUTINES, isLoading: isLoadingRoutines } = useQuery<Routine[]>({
    queryKey: queryKeys.gym.routines,
    queryFn: gymService.getRoutines,
  });

  const todayDay = new Date().getDay() === 0 ? 7 : new Date().getDay(); // 1=Mon..7=Sun
  const routineToday = routines.find(r => r.targetDay === todayDay);

  const { data: todayRoutineFull, isLoading: isLoadingFull } = useQuery({
    queryKey: queryKeys.gym.routine(routineToday?.id),
    queryFn: () => gymService.getRoutineById(routineToday!.id),
    enabled: !!routineToday?.id && !isActive,
  });

  const todayRoutine = todayRoutineFull || routineToday;
  const current = isActive ? activeRoutine : todayRoutine;
  const isLoading = isLoadingRoutines || (isLoadingFull && !isActive);

  const { progressPercent, strokeDashoffset } = useMemo(() => {
    let progress = 0;
    if (isActive && activeRoutine) {
      const totalExercises = activeRoutine.exercises.length;
      const completedCount = activeRoutine.exercises.filter(
        e => (completedSets[e.exerciseId] || 0) >= e.sets
      ).length;
      progress = totalExercises > 0 ? (completedCount / totalExercises) * 100 : 0;
    } else if (todayRoutine) {
      progress = 0;
    }

    const dashOffset = 106 - (106 * progress) / 100;

    return {
      progressPercent: progress,
      strokeDashoffset: dashOffset,
    };
  }, [isActive, activeRoutine, completedSets, todayRoutine]);

  const handlePressCard = () => {
    if (isActive) {
      navigation.navigate('ActiveWorkout');
    } else {
      navigation.navigate('Fit', { initialTab: 'gym' });
    }
  };

  const handleAction = () => {
    if (isActive) {
      navigation.navigate('ActiveWorkout');
    } else if (todayRoutine) {
      navigation.navigate('Fit', { initialTab: 'gym' });
    } else {
      navigation.navigate('CreateRoutine');
    }
  };

  const exerciseItems = current?.exercises?.slice(0, 3) || [];

  return (
    <TouchableOpacity 
      style={styles.card}
      activeOpacity={0.8}
      onPress={handlePressCard}
    >
      <View>
        <View style={styles.header}>
          <Dumbbell size={16} color={theme.colors.neonCyan} />
          <Text style={styles.headerTitle} numberOfLines={1}>
            {isActive ? 'Entrenamiento Activo' : 'Rutina Gym'}
          </Text>
        </View>
        
        {isLoading ? (
          <Skeleton width={120} height={18} style={{ marginBottom: 8, borderRadius: 4 }} />
        ) : (
          <Text style={styles.subtitle} numberOfLines={1}>
            {isActive 
              ? `En Curso: ${activeRoutine?.name}` 
              : todayRoutine 
                ? `Hoy: ${todayRoutine.name}`
                : routines.length > 0
                  ? 'Día de Descanso'
                  : 'Sin Rutinas'}
          </Text>
        )}
        
        <View style={styles.contentRow}>
          <View style={styles.exerciseList}>
            {isLoading ? (
              <>
                <Skeleton width={80} height={14} style={{ marginBottom: 4, borderRadius: 4 }} />
                <Skeleton width={90} height={14} style={{ marginBottom: 4, borderRadius: 4 }} />
                <Skeleton width={70} height={14} style={{ borderRadius: 4 }} />
              </>
            ) : exerciseItems.length > 0 ? (
              exerciseItems.map((ex, idx) => {
                const name = ex.exercise?.name || `Ejercicio ${idx + 1}`;
                const isFinished = isActive && (completedSets[ex.exerciseId] || 0) >= ex.sets;
                return (
                  <View key={ex.id || `${ex.exerciseId}-${idx}`} style={styles.exerciseItem}>
                    <View style={[
                      styles.bullet, 
                      isFinished && { backgroundColor: theme.colors.neonCyan }
                    ]} />
                    <Text 
                      style={[
                        styles.exerciseText, 
                        isFinished && { color: theme.colors.slate400, textDecorationLine: 'line-through' }
                      ]} 
                      numberOfLines={1}
                    >
                      {name}
                    </Text>
                  </View>
                );
              })
            ) : (
              <Text style={styles.emptyText}>
                {routines.length > 0 ? 'Sin ejercicios hoy' : 'Crea tu primera rutina'}
              </Text>
            )}
          </View>
          
          <View style={styles.gaugeContainer}>
            <Svg width={48} height={48} viewBox="0 0 44 44" style={{ transform: [{ rotate: '-90deg' }] }}>
              <Circle cx={22} cy={22} r={17} fill="none" stroke={theme.colors.surfaceLight} strokeWidth={3} />
              <Circle 
                cx={22} cy={22} r={17} fill="none" 
                stroke={isActive ? theme.colors.neonCyan : (todayRoutine ? theme.colors.borderGlow : theme.colors.surfaceLight)} 
                strokeWidth={3} 
                strokeLinecap="round"
                strokeDasharray={106} 
                strokeDashoffset={isActive ? strokeDashoffset : 106} 
              />
            </Svg>
            {isActive ? (
              <View style={styles.gaugeCenterText}>
                <Text style={styles.gaugeText}>{Math.round(progressPercent)}%</Text>
              </View>
            ) : current?.exercises?.length ? (
              <View style={styles.gaugeCenterText}>
                <Text style={[styles.gaugeText, { color: theme.colors.slate400, fontSize: 11 }]}>
                  {current.exercises.length}
                </Text>
              </View>
            ) : null}
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
  exerciseList: {
    flex: 1,
    gap: 4,
    paddingRight: 6,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.slate500,
  },
  exerciseText: {
    fontSize: 12,
    color: colors.slate300,
    fontFamily: 'Geist_400Regular',
    flex: 1,
  },
  emptyText: {
    fontSize: 11,
    color: colors.slate400,
    fontFamily: 'Geist_400Regular',
    fontStyle: 'italic',
  },
  gaugeContainer: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  gaugeCenterText: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeText: {
    fontSize: 10,
    color: colors.neonCyan,
    fontFamily: 'JetBrainsMono_500Medium',
  }
});
