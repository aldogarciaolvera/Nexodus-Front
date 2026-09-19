import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../../utils/ThemeContext';
import { ThemeColors } from '../../../utils/theme';
import { FinanceTransaction } from '../../../services/finance.service';
import { Skeleton } from '../../../components/Skeleton';

interface WeeklyOutflowCardProps {
  transactions?: FinanceTransaction[];
  loading?: boolean;
}

export const WeeklyOutflowCard = ({ transactions = [], loading = false }: WeeklyOutflowCardProps) => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);

  const { days, maxVal, runRate } = useMemo(() => {
    // 0 = Sunday, 1 = Monday, etc.
    const now = new Date();
    const currentDay = now.getDay();
    // Monday is 1, Sunday is 0. Let's make Monday 0 and Sunday 6
    const todayIndex = currentDay === 0 ? 6 : currentDay - 1;

    // Start of week (Monday)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - todayIndex);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const weekExpenses = transactions.filter(t => {
      if ((t.transactionType !== 'Gasto' && t.transactionType !== 'Expense') || !t.transactionDate) return false;
      const tDate = new Date(t.transactionDate);
      return tDate >= startOfWeek && tDate <= endOfWeek;
    });

    const dayTotals = [0, 0, 0, 0, 0, 0, 0];
    let totalSpent = 0;

    weekExpenses.forEach(t => {
      const tDate = new Date(t.transactionDate!);
      const d = tDate.getDay();
      const idx = d === 0 ? 6 : d - 1;
      dayTotals[idx] += t.amount;
      totalSpent += t.amount;
    });

    const calculatedRunRate = (todayIndex + 1) > 0 ? (totalSpent / (todayIndex + 1)) : 0;
    
    const dayLabels = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
    const calculatedDays = dayLabels.map((label, i) => ({
      label,
      value: dayTotals[i],
      active: i === todayIndex
    }));

    const max = Math.max(...dayTotals, 100);

    return { days: calculatedDays, maxVal: max, runRate: calculatedRunRate };
  }, [transactions]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
          <Text style={styles.title}>Semanales</Text>
        <View style={styles.pill}>
          <Text style={styles.pillText}>Promedio: ${runRate.toFixed(2)}/D</Text>
        </View>
      </View>

      <View style={styles.chartContainer}>
        {loading ? (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', flex: 1, width: '100%' }}>
            {[60, 40, 70, 30, 50, 80, 45].map((h, i) => (
              <View key={i} style={styles.barCol}>
                <Skeleton width={24} height={h} borderRadius={4} style={{ marginBottom: 8 }} />
                <Skeleton width={16} height={10} borderRadius={2} />
              </View>
            ))}
          </View>
        ) : (
          days.map((day, index) => {
            const heightPercent = day.value > 0 ? (day.value / maxVal) * 100 : 4;
            
            return (
              <View key={index} style={styles.barCol}>
                {day.value > 0 && (
                  <Text style={[styles.barValue, day.active && { color: theme.colors.neonCyan }]}>
                    ${Math.round(day.value)}
                  </Text>
                )}
                <View style={[styles.barTrack, { height: 60 }]}>
                  {day.value > 0 ? (
                    <View style={[
                      styles.barFill, 
                      { height: `${heightPercent}%` },
                      day.active ? { backgroundColor: theme.colors.neonCyan } : {}
                    ]} />
                  ) : (
                    <View style={styles.barEmpty}>
                      <Text style={styles.dash}>--</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.dayLabel, day.active && { color: theme.colors.neonCyan }]}>
                  {day.label}
                </Text>
              </View>
            );
          })
        )}
      </View>
    </View>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Geist_500Medium',
    fontSize: 16,
    color: colors.text,
  },
  pill: {
    backgroundColor: colors.borderGlow,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  pillText: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 10,
    color: colors.slate400,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 100,
  },
  barCol: {
    alignItems: 'center',
    width: 30,
  },
  barValue: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 9,
    color: colors.slate500,
    marginBottom: 4,
  },
  barTrack: {
    width: '100%',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  barFill: {
    width: '100%',
    backgroundColor: colors.slate600,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  barEmpty: {
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 4,
  },
  dash: {
    color: colors.slate600,
    fontSize: 10,
  },
  dayLabel: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 10,
    color: colors.slate500,
  },
});
