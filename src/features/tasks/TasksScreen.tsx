import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, Platform, Modal, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { theme } from '../../utils/theme';
import { ProgressTelemetry } from './components/ProgressTelemetry';
import { FilterPills } from './components/FilterPills';
import { TaskHabitCard, TaskHabitItem } from './components/TaskHabitCard';
import { CreateTaskModal } from './components/CreateTaskModal';
import { ActionSheet } from '../../components/ActionSheet';
import { TodoService, CreateTodoDto, TodoDto } from '../../services/todo.service';
import { isItemActiveForDate } from '../../utils/todoHelpers';
import { Header } from '../../components/Header';
import { Skeleton } from '../../components/Skeleton';
import { useAlertStore } from '../../store/alertStore';

const FILTERS = [
  { id: 'today', label: 'HOY' },
  { id: 'upcoming', label: 'MAÑANA' },
  { id: 'all', label: 'TODOS LOS SECTORES' },
  { id: 'tasks', label: 'SOLO TAREAS' },
  { id: 'habits', label: 'SOLO HÁBITOS' },
  { id: 'work', label: 'TRABAJO' },
  { id: 'personal', label: 'PERSONAL' },
  { id: 'health', label: 'SALUD' },
];

export const TasksScreen = () => {
  const queryClient = useQueryClient();
  const navigation = useNavigation();
  const alertStore = useAlertStore();
  const [filter, setFilter] = useState('today');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<TaskHabitItem | null>(null);
  const [isActionModalVisible, setActionModalVisible] = useState(false);
  const [editingItemDto, setEditingItemDto] = useState<TodoDto | null>(null);

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

  const deleteMutation = useMutation({
    mutationFn: (id: string) => TodoService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      setActionModalVisible(false);
      setSelectedItem(null);
    },
  });

  const uncompleteMutation = useMutation({
    mutationFn: (id: string) => TodoService.uncomplete(id),
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
      setIsModalVisible(false);
      setEditingItemDto(null);
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
    frequency: t.frequency,
    customDays: t.customDays,
    lastCompletedAt: t.lastCompletedAt,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  }));

  const completedCount = items.filter(i => i.isCompleted).length;
  const totalCount = items.length;
  const urgentCount = items.filter(i => i.type === 'task' && i.urgent && !i.isCompleted).length;
  const activeHabitsCount = items.filter(i => i.type === 'habit').length;

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

  let filteredItems = items;
  if (filter === 'today') {
    const today = new Date();
    filteredItems = items.filter(i => isItemActiveForDate(i, today, false));
  }
  else if (filter === 'upcoming') {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    filteredItems = items.filter(i => isItemActiveForDate(i, tomorrow, true));
  }
  else if (filter === 'work') filteredItems = items.filter(i => i.tag === 'TRABAJO');
  else if (filter === 'personal') filteredItems = items.filter(i => i.tag === 'PERSONAL');
  else if (filter === 'health') filteredItems = items.filter(i => i.tag === 'SALUD');
  else if (filter === 'tasks') filteredItems = items.filter(i => i.type === 'task');
  else if (filter === 'habits') filteredItems = items.filter(i => i.type === 'habit');
  // 'all' shows all items

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (a.isCompleted !== b.isCompleted) {
      return a.isCompleted ? 1 : -1;
    }
    if (a.urgent !== b.urgent) {
      return a.urgent ? -1 : 1;
    }
    return 0;
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
                <Text style={styles.listHeaderText}>
                  EN EJECUCION • {filteredItems.length - filteredItems.filter(i => i.isCompleted).length}
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

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab} 
        activeOpacity={0.8} 
        onPress={() => {
          setEditingItemDto(null);
          setIsModalVisible(true);
        }}
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
  viewAllText: {
    color: theme.colors.neonCyan,
    fontFamily: theme.typography.fontMono,
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
