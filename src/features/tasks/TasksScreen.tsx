import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../utils/ThemeContext';
import { ThemeColors, ThemeTypography, ThemeMetrics } from '../../utils/theme';
import { ProgressTelemetry } from './components/ProgressTelemetry';
import { TaskHabitCard, TaskHabitItem } from './components/TaskHabitCard';
import { CreateTaskModal } from './components/CreateTaskModal';
import { ActionSheet } from '../../components/ActionSheet';
import { TodoService, CreateTodoDto, TodoDto } from '../../services/todo.service';
import { Header } from '../../components/Header';
import { Skeleton } from '../../components/Skeleton';
import { useAlertStore } from '../../store/alertStore';
import { scheduleTodoNotification, cancelTodoNotification } from '../../utils/notifications';
import { queryKeys } from '../../services/queryKeys';
import { HabitsView } from '../habits/HabitsView';
import { useCarouselNavStore } from '../../store/carouselNavStore';

export type TasksTabType = 'tasks' | 'habits';

interface TasksScreenProps {
  mode?: TasksTabType;
  initialTab?: TasksTabType;
}

const EMPTY_TODOS: TodoDto[] = [];

export const TasksScreen: React.FC<TasksScreenProps> = ({ mode = 'tasks', initialTab }) => {
  const theme = useTheme();
  const styles = createStyles(theme.colors, theme.typography, theme.metrics);
  const queryClient = useQueryClient();
  const navigation = useNavigation();
  const alertStore = useAlertStore();
  const navigateToPage = useCarouselNavStore((s) => s.navigateToPage);

  const [internalMode, setInternalMode] = useState<TasksTabType>(mode || initialTab || 'tasks');
  const selectedMode = mode || internalMode;
  const isHabits = selectedMode === 'habits';

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isHabitCreateVisible, setIsHabitCreateVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<TaskHabitItem | null>(null);
  const [isActionModalVisible, setActionModalVisible] = useState(false);
  const [editingItemDto, setEditingItemDto] = useState<TodoDto | null>(null);

  const { data: todos = EMPTY_TODOS, isLoading } = useQuery({
    queryKey: queryKeys.todos.all,
    queryFn: TodoService.getAll,
  });

  const createMutation = useMutation({
    mutationFn: (newTodo: CreateTodoDto) => TodoService.create(newTodo),
    onSuccess: async (data) => {
      await scheduleTodoNotification(data);
      queryClient.invalidateQueries({ queryKey: queryKeys.todos.all });
      setIsModalVisible(false);
    },
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => TodoService.complete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.todos.all });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => TodoService.delete(id),
    onSuccess: async (_, id) => {
      const todo = todos.find(t => t.id === id);
      if (todo) {
        await cancelTodoNotification(todo);
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.todos.all });
      setActionModalVisible(false);
      setSelectedItem(null);
    },
  });

  const uncompleteMutation = useMutation({
    mutationFn: (id: string) => TodoService.uncomplete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.todos.all });
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
        notificationsEnabled: data.notificationsEnabled,
        notificationTime: data.notificationTime,
        customDays: data.customDays,
      }),
    onSuccess: async (data) => {
      await scheduleTodoNotification(data);
      queryClient.invalidateQueries({ queryKey: queryKeys.todos.all });
      setIsModalVisible(false);
      setEditingItemDto(null);
    },
  });

  const { completedCount, totalCount, urgentCount, sortedItems, pendingExecutionCount } = useMemo(() => {
    // Only pure tasks in this screen (habits are in their dedicated Habits screen)
    const tasksOnly = todos.filter((t) => !t.isHabit);
    const viewingDateStr = new Date().toDateString();

    const mappedItems: TaskHabitItem[] = tasksOnly.map((t) => {
      let computedCompleted = t.isCompleted;
      const isRepeating = t.frequency && t.frequency !== 'Ninguna' && t.frequency !== 'Un solo día' && t.frequency !== '';

      if (isRepeating && t.isCompleted) {
        if (t.lastCompletedAt) {
          const completedDate = new Date(t.lastCompletedAt).toDateString();
          computedCompleted = completedDate === viewingDateStr;
        } else {
          computedCompleted = false;
        }
      }

      return {
        id: t.id,
        type: 'task',
        title: t.task,
        subtitle: t.subtitle,
        tag: t.tag,
        isCompleted: computedCompleted,
        urgent: t.urgent,
        frequency: t.frequency,
        customDays: t.customDays,
        lastCompletedAt: t.lastCompletedAt,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        notificationsEnabled: t.notificationsEnabled,
      };
    });

    const completed = mappedItems.filter((i) => i.isCompleted).length;
    const total = mappedItems.length;
    const urgent = mappedItems.filter((i) => i.urgent && !i.isCompleted).length;

    const sorted = [...mappedItems].sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) {
        return a.isCompleted ? 1 : -1;
      }
      if (a.urgent !== b.urgent) {
        return a.urgent ? -1 : 1;
      }
      return 0;
    });

    const pendingExecution = sorted.filter((i) => !i.isCompleted).length;

    return {
      completedCount: completed,
      totalCount: total,
      urgentCount: urgent,
      sortedItems: sorted,
      pendingExecutionCount: pendingExecution,
    };
  }, [todos]);

  const handleToggle = (id: string) => {
    const item = todos.find(t => t.id === id);
    if (!item) return;

    if (!item.isCompleted) {
      completeMutation.mutate(id);
    } else {
      uncompleteMutation.mutate(id);
    }
  };

  const handleLongPress = (item: TaskHabitItem) => {
    setSelectedItem(item);
    setActionModalVisible(true);
  };

  const handleEdit = () => {
    if (!selectedItem) return;
    const dto = todos.find(t => t.id === selectedItem.id);
    if (dto) {
      setEditingItemDto(dto);
      setActionModalVisible(false);
      setIsModalVisible(true);
    }
  };

  const handleDelete = () => {
    if (!selectedItem) return;
    setActionModalVisible(false);
    alertStore.showAlert({
      title: 'Eliminar',
      message: '¿Estás seguro que deseas eliminar esto permanentemente?',
      type: 'error',
      buttons: [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: () => deleteMutation.mutate(selectedItem.id)
        }
      ]
    });
  };

  const handleAddItem = (newItemData: CreateTodoDto) => {
    createMutation.mutate(newItemData);
  };

  const handleEditItem = (id: string, updatedData: CreateTodoDto) => {
    const original = todos.find(t => t.id === id);
    if (original) {
      updateMutation.mutate({ 
        id, 
        data: { ...original, ...updatedData } 
      });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Header 
            title={isHabits ? 'Mis Hábitos' : 'Mis Tareas'} 
            dots={{
              total: 2,
              active: isHabits ? 1 : 0,
              onPressDot: (idx) => {
                setInternalMode(idx === 1 ? 'habits' : 'tasks');
                navigateToPage(idx === 0 ? 3 : 4);
              },
            }}
          />

          {isHabits ? (
            <HabitsView
              isCreateModalOpen={isHabitCreateVisible}
              onCloseCreateModal={() => setIsHabitCreateVisible(false)}
            />
          ) : isLoading ? (
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
              />

              <View style={styles.listHeader}>
                <Text style={styles.listHeaderText}>
                  EN EJECUCION • {pendingExecutionCount}
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate('AllTasks' as never)}>
                  <Text style={styles.viewAllText}>VER TODO</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.listContainer}>
                {sortedItems.map(item => (
                  <TaskHabitCard 
                    key={item.id}
                    item={item}
                    onToggle={handleToggle}
                    onLongPress={handleLongPress}
                  />
                ))}
              </View>
              <View style={styles.bottomPadding} />
            </>
          )}
        </ScrollView>
      </View>

      {/* Floating Action Button (Disponible tanto en tareas como en hábitos) */}
      <TouchableOpacity 
        style={styles.fab} 
        activeOpacity={0.8} 
        onPress={() => {
          if (isHabits) {
            setIsHabitCreateVisible(true);
          } else {
            setEditingItemDto(null);
            setIsModalVisible(true);
          }
        }}
        accessibilityRole="button"
        accessibilityLabel={isHabits ? "Crear nuevo hábito" : "Crear nueva tarea"}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      <CreateTaskModal 
        visible={isModalVisible}
        onClose={() => {
          setIsModalVisible(false);
          setEditingItemDto(null);
        }}
        onAdd={handleAddItem}
        onEdit={handleEditItem}
        isLoading={createMutation.isPending || updateMutation.isPending}
        editingItem={editingItemDto}
      />

      <ActionSheet
        visible={isActionModalVisible}
        onClose={() => setActionModalVisible(false)}
        title={selectedItem?.title}
        subtitle={selectedItem?.subtitle}
        options={[
          {
            label: 'Editar',
            onPress: handleEdit
          },
          {
            label: 'Eliminar',
            destructive: true,
            onPress: handleDelete
          }
        ]}
      />
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors, typography: ThemeTypography, metrics: ThemeMetrics) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.obsidian,
  },
  container: {
    flex: 1,
    backgroundColor: colors.obsidian,
  },
  scrollContent: {
    paddingHorizontal: metrics.marginHorizontal,
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
    color: colors.slate400,
    fontFamily: typography.fontMono,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  viewAllText: {
    color: colors.neonCyan,
    fontFamily: typography.fontMono,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
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
    backgroundColor: colors.neonCyan,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  fabIcon: {
    fontSize: 28,
    fontWeight: '300',
    color: '#000000',
    lineHeight: 32,
  },
});
