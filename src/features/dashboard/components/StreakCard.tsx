import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../utils/ThemeContext';
import { ThemeColors } from '../../../utils/theme';
import { Flame, Shield, ShieldAlert, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { gamificationService } from '../../../services/gamification.service';
import { queryKeys } from '../../../services/queryKeys';
import { StreakRestoreModal } from './StreakRestoreModal';
import { Skeleton } from '../../../components/Skeleton';

const DAYS_OF_WEEK = [
  { key: 'Monday', label: 'L' },
  { key: 'Tuesday', label: 'M' },
  { key: 'Wednesday', label: 'X' },
  { key: 'Thursday', label: 'J' },
  { key: 'Friday', label: 'V' },
  { key: 'Saturday', label: 'S' },
  { key: 'Sunday', label: 'D' },
];

export const StreakCard: React.FC = () => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);
  const queryClient = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);

  const { data: status, isLoading } = useQuery({
    queryKey: queryKeys.gamification.status,
    queryFn: gamificationService.getStatus,
    staleTime: 60 * 1000,
  });

  if (isLoading) {
    return (
      <View style={styles.card}>
        <Skeleton width="40%" height={24} style={{ marginBottom: 12 }} />
        <Skeleton width="100%" height={60} borderRadius={6} />
      </View>
    );
  }

  if (!status) return null;

  const todayIndex = (new Date().getDay() + 6) % 7; // 0 = Monday, 6 = Sunday

  return (
    <View style={styles.card}>
      {/* Top Row: Flame + Streak Count + Status */}
      <View style={styles.topRow}>
        <View style={styles.streakLeft}>
          <View
            style={[
              styles.flameContainer,
              status.isGracePeriodActive && styles.flameContainerWarning,
            ]}
          >
            <Flame
              size={24}
              color={status.isGracePeriodActive ? '#F59E0B' : '#00F0FF'}
            />
          </View>
          <View>
            <View style={styles.streakNumberRow}>
              <Text style={styles.streakCount}>{status.currentStreak}</Text>
              <Text style={styles.streakUnit}>DÍAS</Text>
            </View>
            <Text style={styles.streakSub}>RÉCORD: {status.highestStreak} DÍAS</Text>
          </View>
        </View>

        {/* Status Badge */}
        <View style={styles.streakRight}>
          {status.isGracePeriodActive ? (
            <View style={[styles.statusBadge, styles.statusBadgeWarning]}>
              <AlertCircle size={12} color="#F59E0B" />
              <Text style={styles.statusBadgeWarningText}>EN GRACIA</Text>
            </View>
          ) : status.isRestDayToday ? (
            <View style={[styles.statusBadge, styles.statusBadgeRest]}>
              <Shield size={12} color="#38BDF8" />
              <Text style={styles.statusBadgeRestText}>DESCANSO</Text>
            </View>
          ) : status.isActiveToday ? (
            <View style={[styles.statusBadge, styles.statusBadgeActive]}>
              <CheckCircle2 size={12} color="#00F0FF" />
              <Text style={styles.statusBadgeActiveText}>CUMPLIDO</Text>
            </View>
          ) : (
            <View style={[styles.statusBadge, styles.statusBadgePending]}>
              <Text style={styles.statusBadgePendingText}>PENDIENTE</Text>
            </View>
          )}

          {/* Shields Count */}
          <View style={styles.shieldRow}>
            <Shield size={12} color="#00F0FF" />
            <Text style={styles.shieldCountText}>
              {status.streakFreezesAvailable} Escudos
            </Text>
          </View>
        </View>
      </View>

      {/* Grace Alert Banner */}
      {status.isGracePeriodActive && (
        <TouchableOpacity
          style={styles.graceAlertBanner}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <AlertCircle size={14} color="#F59E0B" />
          <Text style={styles.graceAlertText}>
            ¡Ventana de gracia activa! Toca para proteger tu racha.
          </Text>
          <RefreshCw size={12} color="#F59E0B" />
        </TouchableOpacity>
      )}

      {/* Weekly Matrix (7 capsules) */}
      <View style={styles.matrixContainer}>
        {DAYS_OF_WEEK.map((day, idx) => {
          const isToday = idx === todayIndex;
          const isPast = idx < todayIndex;
          const isRest = status.scheduledRestDays.includes(day.key);
          const isCompleted = isPast && status.currentStreak > 0;

          return (
            <View
              key={day.key}
              style={[
                styles.dayCapsule,
                isToday && styles.dayCapsuleToday,
                isCompleted && styles.dayCapsuleCompleted,
                isRest && !isCompleted && styles.dayCapsuleRest,
              ]}
            >
              <Text
                style={[
                  styles.dayLabel,
                  isToday && styles.dayLabelToday,
                  isCompleted && styles.dayLabelCompleted,
                ]}
              >
                {day.label}
              </Text>
              {isCompleted ? (
                <CheckCircle2 size={10} color="#00F0FF" />
              ) : isRest ? (
                <Shield size={10} color="#38BDF8" />
              ) : (
                <View style={styles.emptyDot} />
              )}
            </View>
          );
        })}
      </View>

      {/* Modal for restoring streak */}
      <StreakRestoreModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        currentStreak={status.currentStreak}
        highestStreak={status.highestStreak}
        cyphers={status.cyphers}
        freezesAvailable={status.streakFreezesAvailable}
        onRestored={() => {
          queryClient.invalidateQueries({ queryKey: queryKeys.gamification.status });
        }}
      />
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  card: {
    backgroundColor: '#14171F',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#222836',
    padding: 16,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  streakLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flameContainer: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderWidth: 1,
    borderColor: '#00F0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flameContainerWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: '#F59E0B',
  },
  streakNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  streakCount: {
    fontFamily: 'JetBrains Mono',
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  streakUnit: {
    fontFamily: 'JetBrains Mono',
    fontSize: 10,
    fontWeight: '700',
    color: '#00F0FF',
    letterSpacing: 1,
  },
  streakSub: {
    fontFamily: 'JetBrains Mono',
    fontSize: 10,
    color: colors.mutedText,
    marginTop: 2,
  },
  streakRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
    borderWidth: 1,
  },
  statusBadgeActive: {
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderColor: '#00F0FF',
  },
  statusBadgeActiveText: {
    fontFamily: 'JetBrains Mono',
    fontSize: 9,
    fontWeight: '700',
    color: '#00F0FF',
  },
  statusBadgeRest: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderColor: '#38BDF8',
  },
  statusBadgeRestText: {
    fontFamily: 'JetBrains Mono',
    fontSize: 9,
    fontWeight: '700',
    color: '#38BDF8',
  },
  statusBadgeWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: '#F59E0B',
  },
  statusBadgeWarningText: {
    fontFamily: 'JetBrains Mono',
    fontSize: 9,
    fontWeight: '700',
    color: '#F59E0B',
  },
  statusBadgePending: {
    backgroundColor: '#0B0D11',
    borderColor: '#222836',
  },
  statusBadgePendingText: {
    fontFamily: 'JetBrains Mono',
    fontSize: 9,
    color: colors.mutedText,
  },
  shieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  shieldCountText: {
    fontFamily: 'JetBrains Mono',
    fontSize: 10,
    color: colors.mutedText,
  },
  graceAlertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  graceAlertText: {
    fontFamily: 'Geist',
    fontSize: 11,
    color: '#F59E0B',
    flex: 1,
    marginHorizontal: 6,
  },
  matrixContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#222836',
  },
  dayCapsule: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    marginHorizontal: 2,
    backgroundColor: '#0B0D11',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#222836',
    gap: 4,
  },
  dayCapsuleToday: {
    borderColor: '#00F0FF',
    borderStyle: 'dashed',
  },
  dayCapsuleCompleted: {
    borderColor: '#00F0FF',
    backgroundColor: 'rgba(0, 240, 255, 0.05)',
  },
  dayCapsuleRest: {
    backgroundColor: '#181C26',
    borderColor: '#38BDF8',
  },
  dayLabel: {
    fontFamily: 'JetBrains Mono',
    fontSize: 10,
    color: colors.mutedText,
    fontWeight: '600',
  },
  dayLabelToday: {
    color: '#00F0FF',
    fontWeight: '700',
  },
  dayLabelCompleted: {
    color: '#00F0FF',
  },
  emptyDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#222836',
  },
});
