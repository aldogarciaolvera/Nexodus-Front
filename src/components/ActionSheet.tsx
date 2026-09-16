import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { useTheme } from '../utils/ThemeContext';
import { ThemeColors } from '../utils/theme';

export interface ActionOption {
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

interface ActionSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  options: ActionOption[];
  isError?: boolean;
}

export const ActionSheet = ({ visible, onClose, title, subtitle, options, isError }: ActionSheetProps) => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.content}>
          {(title || subtitle) && (
            <View style={styles.header}>
              {title && <Text style={[styles.title, isError && styles.titleError]}>{title}</Text>}
              {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
          )}

          <View style={styles.actionRow}>
            {!isError && (
              <TouchableOpacity style={styles.cancelBtn} activeOpacity={0.8} onPress={onClose}>
                <Text style={styles.cancelText}>CANCELAR</Text>
              </TouchableOpacity>
            )}

            <View style={styles.optionsContainer}>
              {options.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.optionBtn, index === options.length - 1 && styles.lastOptionBtn]}
                  activeOpacity={0.8}
                  onPress={() => {
                    onClose();
                    setTimeout(() => {
                      option.onPress();
                    }, 100);
                  }}
                >
                  <Text style={[styles.optionText, option.destructive && styles.optionTextDestructive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Geist_500Medium',
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  titleError: {
    color: colors.error,
  },
  subtitle: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 12,
    color: colors.slate400,
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
  },
  optionsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    overflow: 'hidden',
    flex: 2,
  },
  optionBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.borderGlow,
  },
  lastOptionBtn: {
    borderRightWidth: 0,
  },
  optionText: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 13,
    color: colors.text,
  },
  optionTextDestructive: {
    color: colors.error,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  cancelText: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 13,
    color: colors.slate300,
  },
});
