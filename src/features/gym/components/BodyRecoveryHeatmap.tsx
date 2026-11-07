import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '../../../utils/ThemeContext';
import { ThemeColors } from '../../../utils/theme';
import { MuscleRecoveryDto } from '../../../services/gym.service';
import { RotateCw, ShieldCheck, Zap } from 'lucide-react-native';

interface BodyRecoveryHeatmapProps {
  recoveryData?: MuscleRecoveryDto[];
}

export const BodyRecoveryHeatmap: React.FC<BodyRecoveryHeatmapProps> = ({ recoveryData = [] }) => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);
  const [viewMode, setViewMode] = useState<'front' | 'back'>('front');
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);

  // Helper to map muscle group to recovery score
  const getRecovery = (muscleName: string): { percentage: number; status: string; hoursLeft: number } => {
    const match = recoveryData.find(
      (m) => m.muscleGroup.toLowerCase().includes(muscleName.toLowerCase()) ||
             muscleName.toLowerCase().includes(m.muscleGroup.toLowerCase())
    );
    if (!match) {
      return { percentage: 100, status: 'Óptimo', hoursLeft: 0 };
    }
    return {
      percentage: match.recoveryPercentage,
      status: match.status,
      hoursLeft: match.estimatedFullRecoveryHours ?? 0,
    };
  };

  const getColorForPercentage = (pct: number): string => {
    if (pct < 35) return '#EF4444'; // Rojo - Fatigado
    if (pct < 70) return '#F59E0B'; // Ámbar - En Recuperación
    if (pct < 90) return '#38BDF8'; // Azul Neón - Casi Listo
    return '#00F0FF';               // Cian Neón - 100% Óptimo
  };

  // Specific muscle recovery mappings
  const chest = getRecovery('Pecho');
  const back = getRecovery('Espalda');
  const legs = getRecovery('Piernas');
  const shoulders = getRecovery('Hombros');
  const biceps = getRecovery('Bíceps');
  const triceps = getRecovery('Tríceps');
  const core = getRecovery('Core');

  const chestColor = getColorForPercentage(chest.percentage);
  const backColor = getColorForPercentage(back.percentage);
  const legsColor = getColorForPercentage(legs.percentage);
  const shoulderColor = getColorForPercentage(shoulders.percentage);
  const bicepsColor = getColorForPercentage(biceps.percentage);
  const tricepsColor = getColorForPercentage(triceps.percentage);
  const coreColor = getColorForPercentage(core.percentage);

  const bodyBaseColor = '#1C2029';

  return (
    <View style={styles.container}>
      {/* Header with Switch */}
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <Zap size={16} color={theme.colors.neonCyan} />
          <Text style={styles.title}>RECOVERY ZONE ANATOMY</Text>
        </View>

        <TouchableOpacity
          style={styles.switchButton}
          onPress={() => setViewMode(prev => prev === 'front' ? 'back' : 'front')}
          activeOpacity={0.8}
        >
          <RotateCw size={14} color={theme.colors.neonCyan} />
          <Text style={styles.switchButtonText}>
            {viewMode === 'front' ? 'VISTA DORSAL' : 'VISTA FRONTAL'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Anatomical Body Canvas */}
      <View style={styles.canvasWrapper}>
        <View style={styles.bodyStack}>
          {viewMode === 'front' ? (
            <>
              {/* Silhouette Front */}
              <Image
                source={require('../../../../assets/musclegraphics/assets_musclegraphics_male_musclebody_upperfront.png')}
                style={[styles.layer, { tintColor: bodyBaseColor }]}
              />
              <Image
                source={require('../../../../assets/musclegraphics/assets_musclegraphics_male_musclebody_middlefront.png')}
                style={[styles.layer, { tintColor: bodyBaseColor }]}
              />
              <Image
                source={require('../../../../assets/musclegraphics/assets_musclegraphics_male_musclebody_lowerfront.png')}
                style={[styles.layer, { tintColor: bodyBaseColor }]}
              />

              {/* Muscles Front */}
              <Image
                source={require('../../../../assets/musclegraphics/assets_musclegraphics_male_muscle_upperchest.png')}
                style={[styles.layer, { tintColor: chestColor }]}
              />
              <Image
                source={require('../../../../assets/musclegraphics/assets_musclegraphics_male_muscle_lowerchest.png')}
                style={[styles.layer, { tintColor: chestColor }]}
              />
              <Image
                source={require('../../../../assets/musclegraphics/assets_musclegraphics_male_muscle_frontdelt.png')}
                style={[styles.layer, { tintColor: shoulderColor }]}
              />
              <Image
                source={require('../../../../assets/musclegraphics/assets_musclegraphics_male_muscle_middledelt.png')}
                style={[styles.layer, { tintColor: shoulderColor }]}
              />
              <Image
                source={require('../../../../assets/musclegraphics/assets_musclegraphics_male_muscle_biceps.png')}
                style={[styles.layer, { tintColor: bicepsColor }]}
              />
              <Image
                source={require('../../../../assets/musclegraphics/assets_musclegraphics_male_muscle_abdominals.png')}
                style={[styles.layer, { tintColor: coreColor }]}
              />
              <Image
                source={require('../../../../assets/musclegraphics/assets_musclegraphics_male_muscle_obliques.png')}
                style={[styles.layer, { tintColor: coreColor }]}
              />
              <Image
                source={require('../../../../assets/musclegraphics/assets_musclegraphics_male_muscle_quadriceps.png')}
                style={[styles.layer, { tintColor: legsColor }]}
              />
              <Image
                source={require('../../../../assets/musclegraphics/assets_musclegraphics_male_muscle_forearms.png')}
                style={[styles.layer, { tintColor: bicepsColor }]}
              />
              <Image
                source={require('../../../../assets/musclegraphics/assets_musclegraphics_male_muscle_calves.png')}
                style={[styles.layer, { tintColor: legsColor }]}
              />
            </>
          ) : (
            <>
              {/* Silhouette Back */}
              <Image
                source={require('../../../../assets/musclegraphics/assets_musclegraphics_male_musclebody_upperback.png')}
                style={[styles.layer, { tintColor: bodyBaseColor }]}
              />
              <Image
                source={require('../../../../assets/musclegraphics/assets_musclegraphics_male_musclebody_middleback.png')}
                style={[styles.layer, { tintColor: bodyBaseColor }]}
              />
              <Image
                source={require('../../../../assets/musclegraphics/assets_musclegraphics_male_musclebody_lowerback.png')}
                style={[styles.layer, { tintColor: bodyBaseColor }]}
              />

              {/* Muscles Back */}
              <Image
                source={require('../../../../assets/musclegraphics/assets_musclegraphics_male_muscle_traps.png')}
                style={[styles.layer, { tintColor: backColor }]}
              />
              <Image
                source={require('../../../../assets/musclegraphics/assets_musclegraphics_male_muscle_upperback.png')}
                style={[styles.layer, { tintColor: backColor }]}
              />
              <Image
                source={require('../../../../assets/musclegraphics/assets_musclegraphics_male_muscle_lats.png')}
                style={[styles.layer, { tintColor: backColor }]}
              />
              <Image
                source={require('../../../../assets/musclegraphics/assets_musclegraphics_male_muscle_reardelt.png')}
                style={[styles.layer, { tintColor: shoulderColor }]}
              />
              <Image
                source={require('../../../../assets/musclegraphics/assets_musclegraphics_male_muscle_triceps.png')}
                style={[styles.layer, { tintColor: tricepsColor }]}
              />
              <Image
                source={require('../../../../assets/musclegraphics/assets_musclegraphics_male_muscle_lowerback.png')}
                style={[styles.layer, { tintColor: backColor }]}
              />
              <Image
                source={require('../../../../assets/musclegraphics/assets_musclegraphics_male_muscle_glutes.png')}
                style={[styles.layer, { tintColor: legsColor }]}
              />
              <Image
                source={require('../../../../assets/musclegraphics/assets_musclegraphics_male_muscle_hamstrings.png')}
                style={[styles.layer, { tintColor: legsColor }]}
              />
              <Image
                source={require('../../../../assets/musclegraphics/assets_musclegraphics_male_muscle_calves.png')}
                style={[styles.layer, { tintColor: legsColor }]}
              />
            </>
          )}
        </View>

        {/* Legend */}
        <View style={styles.legendColumn}>
          <Text style={styles.viewIndicator}>
            {viewMode === 'front' ? 'VISTA ANTERIOR' : 'VISTA POSTERIOR'}
          </Text>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#00F0FF' }]} />
            <Text style={styles.legendText}>Óptimo (100%)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#38BDF8' }]} />
            <Text style={styles.legendText}>Listo (&gt;70%)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.legendText}>Descansando</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.legendText}>Fatiga Alta</Text>
          </View>
        </View>
      </View>

      {/* Muscle Quick Badges */}
      <View style={styles.badgesRow}>
        <TouchableOpacity
          style={[styles.badgePill, selectedMuscle === 'Pecho' && styles.badgePillActive]}
          onPress={() => setSelectedMuscle('Pecho')}
        >
          <Text style={styles.badgeLabel}>Pecho</Text>
          <Text style={[styles.badgeValue, { color: chestColor }]}>{chest.percentage}%</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.badgePill, selectedMuscle === 'Espalda' && styles.badgePillActive]}
          onPress={() => setSelectedMuscle('Espalda')}
        >
          <Text style={styles.badgeLabel}>Espalda</Text>
          <Text style={[styles.badgeValue, { color: backColor }]}>{back.percentage}%</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.badgePill, selectedMuscle === 'Piernas' && styles.badgePillActive]}
          onPress={() => setSelectedMuscle('Piernas')}
        >
          <Text style={styles.badgeLabel}>Piernas</Text>
          <Text style={[styles.badgeValue, { color: legsColor }]}>{legs.percentage}%</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.badgePill, selectedMuscle === 'Hombros' && styles.badgePillActive]}
          onPress={() => setSelectedMuscle('Hombros')}
        >
          <Text style={styles.badgeLabel}>Hombros</Text>
          <Text style={[styles.badgeValue, { color: shoulderColor }]}>{shoulders.percentage}%</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  container: {
    backgroundColor: '#14171F',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#222836',
    padding: 16,
    marginVertical: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontFamily: 'JetBrains Mono',
    fontSize: 12,
    fontWeight: '700',
    color: '#00F0FF',
    letterSpacing: 1,
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0B0D11',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#222836',
  },
  switchButtonText: {
    fontFamily: 'JetBrains Mono',
    fontSize: 10,
    color: '#00F0FF',
    fontWeight: '600',
  },
  canvasWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  bodyStack: {
    width: 190,
    height: 190,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  layer: {
    position: 'absolute',
    width: 190,
    height: 190,
    resizeMode: 'contain',
  },
  legendColumn: {
    gap: 8,
    paddingLeft: 10,
  },
  viewIndicator: {
    fontFamily: 'JetBrains Mono',
    fontSize: 11,
    fontWeight: '700',
    color: colors.mutedText,
    marginBottom: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: colors.slate400,
    fontFamily: 'Geist',
  },
  badgesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#222836',
    gap: 6,
  },
  badgePill: {
    flex: 1,
    backgroundColor: '#0B0D11',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#222836',
    paddingVertical: 6,
    alignItems: 'center',
  },
  badgePillActive: {
    borderColor: '#00F0FF',
  },
  badgeLabel: {
    fontSize: 9,
    fontFamily: 'JetBrains Mono',
    color: colors.mutedText,
    textTransform: 'uppercase',
  },
  badgeValue: {
    fontSize: 12,
    fontFamily: 'JetBrains Mono',
    fontWeight: '700',
    marginTop: 2,
  },
});
