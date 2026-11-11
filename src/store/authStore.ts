import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
import { AuthService } from '../services/auth.service';

interface User {
  name: string;
  email?: string;
  role?: string | string[];
  [key: string]: any;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  user: User | null;
  login: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  updateAccessToken: (token: string) => Promise<void>;
  updateTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  updateLastActive: () => Promise<void>;
  getApiUrl: () => string;
  initialize: () => Promise<void>;
}

const decodeUser = (token: string): User | null => {
  try {
    const decoded: any = jwtDecode(token);
    return {
      name: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || decoded.name || 'Usuario',
      email: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || decoded.email || '',
      role: decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || decoded.role || '',
    };
  } catch (e) {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  user: null,
  login: async (accessToken: string, refreshToken: string) => {
    await SecureStore.setItemAsync('accessToken', accessToken);
    await SecureStore.setItemAsync('refreshToken', refreshToken);
    await SecureStore.setItemAsync('lastActiveAt', Date.now().toString());
    set({ accessToken, refreshToken, isAuthenticated: true, user: decodeUser(accessToken) });
  },
  logout: async () => {
    const refreshToken = await SecureStore.getItemAsync('refreshToken');
    if (refreshToken) {
      await AuthService.logout(refreshToken).catch(() => {});
    }
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    await SecureStore.deleteItemAsync('lastActiveAt');
    set({ accessToken: null, refreshToken: null, isAuthenticated: false, user: null });
  },
  updateAccessToken: async (token: string) => {
    await SecureStore.setItemAsync('accessToken', token);
    set((state) => ({ accessToken: token, user: decodeUser(token) || state.user }));
  },
  updateTokens: async (accessToken: string, refreshToken: string) => {
    await SecureStore.setItemAsync('accessToken', accessToken);
    await SecureStore.setItemAsync('refreshToken', refreshToken);
    set((state) => ({ accessToken, refreshToken, user: decodeUser(accessToken) || state.user }));
  },
  updateLastActive: async () => {
    if (useAuthStore.getState().isAuthenticated) {
      await SecureStore.setItemAsync('lastActiveAt', Date.now().toString());
    }
  },
  getApiUrl: () => {
    // 1. Variable explícita de entorno (inyectada por EAS Build o .env)
    if (process.env.EXPO_PUBLIC_API_URL) {
      return process.env.EXPO_PUBLIC_API_URL;
    }
    // 2. Compilaciones preview, producción o modo release fuera de desarrollo local
    if (!__DEV__ || process.env.APP_VARIANT === 'preview' || process.env.APP_VARIANT === 'production') {
      return 'https://nexodusback.atomsystems.org';
    }
    // 3. Fallback en desarrollo local
    return 'http://192.168.1.33:5079';
  },
  initialize: async () => {
    const SESSION_TIMEOUT = 48 * 60 * 60 * 1000; // 48 hours
    const accessToken = await SecureStore.getItemAsync('accessToken');
    const refreshToken = await SecureStore.getItemAsync('refreshToken');
    const lastActiveAtStr = await SecureStore.getItemAsync('lastActiveAt');
    
    // Limpieza segura de llaves obsoletas
    try {
      await SecureStore.deleteItemAsync('apiEnv');
    } catch {
      // Ignorar si no existe
    }
    
    if (accessToken && refreshToken) {
      if (lastActiveAtStr) {
        const lastActiveAt = parseInt(lastActiveAtStr, 10);
        if (Date.now() - lastActiveAt > SESSION_TIMEOUT) {
          // Session expired due to inactivity
          await SecureStore.deleteItemAsync('accessToken');
          await SecureStore.deleteItemAsync('refreshToken');
          await SecureStore.deleteItemAsync('lastActiveAt');
          set({ isAuthenticated: false, user: null });
          return;
        }
      }
      
      // Update last active time since we're initializing and it's valid
      await SecureStore.setItemAsync('lastActiveAt', Date.now().toString());
      set({ accessToken, refreshToken, isAuthenticated: true, user: decodeUser(accessToken) });
    } else {
      set({ isAuthenticated: false, user: null });
    }
  },
}));
