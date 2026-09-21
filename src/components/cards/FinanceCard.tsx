import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { theme } from '../../utils/theme';
import { useQuery } from '@tanstack/react-query';
import { FinanceService } from '../../services/finance.service';
import { CategoryService } from '../../services/category.service';
import { Skeleton } from '../Skeleton';

export const FinanceCard = () => {
  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['financeSummary'],
    queryFn: FinanceService.getSummary,
  });

  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: CategoryService.getAll,
  });

  const { data: transactions = [], isLoading: loadingTransactions } = useQuery({
    queryKey: ['financeTransactions'],
    queryFn: FinanceService.getAll,
  });

  const isLoading = loadingSummary || loadingCategories || loadingTransactions;

  const totalSpent = summary?.totalExpense || 0;
  
  // Calculate total monthly limit from all categories
  const totalLimit = categories.reduce((acc, cat) => acc + (cat.monthlyLimit || 0), 0);
  const remaining = (summary?.totalIncome || 0) - totalSpent;
  const isNegative = remaining < 0;

  // Calculate today's and yesterday's spending
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 86400000; // Subtract 24 hours in milliseconds

  let spentToday = 0;
  let spentYesterday = 0;

  transactions.forEach(t => {
    if (t.transactionType === 'Gasto' && t.transactionDate) {
      const tDate = new Date(t.transactionDate).getTime();
      if (tDate >= today) {
        spentToday += t.amount;
      } else if (tDate >= yesterday && tDate < today) {
        spentYesterday += t.amount;
      }
    }
  });

  const maxDaily = Math.max(spentToday, spentYesterday, 1); // Avoid division by zero

  return (
    <View style={styles.card}>
      <View>
        <View style={styles.header}>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={theme.colors.neonCyan} strokeWidth={1.8}>
            <Path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </Svg>
          <Text style={styles.headerTitle} numberOfLines={1}>Finanzas</Text>
        </View>
        
        {isLoading ? (
          <View style={{ marginTop: 20, gap: 12 }}>
            <Skeleton width={100} height={14} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 4 }}>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
                <Skeleton width={16} height={28} />
                <Skeleton width={16} height={44} />
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Skeleton width={50} height={16} />
                <Skeleton width={40} height={10} />
              </View>
            </View>
          </View>
        ) : (
          <>
            <Text style={styles.spentText}>
              Gastado: <Text style={styles.spentValue}>${totalSpent.toFixed(2)}</Text>
            </Text>
            
            <View style={styles.chartRow}>
              <View style={styles.barsContainer}>
                <View style={styles.barColumn}>
                  <View style={[styles.bar, styles.barInactive, { height: Math.max((spentYesterday / maxDaily) * 44, 4) }]} />
                  <Text style={styles.barLabel}>Ayer</Text>
                </View>
                <View style={styles.barColumn}>
                  <View style={[styles.bar, styles.barActive, { height: Math.max((spentToday / maxDaily) * 44, 4) }]}>
                    <View style={styles.barGlow} />
                  </View>
                  <Text style={styles.barLabel}>Hoy</Text>
                </View>
              </View>
              
              <View style={styles.remainingContainer}>
                <Text style={[styles.remainingValue, isNegative && { color: theme.colors.error }]}>${remaining.toFixed(2)}</Text>
                <Text style={[styles.remainingLabel, isNegative && { color: theme.colors.error }]}>(Restante)</Text>
              </View>
            </View>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderGlow,
    borderWidth: 1,
    borderRadius: theme.metrics.borderRadiusCard,
    padding: 14,
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: theme.colors.mutedText,
    textTransform: 'uppercase',
    fontFamily: 'JetBrains Mono',
    flex: 1,
  },
  spentText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.white,
    letterSpacing: -0.5,
    marginBottom: 8,
    fontFamily: 'Geist',
  },
  spentValue: {
    color: theme.colors.slate200,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 4,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingBottom: 2,
  },
  barColumn: {
    alignItems: 'center',
  },
  bar: {
    width: 16,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  barActive: {
    height: 44,
    backgroundColor: 'rgba(0, 240, 255, 0.25)',
    borderColor: 'rgba(0, 240, 255, 0.5)',
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: 'hidden',
  },
  barGlow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    backgroundColor: 'rgba(0, 240, 255, 0.2)',
  },
  barInactive: {
    height: 28,
    backgroundColor: theme.colors.surfaceLight,
    borderColor: theme.colors.slate600,
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  barLabel: {
    fontSize: 8.5,
    color: theme.colors.slate400,
    fontWeight: '500',
    marginTop: 4,
    fontFamily: 'Geist',
  },
  remainingContainer: {
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  remainingValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.neonCyan,
    letterSpacing: -0.5,
    fontFamily: 'JetBrains Mono',
  },
  remainingLabel: {
    fontSize: 8.5,
    color: theme.colors.mutedText,
    letterSpacing: 0.5,
    fontFamily: 'Geist',
  },
});
