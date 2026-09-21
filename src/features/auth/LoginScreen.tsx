import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { theme } from '../../utils/theme';
import { AuthService } from '../../services/auth.service';
import { useAuthStore } from '../../store/authStore';
import { useNavigation } from '@react-navigation/native';

export const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const login = useAuthStore(state => state.login);
  const navigation = useNavigation<any>();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }
    
    setError('');
    setLoading(true);
    
    try {
      const data = await AuthService.login({ email, password });
      const token = data.token || data.accessToken;
      if (!token) throw new Error('Token is missing from server response');
      await login(token, data.refreshToken);
    } catch (err: any) {
      setError(err.message || 'Login failed');
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
          contentContainerStyle={styles.scrollContent} 
          keyboardShouldPersistTaps="handled"
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
            />
            <Input 
              label="PASSWORD" 
              placeholder="Ingresa tu contraseña" 
              value={password}
              onChangeText={setPassword}
              isPassword
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
    paddingBottom: 80, // added extra padding bottom
  },
  header: {
    marginBottom: 48,
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
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  registerText: {
    color: theme.colors.slate400,
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
  },
  registerLink: {
    color: theme.colors.neonCyan,
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 14,
    textDecorationLine: 'underline',
  }
});
