import React from 'react';
import { TouchableOpacity, Text, StyleSheet, TouchableOpacityProps, ActivityIndicator } from 'react-native';
import { theme } from '../utils/theme';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'ghost';
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ title, variant = 'primary', loading, style, disabled, ...props }) => {
  const isPrimary = variant === 'primary';
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isPrimary ? styles.primary : styles.ghost,
        isDisabled && styles.disabled,
        style
      ]}
      disabled={isDisabled}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? theme.colors.obsidian : theme.colors.white} />
      ) : (
        <Text style={[
          styles.text,
          isPrimary ? styles.textPrimary : styles.textGhost
        ]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primary: {
    backgroundColor: theme.colors.neonCyan,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.borderGlow,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 16,
  },
  textPrimary: {
    color: theme.colors.obsidian,
  },
  textGhost: {
    color: theme.colors.white,
  }
});
