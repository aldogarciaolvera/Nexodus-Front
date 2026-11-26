import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useTheme } from '../../../utils/ThemeContext';
import { ThemeColors } from '../../../utils/theme';
import { MuscleRecoveryDto } from '../../../services/gym.service';
import { Zap } from 'lucide-react-native';

interface BodyRecoveryHeatmapProps {
  recoveryData?: MuscleRecoveryDto[];
}

export const BodyRecoveryHeatmap: React.FC<BodyRecoveryHeatmapProps> = ({ recoveryData = [] }) => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);

  // Helper para buscar porcentaje de recuperación de un músculo
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
    if (pct < 35) return '#EF4444'; // Rojo - Fatiga Alta
    if (pct < 70) return '#F59E0B'; // Ámbar - Descansando
    if (pct < 90) return '#38BDF8'; // Azul Neón - Listo (>70%)
    return '#00F0FF';               // Cian Neón - 100% Óptimo
  };

  // Mapeo de grupos musculares
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

  const armsPercentage = Math.round((biceps.percentage + triceps.percentage) / 2);
  const armsColor = getColorForPercentage(armsPercentage);

  // Promedio general de recuperación
  const avgRecovery = recoveryData.length > 0
    ? Math.round(recoveryData.reduce((acc, curr) => acc + curr.recoveryPercentage, 0) / recoveryData.length)
    : 100;
  const avgColor = getColorForPercentage(avgRecovery);

  // Color de base visible para la silueta del cuerpo
  const bodyBaseColor = '#222836';

  const getStatusMessage = () => {
    if (avgRecovery >= 90) {
      return 'Tus grupos musculares están completamente recuperados. ¡Listo para entrenar con alta intensidad!';
    }
    if (avgRecovery >= 70) {
      return 'Tus músculos principales están recuperados y listos para una sesión de entrenamiento.';
    }
    if (avgRecovery >= 45) {
      return 'Recuperación activa en curso. Se recomienda priorizar grupos musculares descansados.';
    }
    return 'Fatiga muscular alta acumulada. Se recomienda descanso e hidratación.';
  };

  return (
    <View style={styles.container}>
      {/* Header unificado Obsidian Cyan */}
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <View style={styles.iconCircle}>
            <Zap size={14} color={theme.colors.neonCyan} />
          </View>
          <Text style={styles.title}>Recuperación Muscular</Text>
        </View>
        <Text style={styles.headerSub}>Modelo 48-72h</Text>
      </View>

      {/* Canvas anatómico: Medidor vertical de batería + Vistas Frontal y Dorsal lado a lado */}
      <View style={styles.canvasWrapper}>
        {/* Barra de batería / energía general a la izquierda */}
        <View style={styles.batteryColumn}>
          <View style={[styles.batteryCap, { backgroundColor: avgColor }]} />
          <View style={styles.batteryTrack}>
            <View
              style={[
                styles.batteryFill,
                {
                  height: `${Math.max(8, Math.min(100, avgRecovery))}%`,
                  backgroundColor: avgColor,
                },
              ]}
            />
          </View>
          <View style={styles.batteryBottom} />
          <Text style={[styles.batteryText, { color: avgColor }]}>{avgRecovery}%</Text>
        </View>

        {/* Siluetas frontal y dorsal organizadas en paralelo con anatomía unificada */}
        <View style={styles.figuresContainer}>
          {/* Silueta Frontal (Anterior) */}
          <View style={styles.figureBox}>
            <View style={styles.figureCanvas}>
              {/* Capa base anatómica completa */}
              <Image
                source={require('../../../../assets/musclegraphics/composite_front_base.png')}
                style={[styles.layer, { tintColor: bodyBaseColor }]}
              />

              {/* Músculos frontales alineados con precisión anatómica */}
              <Image
                source={require('../../../../assets/musclegraphics/composite_front_pecho.png')}
                style={[styles.layer, { tintColor: chestColor }]}
              />
              <Image
                source={require('../../../../assets/musclegraphics/composite_front_hombros.png')}
                style={[styles.layer, { tintColor: shoulderColor }]}
              />
              <Image
                source={require('../../../../assets/musclegraphics/composite_front_core.png')}
                style={[styles.layer, { tintColor: coreColor }]}
              />
              <Image
                source={require('../../../../assets/musclegraphics/composite_front_brazos.png')}
                style={[styles.layer, { tintColor: armsColor }]}
              />
              <Image
                source={require('../../../../assets/musclegraphics/composite_front_piernas.png')}
                style={[styles.layer, { tintColor: legsColor }]}
              />
            </View>
            <Text style={styles.figureLabel}>VISTA ANTERIOR</Text>
          </View>

          {/* Silueta Dorsal (Posterior) */}
          <View style={styles.figureBox}>
            <View style={styles.figureCanvas}>
              {/* Capa base anatómica completa */}
              <Image
                source={require('../../../../assets/musclegraphics/composite_back_base.png')}
                style={[styles.layer, { tintColor: bodyBaseColor }]}
              />

              {/* Músculos dorsales alineados con precisión anatómica */}
              <Image
                source={require('../../../../assets/musclegraphics/composite_back_espalda.png')}
                style={[styles.layer, { tintColor: backColor }]}
              />
              <Image
                source={require('../../../../assets/musclegraphics/composite_back_hombros.png')}
                style={[styles.layer, { tintColor: shoulderColor }]}
              />
              <Image
                source={require('../../../../assets/musclegraphics/composite_back_brazos.png')}
                style={[styles.layer, { tintColor: armsColor }]}
              />
              <Image
                source={require('../../../../assets/musclegraphics/composite_back_piernas.png')}
                style={[styles.layer, { tintColor: legsColor }]}
              />
            </View>
            <Text style={styles.figureLabel}>VISTA POSTERIOR</Text>
          </View>
        </View>
      </View>

      {/* Insignia de estado y recomendación */}
      <View style={styles.statusSection}>
        <View style={[styles.statusPill, { borderColor: avgColor, backgroundColor: avgColor + '18' }]}>
          <Text style={[styles.statusPillText, { color: avgColor }]}>
            {avgRecovery >= 85 ? 'LISTO PARA ENTRENAR' : avgRecovery >= 50 ? 'RECUPERACIÓN ACTIVA' : 'DESCANSO RECOMENDADO'}
          </Text>
        </View>
        <Text style={styles.statusDescription}>{getStatusMessage()}</Text>
      </View>

      {/* Rectángulos ordenados con el porcentaje de cada grupo muscular dentro del contenedor */}
      <View style={styles.badgesContainer}>
        <View style={styles.badgeRow}>
          <View style={styles.badgeCard}>
            <Text style={styles.badgeLabel}>PECHO</Text>
            <Text style={[styles.badgeValue, { color: chestColor }]}>{chest.percentage}%</Text>
          </View>

          <View style={styles.badgeCard}>
            <Text style={styles.badgeLabel}>ESPALDA</Text>
            <Text style={[styles.badgeValue, { color: backColor }]}>{back.percentage}%</Text>
          </View>

          <View style={styles.badgeCard}>
            <Text style={styles.badgeLabel}>PIERNAS</Text>
            <Text style={[styles.badgeValue, { color: legsColor }]}>{legs.percentage}%</Text>
          </View>
        </View>

        <View style={styles.badgeRow}>
          <View style={styles.badgeCard}>
            <Text style={styles.badgeLabel}>HOMBROS</Text>
            <Text style={[styles.badgeValue, { color: shoulderColor }]}>{shoulders.percentage}%</Text>
          </View>

          <View style={styles.badgeCard}>
            <Text style={styles.badgeLabel}>BRAZOS</Text>
            <Text style={[styles.badgeValue, { color: armsColor }]}>{armsPercentage}%</Text>
          </View>

          <View style={styles.badgeCard}>
            <Text style={styles.badgeLabel}>CORE</Text>
            <Text style={[styles.badgeValue, { color: coreColor }]}>{core.percentage}%</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      padding: 16,
      marginBottom: 20,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    titleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    iconCircle: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: colors.surfaceLight,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.borderGlow,
    },
    title: {
      fontFamily: 'Geist_500Medium',
      fontSize: 14,
      color: colors.text,
      letterSpacing: -0.3,
    },
    headerSub: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 10,
      color: colors.mutedText,
    },
    canvasWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 6,
    },
    batteryColumn: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingLeft: 2,
      paddingRight: 8,
    },
    batteryCap: {
      width: 10,
      height: 4,
      borderTopLeftRadius: 2,
      borderTopRightRadius: 2,
      marginBottom: 1,
    },
    batteryTrack: {
      width: 20,
      height: 125,
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: colors.borderGlow,
      backgroundColor: '#0B0D11',
      overflow: 'hidden',
      justifyContent: 'flex-end',
      padding: 2,
    },
    batteryFill: {
      width: '100%',
      borderRadius: 4,
    },
    batteryBottom: {
      width: 12,
      height: 2,
      backgroundColor: colors.borderGlow,
      borderRadius: 1,
      marginTop: 2,
    },
    batteryText: {
      fontSize: 10,
      fontFamily: 'JetBrainsMono_700Bold',
      marginTop: 4,
    },
    figuresContainer: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
    },
    figureBox: {
      alignItems: 'center',
    },
    figureCanvas: {
      width: 95,
      height: 165,
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
    },
    layer: {
      position: 'absolute',
      width: 95,
      height: 165,
      resizeMode: 'contain',
    },
    figureLabel: {
      fontSize: 8.5,
      fontFamily: 'JetBrainsMono_500Medium',
      color: colors.mutedText,
      letterSpacing: 0.5,
      marginTop: 4,
    },
    statusSection: {
      alignItems: 'center',
      marginTop: 10,
      marginBottom: 2,
    },
    statusPill: {
      borderWidth: 1,
      borderRadius: 999,
      paddingVertical: 4,
      paddingHorizontal: 12,
      marginBottom: 6,
    },
    statusPillText: {
      fontFamily: 'JetBrainsMono_700Bold',
      fontSize: 10,
      letterSpacing: 0.5,
    },
    statusDescription: {
      fontFamily: 'Geist_400Regular',
      fontSize: 11.5,
      color: colors.slate400,
      textAlign: 'center',
      lineHeight: 16,
      paddingHorizontal: 8,
    },
    badgesContainer: {
      marginTop: 14,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.borderGlow,
      gap: 8,
    },
    badgeRow: {
      flexDirection: 'row',
      gap: 8,
    },
    badgeCard: {
      flex: 1,
      backgroundColor: '#0B0D11',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      paddingVertical: 8,
      paddingHorizontal: 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeLabel: {
      fontSize: 9,
      fontFamily: 'JetBrainsMono_500Medium',
      color: colors.mutedText,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      marginBottom: 2,
    },
    badgeValue: {
      fontSize: 12.5,
      fontFamily: 'JetBrainsMono_700Bold',
    },
  });
