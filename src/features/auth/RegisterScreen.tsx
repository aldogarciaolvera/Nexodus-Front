import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { theme } from '../../utils/theme';
import { AuthService } from '../../services/auth.service';
import { useAuthStore } from '../../store/authStore';
import { useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';

export const RegisterScreen = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const login = useAuthStore(state => state.login);
  const navigation = useNavigation();

  const handleRegister = async () => {
    // Validations
    if (!username || !email || !password || !confirmPassword || !phoneNumber) {
      setError('Por favor completa todos los campos requeridos');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
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
      setError(err.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          keyboardShouldPersistTaps="handled"
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
            />
            
            <Input 
              label="EMAIL" 
              placeholder="Ingresa tu correo electrónico" 
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            
            <Input 
              label="TELÉFONO" 
              placeholder="Ingresa tu número de teléfono" 
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />
            
            <Input 
              label="CONTRASEÑA" 
              placeholder="Crea una contraseña" 
              value={password}
              onChangeText={setPassword}
              isPassword
            />

            <Input 
              label="CONFIRMAR CONTRASEÑA" 
              placeholder="Confirma tu contraseña" 
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              isPassword
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
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <Text style={styles.versionText}>v{Constants.expoConfig?.version || '0.0.3'}</Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.obsidian,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.metrics.marginHorizontal,
    paddingVertical: 40,
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 40,
    color: theme.colors.white,
    letterSpacing: -1.2,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: theme.typography.fontMono,
    fontSize: 13,
    color: theme.colors.neonCyan,
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
    color: '#ffb4ab',
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  versionText: {
    position: 'absolute',
    bottom: 24,
    width: '100%',
    textAlign: 'center',
    color: theme.colors.slate500,
    fontFamily: theme.typography.fontMono,
    fontSize: 10,
    letterSpacing: 1,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    paddingBottom: 24,
  },
  loginText: {
    color: theme.colors.slate400,
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
  },
  loginLink: {
    color: theme.colors.neonCyan,
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 14,
    textDecorationLine: 'underline',
  }
});
