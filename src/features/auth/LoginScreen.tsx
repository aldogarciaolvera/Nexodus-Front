import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity, ScrollView, ScrollViewInstance, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { useTheme } from '../../utils/ThemeContext';
import { ThemeColors, ThemeTypography, ThemeMetrics } from '../../utils/theme';
import { AuthService } from '../../services/auth.service';
import { useAuthStore } from '../../store/authStore';
import { useNavigation } from '@react-navigation/native';

import { useAlertStore } from '../../store/alertStore';
import { normalizeErrorMessage } from '../../services/api';

export const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const theme = useTheme();
  const styles = createStyles(theme.colors, theme.typography, theme.metrics);
  
  const login = useAuthStore(state => state.login);
  const navigation = useNavigation<any>();

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

  const handleLogin = async () => {
    if (!email || !password) {
      const msg = 'Por favor ingresa tu correo y contraseña';
      setError(msg);
      useAlertStore.getState().showAlert('Campos Incompletos', msg, 'info');
      return;
    }
    
    setError('');
    setLoading(true);
    
    try {
      const data = await AuthService.login({ email, password });
      const token = data.token || data.accessToken;
      if (!token) throw new Error('No se recibió el token de autenticación del servidor');
      await login(token, data.refreshToken);
    } catch (err: any) {
      const msg = normalizeErrorMessage(err);
      setError(msg);
      useAlertStore.getState().showAlert('Error al Iniciar Sesión', msg, 'error');
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
            <Text style={styles.title}>Nexodus</Text>
            <Text style={styles.subtitle}>Centro de control</Text>
          </View>

          <View style={styles.form}>
            <Input 
              label="EMAIL" 
              placeholder="Ingresa tu correo electrónico" 
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              onFocus={() => handleFocusField(0)}
            />
            <Input 
              label="PASSWORD" 
              placeholder="Ingresa tu contraseña" 
              value={password}
              onChangeText={setPassword}
              isPassword
              onFocus={() => handleFocusField(80)}
            />
            
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            
            <Button 
              title="Iniciar Sesión" 
              onPress={handleLogin} 
              loading={loading}
              style={styles.submitButton}
            />
            
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>¿No tienes cuenta? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.registerLink}>Regístrate</Text>
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
    paddingBottom: 80,
  },
  header: {
    marginBottom: 48,
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
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  registerText: {
    color: colors.slate400,
    fontFamily: typography.fontFamily,
    fontSize: 14,
  },
  registerLink: {
    color: colors.neonCyan,
    fontFamily: typography.fontFamilyBold,
    fontSize: 14,
    textDecorationLine: 'underline',
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
