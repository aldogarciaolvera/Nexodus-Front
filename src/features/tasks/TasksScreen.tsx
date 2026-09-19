import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity } from 'react-native';
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
  { id: 'today', label: 'TODAY' },
  { id: 'upcoming', label: 'UPCOMING' },
  { id: 'all', label: 'ALL SECTORS' },
  { id: 'work', label: 'WORK' },
  { id: 'personal', label: 'PERSONAL' },
  { id: 'health', label: 'HEALTH' },
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
      <View style={{ paddingHorizontal: theme.metrics.marginHorizontal }}>
        <Header title="Focus & Execution" />
      </View>

      {isLoading ? (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Skeleton height={80} borderRadius={16} style={{ marginBottom: 16 }} />
          <View style={styles.listHeader}>
            <Skeleton width={100} height={14} borderRadius={4} />
          </View>
          <View style={styles.listContainer}>
            {[1, 2, 3, 4].map((key) => (
              <Skeleton key={key} height={70} borderRadius={0} style={{ marginBottom: 2 }} />
            ))}
          </View>
        </ScrollView>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
        </ScrollView>
      )}

      {/* Rapid Add Bar */}
      <View style={styles.rapidAddContainer}>
        <TouchableOpacity 
          style={styles.rapidAddInput}
          onPress={() => setIsModalVisible(true)}
        >
          <View style={styles.rapidAddCircle} />
          <Text style={styles.rapidAddPlaceholder}>Add rapid task or habit...</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.rapidAddButton}
          onPress={() => setIsModalVisible(true)}
        >
          <Text style={styles.rapidAddButtonIcon}>↑</Text>
        </TouchableOpacity>
      </View>

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

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.metrics.marginHorizontal,
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
  rapidAddContainer: {
    position: 'absolute',
    bottom: 24,
    left: theme.metrics.marginHorizontal,
    right: theme.metrics.marginHorizontal,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 30,
    padding: 8,
    paddingLeft: 16,
    borderWidth: 1,
    borderColor: theme.colors.borderGlow,
  },
  rapidAddInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rapidAddCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.colors.neonCyan,
    marginRight: 12,
  },
  rapidAddPlaceholder: {
    color: theme.colors.slate400,
    fontFamily: theme.typography.fontFamily,
    fontSize: 16,
  },
  rapidAddButton: {
    backgroundColor: theme.colors.neonCyan,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rapidAddButtonIcon: {
    color: theme.colors.obsidian,
    fontSize: 20,
    fontWeight: 'bold',
  },
});
