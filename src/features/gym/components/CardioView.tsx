import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import {
  Sparkles,
  Play,
  Square,
  MapPin,
  Clock,
  Footprints,
  X,
  RefreshCw,
  Check,
  Navigation,
} from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../../utils/ThemeContext';
import { ThemeColors } from '../../../utils/theme';
import {
  cardioService,
  CardioEnvironment,
  CardioModality,
  CardioState,
  CardioTrackingMode,
  CardioSegment,
  GeneratedAiCardioPlan,
  CARDIO_STATE_LABELS,
} from '../../../services/cardio.service';
import { useAlertStore } from '../../../store/alertStore';
import { Skeleton } from '../../../components/Skeleton';

interface CardioViewProps {
  userWeightKg?: number;
}

const LIVE_STATES: CardioState[] = ['Walking', 'Jogging', 'Running', 'Sprint', 'Resting'];

const MODALITIES: { label: string; value: CardioModality }[] = [
  { label: 'Solo Trotar', value: 'Jogging' },
  { label: 'Correr', value: 'Running' },
  { label: 'Caminata', value: 'Walking' },
  { label: 'Mixto / Intervalos', value: 'Mixed' },
];

const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const formatDuration = (secs: number) => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export const CardioView: React.FC<CardioViewProps> = ({ userWeightKg }) => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);
  const queryClient = useQueryClient();
  const showAlert = useAlertStore((s) => s.showAlert);

  // Setup state
  const [environment, setEnvironment] = useState<CardioEnvironment>('Outdoor');
  const [trackingMode, setTrackingMode] = useState<CardioTrackingMode>('Manual');
  const [showAiModal, setShowAiModal] = useState(false);

  // AI modal state
  const [aiModality, setAiModality] = useState<CardioModality>('Mixed');
  const [aiDuration, setAiDuration] = useState(30);
  const [aiDifficulty, setAiDifficulty] = useState('Intermedio');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiPlan, setAiPlan] = useState<GeneratedAiCardioPlan | null>(null);

  // Active Live Session state
  const [isSessionOpen, setIsSessionOpen] = useState(false);
  const [sessionName, setSessionName] = useState('Cardio Libre');
  const [activeAiPlan, setActiveAiPlan] = useState<GeneratedAiCardioPlan | null>(null);
  const [sessionStartIso, setSessionStartIso] = useState('');
  const [currentState, setCurrentState] = useState<CardioState>('Jogging');
  const [stateStartMs, setStateStartMs] = useState<number>(Date.now());
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [stateSeconds, setStateSeconds] = useState(0);
  const [segments, setSegments] = useState<CardioSegment[]>([]);
  const [gpsDistanceKm, setGpsDistanceKm] = useState(0);
  const [manualDistanceText, setManualDistanceText] = useState('');
  const [showFinishSheet, setShowFinishSheet] = useState(false);

  const locationSubRef = useRef<Location.LocationSubscription | null>(null);
  const lastCoordsRef = useRef<{ lat: number; lon: number } | null>(null);
  const aiScrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const s1 = Keyboard.addListener(showEvent, (e) => setKeyboardHeight(e.endCoordinates.height));
    const s2 = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => {
      s1.remove();
      s2.remove();
    };
  }, []);

  const { data: sessions = [], isLoading: loadingSessions } = useQuery({
    queryKey: ['cardio', 'sessions'],
    queryFn: () => cardioService.getSessions(15),
    staleTime: 2 * 60 * 1000,
  });

  const generateAiMutation = useMutation({
    mutationFn: () =>
      cardioService.generateAiPlan({
        environment,
        modality: aiModality,
        durationMinutes: aiDuration,
        difficultyLevel: aiDifficulty,
        prompt: aiPrompt.trim() || undefined,
        userWeightKg,
      }),
    onSuccess: (plan) => setAiPlan(plan),
    onError: (e: Error) => {
      showAlert('Error Cardio IA', e.message || 'No se pudo generar el plan de cardio.', 'error');
    },
  });

  const saveSessionMutation = useMutation({
    mutationFn: cardioService.saveSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cardio', 'sessions'] });
      showAlert(
        'Cardio Guardado',
        'Tu sesión y cambios de estado quedaron registrados en el historial.',
        'success'
      );
      stopGpsWatcher();
      setIsSessionOpen(false);
      setShowFinishSheet(false);
      setActiveAiPlan(null);
    },
    onError: (e: Error) => {
      showAlert('Error', e.message || 'No se pudo guardar la sesión de cardio.', 'error');
    },
  });

  // Live timer tick
  useEffect(() => {
    if (!isSessionOpen || showFinishSheet) return;
    const interval = setInterval(() => {
      setTotalSeconds((s) => s + 1);
      setStateSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isSessionOpen, showFinishSheet]);

  const stopGpsWatcher = () => {
    if (locationSubRef.current) {
      locationSubRef.current.remove();
      locationSubRef.current = null;
    }
    lastCoordsRef.current = null;
  };

  useEffect(() => {
    return () => stopGpsWatcher();
  }, []);

  const startGpsWatcher = async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showAlert(
          'Permiso GPS denegado',
          'Se continuará en modo Tiempo + Estados (puedes ingresar distancia manual al finalizar).',
          'info'
        );
        return false;
      }

      lastCoordsRef.current = null;
      locationSubRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 3000,
          distanceInterval: 8,
        },
        (loc) => {
          const { latitude, longitude } = loc.coords;
          if (lastCoordsRef.current) {
            const delta = haversineKm(
              lastCoordsRef.current.lat,
              lastCoordsRef.current.lon,
              latitude,
              longitude
            );
            // Filter GPS jitter (> 5m and < 200m per tick)
            if (delta >= 0.005 && delta < 0.2) {
              setGpsDistanceKm((prev) => prev + delta);
            }
          }
          lastCoordsRef.current = { lat: latitude, lon: longitude };
        }
      );
      return true;
    } catch {
      return false;
    }
  };

  const launchCardioSession = async (plan?: GeneratedAiCardioPlan) => {
    const now = Date.now();
    const initialState: CardioState = plan?.blocks?.[0]?.state || 'Jogging';

    setActiveAiPlan(plan || null);
    setSessionName(
      plan?.name || (environment === 'Gym' ? 'Cardio en Gym' : 'Cardio al Aire Libre')
    );
    setSessionStartIso(new Date(now).toISOString());
    setCurrentState(initialState);
    setStateStartMs(now);
    setTotalSeconds(0);
    setStateSeconds(0);
    setSegments([]);
    setGpsDistanceKm(0);
    setManualDistanceText('');
    setShowFinishSheet(false);
    setShowAiModal(false);
    setIsSessionOpen(true);

    if (environment === 'Outdoor' && trackingMode === 'Gps') {
      const started = await startGpsWatcher();
      if (!started) {
        setTrackingMode('Manual');
      }
    }
  };

  const handleSwitchLiveState = (nextState: CardioState) => {
    if (nextState === currentState) return;
    const now = Date.now();
    const duration = Math.max(1, Math.round((now - stateStartMs) / 1000));

    setSegments((prev) => [
      ...prev,
      {
        segmentOrder: prev.length + 1,
        state: currentState,
        durationSeconds: duration,
        startedAt: new Date(stateStartMs).toISOString(),
        endedAt: new Date(now).toISOString(),
      },
    ]);
    setCurrentState(nextState);
    setStateStartMs(now);
    setStateSeconds(0);
  };

  const handleConfirmFinish = () => {
    const now = Date.now();
    const finalSegDuration = Math.max(1, Math.round((now - stateStartMs) / 1000));
    const allSegments: CardioSegment[] = [
      ...segments,
      {
        segmentOrder: segments.length + 1,
        state: currentState,
        durationSeconds: finalSegDuration,
        startedAt: new Date(stateStartMs).toISOString(),
        endedAt: new Date(now).toISOString(),
      },
    ];

    const manualDist = parseFloat(manualDistanceText.replace(',', '.'));
    const finalDistance =
      trackingMode === 'Gps' && gpsDistanceKm > 0
        ? Number(gpsDistanceKm.toFixed(2))
        : !isNaN(manualDist) && manualDist > 0
        ? manualDist
        : undefined;

    saveSessionMutation.mutate({
      name: sessionName,
      environment,
      activityType: activeAiPlan?.modality || 'Mixed',
      trackingMode: environment === 'Outdoor' ? trackingMode : 'Manual',
      startTime: sessionStartIso,
      endTime: new Date(now).toISOString(),
      totalDurationSeconds: Math.max(1, totalSeconds),
      distanceKm: finalDistance,
      isAiGenerated: Boolean(activeAiPlan),
      segments: allSegments,
    });
  };

  // Compute current suggested AI block based on totalSeconds
  const getCurrentAiBlock = () => {
    if (!activeAiPlan?.blocks?.length) return null;
    let acc = 0;
    for (let i = 0; i < activeAiPlan.blocks.length; i++) {
      const b = activeAiPlan.blocks[i];
      if (totalSeconds < acc + b.durationSeconds) {
        return {
          current: b,
          remainingInBlock: acc + b.durationSeconds - totalSeconds,
          next: activeAiPlan.blocks[i + 1] || null,
        };
      }
      acc += b.durationSeconds;
    }
    return null;
  };

  const aiBlockInfo = getCurrentAiBlock();
  const livePaceMinPerKm =
    gpsDistanceKm > 0.05 ? totalSeconds / 60 / gpsDistanceKm : null;

  return (
    <View style={styles.container}>
      {/* Setup Card */}
      <View style={styles.card}>
        <Text style={styles.eyebrow}>CARDIO DEDICADO (OPCIONAL • NO AFECTA RACHA DE PESAS)</Text>
        <Text style={styles.cardTitle}>Elige tu entorno y modo</Text>

        {/* Outdoor vs Gym */}
        <View style={styles.pillsRow}>
          <TouchableOpacity
            style={[styles.pill, environment === 'Outdoor' && styles.pillActive]}
            onPress={() => setEnvironment('Outdoor')}
          >
            <MapPin
              color={environment === 'Outdoor' ? theme.colors.neonCyan : theme.colors.mutedText}
              size={14}
            />
            <Text style={[styles.pillText, environment === 'Outdoor' && styles.pillTextActive]}>
              Al Aire Libre
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.pill, environment === 'Gym' && styles.pillActive]}
            onPress={() => setEnvironment('Gym')}
          >
            <Footprints
              color={environment === 'Gym' ? theme.colors.neonCyan : theme.colors.mutedText}
              size={14}
            />
            <Text style={[styles.pillText, environment === 'Gym' && styles.pillTextActive]}>
              En Gimnasio
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tracking Mode (Outdoor allows comparing Manual vs Live GPS) */}
        {environment === 'Outdoor' && (
          <View style={styles.modeBox}>
            <Text style={styles.modeLabel}>MODO DE MEDICIÓN</Text>
            <View style={styles.pillsRow}>
              <TouchableOpacity
                style={[styles.pill, trackingMode === 'Manual' && styles.pillActive]}
                onPress={() => setTrackingMode('Manual')}
              >
                <Clock
                  color={trackingMode === 'Manual' ? theme.colors.neonCyan : theme.colors.mutedText}
                  size={13}
                />
                <Text style={[styles.pillText, trackingMode === 'Manual' && styles.pillTextActive]}>
                  Tiempo + Estados
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pill, trackingMode === 'Gps' && styles.pillActive]}
                onPress={() => setTrackingMode('Gps')}
              >
                <Navigation
                  color={trackingMode === 'Gps' ? theme.colors.neonCyan : theme.colors.mutedText}
                  size={13}
                />
                <Text style={[styles.pillText, trackingMode === 'Gps' && styles.pillTextActive]}>
                  GPS en Vivo
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.aiBtn}
            onPress={() => {
              setAiPlan(null);
              setShowAiModal(true);
            }}
            activeOpacity={0.85}
          >
            <Sparkles color={theme.colors.neonCyan} size={16} />
            <Text style={styles.aiBtnText}>Propuesta IA</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.startBtn}
            onPress={() => launchCardioSession()}
            activeOpacity={0.85}
          >
            <Play color={theme.colors.obsidian} size={15} fill={theme.colors.obsidian} />
            <Text style={styles.startBtnText}>Iniciar Libre</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Cardio History */}
      <Text style={styles.sectionTitle}>HISTORIAL DE CARDIO</Text>
      {loadingSessions ? (
        <Skeleton width="100%" height={90} borderRadius={16} />
      ) : sessions.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.mutedDesc}>
            Aún no has registrado sesiones de cardio. Inicia una libre o diseña intervalos con IA.
          </Text>
        </View>
      ) : (
        sessions.map((s) => (
          <View key={s.id} style={styles.card}>
            <View style={styles.historyTop}>
              <Text style={styles.historyTitle}>{s.name}</Text>
              <View style={styles.metaPill}>
                <Text style={styles.metaPillText}>
                  {s.environment === 'Gym' ? 'GYM' : s.trackingMode === 'Gps' ? 'GPS' : 'AIRE LIBRE'}
                </Text>
              </View>
            </View>
            <Text style={styles.historyMetrics}>
              {formatDuration(s.totalDurationSeconds)}
              {s.distanceKm ? ` • ${s.distanceKm.toFixed(2)} km` : ''} • ~{Math.round(s.estimatedCalories)} kcal
            </Text>
            {s.segments && s.segments.length > 0 && (
              <View style={styles.segmentsSummaryRow}>
                {s.segments.slice(0, 4).map((seg, idx) => (
                  <View key={`seg_${idx}`} style={styles.segmentTag}>
                    <Text style={styles.segmentTagText}>
                      {CARDIO_STATE_LABELS[seg.state] || seg.state} {formatDuration(seg.durationSeconds)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))
      )}

      {/* AI Cardio Planner Modal */}
      <Modal
        visible={showAiModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowAiModal(false)}
      >
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.eyebrow}>CARDIO COACH IA</Text>
              <Text style={styles.modalTitle}>Diseñar Sesión de Cardio</Text>
            </View>
            <TouchableOpacity onPress={() => setShowAiModal(false)} style={{ padding: 6 }}>
              <X color={theme.colors.mutedText} size={22} />
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView
              ref={aiScrollRef}
              contentContainerStyle={[
                styles.modalScroll,
                { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 80 : 40 },
              ]}
              keyboardShouldPersistTaps="handled"
              automaticallyAdjustKeyboardInsets={true}
              keyboardDismissMode="on-drag"
            >
              {generateAiMutation.isPending ? (
                <View style={{ gap: 12 }}>
                  <Skeleton width="70%" height={22} borderRadius={8} />
                  <Skeleton width="100%" height={80} borderRadius={16} />
                  <Skeleton width="100%" height={80} borderRadius={16} />
                </View>
              ) : aiPlan ? (
                <View style={{ gap: 12 }}>
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>{aiPlan.name}</Text>
                    <Text style={styles.mutedDesc}>{aiPlan.description}</Text>
                    <Text style={styles.historyMetrics}>
                      ~{aiPlan.estimatedDurationMinutes} min • ~{Math.round(aiPlan.estimatedCalories)} kcal
                    </Text>
                  </View>

                  {aiPlan.blocks.map((b, idx) => (
                    <View key={`blk_${idx}`} style={styles.card}>
                      <View style={styles.historyTop}>
                        <Text style={styles.historyTitle}>
                          {idx + 1}. {b.label}
                        </Text>
                        <Text style={styles.blockDuration}>{formatDuration(b.durationSeconds)}</Text>
                      </View>
                      <Text style={styles.eyebrow}>
                        {(CARDIO_STATE_LABELS[b.state] || b.state).toUpperCase()}
                      </Text>
                      {Boolean(b.cue) && <Text style={styles.mutedDesc}>{b.cue}</Text>}
                    </View>
                  ))}

                  <View style={styles.actionsRow}>
                    <TouchableOpacity style={styles.aiBtn} onPress={() => generateAiMutation.mutate()}>
                      <RefreshCw color={theme.colors.neonCyan} size={16} />
                      <Text style={styles.aiBtnText}>Regenerar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.startBtn}
                      onPress={() => launchCardioSession(aiPlan)}
                    >
                      <Play color={theme.colors.obsidian} size={15} fill={theme.colors.obsidian} />
                      <Text style={styles.startBtnText}>Iniciar Plan</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={{ gap: 16 }}>
                  <Text style={styles.sectionTitle}>MODALIDAD</Text>
                  <View style={styles.pillsWrap}>
                    {MODALITIES.map((m) => (
                      <TouchableOpacity
                        key={m.value}
                        style={[styles.chipPill, aiModality === m.value && styles.pillActive]}
                        onPress={() => setAiModality(m.value)}
                      >
                        <Text style={[styles.pillText, aiModality === m.value && styles.pillTextActive]}>
                          {m.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.sectionTitle}>DURACIÓN</Text>
                  <View style={styles.pillsRow}>
                    {[20, 30, 45, 60].map((m) => (
                      <TouchableOpacity
                        key={m}
                        style={[styles.pill, aiDuration === m && styles.pillActive]}
                        onPress={() => setAiDuration(m)}
                      >
                        <Text style={[styles.pillText, aiDuration === m && styles.pillTextActive]}>
                          {m}m
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.sectionTitle}>NIVEL</Text>
                  <View style={styles.pillsRow}>
                    {['Principiante', 'Intermedio', 'Avanzado'].map((lvl) => (
                      <TouchableOpacity
                        key={lvl}
                        style={[styles.pill, aiDifficulty === lvl && styles.pillActive]}
                        onPress={() => setAiDifficulty(lvl)}
                      >
                        <Text style={[styles.pillText, aiDifficulty === lvl && styles.pillTextActive]}>
                          {lvl}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.sectionTitle}>PREFERENCIAS (OPCIONAL)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ej. Quiero intervalos suaves para mejorar resistencia..."
                    placeholderTextColor={theme.colors.mutedText}
                    value={aiPrompt}
                    onChangeText={setAiPrompt}
                    onFocus={() =>
                      setTimeout(() => aiScrollRef.current?.scrollTo({ y: 180, animated: true }), 120)
                    }
                  />

                  <TouchableOpacity
                    style={styles.startBtn}
                    onPress={() => generateAiMutation.mutate()}
                  >
                    <Sparkles color={theme.colors.obsidian} size={16} />
                    <Text style={styles.startBtnText}>Generar Plan de Cardio</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Active Live Cardio HUD Modal */}
      <Modal
        visible={isSessionOpen}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowFinishSheet(true)}
      >
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.eyebrow}>
                {environment === 'Gym' ? 'CARDIO EN GYM' : trackingMode === 'Gps' ? 'GPS EN VIVO' : 'TIEMPO + ESTADOS'}
              </Text>
              <Text style={styles.modalTitle}>{sessionName}</Text>
            </View>
            <TouchableOpacity
              style={styles.stopBtn}
              onPress={() => setShowFinishSheet(true)}
            >
              <Square color={theme.colors.obsidian} size={14} fill={theme.colors.obsidian} />
              <Text style={styles.stopBtnText}>Terminar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
            {/* Main Telemetry */}
            <View style={styles.hudCard}>
              <Text style={styles.eyebrow}>TIEMPO TOTAL</Text>
              <Text style={styles.bigTimer}>{formatDuration(totalSeconds)}</Text>

              <View style={styles.hudMetricsRow}>
                <View style={styles.hudMetric}>
                  <Text style={styles.hudMetricVal}>
                    {CARDIO_STATE_LABELS[currentState]}
                  </Text>
                  <Text style={styles.hudMetricLbl}>
                    ESTATUS • {formatDuration(stateSeconds)}
                  </Text>
                </View>
                {trackingMode === 'Gps' && environment === 'Outdoor' && (
                  <View style={styles.hudMetric}>
                    <Text style={styles.hudMetricVal}>{gpsDistanceKm.toFixed(2)} km</Text>
                    <Text style={styles.hudMetricLbl}>
                      {livePaceMinPerKm ? `${livePaceMinPerKm.toFixed(1)} min/km` : 'GPS ACTIVO'}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* AI Current Block Suggestion */}
            {aiBlockInfo && (
              <View style={styles.aiGuideCard}>
                <Text style={styles.eyebrow}>
                  BLOQUE SUGERIDO • RESTAN {formatDuration(aiBlockInfo.remainingInBlock)}
                </Text>
                <Text style={styles.cardTitle}>{aiBlockInfo.current.label}</Text>
                {Boolean(aiBlockInfo.current.cue) && (
                  <Text style={styles.mutedDesc}>{aiBlockInfo.current.cue}</Text>
                )}
                {aiBlockInfo.next && (
                  <Text style={styles.nextBlockText}>
                    Siguiente: {aiBlockInfo.next.label} ({formatDuration(aiBlockInfo.next.durationSeconds)})
                  </Text>
                )}
              </View>
            )}

            {/* Live State Switcher */}
            <Text style={styles.sectionTitle}>CAMBIAR ESTATUS EN VIVO</Text>
            <View style={styles.pillsWrap}>
              {LIVE_STATES.map((st) => {
                const active = currentState === st;
                return (
                  <TouchableOpacity
                    key={st}
                    style={[styles.stateBtn, active && styles.stateBtnActive]}
                    onPress={() => handleSwitchLiveState(st)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.stateBtnText, active && styles.stateBtnTextActive]}>
                      {CARDIO_STATE_LABELS[st]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Segments timeline so far */}
            {segments.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>SEGMENTOS REGISTRADOS ({segments.length})</Text>
                {segments.map((seg, idx) => (
                  <View key={`live_seg_${idx}`} style={styles.historyTop}>
                    <Text style={styles.mutedDesc}>
                      {idx + 1}. {CARDIO_STATE_LABELS[seg.state] || seg.state}
                    </Text>
                    <Text style={styles.blockDuration}>{formatDuration(seg.durationSeconds)}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Finish Confirmation Box */}
            {showFinishSheet && (
              <View style={styles.finishCard}>
                <Text style={styles.cardTitle}>Finalizar y Guardar Sesión</Text>
                {!(trackingMode === 'Gps' && gpsDistanceKm > 0) && (
                  <>
                    <Text style={styles.sectionTitle}>DISTANCIA OPCIONAL (KM)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Ej. 3.5"
                      placeholderTextColor={theme.colors.mutedText}
                      keyboardType="numeric"
                      value={manualDistanceText}
                      onChangeText={setManualDistanceText}
                    />
                  </>
                )}
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={styles.aiBtn}
                    onPress={() => setShowFinishSheet(false)}
                  >
                    <Text style={styles.aiBtnText}>Continuar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.startBtn}
                    onPress={handleConfirmFinish}
                    disabled={saveSessionMutation.isPending}
                  >
                    {saveSessionMutation.isPending ? (
                      <ActivityIndicator color={theme.colors.obsidian} />
                    ) : (
                      <>
                        <Check color={theme.colors.obsidian} size={16} />
                        <Text style={styles.startBtnText}>Guardar</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      gap: 14,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      padding: 16,
      gap: 10,
    },
    eyebrow: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 10,
      color: colors.neonCyan,
      letterSpacing: 0.7,
    },
    cardTitle: {
      fontFamily: 'Geist_700Bold',
      fontSize: 16,
      color: colors.text,
    },
    mutedDesc: {
      fontFamily: 'Geist_400Regular',
      fontSize: 13,
      color: colors.mutedText,
      lineHeight: 19,
    },
    sectionTitle: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 11,
      color: colors.mutedText,
      letterSpacing: 0.9,
      marginTop: 4,
    },
    pillsRow: {
      flexDirection: 'row',
      gap: 8,
    },
    pillsWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    pill: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      borderRadius: 999,
      backgroundColor: colors.surfaceLight,
      borderWidth: 1,
      borderColor: colors.borderGlow,
    },
    chipPill: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 999,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderGlow,
    },
    pillActive: {
      backgroundColor: 'rgba(0, 240, 255, 0.12)',
      borderColor: colors.neonCyan,
    },
    pillText: {
      fontFamily: 'Geist_600SemiBold',
      fontSize: 13,
      color: colors.mutedText,
    },
    pillTextActive: {
      color: colors.neonCyan,
    },
    modeBox: {
      gap: 8,
      paddingTop: 6,
      borderTopWidth: 1,
      borderTopColor: colors.borderGlow,
    },
    modeLabel: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 10,
      color: colors.mutedText,
      letterSpacing: 0.8,
    },
    actionsRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 4,
    },
    aiBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 13,
      borderRadius: 12,
      backgroundColor: 'rgba(0, 240, 255, 0.08)',
      borderWidth: 1,
      borderColor: colors.neonCyan,
    },
    aiBtnText: {
      fontFamily: 'Geist_600SemiBold',
      fontSize: 13,
      color: colors.neonCyan,
    },
    startBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 13,
      borderRadius: 12,
      backgroundColor: colors.neonCyan,
    },
    startBtnText: {
      fontFamily: 'Geist_700Bold',
      fontSize: 13,
      color: colors.obsidian,
    },
    historyTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    historyTitle: {
      fontFamily: 'Geist_600SemiBold',
      fontSize: 15,
      color: colors.text,
      flex: 1,
    },
    historyMetrics: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 12,
      color: colors.neonCyan,
    },
    metaPill: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
      backgroundColor: colors.surfaceLight,
      borderWidth: 1,
      borderColor: colors.borderGlow,
    },
    metaPillText: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 9,
      color: colors.mutedText,
    },
    segmentsSummaryRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    segmentTag: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor: colors.surfaceLight,
      borderWidth: 1,
      borderColor: colors.borderGlow,
    },
    segmentTagText: {
      fontFamily: 'JetBrainsMono_400Regular',
      fontSize: 10,
      color: colors.mutedText,
    },
    blockDuration: {
      fontFamily: 'JetBrainsMono_600SemiBold',
      fontSize: 13,
      color: colors.text,
    },
    modalSafe: {
      flex: 1,
      backgroundColor: colors.obsidian,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderGlow,
    },
    modalTitle: {
      fontFamily: 'Geist_700Bold',
      fontSize: 18,
      color: colors.text,
    },
    modalScroll: {
      padding: 20,
      gap: 14,
    },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      borderRadius: 12,
      padding: 14,
      color: colors.text,
      fontFamily: 'Geist_400Regular',
      fontSize: 14,
    },
    stopBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.error,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 10,
    },
    stopBtnText: {
      fontFamily: 'Geist_700Bold',
      fontSize: 12,
      color: colors.obsidian,
    },
    hudCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      padding: 20,
      alignItems: 'center',
      gap: 10,
    },
    bigTimer: {
      fontFamily: 'JetBrainsMono_600SemiBold',
      fontSize: 48,
      color: colors.text,
    },
    hudMetricsRow: {
      flexDirection: 'row',
      width: '100%',
      gap: 10,
      marginTop: 6,
    },
    hudMetric: {
      flex: 1,
      backgroundColor: colors.surfaceLight,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      padding: 12,
      alignItems: 'center',
    },
    hudMetricVal: {
      fontFamily: 'JetBrainsMono_600SemiBold',
      fontSize: 15,
      color: colors.neonCyan,
    },
    hudMetricLbl: {
      fontFamily: 'JetBrainsMono_400Regular',
      fontSize: 10,
      color: colors.mutedText,
      marginTop: 2,
    },
    aiGuideCard: {
      backgroundColor: 'rgba(0, 240, 255, 0.06)',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: 'rgba(0, 240, 255, 0.3)',
      padding: 14,
      gap: 6,
    },
    nextBlockText: {
      fontFamily: 'JetBrainsMono_400Regular',
      fontSize: 11,
      color: colors.neonCyan,
      marginTop: 4,
    },
    stateBtn: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 999,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderGlow,
    },
    stateBtnActive: {
      backgroundColor: colors.neonCyan,
      borderColor: colors.neonCyan,
    },
    stateBtnText: {
      fontFamily: 'Geist_600SemiBold',
      fontSize: 13,
      color: colors.text,
    },
    stateBtnTextActive: {
      color: colors.obsidian,
      fontFamily: 'Geist_700Bold',
    },
    finishCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.neonCyan,
      padding: 16,
      gap: 12,
    },
  });
