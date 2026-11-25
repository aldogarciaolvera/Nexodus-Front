import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Path, Line } from 'react-native-svg';
import { useTheme } from '../../../utils/ThemeContext';

interface StretchingIllustrationProps {
  bodyPart?: string;
  size?: number;
}

/**
 * Clean Obsidian Cyan vector illustration fallback for stretching exercises
 * whenever no custom GIF/thumbnail is uploaded in S3 yet.
 */
export const StretchingIllustration: React.FC<StretchingIllustrationProps> = ({
  bodyPart = '',
  size = 56,
}) => {
  const theme = useTheme();
  const cyan = theme.colors.neonCyan;
  const muted = theme.colors.mutedText;
  const part = bodyPart.toLowerCase();

  // Pick a distinct minimal pose silhouette by body area
  const renderPose = () => {
    if (part.includes('back') || part.includes('waist')) {
      // Child's pose / spinal stretch silhouette
      return (
        <>
          <Circle cx="44" cy="36" r="5" stroke={cyan} strokeWidth="2.2" fill="none" />
          <Path d="M16 44 Q28 30 40 38" stroke={cyan} strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <Line x1="40" y1="38" x2="54" y2="44" stroke={cyan} strokeWidth="2.2" strokeLinecap="round" />
          <Line x1="12" y1="46" x2="52" y2="46" stroke={muted} strokeWidth="1.5" strokeDasharray="3 3" />
        </>
      );
    }
    if (part.includes('leg') || part.includes('hip') || part.includes('glute')) {
      // Lunge / quad / hamstring stretch silhouette
      return (
        <>
          <Circle cx="30" cy="14" r="5" stroke={cyan} strokeWidth="2.2" fill="none" />
          <Line x1="30" y1="19" x2="30" y2="34" stroke={cyan} strokeWidth="2.5" strokeLinecap="round" />
          <Path d="M30 34 L42 36 L44 48" stroke={cyan} strokeWidth="2.4" strokeLinecap="round" fill="none" />
          <Path d="M30 34 L18 44 L14 48" stroke={cyan} strokeWidth="2.4" strokeLinecap="round" fill="none" />
          <Line x1="22" y1="24" x2="38" y2="24" stroke={muted} strokeWidth="2" strokeLinecap="round" />
        </>
      );
    }
    // Upper body / neck / shoulder / chest opener silhouette
    return (
      <>
        <Circle cx="32" cy="15" r="5" stroke={cyan} strokeWidth="2.2" fill="none" />
        <Line x1="32" y1="20" x2="32" y2="38" stroke={cyan} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M16 20 Q24 26 32 24 Q40 26 48 20" stroke={cyan} strokeWidth="2.3" strokeLinecap="round" fill="none" />
        <Line x1="32" y1="38" x2="24" y2="50" stroke={muted} strokeWidth="2.2" strokeLinecap="round" />
        <Line x1="32" y1="38" x2="40" y2="50" stroke={muted} strokeWidth="2.2" strokeLinecap="round" />
      </>
    );
  };

  return (
    <View
      style={[
        styles.box,
        {
          width: size,
          height: size,
          backgroundColor: theme.colors.surfaceLight,
          borderColor: theme.colors.borderGlow,
        },
      ]}
    >
      <Svg width={size * 0.85} height={size * 0.85} viewBox="0 0 64 64">
        {renderPose()}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
