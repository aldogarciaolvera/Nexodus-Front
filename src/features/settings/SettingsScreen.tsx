import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { Clock } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../utils/ThemeContext';
import { ThemeColors } from '../../utils/theme';
import { useAuthStore } from '../../store/authStore';
import { UserService } from '../../services/user.service';
import Constants from 'expo-constants';
import { AuthService } from '../../services/auth.service';
import { useQuery } from '@tanstack/react-query';
import { useAlertStore, AlertState } from '../../store/alertStore';
import { queryKeys } from '../../services/queryKeys';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as Updates from 'expo-updates';
import { ProfileEditModal } from './components/ProfileEditModal';
import { CustomTimePicker } from '../../components/CustomTimePicker';
import { 
  getGlobalReminderConfig, 
  scheduleGlobalReminder, 
  cancelGlobalReminder, 
  requestNotificationPermissions 
} from '../../utils/notifications';

export const SettingsScreen = () => {
  const theme = useTheme();
  const { isDarkMode, toggleTheme } = theme;
  const styles = createStyles(theme.colors);
  const navigation = useNavigation();
  const { logout, user, accessToken, refreshToken, updateTokens, updateAccessToken, apiEnv, setApiEnv, getApiUrl } = useAuthStore();
  const [isProfileModalVisible, setProfileModalVisible] = useState(false);
  const showAlert = useAlertStore((state: AlertState) => state.showAlert);

  const [globalReminderEnabled, setGlobalReminderEnabled] = useState(false);
  const [globalReminderTime, setGlobalReminderTime] = useState('20:00');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timePickerDate, setTimePickerDate] = useState(() => {
    const d = new Date();
    d.setHours(20, 0, 0, 0);
    return d;
  });
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);

  useEffect(() => {
    getGlobalReminderConfig().then(cfg => {
      setGlobalReminderEnabled(cfg.enabled);
      setGlobalReminderTime(cfg.time);
      const [h, m] = cfg.time.split(':').map(Number);
      const d = new Date();
      d.setHours(h || 20, m || 0, 0, 0);
      setTimePickerDate(d);
    });
  }, []);

  const handleToggleGlobalReminder = async (val: boolean) => {
    if (val) {
      const hasPermission = await requestNotificationPermissions();
      if (!hasPermission) {
        showAlert('Permiso Requerido', 'Debes conceder permisos de notificaciones para activar el recordatorio.', 'error');
        return;
      }
      const [h, m] = globalReminderTime.split(':').map(Number);
      const d = new Date();
      d.setHours(h || 20, m || 0, 0, 0);
      setTimePickerDate(d);
      setShowTimePicker(true);
    } else {
      await cancelGlobalReminder();
      setGlobalReminderEnabled(false);
      showAlert('Recordatorio Desactivado', 'Se ha cancelado el recordatorio diario de tareas.', 'info');
    }
  };

  const handleConfirmTime = async (selectedDate: Date) => {
    setShowTimePicker(false);
    const formatted = `${selectedDate.getHours().toString().padStart(2, '0')}:${selectedDate.getMinutes().toString().padStart(2, '0')}`;
    const success = await scheduleGlobalReminder(formatted);
    if (success) {
      setGlobalReminderEnabled(true);
      setGlobalReminderTime(formatted);
      showAlert('Recordatorio Guardado', `Se programó un recordatorio diario a las ${formatted} para revisar tus tareas.`, 'success');
    } else {
      showAlert('Error', 'No se pudo programar el recordatorio. Verifica tus permisos.', 'error');
    }
  };

  const handleCancelTimePicker = () => {
    setShowTimePicker(false);
  };

  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: queryKeys.user.profile,
    queryFn: UserService.getProfile,
  });



  const testNotification = async () => {
    if (!Device.isDevice) {
      showAlert('Error', 'Las notificaciones push requieren un dispositivo físico');
      return;
    }

    if (Constants.appOwnership === 'expo') {
      showAlert('Aviso', 'Las notificaciones no están disponibles en Expo Go en SDK 53+');
      return;
    }

    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      showAlert('Error', 'No se otorgaron permisos para notificaciones');
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "¡Hola desde Nexodus! 🚀",
          body: "Esta es una notificación de prueba para verificar que el sistema funciona.",
          sound: true,
          data: { test: 'true' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          channelId: 'default',
          seconds: 2,
        },
      });
      showAlert('Éxito', 'La notificación se mostrará en 2 segundos', 'success');
    } catch (e: any) {
      showAlert('Error', `Fallo al programar notificación: ${e.message}`);
    }
  };

  const handleCheckUpdates = async () => {
    if (isCheckingUpdates) return;
    setIsCheckingUpdates(true);

    try {
      if (__DEV__) {
        showAlert('Aviso', 'Las actualizaciones OTA no funcionan en modo desarrollo o Expo Go.');
        return;
      }

      if (!Updates.isEnabled) {
        const channel = Updates.channel || 'ninguno';
        const runtime = Updates.runtimeVersion || 'desconocido';
        showAlert(
          'Actualizaciones no disponibles',
          `Las actualizaciones OTA no están habilitadas en esta compilación.\n\n• Canal: ${channel}\n• Runtime: ${runtime}\n• Tipo: Build local / debug`
        );
        return;
      }
      
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        useAlertStore.getState().showAlert({
          title: 'Actualización disponible',
          message: 'Hay una nueva versión de Nexodus disponible. ¿Deseas descargarla e instalarla ahora?',
          type: 'info',
          buttons: [
            { text: 'Cancelar', style: 'cancel', onPress: () => useAlertStore.getState().hideAlert() },
            { 
              text: 'Actualizar', 
              style: 'default', 
              onPress: async () => {
                useAlertStore.getState().hideAlert();
                useAlertStore.getState().showAlert('Actualizando', 'Descargando actualización...', 'info');
                try {
                  await Updates.fetchUpdateAsync();
                  useAlertStore.getState().showAlert({
                    title: '¡Listo!',
                    message: 'La actualización se descargó correctamente. La app se reiniciará para aplicar los cambios.',
                    type: 'success',
                    buttons: [
                      { text: 'Reiniciar', style: 'default', onPress: () => Updates.reloadAsync() }
                    ]
                  });
                } catch (fetchErr: any) {
                  useAlertStore.getState().showAlert('Error', `No se pudo descargar la actualización: ${fetchErr.message}`);
                }
              }
            }
          ]
        });
      } else {
        const channel = Updates.channel || 'preview';
        const runtime = Updates.runtimeVersion || 'desconocido';
        const updateId = Updates.updateId ? `${Updates.updateId.substring(0, 8)}...` : 'Build nativa embebida';
        showAlert(
          'Al día', 
          `Estás usando la versión más reciente compatible con tu compilación.\n\n• Canal: ${channel}\n• Runtime: ${runtime}\n• Update ID: ${updateId}`,
          'success'
        );
      }
    } catch (error: any) {
      showAlert('Error', `No se pudo comprobar actualizaciones: ${error.message}`);
    } finally {
      setIsCheckingUpdates(false);
    }
  };

  const isTester = Array.isArray(user?.role) ? user.role.includes('Tester') : user?.role === 'Tester';

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

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
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
              accessibilityRole="switch"
              accessibilityLabel="Alternar tema oscuro"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.rowTitle}>Recordatorio Global de Tareas</Text>
            </View>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              {globalReminderEnabled && (
                <TouchableOpacity
                  style={styles.timeBadge}
                  onPress={() => {
                    const [h, m] = globalReminderTime.split(':').map(Number);
                    const d = new Date();
                    d.setHours(h || 20, m || 0, 0, 0);
                    setTimePickerDate(d);
                    setShowTimePicker(true);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Hora de recordatorio configurada: ${globalReminderTime}. Presiona para cambiar.`}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Clock color={theme.colors.neonCyan} size={14} style={{ marginRight: 5 }} />
                  <Text style={styles.timeBadgeText}>{globalReminderTime}</Text>
                </TouchableOpacity>
              )}

              <Switch
                value={globalReminderEnabled}
                onValueChange={handleToggleGlobalReminder}
                trackColor={{ false: theme.colors.slate600, true: theme.colors.neonCyan }}
                thumbColor={theme.colors.white}
                accessibilityRole="switch"
                accessibilityLabel="Activar recordatorio global de tareas"
              />
            </View>
          </View>
        </View>
        
        {__DEV__ && isTester && (
          <View style={[styles.card, { marginTop: 16 }]}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>Entorno Producción</Text>
                <Text style={styles.rowSubtitle}>Actual: {getApiUrl()}</Text>
              </View>
              <Switch
                value={apiEnv === 'production'}
                onValueChange={async (val) => {
                  const newEnv = val ? 'production' : 'local';
                  setApiEnv(newEnv);
                  
                  const url = newEnv === 'production' 
                    ? 'https://nexodusback.atomsystems.org/health'
                    : `${process.env.EXPO_PUBLIC_API_URL}/health`;
                    
                  console.log(`[Env Switch] Cambiando a ${newEnv}. Fetching: ${url}`);
                  try {
                    const response = await fetch(url);
                    const text = await response.text();
                    console.log(`[Env Switch] Respuesta exitosa de ${url}:`, text);
                  } catch (e) {
                    console.error(`[Env Switch] Falló la conexión a ${url}:`, e);
                  }
                }}
                trackColor={{ false: theme.colors.slate600, true: theme.colors.neonCyan }}
                thumbColor={theme.colors.white}
              />
            </View>

            <TouchableOpacity 
              style={[styles.logoutButton, { backgroundColor: theme.colors.surfaceLight, marginTop: 16, borderColor: theme.colors.neonCyan, borderWidth: 1 }]} 
              activeOpacity={0.8}
              onPress={async () => {
                try {
                  const apiUrl = getApiUrl();
                  const response = await fetch(`${apiUrl}/api/auth/refresh`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: accessToken, refreshToken })
                  });
                  const text = await response.text();
                  if (response.ok) {
                    const data = JSON.parse(text);
                    const newToken = data.content?.token || data.token || data.content?.accessToken || data.accessToken;
                    const newRefreshToken = data.content?.refreshToken || data.refreshToken;
                    
                    if (newToken && newRefreshToken) {
                      await updateTokens(newToken, newRefreshToken);
                      showAlert('Éxito', 'Token refrescado correctamente', 'success');
                    } else if (newToken) {
                      await updateAccessToken(newToken);
                      showAlert('Éxito', 'Access token refrescado correctamente', 'success');
                    } else {
                      showAlert('Error', 'No se encontraron tokens en la respuesta: ' + text);
                    }
                  } else {
                    showAlert('Error Refresh', `Status: ${response.status} Body: ${text}`);
                  }
                } catch (e: any) {
                  showAlert('Error Refresh', e.message || 'Error desconocido');
                }
              }}
            >
              <Text style={[styles.logoutText, { color: theme.colors.neonCyan }]}>Test Refresh Token</Text>
            </TouchableOpacity>

          </View>
        )}

        <View style={[styles.card, { marginTop: 16 }]}>
          <TouchableOpacity 
            style={[styles.logoutButton, { backgroundColor: theme.colors.surfaceLight, marginTop: 0, borderColor: theme.colors.neonCyan, borderWidth: 1 }]} 
            activeOpacity={0.8}
            onPress={testNotification}
          >
            <Text style={[styles.logoutText, { color: theme.colors.neonCyan }]}>Probar Notificación Push</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.logoutButton, 
              { 
                backgroundColor: theme.colors.surfaceLight, 
                marginTop: 12, 
                borderColor: theme.colors.neonCyan, 
                borderWidth: 1,
                opacity: isCheckingUpdates ? 0.7 : 1
              }
            ]} 
            activeOpacity={0.8}
            onPress={handleCheckUpdates}
            disabled={isCheckingUpdates}
          >
            {isCheckingUpdates ? (
              <ActivityIndicator color={theme.colors.neonCyan} size="small" />
            ) : (
              <Text style={[styles.logoutText, { color: theme.colors.neonCyan }]}>Buscar Actualizaciones</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.8}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>v{Constants.expoConfig?.version || '0.0.10'}</Text>
      </ScrollView>

      {/* Edit Profile Modal */}
      <ProfileEditModal
        visible={isProfileModalVisible}
        onClose={() => setProfileModalVisible(false)}
        profile={profile}
      />

      {/* Global Reminder Time Picker Modal */}
      <CustomTimePicker
        visible={showTimePicker}
        value={timePickerDate}
        onClose={handleCancelTimePicker}
        onConfirm={handleConfirmTime}
      />
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    padding: 20,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderGlow,
    marginVertical: 16,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderWidth: 1,
    borderColor: colors.neonCyan,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  timeBadgeText: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 13,
    color: colors.neonCyan,
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
});
