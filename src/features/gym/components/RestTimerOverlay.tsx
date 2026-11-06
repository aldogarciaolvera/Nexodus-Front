import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Timer, Plus, SkipForward, X } from 'lucide-react-native';
import { useWorkoutStore } from '../../../store/workoutStore';
import { useTheme } from '../../../utils/ThemeContext';
import { ThemeColors } from '../../../utils/theme';

export const RestTimerOverlay = React.memo(() => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);

  const restTimer = useWorkoutStore((state) => state.restTimer);
  const tickRestTimer = useWorkoutStore((state) => state.tickRestTimer);
  const stopRestTimer = useWorkoutStore((state) => state.stopRestTimer);
  const addRestTime = useWorkoutStore((state) => state.addRestTime);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (restTimer.isRunning) {
      interval = setInterval(() => {
        tickRestTimer();
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [restTimer.isRunning, tickRestTimer]);

  if (!restTimer.isRunning || restTimer.remainingSeconds <= 0) {
    return null;
  }

  const mins = Math.floor(restTimer.remainingSeconds / 60);
  const secs = restTimer.remainingSeconds % 60;
  const timeFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  const progress = restTimer.targetSeconds > 0
    ? Math.max(0, Math.min(1, restTimer.remainingSeconds / restTimer.targetSeconds))
    : 0;

  return (
    <View style={styles.container}>
      {/* Track progress bar */}
      <View style={styles.trackBackground}>
        <View style={[styles.trackFill, { width: `${progress * 100}%` }]} />
      </View>

      <View style={styles.content}>
        {/* Timer icon + readout */}
        <View style={styles.timerGroup}>
          <View style={styles.iconCircle}>
            <Timer size={16} color={theme.colors.neonCyan} />
          </View>
          <View>
            <Text style={styles.timerLabel}>DESCANSO</Text>
            <Text style={styles.timerValue}>{timeFormatted}</Text>
          </View>
        </View>

        {/* Quick action controls */}
        <View style={styles.actionsGroup}>
          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.7}
            onPress={() => addRestTime(30)}
          >
            <Plus size={12} color={theme.colors.neonCyan} />
            <Text style={styles.actionBtnText}>30s</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.skipBtn]}
            activeOpacity={0.7}
            onPress={stopRestTimer}
          >
            <SkipForward size={14} color={theme.colors.slate400} />
            <Text style={styles.skipBtnText}>Omitir</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
});

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: 24,
      left: 16,
      right: 16,
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      overflow: 'hidden',
      zIndex: 999,
      elevation: 6,
    },
    trackBackground: {
      width: '100%',
      height: 3,
      backgroundColor: colors.surfaceLight,
    },
    trackFill: {
      height: '100%',
      backgroundColor: colors.neonCyan,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    timerGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    iconCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(56, 189, 248, 0.1)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'rgba(56, 189, 248, 0.3)',
    },
    timerLabel: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 9,
      color: colors.slate400,
      letterSpacing: 0.5,
    },
    timerValue: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 18,
      color: colors.neonCyan,
      fontWeight: '700',
    },
    actionsGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.surfaceLight,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.borderGlow,
    },
    actionBtnText: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 12,
      color: colors.neonCyan,
    },
    skipBtn: {
      borderColor: 'transparent',
    },
    skipBtnText: {
      fontFamily: 'Geist_400Regular',
      fontSize: 12,
      color: colors.slate400,
    },
  });

