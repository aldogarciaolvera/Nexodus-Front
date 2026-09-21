import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { theme } from '../../utils/theme';
import { TodoService, TodoDto, CreateTodoDto } from '../../services/todo.service';
import { TaskHabitItem, TaskHabitCard } from './components/TaskHabitCard';
import { ActionSheet } from '../../components/ActionSheet';
import { CreateTaskModal } from './components/CreateTaskModal';
import { Skeleton } from '../../components/Skeleton';
import { useAlertStore } from '../../store/alertStore';

export const AllTasksScreen = () => {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const alertStore = useAlertStore();
  const [filter, setFilter] = useState('all');
  
  const [isActionModalVisible, setActionModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<TaskHabitItem | null>(null);
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingItemDto, setEditingItemDto] = useState<TodoDto | null>(null);

  const { data: todos = [], isLoading } = useQuery({
    queryKey: ['todos'],
    queryFn: TodoService.getAll,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => TodoService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      setActionModalVisible(false);
      setSelectedItem(null);
    },
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => TodoService.complete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  });

  const uncompleteMutation = useMutation({
    mutationFn: (id: string) => TodoService.uncomplete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
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
        isCompleted: false, // Optional: might want to preserve isCompleted status
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      setIsModalVisible(false);
      setEditingItemDto(null);
    },
  });

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

  const handleEditItem = (id: string, updatedData: CreateTodoDto) => {
    const original = todos.find(t => t.id === id);
    if (original) {
      updateMutation.mutate({ 
        id, 
        data: { ...original, ...updatedData } 
      });
    }
  };

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

  // Filtering
  let filteredItems = items;
  if (filter === 'tasks') filteredItems = items.filter(i => i.type === 'task');
  else if (filter === 'habits') filteredItems = items.filter(i => i.type === 'habit');
  else if (filter === 'completed') filteredItems = items.filter(i => i.isCompleted);
  else if (filter === 'pending') filteredItems = items.filter(i => !i.isCompleted);

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
    if (a.urgent !== b.urgent) return a.urgent ? -1 : 1;
    return 0;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={theme.colors.text} strokeWidth={2}>
            <Path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Historial</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity 
            style={[styles.filterPill, filter === 'all' && styles.filterPillActive]} 
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterPillText, filter === 'all' && styles.filterPillTextActive]}>Todas</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterPill, filter === 'pending' && styles.filterPillActive]} 
            onPress={() => setFilter('pending')}
          >
            <Text style={[styles.filterPillText, filter === 'pending' && styles.filterPillTextActive]}>En Ejecución</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterPill, filter === 'tasks' && styles.filterPillActive]} 
            onPress={() => setFilter('tasks')}
          >
            <Text style={[styles.filterPillText, filter === 'tasks' && styles.filterPillTextActive]}>Tareas</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterPill, filter === 'habits' && styles.filterPillActive]} 
            onPress={() => setFilter('habits')}
          >
            <Text style={[styles.filterPillText, filter === 'habits' && styles.filterPillTextActive]}>Hábitos</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterPill, filter === 'completed' && styles.filterPillActive]} 
            onPress={() => setFilter('completed')}
          >
            <Text style={[styles.filterPillText, filter === 'completed' && styles.filterPillTextActive]}>Completadas</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={{ gap: 12 }}>
            {[1, 2, 3, 4, 5].map((key) => (
              <Skeleton key={key} height={70} borderRadius={16} />
            ))}
          </View>
        ) : sortedItems.length === 0 ? (
          <Text style={styles.emptyText}>No se encontraron resultados.</Text>
        ) : (
          <View style={{ gap: 0 }}>
            {sortedItems.map(item => (
              <TaskHabitCard 
                key={item.id}
                item={item}
                onToggle={handleToggle}
                onLongPress={handleLongPress}
              />
            ))}
          </View>
        )}
      </ScrollView>

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

      <CreateTaskModal 
        visible={isModalVisible}
        onClose={() => {
          setIsModalVisible(false);
          setEditingItemDto(null);
        }}
        onAdd={() => {}} // No creating new items here
        onEdit={handleEditItem}
        isLoading={updateMutation.isPending}
        editingItem={editingItemDto}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.obsidian,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderGlow,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontFamily: theme.typography.fontFamilyMedium,
    fontSize: 18,
    color: theme.colors.text,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  filterScroll: {
    gap: 8,
    paddingBottom: 8,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceLight,
    borderWidth: 1,
    borderColor: theme.colors.borderGlow,
  },
  filterPillActive: {
    borderColor: theme.colors.neonCyan,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
  },
  filterPillText: {
    fontFamily: theme.typography.fontMono,
    fontSize: 11,
    color: theme.colors.slate400,
  },
  filterPillTextActive: {
    color: theme.colors.neonCyan,
  },
  emptyText: {
    fontFamily: theme.typography.fontFamily,
    color: theme.colors.slate400,
    textAlign: 'center',
    marginTop: 40,
  },
});
