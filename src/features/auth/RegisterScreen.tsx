import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity, ScrollView, ScrollViewInstance, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { useTheme } from '../../utils/ThemeContext';
import { ThemeColors, ThemeTypography, ThemeMetrics } from '../../utils/theme';
import { AuthService } from '../../services/auth.service';
import { useAuthStore } from '../../store/authStore';
import { useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';

import { useAlertStore } from '../../store/alertStore';
import { normalizeErrorMessage } from '../../services/api';

export const RegisterScreen = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const theme = useTheme();
  const styles = createStyles(theme.colors, theme.typography, theme.metrics);
  
  const login = useAuthStore(state => state.login);
  const navigation = useNavigation();

  const scrollViewRef = useRef<ScrollViewInstance>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Dynamic keyboard height listener to expand scroll bounds and prevent inputs being obscured
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleFocusField = (yOffset: number) => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        y: yOffset,
        animated: true,
      });
    }, 120);
  };

  const handleRegister = async () => {
    // Validations
    if (!username || !email || !password || !confirmPassword || !phoneNumber) {
      const msg = 'Por favor completa todos los campos requeridos';
      setError(msg);
      useAlertStore.getState().showAlert('Campos Incompletos', msg, 'info');
      return;
    }

    if (password !== confirmPassword) {
      const msg = 'Las contraseñas no coinciden';
      setError(msg);
      useAlertStore.getState().showAlert('Contraseñas no coinciden', msg, 'error');
      return;
    }

    if (password.length < 6) {
      const msg = 'La contraseña debe tener al menos 6 caracteres';
      setError(msg);
      useAlertStore.getState().showAlert('Contraseña muy corta', msg, 'info');
      return;
    }

    setError('');
    setLoading(true);
    
    try {
      const response = await AuthService.register({
        username,
        email,
        password,
        phoneNumber
      });

      // Based on feedback, backend returns { token, refreshToken, username, ... }
      const token = response.token || response.accessToken;
      if (!token) throw new Error('No se recibió el token de acceso');
      
      await login(token, response.refreshToken);
    } catch (err: any) {
      const msg = normalizeErrorMessage(err);
      setError(msg);
      useAlertStore.getState().showAlert('Error al Registrarse', msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          ref={scrollViewRef}
          contentContainerStyle={[
            styles.scrollContent,
            keyboardHeight > 0 && {
              paddingBottom: keyboardHeight + 80,
              justifyContent: 'flex-start',
            }
          ]} 
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets={true}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Crear Cuenta</Text>
            <Text style={styles.subtitle}>Únete a Nexodus</Text>
          </View>

          <View style={styles.form}>
            <Input 
              label="USUARIO" 
              placeholder="Ingresa tu nombre de usuario" 
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              onFocus={() => handleFocusField(0)}
            />
            
            <Input 
              label="EMAIL" 
              placeholder="Ingresa tu correo electrónico" 
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              onFocus={() => handleFocusField(60)}
            />
            
            <Input 
              label="TELÉFONO" 
              placeholder="Ingresa tu número de teléfono" 
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              onFocus={() => handleFocusField(140)}
            />
            
            <Input 
              label="CONTRASEÑA" 
              placeholder="Crea una contraseña" 
              value={password}
              onChangeText={setPassword}
              isPassword
              onFocus={() => handleFocusField(220)}
            />

            <Input 
              label="CONFIRMAR CONTRASEÑA" 
              placeholder="Confirma tu contraseña" 
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              isPassword
              onFocus={() => handleFocusField(300)}
            />
            
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            
            <Button 
              title="Registrarse" 
              onPress={handleRegister} 
              loading={loading}
              style={styles.submitButton}
            />
            
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>¿Ya tienes cuenta? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login' as never)}>
                <Text style={styles.loginLink}>Inicia Sesión</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.versionText}>v{Constants.expoConfig?.version || '0.0.10'}</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors, typography: ThemeTypography, metrics: ThemeMetrics) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.obsidian,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: metrics.marginHorizontal,
    paddingTop: 40,
    paddingBottom: 80,
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontFamily: typography.fontFamilyBold,
    fontSize: 40,
    color: colors.text,
    letterSpacing: -1.2,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: typography.fontMono,
    fontSize: 13,
    color: colors.neonCyan,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  form: {
    width: '100%',
  },
  submitButton: {
    marginTop: 24,
  },
  errorText: {
    color: colors.error,
    fontFamily: typography.fontFamily,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginText: {
    color: colors.slate400,
    fontFamily: typography.fontFamily,
    fontSize: 14,
  },
  loginLink: {
    color: colors.neonCyan,
    fontFamily: typography.fontFamilyBold,
    fontSize: 14,
  },
  versionText: {
    marginTop: 24,
    textAlign: 'center',
    color: colors.slate500,
    fontFamily: typography.fontMono,
    fontSize: 10,
    letterSpacing: 1,
  },
});
