import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TouchableWithoutFeedback } from 'react-native';
import { useTheme } from '../utils/ThemeContext';
import { ThemeColors } from '../utils/theme';

interface DropdownOption {
  label: string;
  onPress: () => void;
  icon?: React.ReactNode;
}

interface DropdownMenuProps {
  visible: boolean;
  onClose: () => void;
  options: DropdownOption[];
}

export const DropdownMenu = ({ visible, onClose, options }: DropdownMenuProps) => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.menuContainer}>
              {options.map((option, index) => (
                <TouchableOpacity 
                  key={index}
                  style={[
                    styles.menuItem,
                    index < options.length - 1 && styles.borderBottom
                  ]}
                  onPress={() => {
                    option.onPress();
                    onClose();
                  }}
                  activeOpacity={0.8}
                >
                  {option.icon}
                  <Text style={styles.menuLabel}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)', // Very subtle overlay
  },
  menuContainer: {
    position: 'absolute',
    top: 80, // Adjust based on header height (approximate)
    right: 20,
    width: 200,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderGlow,
  },
  menuLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 14,
    color: colors.text,
  },
});
