import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Droplet } from 'lucide-react-native';
import { useTheme } from '../../../utils/ThemeContext';
import { ThemeColors } from '../../../utils/theme';

interface HydrationCardProps {
  currentWaterMl: number;
  targetWaterMl: number;
  onAddWater: (amount: number) => void;
  isPending?: boolean;
}

export const HydrationCard: React.FC<HydrationCardProps> = ({
  currentWaterMl,
  targetWaterMl,
  onAddWater,
  isPending = false,
}) => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);

  const currentLiters = (Math.max(0, currentWaterMl) / 1000).toFixed(1);
  const targetLiters = (Math.max(1000, targetWaterMl) / 1000).toFixed(1);
  const progressPct = targetWaterMl > 0 ? Math.min(100, Math.round((currentWaterMl / targetWaterMl) * 100)) : 0;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <View style={styles.iconCircle}>
            <Droplet color={theme.colors.neonCyan} size={16} />
          </View>
          <View>
            <Text style={styles.cardTitle}>HIDRATACIÓN DIARIA</Text>
            <Text style={styles.volumeText}>
              {currentLiters}L <Text style={styles.targetText}>/ {targetLiters}L Meta</Text>
            </Text>
          </View>
        </View>

        <View style={styles.buttonsGroup}>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => onAddWater(250)}
            disabled={isPending}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Agregar 250 mililitros de agua"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {isPending ? (
              <ActivityIndicator size="small" color={theme.colors.obsidian} />
            ) : (
              <Text style={styles.addBtnText}>+ 250ml</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.addBtn, styles.addBtnAlt]}
            onPress={() => onAddWater(500)}
            disabled={isPending}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Agregar 500 mililitros de agua"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.addBtnAltText}>+ 500ml</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress Track */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
      </View>
      <View style={styles.footerLabels}>
        <Text style={styles.progressSubText}>{progressPct}% de tu ingesta diaria</Text>
        <Text style={styles.progressSubText}>{currentWaterMl} ml totales</Text>
      </View>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      padding: 16,
      marginBottom: 16,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    titleGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    iconCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(0, 240, 255, 0.1)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardTitle: {
      fontFamily: 'JetBrainsMono_600SemiBold',
      fontSize: 10,
      color: colors.mutedText,
      letterSpacing: 0.8,
    },
    volumeText: {
      fontFamily: 'JetBrainsMono_700Bold',
      fontSize: 14,
      color: colors.text,
      marginTop: 2,
    },
    targetText: {
      fontFamily: 'JetBrainsMono_400Regular',
      fontSize: 11,
      color: colors.mutedText,
    },
    buttonsGroup: {
      flexDirection: 'row',
      gap: 8,
    },
    addBtn: {
      backgroundColor: colors.neonCyan,
      paddingVertical: 7,
      paddingHorizontal: 12,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addBtnText: {
      fontFamily: 'Geist_700Bold',
      fontSize: 11,
      color: colors.obsidian,
    },
    addBtnAlt: {
      backgroundColor: colors.surfaceLight,
      borderWidth: 1,
      borderColor: colors.borderGlow,
    },
    addBtnAltText: {
      fontFamily: 'Geist_600SemiBold',
      fontSize: 11,
      color: colors.text,
    },
    progressTrack: {
      height: 5,
      backgroundColor: colors.surfaceLight,
      borderRadius: 2.5,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.neonCyan,
      borderRadius: 2.5,
    },
    footerLabels: {
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
