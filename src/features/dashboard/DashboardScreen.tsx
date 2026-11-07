import React from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Header } from '../../components/Header';
import { DailyTodoCard } from './components/DailyTodoCard';
import { WorkoutCard } from './components/WorkoutCard';
import { DietCard } from './components/DietCard';
import { FinanceCard } from './components/FinanceCard';
import { IdeasCard } from './components/IdeasCard';
import { StreakCard } from './components/StreakCard';
import { ObsidianTierCard } from './components/ObsidianTierCard';
import { useTheme } from '../../utils/ThemeContext';
import { ThemeColors } from '../../utils/theme';
import { queryKeys } from '../../services/queryKeys';
import { gamificationService } from '../../services/gamification.service';

export const DashboardScreen = () => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);

  const { data: gamificationStatus } = useQuery({
    queryKey: queryKeys.gamification.status,
    queryFn: gamificationService.getStatus,
    staleTime: 60 * 1000,
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Header />

          {/* Gamification & Streaks Protocol */}
          <ObsidianTierCard status={gamificationStatus} />
          <StreakCard />
          
          <View style={styles.grid}>
            <View style={styles.gridColumn}>
              <DailyTodoCard />
              <DietCard />
              <IdeasCard />
            </View>
            <View style={styles.gridColumn}>
              <WorkoutCard />
              <FinanceCard />
            </View>
          </View>
          
          {/* Spacer for bottom nav */}
          <View style={{ height: 80 }} />
        </ScrollView>
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
  scrollContent: {
    paddingHorizontal: 20, // theme.metrics.marginHorizontal
    paddingTop: Platform.OS === 'android' ? 24 : 12,
    paddingBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 4,
  },
  gridColumn: {
    flex: 1,
    gap: 14,
  },
});
