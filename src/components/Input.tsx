import React, { useState } from 'react';
import { TextInput, TextInputProps, View, Text, StyleSheet } from 'react-native';
import { theme } from '../utils/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, style, onFocus, onBlur, ...props }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          isFocused && styles.inputFocused,
          error && styles.inputError,
          style,
        ]}
        placeholderTextColor={theme.colors.slate400}
        onFocus={(e) => {
          setIsFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          onBlur?.(e);
        }}
        {...props}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontFamily: theme.typography.fontMonoMedium,
    fontSize: 11,
    color: theme.colors.slate400,
    marginBottom: 8,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderGlow,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily,
    fontSize: 16,
  },
  inputFocused: {
    borderColor: theme.colors.neonCyan,
  },
  inputError: {
    borderColor: '#ffb4ab',
  },
  errorText: {
    color: '#ffb4ab',
    fontSize: 12,
    fontFamily: theme.typography.fontFamily,
    marginTop: 4,
  },
});
