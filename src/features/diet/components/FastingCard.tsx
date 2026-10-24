import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, Play, Square, Flame, Sparkles } from 'lucide-react-native';
import { useTheme } from '../../../utils/ThemeContext';
import { ThemeColors } from '../../../utils/theme';
import { dietService, FastingStatus } from '../../../services/diet.service';
import { queryKeys } from '../../../services/queryKeys';
import { useAlertStore } from '../../../store/alertStore';
import { Skeleton } from '../../../components/Skeleton';

interface FastingCardProps {
  fastingProtocol?: string;
}

export const FastingCard: React.FC<FastingCardProps> = ({ fastingProtocol = '16:8' }) => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);
  const queryClient = useQueryClient();
  const showAlert = useAlertStore((state) => state.showAlert);

  // Consulta única al montar o al mutar (sin polling periódico)
  const { data: status, isLoading } = useQuery<FastingStatus>({
    queryKey: queryKeys.diet.fasting,
    queryFn: dietService.getFastingStatus,
    staleTime: 1000 * 60 * 60, // 1 hora de frescura en caché
    refetchOnWindowFocus: false,
    refetchInterval: false,
  });

  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!status?.isActive) {
      setRemainingSeconds(0);
      setElapsedSeconds(0);
      return;
    }

    const targetHours = status.targetHours || 16;
    const targetSecs = targetHours * 3600;

    let startMs: number;
    if (status.startTime) {
      startMs = new Date(status.startTime).getTime();
    } else if (typeof status.elapsedSeconds === 'number') {
      startMs = Date.now() - status.elapsedSeconds * 1000;
    } else {
      startMs = Date.now();
    }

    const endMs = startMs + targetSecs * 1000;

    const tick = () => {
      const now = Date.now();
      const rem = Math.max(0, Math.floor((endMs - now) / 1000));
      const elap = Math.max(0, Math.floor((now - startMs) / 1000));
      setRemainingSeconds(rem);
      setElapsedSeconds(elap);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [status?.isActive, status?.startTime, status?.elapsedSeconds, status?.targetHours]);

  const startMutation = useMutation({
    mutationFn: () => dietService.startFasting(16, fastingProtocol),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.diet.fasting });
      showAlert('Ayuno Iniciado', 'Tu temporizador de ayuno está en marcha.', 'success');
    },
    onError: (e: any) => {
      showAlert('Error', e.message || 'No se pudo iniciar el ayuno.', 'error');
    },
  });

  const stopMutation = useMutation({
    mutationFn: dietService.stopFasting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.diet.fasting });
      showAlert('Ayuno Concluido', '¡Excelente trabajo! Has completado tu sesión de ayuno.', 'success');
    },
    onError: (e: any) => {
      showAlert('Error', e.message || 'No se pudo detener el ayuno.', 'error');
    },
  });

  const handleToggle = () => {
    if (status?.isActive) {
      showAlert({
        title: '¿Concluir Ayuno?',
        message: '¿Deseas finalizar tu sesión actual de ayuno intermitente?',
        type: 'info',
        buttons: [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Concluir', style: 'destructive', onPress: () => stopMutation.mutate() },
        ],
      });
    } else {
      startMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <View style={styles.card}>
        <Skeleton width="60%" height={20} style={{ marginBottom: 10 }} />
        <Skeleton width="100%" height={40} style={{ marginBottom: 10 }} />
        <Skeleton width="100%" height={12} />
      </View>
    );
  }

  const isActive = status?.isActive ?? false;
  const targetHours = status?.targetHours || 16;
  const targetSeconds = targetHours * 3600;
  const progressPct = Math.min(100, Math.round((elapsedSeconds / targetSeconds) * 100));

  const formatHMS = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.titleWithIcon}>
          <Clock size={16} color={theme.colors.neonCyan} />
          <Text style={styles.cardTitle}>AYUNO INTERMITENTE ({status?.fastingProtocol || fastingProtocol})</Text>
        </View>

        <View style={[styles.badge, isActive ? styles.badgeActive : styles.badgeInactive]}>
          <Text style={[styles.badgeText, isActive ? styles.badgeTextActive : styles.badgeTextInactive]}>
            {isActive ? 'EN AYUNO' : 'VENTANA ALIMENTACIÓN'}
          </Text>
        </View>
      </View>

      {/* Main Timer Display */}
      <View style={styles.timerRow}>
        <View>
          <Text style={styles.timerLabel}>
            {isActive ? (remainingSeconds === 0 ? 'META LOGRADA' : 'TIEMPO RESTANTE') : 'META DE AYUNO'}
          </Text>
          <Text style={[styles.timerValue, remainingSeconds === 0 && { color: theme.colors.neonCyan }]}>
            {isActive ? formatHMS(remainingSeconds) : `${targetHours} Horas Objetivo`}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.actionBtn, isActive ? styles.actionBtnStop : styles.actionBtnStart]}
          onPress={handleToggle}
          disabled={startMutation.isPending || stopMutation.isPending}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={isActive ? 'Concluir ayuno' : 'Iniciar ayuno'}
        >
          {startMutation.isPending || stopMutation.isPending ? (
            <ActivityIndicator size="small" color={isActive ? theme.colors.text : theme.colors.obsidian} />
          ) : isActive ? (
            <>
              <Square size={13} color={theme.colors.text} />
              <Text style={styles.actionBtnTextStop}>Concluir</Text>
            </>
          ) : (
            <>
              <Play size={13} color={theme.colors.obsidian} fill={theme.colors.obsidian} />
              <Text style={styles.actionBtnTextStart}>Iniciar</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      {isActive && (
        <View style={styles.progressSection}>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressSubText}>{progressPct}% completado</Text>
            <Text style={styles.progressSubText}>
              Transcurrido: {formatHMS(elapsedSeconds)} / {targetHours}h
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      marginBottom: 20,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    titleWithIcon: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    cardTitle: {
      fontFamily: 'JetBrainsMono_600SemiBold',
      fontSize: 11,
      color: colors.neonCyan,
      letterSpacing: 0.8,
    },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      borderWidth: 1,
    },
    badgeActive: {
      backgroundColor: 'rgba(0, 240, 255, 0.12)',
      borderColor: 'rgba(0, 240, 255, 0.3)',
    },
    badgeInactive: {
      backgroundColor: colors.surfaceLight,
      borderColor: colors.borderGlow,
    },
    badgeText: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 9,
      letterSpacing: 0.6,
    },
    badgeTextActive: {
      color: colors.neonCyan,
    },
    badgeTextInactive: {
      color: colors.mutedText,
    },
    timerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 2,
      marginBottom: 10,
    },
    timerLabel: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 10,
      color: colors.mutedText,
      letterSpacing: 0.6,
    },
    timerValue: {
      fontFamily: 'JetBrainsMono_700Bold',
      fontSize: 18,
      color: colors.text,
      marginTop: 2,
    },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 10,
    },
    actionBtnStart: {
      backgroundColor: colors.neonCyan,
    },
    actionBtnStop: {
      backgroundColor: colors.surfaceLight,
      borderWidth: 1,
      borderColor: colors.borderGlow,
    },
    actionBtnTextStart: {
      fontFamily: 'Geist_600SemiBold',
      fontSize: 12,
      color: colors.obsidian,
    },
    actionBtnTextStop: {
      fontFamily: 'Geist_600SemiBold',
      fontSize: 12,
      color: colors.text,
    },
    progressSection: {
      marginTop: 6,
    },
    progressBarBg: {
      height: 6,
      backgroundColor: colors.surfaceLight,
      borderRadius: 3,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: colors.neonCyan,
      borderRadius: 3,
    },
    progressLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 6,
    },
    progressSubText: {
      fontFamily: 'JetBrainsMono_400Regular',
      fontSize: 10,
      color: colors.mutedText,
    },
  });
