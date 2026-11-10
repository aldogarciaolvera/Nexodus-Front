import React, { useRef, useEffect } from 'react';
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

export const MainCarouselScreen = () => {
  const theme = useTheme();
  const route = useRoute();
  const { width: screenWidth } = useWindowDimensions();
  const pagerRef = useRef<React.ElementRef<typeof ScrollView>>(null);

  const {
    activeTab,
    setCurrentPage,
    setScrollToPageFn,
    navigateToTab,
  } = useCarouselNavStore();

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
      if (p.screen) {
        navigateToTab(p.screen, p.params?.initialTab);
      } else if (p.initialTab) {
        navigateToTab('Fit', p.initialTab);
      }
    }
  }, [route.params, navigateToTab]);

  const handleMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
    setCurrentPage(page);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.obsidian }]}>
      {/* Carrusel Horizontal Unificado de 7 Vistas */}
      <ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        style={styles.pager}
      >
        {/* Página 0: Home (Dashboard) */}
        <View style={{ width: screenWidth, flex: 1 }}>
          <DashboardScreen />
        </View>

        {/* Página 1: Mis Ideas */}
        <View style={{ width: screenWidth, flex: 1 }}>
          <JournalScreen mode="idea" />
        </View>

        {/* Página 2: Mi Diario */}
        <View style={{ width: screenWidth, flex: 1 }}>
          <JournalScreen mode="diario" />
        </View>

        {/* Página 3: Tasks */}
        <View style={{ width: screenWidth, flex: 1 }}>
          <TasksScreen />
        </View>

        {/* Página 4: Gym & Rutinas */}
        <View style={{ width: screenWidth, flex: 1 }}>
          <FitScreen mode="gym" />
        </View>

        {/* Página 5: Dieta & Macros */}
        <View style={{ width: screenWidth, flex: 1 }}>
          <FitScreen mode="diet" />
        </View>

        {/* Página 6: Finanzas */}
        <View style={{ width: screenWidth, flex: 1 }}>
          <FinanceScreen />
        </View>
      </ScrollView>

      {/* Barra de Navegación Inferior Flotante */}
      <BottomNav
        activeTab={activeTab}
        onTabPress={(tab) => navigateToTab(tab)}
      />
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

