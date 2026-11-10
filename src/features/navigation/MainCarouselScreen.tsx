import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  StyleSheet,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useTheme } from '../../utils/ThemeContext';
import { BottomNav } from '../../components/BottomNav';
import { useCarouselNavStore } from '../../store/carouselNavStore';

// Las 7 pantallas/vistas del carrusel unificado
import { DashboardScreen } from '../dashboard/DashboardScreen';
import { JournalScreen } from '../journal/JournalScreen';
import { TasksScreen } from '../tasks/TasksScreen';
import { FitScreen } from '../fit/FitScreen';
import { FinanceScreen } from '../finance/FinanceScreen';

// Componentes memoizados para evitar renders innecesarios durante el swipe y selección de tabs
const MemoDashboard = React.memo(DashboardScreen);
const MemoIdeas = React.memo(() => <JournalScreen mode="idea" />);
const MemoDiario = React.memo(() => <JournalScreen mode="diario" />);
const MemoTasks = React.memo(TasksScreen);
const MemoGym = React.memo(() => <FitScreen mode="gym" />);
const MemoDiet = React.memo(() => <FitScreen mode="diet" />);
const MemoFinance = React.memo(FinanceScreen);

// Componente aislado de la barra inferior para que solo ella se re-renderice al cambiar de pestaña
const ConnectedBottomNav = React.memo(() => {
  const activeTab = useCarouselNavStore((s) => s.activeTab);
  const navigateToTab = useCarouselNavStore((s) => s.navigateToTab);

  return (
    <BottomNav
      activeTab={activeTab}
      onTabPress={navigateToTab}
    />
  );
});

export const MainCarouselScreen = () => {
  const theme = useTheme();
  const route = useRoute();
  const { width: screenWidth } = useWindowDimensions();
  const pagerRef = useRef<React.ElementRef<typeof ScrollView>>(null);

  const setCurrentPage = useCarouselNavStore((s) => s.setCurrentPage);
  const setScrollToPageFn = useCarouselNavStore((s) => s.setScrollToPageFn);

  // Registrar la función imperativa de scroll en el store global
  useEffect(() => {
    const scrollFn = (page: number, animated = true) => {
      pagerRef.current?.scrollTo({ x: page * screenWidth, animated });
    };
    setScrollToPageFn(scrollFn);
    return () => setScrollToPageFn(null);
  }, [screenWidth, setScrollToPageFn]);

  // Soporte para deep-linking o parámetros de navegación entre pantallas
  useEffect(() => {
    if (route.params) {
      const p = route.params as any;
      const navFn = useCarouselNavStore.getState().navigateToTab;
      if (p.screen) {
        navFn(p.screen, p.params?.initialTab);
      } else if (p.initialTab) {
        navFn('Fit', p.initialTab);
      }
    }
  }, [route.params]);

  const handleMomentumScrollEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
    setCurrentPage(page);
  }, [screenWidth, setCurrentPage]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.obsidian }]}>
      {/* Carrusel Horizontal Unificado de 7 Vistas con rendimiento ultra optimizado */}
      <ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        directionalLockEnabled={true}
        bounces={false}
        overScrollMode="never"
        keyboardShouldPersistTaps="handled"
        onMomentumScrollEnd={handleMomentumScrollEnd}
        style={styles.pager}
      >
        {/* Página 0: Home (Dashboard) */}
        <View style={{ width: screenWidth, flex: 1 }}>
          <MemoDashboard />
        </View>

        {/* Página 1: Mis Ideas */}
        <View style={{ width: screenWidth, flex: 1 }}>
          <MemoIdeas />
        </View>

        {/* Página 2: Mi Diario */}
        <View style={{ width: screenWidth, flex: 1 }}>
          <MemoDiario />
        </View>

        {/* Página 3: Tasks */}
        <View style={{ width: screenWidth, flex: 1 }}>
          <MemoTasks />
        </View>

        {/* Página 4: Gym & Rutinas */}
        <View style={{ width: screenWidth, flex: 1 }}>
          <MemoGym />
        </View>

        {/* Página 5: Dieta & Macros */}
        <View style={{ width: screenWidth, flex: 1 }}>
          <MemoDiet />
        </View>

        {/* Página 6: Finanzas */}
        <View style={{ width: screenWidth, flex: 1 }}>
          <MemoFinance />
        </View>
      </ScrollView>

      {/* Barra de Navegación Inferior Flotante Aislada */}
      <ConnectedBottomNav />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pager: {
    flex: 1,
  },
});
