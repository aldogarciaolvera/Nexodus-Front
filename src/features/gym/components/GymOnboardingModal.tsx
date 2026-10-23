import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UserService, UserProfile } from '../../../services/user.service';
import { queryKeys } from '../../../services/queryKeys';
import { useAlertStore, AlertState } from '../../../store/alertStore';
import { useTheme } from '../../../utils/ThemeContext';
import { ThemeColors } from '../../../utils/theme';

interface GymOnboardingModalProps {
  profile?: UserProfile | null;
}

export const GymOnboardingModal: React.FC<GymOnboardingModalProps> = ({ profile }) => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);
  const queryClient = useQueryClient();
  const showAlert = useAlertStore((state: AlertState) => state.showAlert);

  const [inputWeight, setInputWeight] = useState(profile?.weight ? profile.weight.toString() : '');
  const [inputHeight, setInputHeight] = useState(profile?.height ? profile.height.toString() : '');

  const mutation = useMutation({
    mutationFn: UserService.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.gym.profile });
      showAlert('Guardado', 'Tus datos corporales fueron actualizados', 'success');
    },
    onError: () => {
      showAlert('Error', 'No se pudieron guardar tus datos', 'error');
    }
  });

  const handleSaveBodyData = () => {
    if (!inputWeight || !inputHeight) {
      showAlert('Requerido', 'Por favor ingresa tu peso y altura.', 'error');
      return;
    }

    mutation.mutate({
      ...profile,
      username: profile?.username || '',
      email: profile?.email || '',
      phoneNumber: profile?.phoneNumber || '',
      weight: parseFloat(inputWeight),
      height: parseFloat(inputHeight),
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.onboardingCard}>
            <Text style={styles.onboardingTitle}>Bienvenido al Gym</Text>
            <Text style={styles.onboardingSub}>
              Para personalizar tus rutinas y calorías, necesitamos un par de datos tuyos.
            </Text>
            
            <View style={{ marginBottom: 16 }}>
              <Text style={styles.onboardingLabel}>Peso (kg)</Text>
              <TextInput 
                style={styles.onboardingInput}
                placeholder="70.5"
                placeholderTextColor={theme.colors.mutedText}
                keyboardType="numeric"
                value={inputWeight}
                onChangeText={setInputWeight}
              />
            </View>

            <View style={{ marginBottom: 24 }}>
              <Text style={styles.onboardingLabel}>Altura (m)</Text>
              <TextInput 
                style={styles.onboardingInput}
                placeholder="1.75"
                placeholderTextColor={theme.colors.mutedText}
                keyboardType="numeric"
                value={inputHeight}
                onChangeText={setInputHeight}
              />
            </View>

            <TouchableOpacity 
              style={[styles.onboardingBtn, mutation.isPending && { opacity: 0.7 }]} 
              onPress={handleSaveBodyData}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <ActivityIndicator color={theme.colors.obsidian} />
              ) : (
                <Text style={styles.onboardingBtnText}>Comenzar a Entrenar</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.obsidian,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  onboardingCard: {
    backgroundColor: colors.surface,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  onboardingTitle: {
    fontFamily: 'Geist_700Bold',
    fontSize: 24,
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  onboardingSub: {
    fontFamily: 'Geist_400Regular',
    fontSize: 14,
    color: colors.mutedText,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  onboardingLabel: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 11,
    color: colors.mutedText,
    marginBottom: 8,
  },
  onboardingInput: {
    backgroundColor: colors.obsidian,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    borderRadius: 12,
    padding: 16,
    color: colors.text,
    fontFamily: 'Geist_500Medium',
    fontSize: 16,
  },
  onboardingBtn: {
    backgroundColor: colors.neonCyan,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  onboardingBtnText: {
    fontFamily: 'Geist_700Bold',
    fontSize: 16,
    color: colors.obsidian,
  }
});
