import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, TextInput, Modal, TouchableWithoutFeedback, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../utils/ThemeContext';
import { ThemeColors } from '../../utils/theme';
import { useAuthStore } from '../../store/authStore';
import { UserService, UserProfile } from '../../services/user.service';
import Constants from 'expo-constants';

export const SettingsScreen = () => {
  const theme = useTheme();
  const { isDarkMode, toggleTheme } = theme;
  const styles = createStyles(theme.colors);
  const navigation = useNavigation();
  const { logout, user, accessToken, refreshToken, updateAccessToken, updateTokens } = useAuthStore();
  const [isProfileModalVisible, setProfileModalVisible] = useState(false);
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await UserService.getProfile();
        setProfile(data);
        setEditUsername(data.username);
        setEditEmail(data.email);
        setEditPhone(data.phoneNumber);
      } catch (e) {
        console.error('Error fetching profile:', e);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const updatedProfile = await UserService.updateProfile({
        username: editUsername,
        email: editEmail,
        phoneNumber: editPhone,
      });
      setProfile(updatedProfile);
      setProfileModalVisible(false);
    } catch (e) {
      console.error('Error updating profile:', e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={theme.colors.text} strokeWidth={2}>
            <Path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configuración</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileAvatar}>
            <Svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke={theme.colors.mutedText} strokeWidth={1.5}>
              <Path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </Svg>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.nameText}>{profile?.username || user?.name || 'Usuario'}</Text>
          </View>
          <TouchableOpacity onPress={() => setProfileModalVisible(true)} style={styles.editButton} activeOpacity={0.7}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={theme.colors.neonCyan} strokeWidth={1.5}>
              <Path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.89 1.12l-2.827.93a.75.75 0 01-.95-.95l.93-2.827a4.5 4.5 0 011.12-1.89l13.647-13.647z" />
            </Svg>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>PREFERENCIAS</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.row}>
            <View>
              <Text style={styles.rowTitle}>Tema Oscuro</Text>
              <Text style={styles.rowSubtitle}>Cambiar entre modo claro y oscuro</Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: theme.colors.slate600, true: theme.colors.neonCyan }}
              thumbColor={theme.colors.white}
            />
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.8}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>v{Constants.expoConfig?.version || '0.0.2'}</Text>
      </View>

      {/* Edit Profile Modal */}
      <Modal
        visible={isProfileModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableWithoutFeedback onPress={() => setProfileModalVisible(false)}>
            <View style={styles.modalOverlayBackground} />
          </TouchableWithoutFeedback>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Perfil</Text>
            
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
            
            <TouchableOpacity 
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} 
              onPress={handleSave}
              activeOpacity={0.8}
              disabled={isSaving}
            >
              <Text style={styles.saveButtonText}>{isSaving ? 'Guardando...' : 'Guardar'}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderGlow,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontFamily: 'Geist_500Medium',
    fontSize: 18,
    color: colors.text,
  },
  content: {
    padding: 20,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    padding: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowTitle: {
    fontFamily: 'Geist_500Medium',
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  rowSubtitle: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 11,
    color: colors.slate400,
  },
  testButton: {
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderWidth: 1,
    borderColor: colors.neonCyan,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  testButtonText: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 10,
    color: colors.neonCyan,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  profileInfo: {
    flex: 1,
  },
  nameText: {
    fontFamily: 'Geist_700Bold',
    fontSize: 18,
    color: colors.text,
  },
  editButton: {
    padding: 8,
    backgroundColor: colors.surfaceLight,
    borderRadius: 8,
  },
  sectionHeader: {
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionHeaderText: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 10,
    color: colors.slate400,
    letterSpacing: 1,
  },
  logoutButton: {
    marginTop: 32,
    backgroundColor: colors.error,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 16,
    color: '#FFFFFF',
  },
  versionText: {
    marginTop: 24,
    textAlign: 'center',
    color: colors.slate500,
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 10,
    letterSpacing: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlayBackground: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(13, 14, 17, 0.8)',
  },
  modalContent: {
    width: '85%',
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    maxHeight: '80%',
  },
  modalTitle: {
    fontFamily: 'Geist_700Bold',
    fontSize: 20,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalAvatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  inputLabel: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 12,
    color: colors.slate400,
    marginBottom: 8,
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
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 16,
    color: colors.obsidian,
  },
});
