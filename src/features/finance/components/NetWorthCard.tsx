import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../../utils/ThemeContext';
import { ThemeColors } from '../../../utils/theme';
import { FinanceSummary, FinanceTransaction } from '../../../services/finance.service';

interface NetWorthCardProps {
  summary: FinanceSummary | null;
  transactions: FinanceTransaction[];
  loading?: boolean;
}

export const NetWorthCard = ({ summary, transactions = [], loading }: NetWorthCardProps) => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);

  // Safe defaults
  const netBalance = summary?.netBalance || 0;
  const totalIncome = summary?.totalIncome || 0;
  const totalExpense = summary?.totalExpense || 0;
  
  // Format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(val);
  };
  // Calculate Efectivo and Tarjeta balances
  const efectivoIncomes = transactions.filter(t => t.transactionType === 'Ingreso' && t.paymentMethod === 'Efectivo').reduce((acc, curr) => acc + curr.amount, 0);
  const efectivoExpenses = transactions.filter(t => t.transactionType === 'Gasto' && t.paymentMethod === 'Efectivo').reduce((acc, curr) => acc + curr.amount, 0);
  const totalEfectivo = efectivoIncomes - efectivoExpenses;

  const tarjetaIncomes = transactions.filter(t => t.transactionType === 'Ingreso' && t.paymentMethod === 'Tarjeta').reduce((acc, curr) => acc + curr.amount, 0);
  const tarjetaExpenses = transactions.filter(t => t.transactionType === 'Gasto' && t.paymentMethod === 'Tarjeta').reduce((acc, curr) => acc + curr.amount, 0);
  const totalTarjeta = tarjetaIncomes - tarjetaExpenses;

  return (
    <View style={styles.card}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>BALANCE TOTAL</Text>
      </View>

      {/* Main Balance */}
      <View style={styles.balanceRow}>
        <Text style={[styles.balance, netBalance < 0 && { color: theme.colors.error }]}>
          {loading ? '...' : formatCurrency(netBalance)}
        </Text>
        <Text style={styles.currency}>MXN</Text>
      </View>

      {/* Separator */}
      <View style={styles.separator} />

      {/* Breakdown */}
      <View style={styles.velocitySection}>
        <View style={styles.velocityHeader}>
          <View style={styles.velocityLabelContainer}>
            <View style={[styles.statusIndicator, { backgroundColor: '#00E676' }]} />
            <Text style={styles.velocityLabel}>EN EFECTIVO</Text>
          </View>
          <View style={styles.velocityAmountContainer}>
            <Text style={[styles.velocityAmount, { color: totalEfectivo < 0 ? theme.colors.error : '#00E676' }]}>
              {loading ? '...' : formatCurrency(totalEfectivo)}
            </Text>
          </View>
        </View>
        
        <View style={[styles.velocityHeader, { marginTop: 16, marginBottom: 0 }]}>
          <View style={styles.velocityLabelContainer}>
            <View style={[styles.statusIndicator, { backgroundColor: theme.colors.neonCyan }]} />
            <Text style={styles.velocityLabel}>EN TARJETAS</Text>
          </View>
          <View style={styles.velocityAmountContainer}>
            <Text style={[styles.velocityAmount, { color: totalTarjeta < 0 ? theme.colors.error : theme.colors.neonCyan }]}>
              {loading ? '...' : formatCurrency(totalTarjeta)}
            </Text>
          </View>
        </View>
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
    alignItems: 'center',
    marginBottom: 16,
  },
  headerText: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 10,
    color: colors.slate400,
    letterSpacing: 1,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 24,
    gap: 8,
  },
  balance: {
    fontFamily: 'Geist_700Bold',
    fontSize: 32,
    color: colors.text,
  },
  currency: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 12,
    color: colors.slate400,
  },
  columns: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  column: {
    flex: 1,
  },
  columnLabel: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 9,
    color: colors.slate400,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  columnValue: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 13,
    color: colors.text,
    marginBottom: 8,
  },
  progressTrack: {
    height: 4,
    backgroundColor: colors.borderGlow,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  separator: {
    height: 1,
    backgroundColor: colors.borderGlow,
    marginBottom: 20,
  },
  velocitySection: {},
  velocityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  velocityLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.neonCyan,
  },
  velocityLabel: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 10,
    color: colors.slate400,
    letterSpacing: 0.5,
  },
  velocityAmountContainer: {
    alignItems: 'flex-end',
  },
  velocityAmount: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 14,
    color: colors.neonCyan,
  },
  largeProgressTrack: {
    height: 6,
    backgroundColor: colors.borderGlow,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  largeProgressFill: {
    height: '100%',
    backgroundColor: colors.neonCyan,
    borderRadius: 3,
  },
  velocityFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  velocitySubtext: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 10,
    color: colors.slate500,
  }
});
