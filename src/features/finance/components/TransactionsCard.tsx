import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { useTheme } from '../../../utils/ThemeContext';
import { ThemeColors } from '../../../utils/theme';
import { FinanceTransaction, FinanceService } from '../../../services/finance.service';
import { Category } from '../../../services/category.service';
import { ActionSheet } from '../../../components/ActionSheet';
import { TransactionModal } from './TransactionModal';

interface TransactionsCardProps {
  transactions: FinanceTransaction[];
  categories?: Category[];
  loading?: boolean;
  onSuccess?: () => void;
}

export const TransactionsCard = ({ transactions, categories = [], loading, onSuccess }: TransactionsCardProps) => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);
  const navigation = useNavigation<any>();

  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [actionTransaction, setActionTransaction] = useState<FinanceTransaction | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [txLoading, setTxLoading] = useState(false);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Math.abs(val));
  };
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const IncomeIcon = () => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={theme.colors.neonCyan} strokeWidth={1.5}>
      <Rect x="2" y="6" width="20" height="12" rx="2" />
      <Circle cx="12" cy="12" r="2" />
      <Path d="M6 12h.01M18 12h.01" />
    </Svg>
  );

  const ExpenseIcon = () => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={theme.colors.slate300} strokeWidth={1.5}>
      <Path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </Svg>
  );

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.headerText}>TRANSACCIONES RECIENTES • {loading ? '...' : transactions.length} REGISTROS</Text>
      </View>

      <View style={styles.list}>
        {transactions.length === 0 && !loading && (
          <Text style={styles.subText}>No se encontraron transacciones.</Text>
        )}
        {transactions.slice(0, 3).map(item => {
          const isIncome = item.transactionType === 'Ingreso';
          const categoryName = categories.find(c => c.id === item.categoryId)?.name || 'Sin Categoría';
          
          return (
            <TouchableOpacity 
              key={item.id} 
              style={styles.transactionItem}
              onLongPress={() => {
                setActionTransaction(item);
                setActionSheetVisible(true);
              }}
              delayLongPress={300}
              activeOpacity={0.8}
            >
              <View style={styles.iconContainer}>
                {isIncome ? <IncomeIcon /> : <ExpenseIcon />}
              </View>
              <View style={styles.detailsContainer}>
                <Text style={styles.title} numberOfLines={1}>{categoryName}</Text>
                <Text style={styles.subText}>{formatDate(item.transactionDate)}</Text>
              </View>
              <View style={styles.amountContainer}>
                <Text style={[
                  styles.amount,
                  isIncome && { color: theme.colors.neonCyan }
                ]}>
                  {isIncome ? '+' : '-'}{formatCurrency(item.amount)}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
        {transactions.length > 3 && (
          <TouchableOpacity 
            style={styles.viewAllBtn} 
            activeOpacity={0.8}
            onPress={() => navigation.navigate('AllTransactions')}
          >
            <Text style={styles.viewAllText}>Ver todas</Text>
          </TouchableOpacity>
        )}
      </View>

      <ActionSheet
        visible={actionSheetVisible}
        onClose={() => setActionSheetVisible(false)}
        title="Opciones de Movimiento"
        subtitle={actionTransaction ? '¿Qué deseas hacer con este movimiento?' : ''}
        options={[
          {
            label: 'Editar',
            onPress: () => {
              if (actionTransaction) {
                setEditModalVisible(true);
              }
            }
          },
          {
            label: 'Eliminar',
            destructive: true,
            onPress: () => {
              setConfirmDeleteVisible(true);
            }
          }
        ]}
      />

      <ActionSheet
        visible={confirmDeleteVisible}
        onClose={() => setConfirmDeleteVisible(false)}
        title="Confirmar Eliminación"
        subtitle={actionTransaction ? '¿Estás seguro que deseas eliminar este movimiento?' : ''}
        options={[
          {
            label: 'Sí, Eliminar',
            destructive: true,
            onPress: async () => {
              if (!actionTransaction) return;
              try {
                setTxLoading(true);
                await FinanceService.delete(actionTransaction.id);
                if (onSuccess) onSuccess();
              } catch (e) {
                console.error(e);
              } finally {
                setTxLoading(false);
              }
            }
          }
        ]}
      />

      <TransactionModal 
        visible={editModalVisible} 
        onClose={() => setEditModalVisible(false)}
        categories={categories}
        transactions={transactions}
        editingTransaction={actionTransaction}
        onSuccess={onSuccess || (() => {})}
      />
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
    marginBottom: 20,
  },
  headerText: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 10,
    color: colors.slate400,
    letterSpacing: 1,
    flex: 1,
  },
  list: {
    gap: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    padding: 16,
    borderRadius: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.borderGlow,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  detailsContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontFamily: 'Geist_500Medium',
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  subText: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 9,
    color: colors.slate400,
  },
  amountContainer: {
    justifyContent: 'center',
  },
  amount: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 14,
    color: colors.text,
  },
  viewAllBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    borderRadius: 8,
    backgroundColor: colors.surfaceLight,
  },
  viewAllText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 14,
    color: colors.neonCyan,
  },
});
