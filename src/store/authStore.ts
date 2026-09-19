import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';

interface User {
  name: string;
  email?: string;
  [key: string]: any;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  apiEnv: 'local' | 'production';
  user: User | null;
  login: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  updateAccessToken: (token: string) => Promise<void>;
  updateTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  updateLastActive: () => Promise<void>;
  setApiEnv: (env: 'local' | 'production') => Promise<void>;
  getApiUrl: () => string;
  initialize: () => Promise<void>;
}

const decodeUser = (token: string): User | null => {
  try {
    const decoded: any = jwtDecode(token);
    return {
      name: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || decoded.name || 'Usuario',
      email: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || decoded.email || '',
    };
  } catch (e) {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  apiEnv: 'local',
  user: null,
  login: async (accessToken: string, refreshToken: string) => {
    await SecureStore.setItemAsync('accessToken', accessToken);
    await SecureStore.setItemAsync('refreshToken', refreshToken);
    await SecureStore.setItemAsync('lastActiveAt', Date.now().toString());
    set({ accessToken, refreshToken, isAuthenticated: true, user: decodeUser(accessToken) });
  },
  logout: async () => {
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
  setApiEnv: async (env: 'local' | 'production') => {
    await SecureStore.setItemAsync('apiEnv', env);
    set({ apiEnv: env });
  },
  getApiUrl: () => {
    const env = get().apiEnv;
    // For local dev server (default for expo usually)
    const localUrl = 'http://192.168.1.144:5079';
    // The production url
    const prodUrl = 'https://nexodusback.atomsystems.org';
    return env === 'production' ? prodUrl : localUrl;
  },
  initialize: async () => {
    const SESSION_TIMEOUT = 48 * 60 * 60 * 1000; // 48 hours
    const accessToken = await SecureStore.getItemAsync('accessToken');
    const refreshToken = await SecureStore.getItemAsync('refreshToken');
    const lastActiveAtStr = await SecureStore.getItemAsync('lastActiveAt');
    const savedApiEnv = await SecureStore.getItemAsync('apiEnv') as 'local' | 'production' | null;
    
    if (savedApiEnv) {
      set({ apiEnv: savedApiEnv });
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
