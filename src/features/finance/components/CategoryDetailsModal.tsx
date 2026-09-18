import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../utils/ThemeContext';
import { ThemeColors } from '../../../utils/theme';
import { Category } from '../../../services/category.service';
import { FinanceTransaction } from '../../../services/finance.service';

interface CategoryDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  category: Category | null;
  transactions: FinanceTransaction[];
}

export const CategoryDetailsModal = ({ visible, onClose, category, transactions }: CategoryDetailsModalProps) => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);

  const { spent, income } = useMemo(() => {
    if (!category) return { spent: 0, income: 0 };
    
    // Sum all 'Gasto' and 'Ingreso' transactions for this category in the current month
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let totalSpent = 0;
    let totalIncome = 0;

    transactions.forEach(t => {
      if (t.categoryId !== category.id || !t.transactionDate) return;
      const tDate = new Date(t.transactionDate);
      if (tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear) {
        if (t.transactionType === 'Gasto' || t.transactionType === 'Expense') totalSpent += t.amount;
        if (t.transactionType === 'Ingreso' || t.transactionType === 'Income') totalIncome += t.amount;
      }
    });

    return { spent: totalSpent, income: totalIncome };
  }, [category, transactions]);

  if (!category) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.content}>
          <Text style={styles.title}>{category.name}</Text>

          {category.description ? (
            <View style={styles.section}>
              <Text style={styles.label}>Descripción</Text>
              <Text style={styles.value}>{category.description}</Text>
            </View>
          ) : null}

          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Ingresos</Text>
              <Text style={[styles.amount, { color: '#00E676' }]}>+${income.toFixed(2)}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Gastos</Text>
              <Text style={[styles.amount, { color: theme.colors.error }]}>-${spent.toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Límite Mensual</Text>
            <Text style={styles.value}>
              {category.monthlyLimit ? `$${category.monthlyLimit.toFixed(2)}` : 'Sin Límite'}
            </Text>
          </View>

          {category.monthlyLimit ? (
            <View style={styles.section}>
              <Text style={styles.label}>Restante</Text>
              <Text style={[styles.value, { color: (category.monthlyLimit - spent) >= 0 ? theme.colors.neonCyan : theme.colors.error }]}>
                ${(category.monthlyLimit - spent).toFixed(2)}
              </Text>
            </View>
          ) : null}

          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={[styles.closeBtn, { backgroundColor: theme.colors.neonCyan }]} 
              activeOpacity={0.8} 
              onPress={onClose}
            >
              <Text style={styles.closeText}>CERRAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  title: {
    fontFamily: 'Geist_500Medium',
    fontSize: 24,
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  column: {
    flex: 1,
  },
  label: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 12,
    color: colors.slate400,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  value: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 16,
    color: colors.text,
  },
  amount: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 18,
  },
  actionRow: {
    marginTop: 20,
  },
  closeBtn: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  closeText: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 14,
    color: colors.surface,
    letterSpacing: 0.5,
  },
});
