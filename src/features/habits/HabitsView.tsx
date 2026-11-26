import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../utils/ThemeContext';
import {
  HabitDto,
  HabitService,
  CreateHabitDto,
  UpdateHabitDto,
  getHabitTodayStatus,
} from '../../services/habit.service';
import { queryKeys } from '../../services/queryKeys';
import { HabitCard } from './components/HabitCard';
import { CreateHabitModal } from './components/CreateHabitModal';
import { HabitDetailModal } from './components/HabitDetailModal';
import { Skeleton } from '../../components/Skeleton';
import { useAlertStore } from '../../store/alertStore';
import { Plus, Flame, Sparkles } from 'lucide-react-native';
import { scheduleHabitNotification, cancelHabitNotification } from '../../utils/notifications';

export interface HabitsViewProps {
  isCreateModalOpen?: boolean;
  onCloseCreateModal?: () => void;
}

export const HabitsView: React.FC<HabitsViewProps> = ({
  isCreateModalOpen,
  onCloseCreateModal,
}) => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const alertStore = useAlertStore();

  const [internalCreateModalVisible, setInternalCreateModalVisible] = useState(false);
  const [selectedHabitForDetail, setSelectedHabitForDetail] = useState<HabitDto | null>(null);
  const [editingHabit, setEditingHabit] = useState<HabitDto | null>(null);

  const isModalVisible = isCreateModalOpen ?? internalCreateModalVisible;

  const handleCloseModal = () => {
    setInternalCreateModalVisible(false);
    onCloseCreateModal?.();
    setEditingHabit(null);
  };

  const { data: habits = [], isLoading } = useQuery({
    queryKey: queryKeys.habits.all,
    queryFn: () => HabitService.getAll(false, 42),
  });

  const createMutation = useMutation({
    mutationFn: (newHabit: CreateHabitDto) => HabitService.create(newHabit),
    onSuccess: async (data) => {
      await scheduleHabitNotification(data);
      queryClient.invalidateQueries({ queryKey: queryKeys.habits.all });
      handleCloseModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateHabitDto }) =>
      HabitService.update(id, data),
    onSuccess: async (data) => {
      await scheduleHabitNotification(data);
      queryClient.invalidateQueries({ queryKey: queryKeys.habits.all });
      handleCloseModal();
      if (selectedHabitForDetail) {
        setSelectedHabitForDetail(null);
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => HabitService.delete(id),
    onSuccess: async (_, id) => {
      await cancelHabitNotification({ id });
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

  const handleDecrement = (habit: HabitDto) => {
    if (habit.habitType === 'Quit' || habit.trackingType === 'YesNo') {
      checkInMutation.mutate({ id: habit.id, toggle: true });
    } else {
      const todayStatus = getHabitTodayStatus(habit);
      const current = todayStatus.currentAmount ?? 0;
      const step = 1;
      const nextAmount = Math.max(0, current - step);
      checkInMutation.mutate({ id: habit.id, amount: nextAmount });
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

  const { totalActive, completedTodayCount, bestCurrentStreak } = useMemo(() => {
    const completedToday = habits.filter((h) => getHabitTodayStatus(h).isCompleted).length;
    const maxStreak = habits.length > 0 ? Math.max(...habits.map((h) => h.currentStreak)) : 0;

    return {
      totalActive: habits.length,
      completedTodayCount: completedToday,
      bestCurrentStreak: maxStreak,
    };
  }, [habits]);

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
      </View>

      {/* Habit Cards List */}
      {isLoading ? (
        <View style={{ gap: 12, marginTop: 12 }}>
          <Skeleton height={140} borderRadius={14} />
          <Skeleton height={140} borderRadius={14} />
          <Skeleton height={140} borderRadius={14} />
        </View>
      ) : habits.length === 0 ? (
        <View style={[styles.emptyContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.borderGlow }]}>
          <Sparkles size={36} color={theme.colors.neonCyan} style={{ marginBottom: 12 }} />
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
            Comienza tu Primera Racha
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.colors.mutedText }]}>
            Crea hábitos positivos o rompe vicios con seguimiento visual en cuadrícula diaria estilo HabitKit.
          </Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              setEditingHabit(null);
              setInternalCreateModalVisible(true);
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
        <View style={{ marginTop: 8 }}>
          {habits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              onPressCard={(h) => setSelectedHabitForDetail(h)}
              onQuickCheckIn={handleQuickCheckIn}
              onDecrement={handleDecrement}
              onManualLog={(h) => setSelectedHabitForDetail(h)}
            />
          ))}
          {/* Bottom spacing so the last habit is fully visible and not covered by floating navbar */}
          <View style={{ height: 120 }} />
        </View>
      )}

      {/* Modals */}
      <CreateHabitModal
        visible={isModalVisible}
        onClose={handleCloseModal}
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
          setInternalCreateModalVisible(true);
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
    justifyContent: 'space-around',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  telemetryItem: {
    flex: 1,
    alignItems: 'center',
  },
  telemetryValue: {
    fontSize: 18,
    fontFamily: 'JetBrainsMono-Bold',
    fontWeight: '700',
  },
  telemetryLabel: {
    fontSize: 9,
    fontFamily: 'JetBrainsMono-Bold',
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  streakInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  telemetryDivider: {
    width: 1,
    height: 32,
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
