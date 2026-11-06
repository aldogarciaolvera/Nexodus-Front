import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Flame } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { UserService } from '../../../services/user.service';
import { queryKeys } from '../../../services/queryKeys';
import { useTheme } from '../../../utils/ThemeContext';
import { ThemeColors } from '../../../utils/theme';
import { DietOnboardingView } from './DietOnboardingView';

interface DietSetupModalProps {
  visible: boolean;
  onClose: () => void;
}

export const DietSetupModal: React.FC<DietSetupModalProps> = ({ visible, onClose }) => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);

  const { data: profile } = useQuery({
    queryKey: queryKeys.user.profile,
    queryFn: UserService.getProfile,
    enabled: visible,
  });

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Flame size={20} color={theme.colors.neonCyan} />
              <View>
                <Text style={styles.headerTitle}>Plan Nutricional</Text>
                <Text style={styles.headerSubtitle}>Metas calóricas y macronutrientes</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Cerrar configuración de dieta"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={20} color={theme.colors.mutedText} />
            </TouchableOpacity>
          </View>

          {/* Form Scroll Content */}
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <DietOnboardingView
              profile={profile}
              isEditing={true}
              onCompleted={onClose}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.obsidian,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderGlow,
  },
  headerTitle: {
    fontFamily: 'Geist_700Bold',
    fontSize: 17,
    color: colors.text,
  },
  headerSubtitle: {
    fontFamily: 'Geist_400Regular',
    fontSize: 12,
    color: colors.mutedText,
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
    backgroundColor: colors.surfaceLight,
    borderRadius: 8,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
});
