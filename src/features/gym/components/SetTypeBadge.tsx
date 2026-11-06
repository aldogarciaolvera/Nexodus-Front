import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { SetType } from '../../../services/gym.service';

interface SetTypeBadgeProps {
  type: SetType;
  onChange?: (newType: SetType) => void;
  size?: 'small' | 'medium';
}

const SET_TYPES_CYCLE: SetType[] = ['Normal', 'Warmup', 'DropSet', 'Failure', 'Timed'];

const TYPE_CONFIG: Record<SetType, { label: string; text: string; bg: string; color: string }> = {
  Normal: {
    label: 'Normal',
    text: 'N',
    bg: 'rgba(56, 189, 248, 0.15)',
    color: '#38BDF8',
  },
  Warmup: {
    label: 'Calentamiento',
    text: 'W',
    bg: 'rgba(245, 158, 11, 0.15)',
    color: '#F59E0B',
  },
  DropSet: {
    label: 'Drop Set',
    text: 'D',
    bg: 'rgba(168, 85, 247, 0.15)',
    color: '#A855F7',
  },
  Failure: {
    label: 'Al Fallo',
    text: 'F',
    bg: 'rgba(255, 51, 102, 0.15)',
    color: '#FF3366',
  },
  Timed: {
    label: 'Tiempo',
    text: 'T',
    bg: 'rgba(16, 185, 129, 0.15)',
    color: '#10B981',
  },
};

export const SetTypeBadge = React.memo(({ type = 'Normal', onChange, size = 'medium' }: SetTypeBadgeProps) => {
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.Normal;

  const handlePress = () => {
    if (!onChange) return;
    const currentIndex = SET_TYPES_CYCLE.indexOf(type);
    const nextIndex = (currentIndex + 1) % SET_TYPES_CYCLE.length;
    onChange(SET_TYPES_CYCLE[nextIndex]);
  };

  const isSmall = size === 'small';

  return (
    <TouchableOpacity
      activeOpacity={onChange ? 0.7 : 1}
      onPress={handlePress}
      disabled={!onChange}
      style={[
        styles.badge,
        {
          backgroundColor: config.bg,
          borderColor: config.color,
          width: isSmall ? 24 : 30,
          height: isSmall ? 24 : 30,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: config.color,
            fontSize: isSmall ? 10 : 12,
          },
        ]}
      >
        {config.text}
      </Text>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  badge: {
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontWeight: '700',
  },
});

