import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Play, Copy, Plus, X, Pause, SkipForward, CheckCircle2, Sparkles } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../utils/ThemeContext';
import { ThemeColors } from '../../../utils/theme';
import { gymService, Routine } from '../../../services/gym.service';
import { useAlertStore } from '../../../store/alertStore';
import { queryKeys } from '../../../services/queryKeys';
import { AppNavigationProp } from '../../../utils/navigation';
import { Skeleton } from '../../../components/Skeleton';
import { StretchingIllustration } from './StretchingIllustration';
import { translateBodyPart, translateMuscle } from '../../../utils/gymTranslations';

interface StretchingViewProps {
  personalStretchingRoutines: Routine[];
}

export const StretchingView: React.FC<StretchingViewProps> = ({ personalStretchingRoutines }) => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);
  const navigation = useNavigation<AppNavigationProp>();
  const queryClient = useQueryClient();
  const showAlert = useAlertStore((s) => s.showAlert);

  const [activeRoutine, setActiveRoutine] = useState<Routine | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(30);
  const [isPaused, setIsPaused] = useState(false);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['gym', 'stretchingTemplates'],
    queryFn: gymService.getStretchingTemplates,
    staleTime: 10 * 60 * 1000,
  });

  const cloneMutation = useMutation({
    mutationFn: (templateKey: string) => gymService.cloneStretchingTemplate(templateKey),
    onSuccess: (cloned) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.gym.routines });
      showAlert('Copia Guardada', `"${cloned.name}" se guardó en tus rutinas para que puedas editarla.`, 'success');
      navigation.navigate('CreateRoutine', { routineId: cloned.id });
    },
    onError: (e: Error) => {
      showAlert('Error', e.message || 'No se pudo clonar la plantilla.', 'error');
    },
  });

  useEffect(() => {
    if (!activeRoutine || isPaused) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          // Advance to next stretch automatically
          if (currentIdx + 1 < (activeRoutine.exercises?.length || 0)) {
            const nextIdx = currentIdx + 1;
            setCurrentIdx(nextIdx);
            return activeRoutine.exercises[nextIdx]?.reps || 30;
          } else {
            clearInterval(timer);
            showAlert(
              'Estiramiento Completado',
              `Finalizaste "${activeRoutine.name}". Esta sesión es opcional y no afecta tu racha de pesas.`,
              'success'
            );
            setActiveRoutine(null);
            return 0;
          }
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeRoutine, isPaused, currentIdx, showAlert]);

  const startGuidedSession = (routine: Routine) => {
    if (!routine.exercises || routine.exercises.length === 0) {
      showAlert('Sin ejercicios', 'Esta rutina de estiramiento no tiene ejercicios aún.', 'info');
      return;
    }
    setActiveRoutine(routine);
    setCurrentIdx(0);
    setSecondsLeft(routine.exercises[0]?.reps || 30);
    setIsPaused(false);
  };

  const handleNextStretch = () => {
    if (!activeRoutine) return;
    if (currentIdx + 1 < activeRoutine.exercises.length) {
      const next = currentIdx + 1;
      setCurrentIdx(next);
      setSecondsLeft(activeRoutine.exercises[next]?.reps || 30);
    } else {
      showAlert('Estiramiento Completado', `Finalizaste "${activeRoutine.name}".`, 'success');
      setActiveRoutine(null);
    }
  };

  const parseTemplatePurpose = (raw?: string) => {
    if (!raw) return { label: 'Movilidad', key: '' };
    const [label, key] = raw.split('|');
    return { label: label || 'Movilidad', key: key || '' };
  };

  const currentStretch = activeRoutine?.exercises?.[currentIdx];
  const currentStretchDetails = currentStretch?.exercise || (currentStretch as any)?.exerciseDetails;

  return (
    <View style={styles.container}>
      <View style={styles.infoBanner}>
        <Sparkles color={theme.colors.neonCyan} size={16} />
        <Text style={styles.infoBannerText}>
          Plantillas de solo lectura listas para iniciar al instante, o guarda una copia editable con ejercicios individuales. No afecta tu racha de pesas.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>PLANTILLAS ESTRUCTURADAS (SOLO LECTURA)</Text>

      {isLoading ? (
        <View style={{ gap: 12 }}>
          <Skeleton width="100%" height={120} borderRadius={16} />
          <Skeleton width="100%" height={120} borderRadius={16} />
        </View>
      ) : (
        templates.map((tpl) => {
          const { label: purposeLabel, key: templateKey } = parseTemplatePurpose(tpl.purpose);
          const totalHoldMins = Math.max(
            1,
            Math.round(
              (tpl.exercises || []).reduce((acc, e) => acc + (e.sets || 1) * (e.reps || 30), 0) / 60
            )
          );

          return (
            <View key={tpl.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.purposePill}>
                  <Text style={styles.purposePillText}>{purposeLabel.toUpperCase()}</Text>
                </View>
                <Text style={styles.metaMono}>
                  {tpl.exercises?.length || 0} posturas • ~{totalHoldMins} min
                </Text>
              </View>

              <Text style={styles.cardTitle}>{tpl.name}</Text>
              {Boolean(tpl.description) && (
                <Text style={styles.cardDesc}>{tpl.description}</Text>
              )}

              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.startBtn}
                  onPress={() => startGuidedSession(tpl)}
                  activeOpacity={0.85}
                >
                  <Play color={theme.colors.obsidian} size={14} fill={theme.colors.obsidian} />
                  <Text style={styles.startBtnText}>Iniciar ahora</Text>
                </TouchableOpacity>

                {Boolean(templateKey) && (
                  <TouchableOpacity
                    style={styles.cloneBtn}
                    onPress={() => cloneMutation.mutate(templateKey)}
                    disabled={cloneMutation.isPending}
                    activeOpacity={0.8}
                  >
                    {cloneMutation.isPending && cloneMutation.variables === templateKey ? (
                      <ActivityIndicator size="small" color={theme.colors.neonCyan} />
                    ) : (
                      <>
                        <Copy color={theme.colors.neonCyan} size={14} />
                        <Text style={styles.cloneBtnText}>Copia editable</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })
      )}

      <View style={styles.personalHeader}>
        <Text style={styles.sectionTitle}>MIS RUTINAS DE ESTIRAMIENTO</Text>
        <TouchableOpacity
          style={styles.newPersonalBtn}
          onPress={() => navigation.navigate('CreateRoutine')}
        >
          <Plus color={theme.colors.neonCyan} size={14} />
          <Text style={styles.newPersonalBtnText}>Personalizada</Text>
        </TouchableOpacity>
      </View>

      {personalStretchingRoutines.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            Aún no tienes copias editables. Clona una plantilla o crea una rutina personalizada eligiendo estiramientos individuales del catálogo.
          </Text>
        </View>
      ) : (
        personalStretchingRoutines.map((r) => (
          <View key={r.id} style={styles.card}>
            <Text style={styles.cardTitle}>{r.name}</Text>
            <Text style={styles.metaMono}>
              {r.exercises?.length || 0} ejercicios • {r.difficultyLevel || 'Principiante'}
            </Text>
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.startBtn}
                onPress={() => startGuidedSession(r)}
              >
                <Play color={theme.colors.obsidian} size={14} fill={theme.colors.obsidian} />
                <Text style={styles.startBtnText}>Iniciar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cloneBtn}
                onPress={() => navigation.navigate('CreateRoutine', { routineId: r.id })}
              >
                <Text style={styles.cloneBtnText}>Editar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      {/* Guided Stretching Player Modal */}
      <Modal
        visible={Boolean(activeRoutine)}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setActiveRoutine(null)}
      >
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.purposePillText}>SESIÓN DE ESTIRAMIENTO</Text>
              <Text style={styles.modalTitle} numberOfLines={1}>
                {activeRoutine?.name}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setActiveRoutine(null)} style={{ padding: 6 }}>
              <X color={theme.colors.mutedText} size={22} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.playerContent}>
            <Text style={styles.progressCounter}>
              POSTURA {currentIdx + 1} DE {activeRoutine?.exercises?.length || 1}
            </Text>

            <View style={styles.illustrationWrap}>
              {currentStretchDetails?.gifUrl || currentStretchDetails?.thumbUrl ? (
                <Image
                  source={{ uri: currentStretchDetails.gifUrl || currentStretchDetails.thumbUrl }}
                  style={styles.stretchImage}
                  contentFit="contain"
                />
              ) : (
                <StretchingIllustration
                  bodyPart={currentStretchDetails?.bodyPart}
                  size={160}
                />
              )}
            </View>

            <Text style={styles.stretchName}>
              {currentStretchDetails?.name || 'Estiramiento'}
            </Text>
            <Text style={styles.stretchMuscle}>
              {[
                translateBodyPart(currentStretchDetails?.bodyPart),
                translateMuscle(currentStretchDetails?.muscle),
              ]
                .filter(Boolean)
                .join(' • ')}
            </Text>

            <View style={styles.timerBox}>
              <Text style={styles.timerValue}>{secondsLeft}s</Text>
              <Text style={styles.timerSub}>MANTÉN LA POSTURA Y RESPIRA</Text>
            </View>

            {Boolean(currentStretchDetails?.instructions) && (
              <View style={styles.instructionsCard}>
                <Text style={styles.instructionsText}>
                  {currentStretchDetails.instructions}
                </Text>
              </View>
            )}

            <View style={styles.playerActions}>
              <TouchableOpacity
                style={styles.cloneBtn}
                onPress={() => setIsPaused((p) => !p)}
              >
                {isPaused ? (
                  <Play color={theme.colors.neonCyan} size={18} />
                ) : (
                  <Pause color={theme.colors.neonCyan} size={18} />
                )}
                <Text style={styles.cloneBtnText}>{isPaused ? 'Reanudar' : 'Pausar'}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.startBtn} onPress={handleNextStretch}>
                {currentIdx + 1 < (activeRoutine?.exercises?.length || 0) ? (
                  <>
                    <SkipForward color={theme.colors.obsidian} size={18} />
                    <Text style={styles.startBtnText}>Siguiente</Text>
                  </>
                ) : (
                  <>
                    <CheckCircle2 color={theme.colors.obsidian} size={18} />
                    <Text style={styles.startBtnText}>Finalizar</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
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
    infoBanner: {
      flexDirection: 'row',
      gap: 10,
      backgroundColor: 'rgba(0, 240, 255, 0.06)',
      borderWidth: 1,
      borderColor: 'rgba(0, 240, 255, 0.25)',
      borderRadius: 14,
      padding: 12,
    },
    infoBannerText: {
      flex: 1,
      fontFamily: 'Geist_400Regular',
      fontSize: 12,
      color: colors.mutedText,
      lineHeight: 17,
    },
    sectionTitle: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 11,
      color: colors.mutedText,
      letterSpacing: 0.9,
      marginTop: 4,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      padding: 16,
      gap: 8,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    purposePill: {
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 999,
      backgroundColor: 'rgba(0, 240, 255, 0.1)',
      borderWidth: 1,
      borderColor: 'rgba(0, 240, 255, 0.3)',
    },
    purposePillText: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 10,
      color: colors.neonCyan,
      letterSpacing: 0.7,
    },
    metaMono: {
      fontFamily: 'JetBrainsMono_400Regular',
      fontSize: 11,
      color: colors.mutedText,
    },
    cardTitle: {
      fontFamily: 'Geist_700Bold',
      fontSize: 16,
      color: colors.text,
    },
    cardDesc: {
      fontFamily: 'Geist_400Regular',
      fontSize: 13,
      color: colors.mutedText,
      lineHeight: 19,
    },
    cardActions: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 6,
    },
    startBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: colors.neonCyan,
      borderRadius: 12,
      paddingVertical: 11,
    },
    startBtnText: {
      fontFamily: 'Geist_700Bold',
      fontSize: 13,
      color: colors.obsidian,
    },
    cloneBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: colors.surfaceLight,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      borderRadius: 12,
      paddingVertical: 11,
    },
    cloneBtnText: {
      fontFamily: 'Geist_600SemiBold',
      fontSize: 13,
      color: colors.neonCyan,
    },
    personalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 8,
    },
    newPersonalBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.neonCyan,
      backgroundColor: 'rgba(0, 240, 255, 0.08)',
    },
    newPersonalBtnText: {
      fontFamily: 'Geist_600SemiBold',
      fontSize: 12,
      color: colors.neonCyan,
    },
    emptyCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      padding: 16,
    },
    emptyText: {
      fontFamily: 'Geist_400Regular',
      fontSize: 13,
      color: colors.mutedText,
      lineHeight: 19,
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
      marginTop: 2,
    },
    playerContent: {
      padding: 20,
      alignItems: 'center',
      gap: 16,
    },
    progressCounter: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 11,
      color: colors.mutedText,
      letterSpacing: 1,
    },
    illustrationWrap: {
      marginVertical: 8,
    },
    stretchImage: {
      width: 200,
      height: 200,
      borderRadius: 16,
    },
    stretchName: {
      fontFamily: 'Geist_700Bold',
      fontSize: 22,
      color: colors.text,
      textAlign: 'center',
    },
    stretchMuscle: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 12,
      color: colors.neonCyan,
    },
    timerBox: {
      width: '100%',
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      paddingVertical: 20,
      alignItems: 'center',
      gap: 4,
    },
    timerValue: {
      fontFamily: 'JetBrainsMono_600SemiBold',
      fontSize: 44,
      color: colors.neonCyan,
    },
    timerSub: {
      fontFamily: 'JetBrainsMono_400Regular',
      fontSize: 10,
      color: colors.mutedText,
      letterSpacing: 0.9,
    },
    instructionsCard: {
      width: '100%',
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      padding: 16,
    },
    instructionsText: {
      fontFamily: 'Geist_400Regular',
      fontSize: 14,
      color: colors.text,
      lineHeight: 22,
    },
    playerActions: {
      flexDirection: 'row',
      width: '100%',
      gap: 12,
      marginTop: 8,
    },
  });
