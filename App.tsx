import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useFonts } from 'expo-font';
import { Geist_400Regular, Geist_500Medium, Geist_700Bold } from '@expo-google-fonts/geist';
import { JetBrainsMono_400Regular, JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono';
import React, { useEffect, useState } from 'react';

import { DashboardScreen } from './src/features/dashboard/DashboardScreen';
import { FinanceScreen } from './src/features/finance/FinanceScreen';
import { AllTransactionsScreen } from './src/features/finance/AllTransactionsScreen';
import { SettingsScreen } from './src/features/settings/SettingsScreen';
import { LoginScreen } from './src/features/auth/LoginScreen';
import { RegisterScreen } from './src/features/auth/RegisterScreen';
import { TasksScreen } from './src/features/tasks/TasksScreen';
import { AllTasksScreen } from './src/features/tasks/AllTasksScreen';
import { BottomNav } from './src/components/BottomNav';
import { View, ActivityIndicator, AppState, AppStateStatus } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './src/store/authStore';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ThemeProvider, useTheme } from './src/utils/ThemeContext';
import { GlobalAlert } from './src/components/GlobalAlert';
import { useOTAUpdates } from './src/hooks/useOTAUpdates';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const queryClient = new QueryClient();

function MainTabs() {
  return (
    <Tab.Navigator 
      tabBar={(props) => <BottomNav {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Tasks" component={TasksScreen} />
      <Tab.Screen name="Gym" component={DashboardScreen} />
      <Tab.Screen name="Meals" component={DashboardScreen} />
      <Tab.Screen name="Money" component={FinanceScreen} />
    </Tab.Navigator>
  );
}

function AppInner() {
  const { isAuthenticated, initialize, updateLastActive } = useAuthStore();
  const [isReady, setIsReady] = useState(false);
  const theme = useTheme();
  const { isDarkMode } = theme;
  
  // Hook for OTA updates
  useOTAUpdates();

  useEffect(() => {
    initialize().finally(() => setIsReady(true));
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        updateLastActive();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [updateLastActive]);

  const [fontsLoaded] = useFonts({
    Geist_400Regular,
    Geist_500Medium,
    Geist_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  });

  const AppTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: theme.colors.obsidian,
    },
  };

  if (!fontsLoaded || !isReady) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.obsidian, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={theme.colors.neonCyan} />
      </View>
    );
  }

  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: theme.colors.obsidian }}>
      <NavigationContainer theme={AppTheme}>
        <StatusBar style={isDarkMode ? "light" : "dark"} />
        <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.obsidian } }}>
          {isAuthenticated ? (
            <>
              <Stack.Screen name="MainTabs" component={MainTabs} />
              <Stack.Screen name="AllTransactions" component={AllTransactionsScreen} />
              <Stack.Screen name="AllTasks" component={AllTasksScreen} />
              <Stack.Screen name="Settings" component={SettingsScreen} />
            </>
          ) : (
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AppInner />
        <GlobalAlert />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
