import React, { useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { X, Target, Dumbbell, Wrench, Sparkles, BookOpen } from 'lucide-react-native';
import { useTheme } from '../../../utils/ThemeContext';
import { ThemeColors } from '../../../utils/theme';
import { Exercise } from '../../../services/gym.service';
import {
  translateBodyPart,
  translateMuscle,
  translateEquipment,
} from '../../../utils/gymTranslations';
import { ExerciseMuscleAnatomy } from './ExerciseMuscleAnatomy';

interface ExerciseDetailModalProps {
  visible: boolean;
  exercise?: Exercise;
  onClose: () => void;
}

export const ExerciseDetailModal: React.FC<ExerciseDetailModalProps> = React.memo(({
  visible,
  exercise,
  onClose,
}) => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);

  // Parse instructions array from text or JSON
  const instructionsList = useMemo(() => {
    if (!exercise?.instructions) return [];
    const raw = exercise.instructions.trim();

    if (raw.startsWith('[') && raw.endsWith(']')) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => String(item).trim()).filter(Boolean);
        }
      } catch {
        // Fallback to string split
      }
    }

    return raw
      .split(/\r?\n/)
      .map((line) => line.replace(/^\d+[\.\-\)]\s*/, '').trim())
      .filter(Boolean);
  }, [exercise?.instructions]);

  if (!exercise) return null;

  const primaryMuscleName = exercise.muscle
    ? translateMuscle(exercise.muscle)
    : exercise.bodyPart
    ? translateBodyPart(exercise.bodyPart)
    : 'No especificado';

  const secondaryMuscleName = exercise.bodyPart && exercise.muscle && exercise.bodyPart.toLowerCase() !== exercise.muscle.toLowerCase()
    ? translateBodyPart(exercise.bodyPart)
    : 'Estabilizadores';

  const equipmentName = exercise.equipment
    ? translateEquipment(exercise.equipment)
    : 'Peso corporal / General';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleCol}>
            <Text style={styles.headerSubtitle}>GUÍA TÉCNICA & ANATOMÍA</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {exercise.name}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <X size={20} color={theme.colors.slate300} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Exercise GIF / Media Preview */}
          {(exercise.gifUrl || exercise.thumbUrl) ? (
            <View style={styles.mediaCard}>
              <Image
                source={{ uri: exercise.gifUrl || exercise.thumbUrl }}
                style={styles.mediaImage}
                contentFit="contain"
                transition={200}
              />
            </View>
          ) : null}

          {/* Section: Muscles Worked Anatomical Diagram */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionIconCircle}>
                <Target size={16} color={theme.colors.neonCyan} />
              </View>
              <View>
                <Text style={styles.sectionTitle}>Músculos Enfocados</Text>
                <Text style={styles.sectionSubtitle}>Activación muscular primaria y secundaria</Text>
              </View>
            </View>

            <ExerciseMuscleAnatomy
              muscle={exercise.muscle}
              bodyPart={exercise.bodyPart}
              secondaryMuscles={exercise.bodyPart && exercise.bodyPart !== exercise.muscle ? [exercise.bodyPart] : []}
              scale={1.05}
            />
          </View>

          {/* Classification Cards: Primary, Secondary & Equipment */}
          <View style={styles.attributesGrid}>
            {/* Primary Muscle */}
            <View style={styles.attributeCard}>
              <View style={styles.attributeIconRow}>
                <Dumbbell size={15} color={theme.colors.neonCyan} />
                <Text style={styles.attributeLabel}>PRIMARIO</Text>
              </View>
              <Text style={styles.attributeValue} numberOfLines={1}>
                {primaryMuscleName}
              </Text>
            </View>

            {/* Secondary Muscle */}
            <View style={styles.attributeCard}>
              <View style={styles.attributeIconRow}>
                <Sparkles size={15} color={theme.colors.neonIce} />
                <Text style={styles.attributeLabel}>SECUNDARIO</Text>
              </View>
              <Text style={styles.attributeValue} numberOfLines={1}>
                {secondaryMuscleName}
              </Text>
            </View>

            {/* Equipment */}
            <View style={styles.attributeCard}>
              <View style={styles.attributeIconRow}>
                <Wrench size={15} color={theme.colors.slate400} />
                <Text style={styles.attributeLabel}>EQUIPO</Text>
              </View>
              <Text style={styles.attributeValue} numberOfLines={1}>
                {equipmentName}
              </Text>
            </View>
          </View>

          {/* Section: Step-by-Step Instructions */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionIconCircle}>
                <BookOpen size={16} color={theme.colors.neonCyan} />
              </View>
              <View>
                <Text style={styles.sectionTitle}>Instrucciones Paso a Paso</Text>
                <Text style={styles.sectionSubtitle}>Guía de ejecución biomecánica correcta</Text>
              </View>
            </View>

            {instructionsList.length > 0 ? (
              <View style={styles.stepsContainer}>
                {instructionsList.map((step, idx) => (
                  <View key={idx} style={styles.stepRow}>
                    <View style={styles.stepNumberBadge}>
                      <Text style={styles.stepNumberText}>{idx + 1}</Text>
                    </View>
                    <Text style={styles.stepDescription}>{step}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyInstructions}>
                <Text style={styles.stepDescription}>
                  Mantén una postura firme, controla la respiración inhalando en la fase excéntrica y exhalando en el esfuerzo concéntrico. Ejecuta cada repetición con rango completo de movimiento.
                </Text>
              </View>
            )}
          </View>

          {/* Bottom Dismiss Button */}
          <TouchableOpacity
            style={styles.bottomBtn}
            activeOpacity={0.8}
            onPress={onClose}
          >
            <Text style={styles.bottomBtnText}>Entendido, Continuar Serie</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
});

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.obsidian,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderGlow,
      backgroundColor: colors.surface,
    },
    headerTitleCol: {
      flex: 1,
      paddingRight: 16,
    },
    headerSubtitle: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 10,
      color: colors.neonCyan,
      letterSpacing: 0.8,
      marginBottom: 2,
    },
    headerTitle: {
      fontFamily: 'Geist_700Bold',
      fontSize: 18,
      color: colors.text,
    },
    closeBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.surfaceLight,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.borderGlow,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 40,
      gap: 16,
    },
    mediaCard: {
      width: '100%',
      height: 220,
      borderRadius: 16,
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    },
    mediaImage: {
      width: '100%',
      height: '100%',
    },
    sectionCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      padding: 16,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 12,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderGlow,
    },
    sectionIconCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(56, 189, 248, 0.1)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'rgba(56, 189, 248, 0.25)',
    },
    sectionTitle: {
      fontFamily: 'Geist_600SemiBold',
      fontSize: 15,
      color: colors.text,
    },
    sectionSubtitle: {
      fontFamily: 'Geist_400Regular',
      fontSize: 11,
      color: colors.slate400,
    },
    attributesGrid: {
      flexDirection: 'row',
      gap: 8,
    },
    attributeCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      padding: 12,
    },
    attributeIconRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 6,
    },
    attributeLabel: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 9,
      color: colors.slate400,
      letterSpacing: 0.5,
    },
    attributeValue: {
      fontFamily: 'Geist_600SemiBold',
      fontSize: 13,
      color: colors.text,
    },
    stepsContainer: {
      gap: 12,
      marginTop: 4,
    },
    stepRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      backgroundColor: colors.surfaceLight,
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.borderGlow,
    },
    stepNumberBadge: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: 'rgba(56, 189, 248, 0.15)',
      borderWidth: 1,
      borderColor: colors.neonCyan,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    stepNumberText: {
      fontFamily: 'JetBrainsMono_700Bold',
      fontSize: 11,
      color: colors.neonCyan,
    },
    stepDescription: {
      flex: 1,
      fontFamily: 'Geist_400Regular',
      fontSize: 13,
      color: colors.slate300,
      lineHeight: 20,
    },
    emptyInstructions: {
      padding: 12,
      backgroundColor: colors.surfaceLight,
      borderRadius: 12,
    },
    bottomBtn: {
      width: '100%',
      height: 48,
      borderRadius: 12,
      backgroundColor: colors.neonCyan,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
    },
    bottomBtnText: {
      fontFamily: 'Geist_600SemiBold',
      fontSize: 14,
      color: colors.obsidian,
      fontWeight: '700',
    },
  });

