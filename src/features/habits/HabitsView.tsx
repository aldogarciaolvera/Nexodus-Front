import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../utils/ThemeContext';
import {
  HabitDto,
  HabitService,
  CreateHabitDto,
  UpdateHabitDto,
} from '../../services/habit.service';
import { queryKeys } from '../../services/queryKeys';
import { HabitCard } from './components/HabitCard';
import { CreateHabitModal } from './components/CreateHabitModal';
import { HabitDetailModal } from './components/HabitDetailModal';
import { Skeleton } from '../../components/Skeleton';
import { useAlertStore } from '../../store/alertStore';
import { Plus, Flame, CheckCircle2, Shield, Sparkles } from 'lucide-react-native';

const CATEGORY_FILTERS = [
  { id: 'all', label: 'TODOS' },
  { id: 'build', label: 'CONSTRUIR' },
  { id: 'quit', label: 'ROMPER VICIOS' },
  { id: 'fitness', label: 'FITNESS' },
  { id: 'salud', label: 'SALUD' },
  { id: 'mente', label: 'MENTE' },
];

export const HabitsView: React.FC = () => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const alertStore = useAlertStore();

  const [filter, setFilter] = useState('all');
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [selectedHabitForDetail, setSelectedHabitForDetail] = useState<HabitDto | null>(null);
  const [editingHabit, setEditingHabit] = useState<HabitDto | null>(null);

  const { data: habits = [], isLoading } = useQuery({
    queryKey: queryKeys.habits.all,
    queryFn: () => HabitService.getAll(false, 42),
  });

  const createMutation = useMutation({
    mutationFn: (newHabit: CreateHabitDto) => HabitService.create(newHabit),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.habits.all });
      setIsCreateModalVisible(false);
      setEditingHabit(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateHabitDto }) =>
      HabitService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.habits.all });
      setIsCreateModalVisible(false);
      setEditingHabit(null);
      if (selectedHabitForDetail) {
        setSelectedHabitForDetail(null);
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => HabitService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.habits.all });
      setSelectedHabitForDetail(null);
    },
  });

  const checkInMutation = useMutation({
    mutationFn: ({ id, toggle, amount }: { id: string; toggle?: boolean; amount?: number }) =>
      HabitService.checkIn(id, { toggle, amount }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.habits.all });
    },
  });

  const handleQuickCheckIn = (habit: HabitDto) => {
    if (habit.habitType === 'Quit') {
      checkInMutation.mutate({ id: habit.id, toggle: true });
    } else if (habit.trackingType === 'YesNo') {
      checkInMutation.mutate({ id: habit.id, toggle: true });
    } else {
      // Increment
      checkInMutation.mutate({ id: habit.id, amount: undefined });
    }
  };

  const handleDeleteHabit = (id: string) => {
    alertStore.showAlert({
      title: 'Eliminar Hábito',
      message: '¿Estás seguro de que deseas eliminar este hábito y todo su historial de cuadrícula permanentemente?',
      type: 'error',
      buttons: [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(id),
        },
      ],
    });
  };

  const { filteredHabits, totalActive, completedTodayCount, bestCurrentStreak } = useMemo(() => {
    let list = habits;
    if (filter === 'build') list = habits.filter((h) => h.habitType === 'Build');
    else if (filter === 'quit') list = habits.filter((h) => h.habitType === 'Quit');
    else if (filter === 'fitness') list = habits.filter((h) => h.category.toLowerCase() === 'fitness');
    else if (filter === 'salud') list = habits.filter((h) => h.category.toLowerCase() === 'salud');
    else if (filter === 'mente') list = habits.filter((h) => h.category.toLowerCase() === 'mente');

    const completedToday = habits.filter((h) => h.todayStatus?.isCompleted).length;
    const maxStreak = habits.length > 0 ? Math.max(...habits.map((h) => h.currentStreak)) : 0;

    return {
      filteredHabits: list,
      totalActive: habits.length,
      completedTodayCount: completedToday,
      bestCurrentStreak: maxStreak,
    };
  }, [habits, filter]);

  return (
    <View style={styles.container}>
      {/* Telemetry Summary */}
      <View style={[styles.telemetryCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.borderGlow }]}>
        <View style={styles.telemetryItem}>
          <Text style={[styles.telemetryValue, { color: theme.colors.neonCyan }]}>
            {completedTodayCount} / {totalActive}
          </Text>
          <Text style={[styles.telemetryLabel, { color: theme.colors.mutedText }]}>
            HOY COMPLETADOS
          </Text>
        </View>

        <View style={[styles.telemetryDivider, { backgroundColor: theme.colors.borderGlow }]} />

        <View style={styles.telemetryItem}>
          <View style={styles.streakInline}>
            <Flame size={16} color="#F59E0B" />
            <Text style={[styles.telemetryValue, { color: '#F59E0B' }]}>
              {bestCurrentStreak} d
            </Text>
          </View>
          <Text style={[styles.telemetryLabel, { color: theme.colors.mutedText }]}>
            MEJOR RACHA
          </Text>
        </View>

        <View style={[styles.telemetryDivider, { backgroundColor: theme.colors.borderGlow }]} />

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            setEditingHabit(null);
            setIsCreateModalVisible(true);
          }}
          style={[styles.addBtnSmall, { backgroundColor: theme.colors.neonCyan }]}
        >
          <Plus size={16} color={theme.colors.obsidian} />
          <Text style={[styles.addBtnText, { color: theme.colors.obsidian }]}>
            HÁBITO
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter Pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {CATEGORY_FILTERS.map((f) => {
          const isSelected = filter === f.id;
          return (
            <TouchableOpacity
              key={f.id}
              onPress={() => setFilter(f.id)}
              style={[
                styles.filterPill,
                isSelected
                  ? { backgroundColor: theme.colors.neonCyan + '20', borderColor: theme.colors.neonCyan }
                  : { backgroundColor: theme.colors.surface, borderColor: theme.colors.borderGlow },
              ]}
            >
              <Text
                style={[
                  styles.filterPillText,
                  { color: isSelected ? theme.colors.neonCyan : theme.colors.mutedText },
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Habit Cards List */}
      {isLoading ? (
        <View style={{ gap: 12, marginTop: 12 }}>
          <Skeleton height={140} borderRadius={14} />
          <Skeleton height={140} borderRadius={14} />
          <Skeleton height={140} borderRadius={14} />
        </View>
      ) : filteredHabits.length === 0 ? (
        <View style={[styles.emptyContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.borderGlow }]}>
          <Sparkles size={36} color={theme.colors.neonCyan} style={{ marginBottom: 12 }} />
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
            {habits.length === 0 ? 'Comienza tu Primera Racha' : 'No hay hábitos en este filtro'}
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.colors.mutedText }]}>
            {habits.length === 0
              ? 'Crea hábitos positivos o rompe vicios con seguimiento visual en cuadrícula diaria estilo HabitKit.'
              : 'Selecciona otro filtro o crea un nuevo hábito para esta categoría.'}
          </Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              setEditingHabit(null);
              setIsCreateModalVisible(true);
            }}
            style={[styles.createFirstBtn, { backgroundColor: theme.colors.neonCyan }]}
          >
            <Plus size={16} color={theme.colors.obsidian} />
            <Text style={[styles.createFirstBtnText, { color: theme.colors.obsidian }]}>
              Crear Nuevo Hábito
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ marginTop: 12 }}>
          {filteredHabits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              onPressCard={(h) => setSelectedHabitForDetail(h)}
              onQuickCheckIn={handleQuickCheckIn}
              onManualLog={(h) => setSelectedHabitForDetail(h)}
            />
          ))}
        </View>
      )}

      {/* Modals */}
      <CreateHabitModal
        visible={isCreateModalVisible}
        onClose={() => {
          setIsCreateModalVisible(false);
          setEditingHabit(null);
        }}
        onSubmit={(data) => createMutation.mutate(data)}
        onUpdate={(id, data) => updateMutation.mutate({ id, data })}
        initialHabit={editingHabit}
      />

      <HabitDetailModal
        habit={selectedHabitForDetail}
        visible={!!selectedHabitForDetail}
        onClose={() => setSelectedHabitForDetail(null)}
        onEdit={(h) => {
          setEditingHabit(h);
          setIsCreateModalVisible(true);
        }}
        onDelete={handleDeleteHabit}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  telemetryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  telemetryItem: {
    flex: 1,
    alignItems: 'center',
  },
  telemetryValue: {
    fontSize: 16,
    fontFamily: 'JetBrainsMono-Bold',
    fontWeight: '700',
  },
  telemetryLabel: {
    fontSize: 9,
    fontFamily: 'JetBrainsMono-Bold',
    fontWeight: '700',
    marginTop: 2,
  },
  streakInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  telemetryDivider: {
    width: 1,
    height: 30,
  },
  addBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 9,
  },
  addBtnText: {
    fontSize: 11,
    fontFamily: 'JetBrainsMono-Bold',
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  filterPillText: {
    fontSize: 10,
    fontFamily: 'JetBrainsMono-Bold',
    fontWeight: '700',
  },
  emptyContainer: {
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: 'Geist-Bold',
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 12,
    fontFamily: 'Geist-Regular',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  createFirstBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  createFirstBtnText: {
    fontSize: 13,
    fontFamily: 'Geist-Bold',
    fontWeight: '700',
  },
});
