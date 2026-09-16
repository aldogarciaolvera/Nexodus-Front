import React from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../../components/Header';
import { DailyTodoCard } from '../../components/cards/DailyTodoCard';
import { WorkoutCard } from '../../components/cards/WorkoutCard';
import { DietCard } from '../../components/cards/DietCard';
import { FinanceCard } from '../../components/cards/FinanceCard';
import { useTheme } from '../../utils/ThemeContext';
import { ThemeColors } from '../../utils/theme';

export const DashboardScreen = () => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Header />
          
          <View style={styles.grid}>
            <View style={styles.gridColumn}>
              <DailyTodoCard />
              <DietCard />
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
