import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../utils/ThemeContext';
import { ThemeColors } from '../../../utils/theme';
import { Award, Zap, Coins, ChevronRight } from 'lucide-react-native';
import { GamificationStatus } from '../../../services/gamification.service';

interface ObsidianTierCardProps {
  status?: GamificationStatus;
  onOpenVault?: () => void;
}

export const ObsidianTierCard: React.FC<ObsidianTierCardProps> = ({ status, onOpenVault }) => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);
  if (!status) return null;

  const tierColors: Record<string, string> = {
    Initiate: '#94A3B8',
    Vanguard: '#38BDF8',
    Cyber: '#00F0FF',
    Titan: '#818CF8',
    Apex: '#A855F7',
    Sovereign: '#EC4899',
    Obsidian: '#00F0FF',
  };

  const currentTierColor = tierColors[status.tier] || '#00F0FF';

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.tierInfo}>
          <View style={[styles.tierIconBadge, { borderColor: currentTierColor }]}>
            <Award size={18} color={currentTierColor} />
          </View>
          <View>
            <Text style={styles.protocolLabel}>THE NEXODUS PROTOCOL</Text>
            <Text style={[styles.tierName, { color: currentTierColor }]}>
              RANGO {status.tier.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Cyphers Pill */}
        <TouchableOpacity style={styles.cyphersPill} onPress={onOpenVault} activeOpacity={0.8}>
          <Coins size={14} color="#F59E0B" />
          <Text style={styles.cyphersText}>{status.cyphers}</Text>
          <Text style={styles.cyphersSymbol}>⬡</Text>
        </TouchableOpacity>
      </View>

      {/* NXP Progress */}
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.nxpCount}>
            <Text style={styles.nxpHighlight}>{status.nxpTotal}</Text> NXP
          </Text>
          {status.nextTier ? (
            <Text style={styles.nextTierText}>
              Siguiente: {status.nextTier.toUpperCase()} ({status.nextTierNxp} NXP)
            </Text>
          ) : (
            <Text style={styles.nextTierText}>NIVEL MÁXIMO ALCANZADO</Text>
          )}
        </View>

        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${status.progressPercent}%`, backgroundColor: currentTierColor },
            ]}
          />
        </View>
      </View>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  card: {
    backgroundColor: '#14171F',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#222836',
    padding: 16,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  tierInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tierIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 6,
    backgroundColor: '#0B0D11',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  protocolLabel: {
    fontFamily: 'JetBrains Mono',
    fontSize: 9,
    color: colors.mutedText,
    letterSpacing: 1.5,
  },
  tierName: {
    fontFamily: 'JetBrains Mono',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 2,
  },
  cyphersPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0B0D11',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#222836',
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  cyphersText: {
    fontFamily: 'JetBrains Mono',
    fontSize: 12,
    fontWeight: '700',
    color: '#F59E0B',
  },
  cyphersSymbol: {
    fontSize: 12,
    color: '#F59E0B',
  },
  progressContainer: {
    gap: 6,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nxpCount: {
    fontFamily: 'JetBrains Mono',
    fontSize: 11,
    color: colors.mutedText,
  },
  nxpHighlight: {
    color: colors.text,
    fontWeight: '700',
  },
  nextTierText: {
    fontFamily: 'JetBrains Mono',
    fontSize: 10,
    color: colors.mutedText,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#0B0D11',
    borderRadius: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#222836',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
});
