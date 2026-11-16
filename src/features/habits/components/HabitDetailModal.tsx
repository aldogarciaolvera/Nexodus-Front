import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../../utils/ThemeContext';
import {
  HabitDto,
  HabitService,
  HabitDayCellDto,
} from '../../../services/habit.service';
import { queryKeys } from '../../../services/queryKeys';
import { HabitHeatmapGrid } from './HabitHeatmapGrid';
import {
  X,
  Flame,
  Trophy,
  Percent,
  Calendar,
  Trash2,
  Edit2,
  Check,
  AlertTriangle,
} from 'lucide-react-native';

interface HabitDetailModalProps {
  habit: HabitDto | null;
  visible: boolean;
  onClose: () => void;
  onEdit: (habit: HabitDto) => void;
  onDelete: (id: string) => void;
}

export const HabitDetailModal: React.FC<HabitDetailModalProps> = ({
  habit,
  visible,
  onClose,
  onEdit,
  onDelete,
}) => {
  const theme = useTheme();
  const queryClient = useQueryClient();

  const [selectedCell, setSelectedCell] = useState<HabitDayCellDto | null>(null);
  const [dayNote, setDayNote] = useState('');
  const [dayAmount, setDayAmount] = useState('');

  const habitId = habit?.id;
  const habitColor = habit?.color || theme.colors.neonCyan;
  const isQuit = habit?.habitType === 'Quit';

  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: queryKeys.habits.stats(habitId),
    queryFn: () => HabitService.getStats(habitId!),
    enabled: !!habitId && visible,
  });

  const checkInMutation = useMutation({
    mutationFn: (variables: { date: string; amount?: number; note?: string; toggle?: boolean; status?: string }) =>
      HabitService.checkIn(habitId!, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.habits.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.habits.stats(habitId) });
      setSelectedCell(null);
    },
  });

  if (!habit) return null;

  const handleCellPress = (cell: HabitDayCellDto) => {
    setSelectedCell(cell);
    setDayNote(cell.note || '');
    setDayAmount(cell.amount ? cell.amount.toString() : '');
  };

  const handleSaveDayLog = () => {
    if (!selectedCell) return;
    checkInMutation.mutate({
      date: selectedCell.date,
      amount: parseFloat(dayAmount) || undefined,
      note: dayNote.trim() || undefined,
      status: isQuit && selectedCell.status === 'Slip' ? 'Slip' : undefined,
    });
  };

  const handleToggleDay = () => {
    if (!selectedCell) return;
    checkInMutation.mutate({
      date: selectedCell.date,
      toggle: true,
      note: dayNote.trim() || undefined,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.colors.surface, borderColor: theme.colors.borderGlow }]}>
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: theme.colors.borderGlow }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.colorIndicator, { backgroundColor: habitColor }]} />
              <View>
                <Text style={[styles.habitTitle, { color: theme.colors.text }]}>
                  {habit.name}
                </Text>
                <Text style={[styles.categorySubtitle, { color: theme.colors.mutedText }]}>
                  {habit.category.toUpperCase()} • {habit.habitType === 'Quit' ? 'ROMPER VICIO' : 'CONSTRUIR'}
                </Text>
              </View>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={() => {
                  onClose();
                  onEdit(habit);
                }}
                style={[styles.actionIconBtn, { backgroundColor: theme.colors.surfaceLight }]}
              >
                <Edit2 size={16} color={theme.colors.text} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => onDelete(habit.id)}
                style={[styles.actionIconBtn, { backgroundColor: theme.colors.error + '20' }]}
              >
                <Trash2 size={16} color={theme.colors.error} />
              </TouchableOpacity>

              <TouchableOpacity onPress={onClose} style={[styles.actionIconBtn, { backgroundColor: theme.colors.surfaceLight }]}>
                <X size={18} color={theme.colors.mutedText} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Stats Summary Cards */}
            <View style={styles.statsRow}>
              <View style={[styles.statCard, { backgroundColor: theme.colors.surfaceLight, borderColor: theme.colors.borderGlow }]}>
                <Flame size={18} color="#F59E0B" />
                <Text style={[styles.statValue, { color: theme.colors.text }]}>
                  {stats?.currentStreak ?? habit.currentStreak}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.mutedText }]}>
                  Racha Actual
                </Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: theme.colors.surfaceLight, borderColor: theme.colors.borderGlow }]}>
                <Trophy size={18} color={theme.colors.neonCyan} />
                <Text style={[styles.statValue, { color: theme.colors.text }]}>
                  {stats?.bestStreak ?? habit.bestStreak}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.mutedText }]}>
                  Mejor Racha
                </Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: theme.colors.surfaceLight, borderColor: theme.colors.borderGlow }]}>
                <Percent size={18} color="#10B981" />
                <Text style={[styles.statValue, { color: theme.colors.text }]}>
                  {stats ? `${stats.consistencyRate}%` : '--'}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.mutedText }]}>
                  Constancia
                </Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: theme.colors.surfaceLight, borderColor: theme.colors.borderGlow }]}>
                <Calendar size={18} color="#8B5CF6" />
                <Text style={[styles.statValue, { color: theme.colors.text }]}>
                  {stats?.totalCompletions ?? '--'}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.mutedText }]}>
                  {isQuit ? 'Días Limpios' : 'Completados'}
                </Text>
              </View>
            </View>

            {/* Annual Heatmap (365 Days) */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  Historial Anual (52 Semanas)
                </Text>
                <Text style={[styles.sectionHint, { color: theme.colors.mutedText }]}>
                  Toca un día para ver o editar
                </Text>
              </View>

              {isLoadingStats ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="small" color={habitColor} />
                </View>
              ) : (
                <View style={[styles.calendarCard, { backgroundColor: theme.colors.surfaceLight, borderColor: theme.colors.borderGlow }]}>
                  <HabitHeatmapGrid
                    history={stats?.fullYearHistory || habit.recentHistory || []}
                    color={habitColor}
                    cellSize={14}
                    cellGap={3.5}
                    scrollable={true}
                    showDayLabels={true}
                    onPressCell={handleCellPress}
                  />

                  {/* Heatmap Legend */}
                  <View style={styles.legendRow}>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendBox, { backgroundColor: theme.colors.surface, borderColor: theme.colors.borderGlow, borderWidth: 1 }]} />
                      <Text style={[styles.legendText, { color: theme.colors.mutedText }]}>Vacío</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendBox, { backgroundColor: theme.colors.surfaceLight }]} />
                      <Text style={[styles.legendText, { color: theme.colors.mutedText }]}>Libre</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendBox, { backgroundColor: habitColor, opacity: 0.5 }]} />
                      <Text style={[styles.legendText, { color: theme.colors.mutedText }]}>Parcial</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendBox, { backgroundColor: habitColor }]} />
                      <Text style={[styles.legendText, { color: theme.colors.mutedText }]}>Cumplido</Text>
                    </View>
                    {isQuit && (
                      <View style={styles.legendItem}>
                        <View style={[styles.legendBox, { backgroundColor: theme.colors.error }]} />
                        <Text style={[styles.legendText, { color: theme.colors.mutedText }]}>Desliz</Text>
                      </View>
                    )}
                  </View>
                </View>
              )}
            </View>

            {/* Selected Day Inspector */}
            {selectedCell && (
              <View style={[styles.inspectorCard, { backgroundColor: theme.colors.surfaceLight, borderColor: habitColor }]}>
                <View style={styles.inspectorHeader}>
                  <Text style={[styles.inspectorDate, { color: theme.colors.text }]}>
                    Día: {selectedCell.date} {selectedCell.isToday ? '(HOY)' : ''}
                  </Text>
                  <TouchableOpacity onPress={() => setSelectedCell(null)}>
                    <X size={16} color={theme.colors.mutedText} />
                  </TouchableOpacity>
                </View>

                <View style={styles.inspectorContent}>
                  <Text style={[styles.inspectorStatus, { color: selectedCell.status === 'Done' ? '#10B981' : selectedCell.status === 'Slip' ? theme.colors.error : theme.colors.mutedText }]}>
                    Estado: {selectedCell.status === 'Done' ? 'Completado' : selectedCell.status === 'Slip' ? 'Desliz' : selectedCell.status === 'Free' ? 'Día Libre' : 'No completado'}
                  </Text>

                  {habit.trackingType !== 'YesNo' && (
                    <View style={styles.inspectorInputRow}>
                      <Text style={[styles.inputLabel, { color: theme.colors.mutedText }]}>Cantidad:</Text>
                      <TextInput
                        style={[styles.smallInput, { backgroundColor: theme.colors.surface, borderColor: theme.colors.borderGlow, color: theme.colors.text }]}
                        keyboardType="numeric"
                        value={dayAmount}
                        onChangeText={setDayAmount}
                        placeholder={`Meta: ${habit.targetValue}`}
                        placeholderTextColor={theme.colors.mutedText}
                      />
                    </View>
                  )}

                  <TextInput
                    style={[styles.noteInput, { backgroundColor: theme.colors.surface, borderColor: theme.colors.borderGlow, color: theme.colors.text }]}
                    placeholder="Escribe una nota o reflexión sobre este día..."
                    placeholderTextColor={theme.colors.mutedText}
                    value={dayNote}
                    onChangeText={setDayNote}
                    multiline
                  />

                  <View style={styles.inspectorActions}>
                    <TouchableOpacity
                      onPress={handleToggleDay}
                      style={[styles.toggleBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.borderGlow }]}
                    >
                      {isQuit ? (
                        <>
                          <AlertTriangle size={14} color={theme.colors.error} />
                          <Text style={[styles.btnText, { color: theme.colors.error }]}>
                            {selectedCell.status === 'Slip' ? 'Quitar Desliz' : 'Marcar Desliz'}
                          </Text>
                        </>
                      ) : (
                        <>
                          <Check size={14} color={selectedCell.status === 'Done' ? theme.colors.mutedText : habitColor} />
                          <Text style={[styles.btnText, { color: selectedCell.status === 'Done' ? theme.colors.mutedText : habitColor }]}>
                            {selectedCell.status === 'Done' ? 'Desmarcar' : 'Completar Día'}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleSaveDayLog}
                      style={[styles.saveDayBtn, { backgroundColor: habitColor }]}
                    >
                      <Text style={[styles.saveDayText, { color: theme.colors.obsidian }]}>
                        Guardar Nota / Log
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* Weekly Volume Trends */}
            {stats && stats.weeklyTrends && stats.weeklyTrends.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  Tendencia Semanal (Últimas 12 Semanas)
                </Text>
                <View style={[styles.trendsCard, { backgroundColor: theme.colors.surfaceLight, borderColor: theme.colors.borderGlow }]}>
                  <View style={styles.barsContainer}>
                    {stats.weeklyTrends.map((w, idx) => (
                      <View key={idx} style={styles.barColumn}>
                        <View style={[styles.barTrack, { backgroundColor: theme.colors.surface }]}>
                          <View
                            style={[
                              styles.barFill,
                              {
                                height: `${Math.min(100, w.rate)}%`,
                                backgroundColor: habitColor,
                              },
                            ]}
                          />
                        </View>
                        <Text style={[styles.barLabel, { color: theme.colors.mutedText }]}>
                          {w.weekLabel}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    maxHeight: '92%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorIndicator: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 10,
  },
  habitTitle: {
    fontSize: 18,
    fontFamily: 'Geist-Bold',
    fontWeight: '700',
  },
  categorySubtitle: {
    fontSize: 10,
    fontFamily: 'JetBrainsMono-Bold',
    fontWeight: '700',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollBody: {
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontFamily: 'JetBrainsMono-Bold',
    fontWeight: '700',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 9,
    fontFamily: 'Geist-Medium',
    marginTop: 2,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Geist-Bold',
    fontWeight: '700',
  },
  sectionHint: {
    fontSize: 11,
    fontFamily: 'Geist-Regular',
  },
  loadingBox: {
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 14,
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#222836',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendBox: {
    width: 10,
    height: 10,
    borderRadius: 2.5,
  },
  legendText: {
    fontSize: 10,
    fontFamily: 'Geist-Regular',
  },
  inspectorCard: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 20,
  },
  inspectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inspectorDate: {
    fontSize: 13,
    fontFamily: 'JetBrainsMono-Bold',
    fontWeight: '700',
  },
  inspectorContent: {
    gap: 8,
  },
  inspectorStatus: {
    fontSize: 12,
    fontFamily: 'Geist-Medium',
  },
  inspectorInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: 'Geist-Regular',
  },
  smallInput: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    fontFamily: 'JetBrainsMono-Regular',
  },
  noteInput: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    fontSize: 12,
    fontFamily: 'Geist-Regular',
    minHeight: 50,
  },
  inspectorActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 6,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  btnText: {
    fontSize: 11,
    fontFamily: 'Geist-Bold',
    fontWeight: '700',
  },
  saveDayBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: 'center',
  },
  saveDayText: {
    fontSize: 11,
    fontFamily: 'Geist-Bold',
    fontWeight: '700',
  },
  trendsCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 100,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
  },
  barTrack: {
    flex: 1,
    width: 8,
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 8,
    fontFamily: 'JetBrainsMono-Regular',
    marginTop: 6,
  },
});
