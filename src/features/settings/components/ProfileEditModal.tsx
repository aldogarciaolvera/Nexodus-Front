import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableWithoutFeedback, KeyboardAvoidingView, Platform, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UserService, UserProfile } from '../../../services/user.service';
import { useAuthStore } from '../../../store/authStore';
import { useAlertStore, AlertState } from '../../../store/alertStore';
import { queryKeys } from '../../../services/queryKeys';
import { useTheme } from '../../../utils/ThemeContext';
import { ThemeColors } from '../../../utils/theme';

interface ProfileEditModalProps {
  visible: boolean;
  onClose: () => void;
  profile?: UserProfile;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  visible,
  onClose,
  profile,
}) => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);
  const queryClient = useQueryClient();
  const showAlert = useAlertStore((state: AlertState) => state.showAlert);
  const { accessToken, refreshToken, updateTokens, updateAccessToken, getApiUrl } = useAuthStore();

  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editWeight, setEditWeight] = useState('');
  const [editHeight, setEditHeight] = useState('');

  useEffect(() => {
    if (profile) {
      setEditUsername(profile.username || '');
      setEditEmail(profile.email || '');
      setEditPhone(profile.phoneNumber || '');
      setEditWeight(profile.weight ? profile.weight.toString() : '');
      setEditHeight(profile.height ? profile.height.toString() : '');
    }
  }, [profile]);

  const mutation = useMutation({
    mutationFn: UserService.updateProfile,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.profile });
      
      if (accessToken && refreshToken) {
        try {
          const apiUrl = getApiUrl();
          const response = await fetch(`${apiUrl}/api/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: accessToken, refreshToken })
          });
          if (response.ok) {
            const data = await response.json();
            const newToken = data.content?.token || data.token || data.content?.accessToken || data.accessToken;
            const newRefreshToken = data.content?.refreshToken || data.refreshToken;
            
            if (newToken && newRefreshToken) {
              await updateTokens(newToken, newRefreshToken);
            } else if (newToken) {
              await updateAccessToken(newToken);
            }
          }
        } catch (e) {
          console.error('Error refreshing token after profile update', e);
        }
      }
      
      onClose();
      showAlert('Perfil Actualizado', 'Tus cambios fueron guardados exitosamente', 'success');
    },
    onError: (e) => {
      console.error('Error updating profile:', e);
      showAlert('Error', 'No se pudo guardar el perfil', 'error');
    }
  });

  const handleSave = () => {
    mutation.mutate({
      username: editUsername,
      email: editEmail,
      phoneNumber: editPhone,
      weight: editWeight ? parseFloat(editWeight) : undefined,
      height: editHeight ? parseFloat(editHeight) : undefined,
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.modalOverlayBackground} />
        </TouchableWithoutFeedback>
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.modalContent}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={styles.modalTitle}>Editar Perfil</Text>
              <TouchableOpacity 
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Cerrar modal de edición de perfil"
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={{ padding: 4 }}
              >
                <Text style={{ color: theme.colors.mutedText, fontSize: 18, fontFamily: 'Geist_500Medium' }}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalAvatarContainer}>
              <View style={styles.modalAvatar}>
                <Svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke={theme.colors.mutedText} strokeWidth={1.5}>
                  <Path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </Svg>
              </View>
            </View>

            <Text style={styles.inputLabel}>Nombre</Text>
            <TextInput 
              style={styles.modalInput}
              value={editUsername}
              onChangeText={setEditUsername}
              placeholder="Tu Nombre"
              placeholderTextColor={theme.colors.slate500}
            />

            <Text style={styles.inputLabel}>Correo Electrónico</Text>
            <TextInput 
              style={styles.modalInput}
              value={editEmail}
              onChangeText={setEditEmail}
              placeholder="tu@correo.com"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={theme.colors.slate500}
            />

            <Text style={styles.inputLabel}>Número de Teléfono</Text>
            <TextInput 
              style={styles.modalInput}
              value={editPhone}
              onChangeText={setEditPhone}
              placeholder="Teléfono"
              keyboardType="phone-pad"
              placeholderTextColor={theme.colors.slate500}
            />

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Peso (kg)</Text>
                <TextInput 
                  style={styles.modalInput}
                  value={editWeight}
                  onChangeText={setEditWeight}
                  placeholder="70.5"
                  keyboardType="numeric"
                  placeholderTextColor={theme.colors.slate500}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Altura (m)</Text>
                <TextInput 
                  style={styles.modalInput}
                  value={editHeight}
                  onChangeText={setEditHeight}
                  placeholder="1.75"
                  keyboardType="numeric"
                  placeholderTextColor={theme.colors.slate500}
                />
              </View>
            </View>
            
            <TouchableOpacity 
              style={[styles.saveButton, mutation.isPending && styles.saveButtonDisabled]} 
              onPress={handleSave}
              activeOpacity={0.8}
              disabled={mutation.isPending}
              accessibilityRole="button"
              accessibilityLabel="Guardar cambios de perfil"
              accessibilityState={{ disabled: mutation.isPending, busy: mutation.isPending }}
            >
              {mutation.isPending ? (
                <ActivityIndicator color={theme.colors.obsidian} />
              ) : (
                <Text style={styles.saveButtonText}>Guardar</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
  },
  modalOverlayBackground: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(11, 13, 17, 0.85)',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  modalContent: {
    width: '88%',
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  modalTitle: {
    fontFamily: 'Geist_700Bold',
    fontSize: 20,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalAvatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  inputLabel: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 11,
    color: colors.slate400,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 12,
    padding: 14,
    color: colors.text,
    fontFamily: 'Geist_500Medium',
    fontSize: 14,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: colors.neonCyan,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 16,
    color: colors.obsidian,
  },
});
