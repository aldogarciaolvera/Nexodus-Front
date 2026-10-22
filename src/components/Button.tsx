import React from 'react';
import { TouchableOpacity, Text, StyleSheet, TouchableOpacityProps, ActivityIndicator } from 'react-native';
import { useTheme } from '../utils/ThemeContext';
import { ThemeColors, ThemeTypography } from '../utils/theme';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'ghost';
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ title, variant = 'primary', loading, style, disabled, ...props }) => {
  const isPrimary = variant === 'primary';
  const isDisabled = disabled || loading;
  const theme = useTheme();
  const styles = createStyles(theme.colors, theme.typography, theme.isDarkMode);

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
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? (theme.isDarkMode ? theme.colors.obsidian : '#FFFFFF') : theme.colors.text} />
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

const createStyles = (colors: ThemeColors, typography: ThemeTypography, isDarkMode: boolean) => StyleSheet.create({
  button: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primary: {
    backgroundColor: colors.neonCyan,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontFamily: typography.fontFamilyBold,
    fontSize: 16,
  },
  textPrimary: {
    color: isDarkMode ? colors.obsidian : '#FFFFFF',
  },
  textGhost: {
    color: colors.text,
  }
});
