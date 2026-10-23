import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../../utils/ThemeContext';
import { ThemeColors } from '../../../utils/theme';
import { useQuery } from '@tanstack/react-query';
import { TodoService, TodoDto } from '../../../services/todo.service';
import { isItemActiveForDate } from '../../../utils/todoHelpers';
import { Skeleton } from '../../../components/Skeleton';
import { TaskHabitItem } from '../../tasks/components/TaskHabitCard';
import { AppNavigationProp } from '../../../utils/navigation';
import { queryKeys } from '../../../services/queryKeys';

const EMPTY_TODOS: TodoDto[] = [];

export const DailyTodoCard = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const theme = useTheme();
  const styles = createStyles(theme.colors);
  
  const { data: todos = EMPTY_TODOS, isLoading } = useQuery<TodoDto[]>({
    queryKey: queryKeys.todos.all,
    queryFn: TodoService.getAll,
  });

  const { totalTasks, completedTasks, progressPercent, displayTasks } = useMemo(() => {
    const items: TaskHabitItem[] = todos.map(t => ({
      id: t.id,
      type: t.isHabit ? 'habit' : 'task',
      title: t.task,
      subtitle: t.subtitle,
      tag: t.tag,
      streak: t.currentStreak,
      isCompleted: t.isCompleted,
      urgent: t.urgent,
      frequency: t.frequency,
      customDays: t.customDays,
      lastCompletedAt: t.lastCompletedAt,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));

    const today = new Date();
    const todayItems = items.filter(i => isItemActiveForDate(i, today, false));
    
    // Sort: Incomplete first, then by urgency
    const sorted = [...todayItems].sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
      if (a.urgent !== b.urgent) return a.urgent ? -1 : 1;
      return 0;
    });

    const total = todayItems.length;
    const completed = todayItems.filter(i => i.isCompleted).length;
    const progress = total > 0 ? (completed / total) * 100 : 0;
    const display = sorted.slice(0, 3);

    return {
      todayItems,
      sortedItems: sorted,
      totalTasks: total,
      completedTasks: completed,
      progressPercent: progress,
      displayTasks: display,
    };
  }, [todos]);

  return (
    <TouchableOpacity 
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => navigation.navigate('Tasks')}
      accessibilityRole="button"
      accessibilityLabel={`Tarjeta de tareas de hoy: ${completedTasks} de ${totalTasks} completadas. Toca para ver todas.`}
    >
      <View>
        <View style={styles.header}>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={theme.colors.neonCyan} strokeWidth={1.8}>
            <Path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </Svg>
          <Text style={styles.headerTitle}>Tareas Diarias</Text>
        </View>
        
        {isLoading ? (
          <Skeleton width={100} height={20} style={{ marginBottom: 10, borderRadius: 4 }} />
        ) : (
          <Text style={styles.taskCount}>{totalTasks} Tareas</Text>
        )}
        
        <View style={styles.taskList}>
          {isLoading ? (
            <>
              <Skeleton width="100%" height={16} style={{ marginBottom: 6, borderRadius: 4 }} />
              <Skeleton width="80%" height={16} style={{ marginBottom: 6, borderRadius: 4 }} />
              <Skeleton width="90%" height={16} style={{ borderRadius: 4 }} />
            </>
          ) : displayTasks.length > 0 ? (
            displayTasks.map(task => (
              <View key={task.id} style={styles.taskItem}>
                <View style={[
                  styles.bullet, 
                  { backgroundColor: task.isCompleted ? theme.colors.slate500 : (task.urgent ? theme.colors.error : theme.colors.neonCyan) }
                ]} />
                <Text 
                  style={[
                    styles.taskText, 
                    task.isCompleted && { color: theme.colors.slate400, textDecorationLine: 'line-through' }
                  ]} 
                  numberOfLines={1}
                >
                  {task.title}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No hay tareas para hoy.</Text>
          )}
        </View>
      </View>
      
      <View style={styles.footer}>
        {isLoading ? (
          <Skeleton width="100%" height={6} style={{ borderRadius: 3, marginBottom: 6 }} />
        ) : (
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>
        )}
        <View style={styles.countContainer}>
          {isLoading ? (
            <Skeleton width={30} height={14} style={{ borderRadius: 4 }} />
          ) : (
            <Text style={styles.countText}>{completedTasks}/{totalTasks}</Text>
          )}
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
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 11,
    letterSpacing: 0.5,
    color: colors.mutedText,
    textTransform: 'uppercase',
    fontFamily: 'JetBrainsMono_500Medium',
  },
  taskCount: {
    fontSize: 18,
    color: colors.white,
    letterSpacing: -0.5,
    marginBottom: 10,
    fontFamily: 'JetBrainsMono_500Medium',
  },
  taskList: {
    gap: 6,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  emptyText: {
    fontSize: 12,
    color: colors.slate400,
    fontFamily: 'Geist_400Regular',
    fontStyle: 'italic',
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  taskText: {
    fontSize: 12,
    color: colors.slate300,
    fontFamily: 'Geist_400Regular',
    flex: 1,
  },
  footer: {
    marginTop: 16,
    paddingTop: 4,
  },
  progressTrack: {
    width: '100%',
    backgroundColor: colors.surfaceLight,
    borderRadius: 3,
    height: 6,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    backgroundColor: colors.neonCyan,
    height: '100%',
    borderRadius: 3,
  },
  countContainer: {
    alignItems: 'flex-end',
  },
  countText: {
    fontSize: 11,
    color: colors.mutedText,
    letterSpacing: 0.5,
    fontFamily: 'JetBrainsMono_500Medium',
  },
});
