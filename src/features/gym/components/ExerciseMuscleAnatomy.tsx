import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useTheme } from '../../../utils/ThemeContext';
import { ThemeColors } from '../../../utils/theme';
import { translateMuscle, translateBodyPart } from '../../../utils/gymTranslations';

interface ExerciseMuscleAnatomyProps {
  muscle?: string;
  bodyPart?: string;
  secondaryMuscles?: string[];
  scale?: number;
}

type MuscleGroupKey = 'pecho' | 'espalda' | 'hombros' | 'brazos' | 'piernas' | 'core';

const mapToGroup = (raw?: string): MuscleGroupKey | null => {
  if (!raw) return null;
  const lower = raw.trim().toLowerCase();

  // Pecho
  if (lower.includes('chest') || lower.includes('pecho') || lower.includes('pectoral')) {
    return 'pecho';
  }
  // Espalda
  if (
    lower.includes('back') || lower.includes('espalda') || lower.includes('lat') ||
    lower.includes('dorsal') || lower.includes('trap') || lower.includes('spine') ||
    lower.includes('scapulae')
  ) {
    return 'espalda';
  }
  // Hombros
  if (lower.includes('shoulder') || lower.includes('hombro') || lower.includes('delt')) {
    return 'hombros';
  }
  // Brazos (Bíceps, Tríceps, Antebrazos)
  if (
    lower.includes('bicep') || lower.includes('bíceps') || lower.includes('tricep') ||
    lower.includes('tríceps') || lower.includes('arm') || lower.includes('brazo') ||
    lower.includes('forearm') || lower.includes('antebrazo') || lower.includes('braquial')
  ) {
    return 'brazos';
  }
  // Piernas
  if (
    lower.includes('leg') || lower.includes('pierna') || lower.includes('quad') ||
    lower.includes('cuádricep') || lower.includes('glute') || lower.includes('glúteo') ||
    lower.includes('hamstring') || lower.includes('femoral') || lower.includes('calf') ||
    lower.includes('calves') || lower.includes('pantorrilla') || lower.includes('gemelo') ||
    lower.includes('abductor') || lower.includes('adductor')
  ) {
    return 'piernas';
  }
  // Core
  if (
    lower.includes('abs') || lower.includes('core') || lower.includes('abdominal') ||
    lower.includes('oblique') || lower.includes('oblicuo') || lower.includes('waist') ||
    lower.includes('cintura') || lower.includes('serratus')
  ) {
    return 'core';
  }

  return null;
};

