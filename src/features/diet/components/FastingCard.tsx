import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, Play, Square } from 'lucide-react-native';
import { useTheme } from '../../../utils/ThemeContext';
import { ThemeColors } from '../../../utils/theme';
import { dietService, FastingStatus } from '../../../services/diet.service';
import { queryKeys } from '../../../services/queryKeys';
import { useAlertStore } from '../../../store/alertStore';
import { useDietStore } from '../../../store/dietStore';
import { Skeleton } from '../../../components/Skeleton';

interface FastingCardProps {
  fastingProtocol?: string;
}

export const FastingCard: React.FC<FastingCardProps> = ({ fastingProtocol = '16:8' }) => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);
  const queryClient = useQueryClient();
  const showAlert = useAlertStore((state) => state.showAlert);

  const fastingState = useDietStore((state) => state.fastingState);
  const storeStartFasting = useDietStore((state) => state.startFasting);
  const storeStopFasting = useDietStore((state) => state.stopFasting);

  // Consulta de estado en backend
  const { data: status, isLoading } = useQuery<FastingStatus>({
    queryKey: queryKeys.diet.fasting,
    queryFn: dietService.getFastingStatus,
    staleTime: 1000 * 60 * 5, // 5 minutos de frescura
    refetchOnWindowFocus: false,
    refetchInterval: false,
  });

  const parseTargetHours = (protocol?: string): number => {
    if (!protocol) return 16;
    if (protocol.includes('18')) return 18;
    if (protocol.includes('20')) return 20;
    if (protocol.includes('16')) return 16;
    const match = protocol.match(/^(\d+)/);
    if (match) return parseInt(match[1], 10);
    return 16;
  };

  const effectiveProtocol = status?.fastingProtocol || fastingProtocol || '16:8';
  const defaultHours = parseTargetHours(effectiveProtocol);
  const targetHours = status?.targetHours || fastingState?.targetHours || defaultHours;

  const isActive = Boolean(status?.isActive || fastingState?.isFasting);
  const startTimeStr = (status?.isActive && status?.startTime)
    ? status.startTime
    : (fastingState?.isFasting && fastingState?.startTime)
      ? fastingState.startTime
      : null;

  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!isActive || !startTimeStr) {
      setRemainingSeconds(0);
      setElapsedSeconds(0);
      return;
    }

    const targetSecs = targetHours * 3600;
    const startMs = new Date(startTimeStr).getTime();
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
  }, [isActive, startTimeStr, targetHours]);

  const startMutation = useMutation({
    mutationFn: async () => {
      // 1. Guardar de inmediato localmente para reactividad instantánea
      await storeStartFasting(targetHours);
      // 2. Sincronizar con el backend
      try {
        const res = await dietService.startFasting(targetHours, effectiveProtocol);
        return res;
      } catch (err) {
        console.warn('Backend start fasting fallback to local store:', err);
        return {
          isActive: true,
          startTime: new Date().toISOString(),
          targetHours,
          fastingProtocol: effectiveProtocol,
        };
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.diet.fasting, data);
      queryClient.invalidateQueries({ queryKey: queryKeys.diet.fasting });
      showAlert('Ayuno Iniciado', 'Tu temporizador de ayuno está en marcha.', 'success');
    },
    onError: (e: any) => {
      showAlert('Error', e.message || 'No se pudo iniciar el ayuno.', 'error');
    },
  });

  const stopMutation = useMutation({
    mutationFn: async () => {
      // 1. Concluir de inmediato localmente
      await storeStopFasting();
      // 2. Sincronizar con el backend
      try {
        const res = await dietService.stopFasting();
        return res;
      } catch (err) {
        console.warn('Backend stop fasting fallback to local store:', err);
        return {
          isActive: false,
        };
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.diet.fasting, data);
      queryClient.invalidateQueries({ queryKey: queryKeys.diet.fasting });
      showAlert('Ayuno Concluido', '¡Excelente trabajo! Has completado tu sesión de ayuno.', 'success');
    },
    onError: (e: any) => {
      showAlert('Error', e.message || 'No se pudo detener el ayuno.', 'error');
    },
  });

  const handleToggle = () => {
    if (isActive) {
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

  if (isLoading && !fastingState.isFasting) {
    return (
      <View style={styles.card}>
        <Skeleton width="60%" height={20} style={{ marginBottom: 10 }} />
        <Skeleton width="100%" height={40} style={{ marginBottom: 10 }} />
        <Skeleton width="100%" height={12} />
      </View>
    );
  }

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
          <Text style={styles.cardTitle}>AYUNO INTERMITENTE</Text>
        </View>
      </View>

      {/* Main Timer Display */}
      <View style={styles.timerRow}>
        <View>
          <Text style={styles.timerLabel}>
            {isActive ? (remainingSeconds === 0 ? 'META LOGRADA' : 'TIEMPO RESTANTE') : 'META DE AYUNO'}
          </Text>
          <Text style={[styles.timerValue, isActive && remainingSeconds === 0 && { color: theme.colors.neonCyan }]}>
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
