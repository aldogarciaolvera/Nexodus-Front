import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../utils/ThemeContext';
import { ThemeColors } from '../../utils/theme';
import { Header } from '../../components/Header';
import { Plus } from 'lucide-react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { AppNavigationProp, RootTabParamList } from '../../utils/navigation';
import { GymView } from '../gym/components/GymView';
import { DietView } from '../diet/components/DietView';

export type FitTabType = 'gym' | 'diet';

interface FitScreenProps {
  initialTab?: FitTabType;
}

export const FitScreen: React.FC<FitScreenProps> = ({ initialTab }) => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);
  const navigation = useNavigation<AppNavigationProp>();
  const route = useRoute<RouteProp<RootTabParamList, 'Fit'>>();

  const defaultTab: FitTabType = initialTab || route?.params?.initialTab || 'gym';
  const [activeTab, setActiveTab] = useState<FitTabType>(defaultTab);

  useEffect(() => {
    if (route?.params?.initialTab) {
      setActiveTab(route.params.initialTab);
    }
  }, [route?.params?.initialTab]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContainer} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header dinámico según la sección activa */}
            <Header title={activeTab === 'gym' ? 'Gym & Rutinas' : 'Dieta & Macros'} />

            {/* Switch estilo Ideas & Diario para Gym & Dieta */}
            <View style={styles.typeToggle}>
              <TouchableOpacity 
                style={[styles.toggleBtn, activeTab === 'gym' && styles.toggleBtnActive]}
                onPress={() => setActiveTab('gym')}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Ver sección de Gym y entrenamiento"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={[styles.toggleText, activeTab === 'gym' && styles.toggleTextActive]}>
                  Gym
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.toggleBtn, activeTab === 'diet' && styles.toggleBtnActive]}
                onPress={() => setActiveTab('diet')}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Ver sección de Dieta y macronutrientes"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={[styles.toggleText, activeTab === 'diet' && styles.toggleTextActive]}>
                  Dieta
                </Text>
              </TouchableOpacity>
            </View>

            {/* Vista según la pestaña activa */}
            {activeTab === 'gym' ? (
              <GymView />
            ) : (
              <DietView />
            )}

            <View style={{ height: 100 }} />
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Botón flotante para crear rutina (únicamente visible en la pestaña Gym) */}
        {activeTab === 'gym' && (
          <TouchableOpacity 
            style={styles.fab} 
            activeOpacity={0.8}
            onPress={() => navigation.navigate('CreateRoutine')}
            accessibilityRole="button"
            accessibilityLabel="Crear nueva rutina de entrenamiento"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Plus color={theme.colors.obsidian} size={24} />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.obsidian,
  },
  container: {
    flex: 1,
    backgroundColor: colors.obsidian,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 24 : 12,
    paddingBottom: 100,
  },
  typeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    marginTop: 16,
    marginBottom: 24,
    alignSelf: 'center',
    width: '80%',
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBtnActive: {
    backgroundColor: colors.neonCyan,
  },
  toggleText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    color: colors.mutedText,
  },
  toggleTextActive: {
    fontFamily: 'Geist_700Bold',
    color: colors.obsidian,
  },
  fab: {
    position: 'absolute',
    bottom: 100, // Sobre la barra inferior flotante
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.neonCyan,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
});