export const ExerciseMuscleAnatomy: React.FC<ExerciseMuscleAnatomyProps> = ({
  muscle,
  bodyPart,
  secondaryMuscles = [],
  scale = 1,
}) => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);

  const primaryGroup = mapToGroup(muscle) || mapToGroup(bodyPart);

  const secondaryGroups: (MuscleGroupKey | null)[] = (secondaryMuscles || []).map(mapToGroup);

  const PRIMARY_COLOR = '#00F0FF';
  const SECONDARY_COLOR = '#38BDF8';
  const BASE_COLOR = '#222836';

  const getGroupColor = (group: MuscleGroupKey): string | null => {
    if (primaryGroup === group) {
      return PRIMARY_COLOR;
    }
    if (secondaryGroups.includes(group)) {
      return SECONDARY_COLOR;
    }
    return null;
  };

  const pechoColor = getGroupColor('pecho');
  const espaldaColor = getGroupColor('espalda');
  const hombrosColor = getGroupColor('hombros');
  const brazosColor = getGroupColor('brazos');
  const piernasColor = getGroupColor('piernas');
  const coreColor = getGroupColor('core');

  const primaryDisplayName = muscle
    ? translateMuscle(muscle)
    : bodyPart
    ? translateBodyPart(bodyPart)
    : 'Músculo Principal';

  const secondaryDisplayNames = secondaryMuscles
    .map(translateMuscle)
    .filter(Boolean);

  const canvasWidth = 105 * scale;
  const canvasHeight = 180 * scale;

  return (
    <View style={styles.container}>
      {/* Figures Row: Front & Back Anatomy */}
      <View style={styles.figuresRow}>
        {/* Vista Anterior (Frontal) */}
        <View style={styles.figureBox}>
          <View style={[styles.canvas, { width: canvasWidth, height: canvasHeight }]}>
            {/* Silueta Base */}
            <Image
              source={require('../../../../assets/musclegraphics/composite_front_base.png')}
              style={[styles.layer, { width: canvasWidth, height: canvasHeight, tintColor: BASE_COLOR }]}
            />

            {/* Capas Frontales Iluminadas */}
            {pechoColor ? (
              <Image
                source={require('../../../../assets/musclegraphics/composite_front_pecho.png')}
                style={[styles.layer, { width: canvasWidth, height: canvasHeight, tintColor: pechoColor }]}
              />
            ) : null}

            {hombrosColor ? (
              <Image
                source={require('../../../../assets/musclegraphics/composite_front_hombros.png')}
                style={[styles.layer, { width: canvasWidth, height: canvasHeight, tintColor: hombrosColor }]}
              />
            ) : null}

            {coreColor ? (
              <Image
                source={require('../../../../assets/musclegraphics/composite_front_core.png')}
                style={[styles.layer, { width: canvasWidth, height: canvasHeight, tintColor: coreColor }]}
              />
            ) : null}

            {brazosColor ? (
              <Image
                source={require('../../../../assets/musclegraphics/composite_front_brazos.png')}
                style={[styles.layer, { width: canvasWidth, height: canvasHeight, tintColor: brazosColor }]}
              />
            ) : null}

            {piernasColor ? (
              <Image
                source={require('../../../../assets/musclegraphics/composite_front_piernas.png')}
                style={[styles.layer, { width: canvasWidth, height: canvasHeight, tintColor: piernasColor }]}
              />
            ) : null}
          </View>
          <Text style={styles.figureLabel}>VISTA ANTERIOR</Text>
        </View>

        {/* Vista Posterior (Dorsal) */}
        <View style={styles.figureBox}>
          <View style={[styles.canvas, { width: canvasWidth, height: canvasHeight }]}>
            {/* Silueta Base */}
            <Image
              source={require('../../../../assets/musclegraphics/composite_back_base.png')}
              style={[styles.layer, { width: canvasWidth, height: canvasHeight, tintColor: BASE_COLOR }]}
            />

            {/* Capas Dorsales Iluminadas */}
            {espaldaColor ? (
              <Image
                source={require('../../../../assets/musclegraphics/composite_back_espalda.png')}
                style={[styles.layer, { width: canvasWidth, height: canvasHeight, tintColor: espaldaColor }]}
              />
            ) : null}

            {hombrosColor ? (
              <Image
                source={require('../../../../assets/musclegraphics/composite_back_hombros.png')}
                style={[styles.layer, { width: canvasWidth, height: canvasHeight, tintColor: hombrosColor }]}
              />
            ) : null}

            {brazosColor ? (
              <Image
                source={require('../../../../assets/musclegraphics/composite_back_brazos.png')}
                style={[styles.layer, { width: canvasWidth, height: canvasHeight, tintColor: brazosColor }]}
              />
            ) : null}

            {piernasColor ? (
              <Image
                source={require('../../../../assets/musclegraphics/composite_back_piernas.png')}
                style={[styles.layer, { width: canvasWidth, height: canvasHeight, tintColor: piernasColor }]}
              />
            ) : null}
          </View>
          <Text style={styles.figureLabel}>VISTA POSTERIOR</Text>
        </View>
      </View>

      {/* Legend Indicator */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendSquare, { backgroundColor: PRIMARY_COLOR }]} />
          <Text style={styles.legendText}>
            Primario: <Text style={styles.legendBold}>{primaryDisplayName}</Text>
          </Text>
        </View>

        {secondaryDisplayNames.length > 0 ? (
          <View style={styles.legendItem}>
            <View style={[styles.legendSquare, { backgroundColor: SECONDARY_COLOR }]} />
            <Text style={styles.legendText}>
              Secundario: <Text style={styles.legendBold}>{secondaryDisplayNames.join(', ')}</Text>
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      paddingVertical: 12,
    },
    figuresRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 36,
    },
    figureBox: {
      alignItems: 'center',
    },
    canvas: {
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
    },
    layer: {
      position: 'absolute',
      resizeMode: 'contain',
    },
    figureLabel: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 9,
      color: colors.slate500,
      letterSpacing: 0.8,
      marginTop: 8,
    },
    legendContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 16,
      marginTop: 14,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: colors.surfaceLight,
      borderWidth: 1,
      borderColor: colors.borderGlow,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    legendSquare: {
      width: 10,
      height: 10,
      borderRadius: 2,
    },
    legendText: {
      fontFamily: 'Geist_400Regular',
      fontSize: 11,
      color: colors.slate400,
    },
    legendBold: {
      fontFamily: 'Geist_600SemiBold',
      color: colors.text,
    },
  });

