import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../utils/ThemeContext';
import { ThemeColors } from '../../utils/theme';
import { Header } from '../../components/Header';
import { Plus } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { AppNavigationProp } from '../../utils/navigation';
import { GymView } from '../gym/components/GymView';
import { DietView } from '../diet/components/DietView';
import { useCarouselNavStore } from '../../store/carouselNavStore';

export type FitTabType = 'gym' | 'diet';

interface FitScreenProps {
  mode?: FitTabType;
  initialTab?: FitTabType;
}

export const FitScreen: React.FC<FitScreenProps> = ({ mode, initialTab }) => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);
  const navigation = useNavigation<AppNavigationProp>();
  const navigateToPage = useCarouselNavStore((s) => s.navigateToPage);

  const selectedMode = mode || initialTab || 'gym';
  const isGym = selectedMode === 'gym';

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
            {/* Header posicionado idénticamente a Dashboard */}
            <Header 
              title={isGym ? 'Gym & Rutinas' : 'Dieta & Macros'} 
              dots={{
                total: 2,
                active: isGym ? 0 : 1,
                onPressDot: (idx) => navigateToPage(idx === 0 ? 4 : 5),
              }}
            />

            {isGym ? <GymView /> : <DietView />}
            <View style={{ height: 100 }} />
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Botón flotante para crear rutina (únicamente visible en la vista Gym) */}
        {isGym && (
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
