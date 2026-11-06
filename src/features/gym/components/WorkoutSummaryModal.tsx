import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Trophy, Clock, Dumbbell, Award, Flame, X } from 'lucide-react-native';
import { useTheme } from '../../../utils/ThemeContext';
import { ThemeColors } from '../../../utils/theme';
import { WorkoutSessionDto } from '../../../services/gym.service';

interface WorkoutSummaryModalProps {
  visible: boolean;
  session: WorkoutSessionDto | null;
  elapsedSeconds: number;
  isLoading?: boolean;
  onConfirmFinish: (notes: string) => void;
  onCancel: () => void;
}

export const WorkoutSummaryModal = React.memo(({
  visible,
  session,
  elapsedSeconds,
  isLoading = false,
  onConfirmFinish,
  onCancel,
}: WorkoutSummaryModalProps) => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);
  const [notes, setNotes] = useState<string>('');

  const completedSets = session?.sets?.filter((s) => s.isCompleted) || [];
  const completedCount = session?.completedSetsCount || completedSets.length;
  const totalVolume = session?.totalVolumeKg || completedSets
    .filter((s) => s.type !== 'Warmup')
    .reduce((acc, s) => acc + s.weightKg * s.reps, 0);

  const totalReps = session?.totalReps || completedSets.reduce((acc, s) => acc + s.reps, 0);
  const estimatedXp = session?.xpEarned || (50 + Math.floor(totalVolume / 100));

  const durationSec = session?.durationSeconds || elapsedSeconds;
  const hrs = Math.floor(durationSec / 3600);
  const mins = Math.floor((durationSec % 3600) / 60);
  const secs = durationSec % 60;
  const formattedDuration = hrs > 0
    ? `${hrs}h ${mins.toString().padStart(2, '0')}m`
    : `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.badgeXp}>
              <Award size={16} color={theme.colors.neonCyan} />
              <Text style={styles.badgeXpText}>+{estimatedXp} NXP</Text>
            </View>
            <TouchableOpacity onPress={onCancel} style={styles.closeBtn} disabled={isLoading}>
              <X size={18} color={theme.colors.slate400} />
            </TouchableOpacity>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.contentContainer}
          >
            {/* Title */}
            <View style={styles.titleContainer}>
              <Text style={styles.subtitle}>SESIÓN COMPLETADA</Text>
              <Text style={styles.title}>{session?.name || 'Entrenamiento'}</Text>
            </View>

            {/* Metrics Grid */}
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <Clock size={16} color={theme.colors.neonCyan} />
                <Text style={styles.metricLabel}>TIEMPO</Text>
                <Text style={styles.metricValue}>{formattedDuration}</Text>
              </View>

              <View style={styles.metricCard}>
                <Dumbbell size={16} color={theme.colors.neonCyan} />
                <Text style={styles.metricLabel}>VOLUMEN</Text>
                <Text style={styles.metricValue}>
                  {Math.round(totalVolume).toLocaleString()} <Text style={styles.unitText}>kg</Text>
                </Text>
              </View>

              <View style={styles.metricCard}>
                <Trophy size={16} color={theme.colors.warning} />
                <Text style={styles.metricLabel}>SERIES</Text>
                <Text style={styles.metricValue}>{completedCount}</Text>
              </View>

              <View style={styles.metricCard}>
                <Flame size={16} color={theme.colors.error} />
                <Text style={styles.metricLabel}>REPS</Text>
                <Text style={styles.metricValue}>{totalReps}</Text>
              </View>
            </View>

            {/* Notes Section */}
            <Text style={styles.sectionLabel}>NOTAS DEL ENTRENAMIENTO (OPCIONAL)</Text>
            <TextInput
              style={styles.notesInput}
              multiline
              numberOfLines={3}
              placeholder="¿Cómo te sentiste? ¿Algún nuevo récord o molestia?"
              placeholderTextColor={theme.colors.slate600}
              value={notes}
              onChangeText={setNotes}
              maxLength={500}
            />
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onCancel}
              disabled={isLoading}
            >
              <Text style={styles.cancelBtnText}>Volver</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.finishBtn}
              onPress={() => onConfirmFinish(notes)}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={theme.colors.obsidian} />
              ) : (
                <Text style={styles.finishBtnText}>Guardar y Salir</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
});

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      justifyContent: 'flex-end',
    },
    modalCard: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      borderWidth: 1,
      borderBottomWidth: 0,
      borderColor: colors.borderGlow,
      maxHeight: '85%',
      padding: 20,
      paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    badgeXp: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(56, 189, 248, 0.15)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.neonCyan,
    },
    badgeXpText: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 12,
      color: colors.neonCyan,
      fontWeight: '700',
    },
    closeBtn: {
      padding: 6,
    },
    contentContainer: {
      paddingBottom: 16,
    },
    titleContainer: {
      marginBottom: 20,
    },
    subtitle: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 10,
      color: colors.neonCyan,
      letterSpacing: 1,
      marginBottom: 4,
    },
    title: {
      fontFamily: 'Geist_700Bold',
      fontSize: 22,
      color: colors.text,
    },
    metricsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 20,
    },
    metricCard: {
      flex: 1,
      minWidth: '45%',
      backgroundColor: colors.surfaceLight,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      padding: 14,
      alignItems: 'flex-start',
    },
    metricLabel: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 9,
      color: colors.slate400,
      marginTop: 8,
      marginBottom: 2,
    },
    metricValue: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 18,
      color: colors.text,
      fontWeight: '700',
    },
    unitText: {
      fontSize: 12,
      fontFamily: 'Geist_400Regular',
      color: colors.mutedText,
    },
    sectionLabel: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 10,
      color: colors.slate400,
      marginBottom: 8,
      letterSpacing: 0.5,
    },
    notesInput: {
      backgroundColor: colors.surfaceLight,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      borderRadius: 12,
      padding: 12,
      fontFamily: 'Geist_400Regular',
      fontSize: 13,
      color: colors.text,
      minHeight: 80,
      textAlignVertical: 'top',
    },
    actionsRow: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 12,
    },
    cancelBtn: {
      flex: 1,
      backgroundColor: colors.surfaceLight,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
    },
    cancelBtnText: {
      fontFamily: 'Geist_500Medium',
      fontSize: 14,
      color: colors.slate300,
    },
    finishBtn: {
      flex: 2,
      backgroundColor: colors.neonCyan,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
    },
    finishBtnText: {
      fontFamily: 'Geist_700Bold',
      fontSize: 14,
      color: colors.obsidian,
    },
  });

