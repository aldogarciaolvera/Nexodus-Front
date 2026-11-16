import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { HabitDto } from '../../../services/habit.service';
import { HabitHeatmapGrid } from './HabitHeatmapGrid';
import { useTheme } from '../../../utils/ThemeContext';
import {
  Flame,
  Check,
  Plus,
  AlertTriangle,
  Shield,
  Dumbbell,
  Droplets,
  BookOpen,
  Coffee,
  Heart,
  Sparkles,
  Target,
  Clock,
  Zap,
} from 'lucide-react-native';

interface HabitCardProps {
  habit: HabitDto;
  onPressCard: (habit: HabitDto) => void;
  onQuickCheckIn: (habit: HabitDto) => void;
  onManualLog?: (habit: HabitDto) => void;
}

export const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  onPressCard,
  onQuickCheckIn,
  onManualLog,
}) => {
  const theme = useTheme();
  const habitColor = habit.color || theme.colors.neonCyan;
  const isQuit = habit.habitType === 'Quit';
  const isTodayDone = habit.todayStatus?.isCompleted;

  // Render appropriate icon based on habit icon key
  const renderIcon = () => {
    const iconProps = { size: 18, color: habitColor };
    switch (habit.icon?.toLowerCase()) {
      case 'dumbbell':
      case 'workout':
      case 'fitness':
        return <Dumbbell {...iconProps} />;
      case 'droplets':
      case 'water':
        return <Droplets {...iconProps} />;
      case 'book':
      case 'read':
        return <BookOpen {...iconProps} />;
      case 'coffee':
        return <Coffee {...iconProps} />;
      case 'heart':
      case 'health':
        return <Heart {...iconProps} />;
      case 'shield':
      case 'quit':
        return <Shield {...iconProps} />;
      case 'zap':
        return <Zap {...iconProps} />;
      case 'target':
        return <Target {...iconProps} />;
      default:
        return isQuit ? <Shield {...iconProps} /> : <Sparkles {...iconProps} />;
    }
  };

  const getFrequencyLabel = () => {
    switch (habit.frequencyType) {
      case 'SpecificDays':
        return 'Días selectos';
      case 'TimesPerWeek':
        return `${habit.frequencyTargetCount}x / sem`;
      case 'EveryNDays':
        return `Cada ${habit.everyNDaysInterval} d`;
      case 'Daily':
      default:
        return 'Diario';
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() => onPressCard(habit)}
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.borderGlow,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.iconBox,
              { backgroundColor: habitColor + '20', borderColor: habitColor + '40' },
            ]}
          >
            {renderIcon()}
          </View>
          <View style={styles.titleArea}>
            <View style={styles.titleRow}>
              <Text style={[styles.habitTitle, { color: theme.colors.text }]} numberOfLines={1}>
                {habit.name}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={[styles.metaText, { color: theme.colors.mutedText }]}>
                {getFrequencyLabel().toUpperCase()}
              </Text>
              {habit.trackingType !== 'YesNo' && (
                <Text style={[styles.metaText, { color: theme.colors.mutedText }]}>
                  {' '}• {habit.targetValue} {habit.targetUnit || ''}
                </Text>
              )}
              {isQuit && (
                <Text style={[styles.metaText, { color: theme.colors.warning }]}>
                  {' '}• ROMPER VICIO
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Streak Badge */}
        <View style={[styles.streakBadge, { backgroundColor: theme.colors.surfaceLight, borderColor: theme.colors.borderGlow }]}>
          <Flame size={14} color={habit.currentStreak > 0 ? '#F59E0B' : theme.colors.mutedText} />
          <Text style={[styles.streakText, { color: habit.currentStreak > 0 ? theme.colors.text : theme.colors.mutedText }]}>
            {habit.currentStreak} {habit.streakUnit === 'Weeks' ? 'sem' : 'd'}
          </Text>
        </View>
      </View>

      {/* Heatmap Grid (recent 35-42 days) */}
      <View style={styles.gridWrapper}>
        <HabitHeatmapGrid
          history={habit.recentHistory || []}
          color={habitColor}
          cellSize={13}
          cellGap={3.5}
        />
      </View>

      {/* Footer / Actions */}
      <View style={[styles.cardFooter, { borderTopColor: theme.colors.borderGlow }]}>
        <View style={styles.footerLeft}>
          {isQuit ? (
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isTodayDone ? theme.colors.success : theme.colors.error },
                ]}
              />
              <Text style={[styles.statusLabel, { color: theme.colors.text }]}>
                {isTodayDone ? 'Día limpio 🛡️' : 'Desliz registrado'}
              </Text>
            </View>
          ) : habit.trackingType === 'YesNo' ? (
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isTodayDone ? theme.colors.success : theme.colors.mutedText },
                ]}
              />
              <Text style={[styles.statusLabel, { color: theme.colors.text }]}>
                {isTodayDone ? 'Completado hoy' : 'Pendiente hoy'}
              </Text>
            </View>
          ) : (
            <View style={styles.progressContainer}>
              <Text style={[styles.progressText, { color: theme.colors.text }]}>
                Hoy: {habit.todayStatus?.currentAmount || 0} / {habit.targetValue} {habit.targetUnit || ''}
              </Text>
              <View style={[styles.progressBarTrack, { backgroundColor: theme.colors.surfaceLight }]}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.min(100, habit.todayStatus?.percentage || 0)}%`,
                      backgroundColor: habitColor,
                    },
                  ]}
                />
              </View>
            </View>
          )}
        </View>

        {/* Quick Check-in Button */}
        <View style={styles.actionButtonsRow}>
          {habit.trackingType !== 'YesNo' && onManualLog && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => onManualLog(habit)}
              style={[
                styles.smallActionButton,
                { borderColor: theme.colors.borderGlow, backgroundColor: theme.colors.surfaceLight },
              ]}
            >
              <Clock size={14} color={theme.colors.mutedText} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onQuickCheckIn(habit)}
            style={[
              styles.checkInButton,
              isQuit
                ? {
                    backgroundColor: isTodayDone ? theme.colors.surfaceLight : theme.colors.error + '25',
                    borderColor: isTodayDone ? theme.colors.borderGlow : theme.colors.error,
                  }
                : isTodayDone
                ? { backgroundColor: habitColor, borderColor: habitColor }
                : { backgroundColor: theme.colors.surfaceLight, borderColor: theme.colors.borderGlow },
            ]}
          >
            {isQuit ? (
              <View style={styles.btnInner}>
                <AlertTriangle size={13} color={isTodayDone ? theme.colors.mutedText : theme.colors.error} />
                <Text
                  style={[
                    styles.btnText,
                    { color: isTodayDone ? theme.colors.mutedText : theme.colors.error },
                  ]}
                >
                  {isTodayDone ? 'Desliz' : 'Anular'}
                </Text>
              </View>
            ) : habit.trackingType !== 'YesNo' && habit.onTapAction === 'Increment' && !isTodayDone ? (
              <View style={styles.btnInner}>
                <Plus size={14} color={habitColor} />
                <Text style={[styles.btnText, { color: habitColor }]}>
                  +1
                </Text>
              </View>
            ) : (
              <Check
                size={16}
                color={isTodayDone ? theme.colors.obsidian : theme.colors.mutedText}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  titleArea: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  habitTitle: {
    fontSize: 15,
    fontFamily: 'Geist-Bold',
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  metaText: {
    fontSize: 10,
    fontFamily: 'JetBrainsMono-Bold',
    fontWeight: '700',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  streakText: {
    fontSize: 11,
    fontFamily: 'JetBrainsMono-Bold',
    fontWeight: '700',
  },
  gridWrapper: {
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  footerLeft: {
    flex: 1,
    marginRight: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusLabel: {
    fontSize: 12,
    fontFamily: 'Geist-Regular',
  },
  progressContainer: {
    width: '100%',
  },
  progressText: {
    fontSize: 11,
    fontFamily: 'JetBrainsMono-Regular',
    marginBottom: 4,
  },
  progressBarTrack: {
    height: 4,
    borderRadius: 2,
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  smallActionButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkInButton: {
    minWidth: 40,
    height: 34,
    paddingHorizontal: 10,
    borderRadius: 9,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  btnText: {
    fontSize: 11,
    fontFamily: 'JetBrainsMono-Bold',
    fontWeight: '700',
  },
});
