import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { theme } from '../../utils/theme';
import { ProgressTelemetry } from './components/ProgressTelemetry';
import { FilterPills } from './components/FilterPills';
import { TaskHabitCard, TaskHabitItem } from './components/TaskHabitCard';
import { CreateTaskModal } from './components/CreateTaskModal';
import { TodoService, CreateTodoDto, TodoDto } from '../../services/todo.service';
import { Header } from '../../components/Header';
import { Skeleton } from '../../components/Skeleton';

const FILTERS = [
  { id: 'today', label: 'HOY' },
  { id: 'upcoming', label: 'MAÑANA' },
  { id: 'all', label: 'TODOS LOS SECTORES' },
  { id: 'work', label: 'TRABAJO' },
  { id: 'personal', label: 'PERSONAL' },
  { id: 'health', label: 'SALUD' },
];

export const TasksScreen = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('today');
  const [isModalVisible, setIsModalVisible] = useState(false);

  const { data: todos = [], isLoading } = useQuery({
    queryKey: ['todos'],
    queryFn: TodoService.getAll,
  });

  const createMutation = useMutation({
    mutationFn: (newTodo: CreateTodoDto) => TodoService.create(newTodo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      setIsModalVisible(false);
    },
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => TodoService.complete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: TodoDto }) => 
      TodoService.update(id, {
        task: data.task,
        subtitle: data.subtitle,
        tag: data.tag,
        urgent: data.urgent,
        isHabit: data.isHabit,
        frequency: data.frequency,
        isCompleted: false, // For un-completing tasks
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });

  // Map Backend DTO to Frontend Item
  const items: TaskHabitItem[] = todos.map(t => ({
    id: t.id,
    type: t.isHabit ? 'habit' : 'task',
    title: t.task,
    subtitle: t.subtitle,
    tag: t.tag,
    streak: t.currentStreak,
    isCompleted: t.isCompleted,
    urgent: t.urgent,
    // Add time formatting here if needed, e.g. using t.dueDate
  }));

  const completedCount = items.filter(i => i.isCompleted).length;
  const totalCount = items.length;
  const urgentCount = items.filter(i => i.type === 'task' && i.urgent && !i.isCompleted).length;
  const activeHabitsCount = items.filter(i => i.type === 'habit').length;

  const handleToggle = (id: string) => {
    const item = todos.find(t => t.id === id);
    if (!item) return;

    if (!item.isCompleted) {
      // Both tasks and habits use /complete to finish
      completeMutation.mutate(id);
    } else {
      // If it's already completed and it's a task, we might want to un-complete it via PUT
      if (!item.isHabit) {
        updateMutation.mutate({ id, data: item });
      }
      // If it's a habit, we do nothing to prevent breaking streak logic as requested
    }
  };

  const handleAddItem = (newItemData: CreateTodoDto) => {
    createMutation.mutate(newItemData);
  };

  const sortedItems = [...items].sort((a, b) => {
    if (a.isCompleted === b.isCompleted) return 0;
    return a.isCompleted ? 1 : -1;
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Header title="Tareas & Habitos" />

          {isLoading ? (
            <>
              <Skeleton height={80} borderRadius={16} style={{ marginBottom: 16 }} />
              <View style={styles.listHeader}>
                <Skeleton width={100} height={14} borderRadius={4} />
              </View>
              <View style={styles.listContainer}>
                {[1, 2, 3, 4].map((key) => (
                  <Skeleton key={key} height={70} borderRadius={0} style={{ marginBottom: 2 }} />
                ))}
              </View>
            </>
          ) : (
            <>
              <ProgressTelemetry 
                completed={completedCount}
                total={totalCount}
                urgent={urgentCount}
                activeHabits={activeHabitsCount}
              />

              <FilterPills 
                options={FILTERS}
                selectedId={filter}
                onSelect={setFilter}
              />

              <View style={styles.listHeader}>
                <Text style={styles.listHeaderText}>IN EXECUTION • {totalCount - completedCount}</Text>
                <TouchableOpacity>
                  <Text style={styles.filterIcon}>☷</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.listContainer}>
                {sortedItems.map(item => (
                  <TaskHabitCard 
                    key={item.id}
                    item={item}
                    onToggle={handleToggle}
                  />
                ))}
              </View>
              <View style={styles.bottomPadding} />
            </>
          )}
        </ScrollView>
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab} 
        activeOpacity={0.8} 
        onPress={() => setIsModalVisible(true)}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      <CreateTaskModal 
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onAdd={handleAddItem}
        isLoading={createMutation.isPending}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.obsidian,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.obsidian,
  },
  scrollContent: {
    paddingHorizontal: theme.metrics.marginHorizontal,
    paddingTop: Platform.OS === 'android' ? 24 : 12,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  listHeaderText: {
    color: theme.colors.slate400,
    fontFamily: theme.typography.fontMono,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  filterIcon: {
    color: theme.colors.slate500,
    fontSize: 16,
  },
  listContainer: {
    gap: 0,
  },
  bottomPadding: {
    height: 100, // Space for rapid add bar
  },
  fab: {
    position: 'absolute',
    bottom: 100, // Above bottom nav
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.neonCyan,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderGlow,
  },
  fabIcon: {
    fontSize: 28,
    fontWeight: '300',
    color: '#000000', // Assuming black for contrast against neon cyan
    lineHeight: 32, // to vertically center the + symbol properly
  },
});
