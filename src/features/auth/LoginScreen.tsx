import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { theme } from '../../utils/theme';
import { AuthService } from '../../services/auth.service';
import { useAuthStore } from '../../store/authStore';

export const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const login = useAuthStore(state => state.login);

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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Nexodus</Text>
          <Text style={styles.subtitle}>Command Center Authentication</Text>
        </View>

        <View style={styles.form}>
          <Input 
            label="EMAIL" 
            placeholder="Enter your email" 
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Input 
            label="PASSWORD" 
            placeholder="Enter your password" 
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          
          <Button 
            title="SYSTEM INITIATION" 
            onPress={handleLogin} 
            loading={loading}
            style={styles.submitButton}
          />
        </View>
      </KeyboardAvoidingView>
      <Text style={styles.versionText}>v0.0.2</Text>
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
    paddingHorizontal: theme.metrics.marginHorizontal,
    justifyContent: 'center',
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
  }
});
