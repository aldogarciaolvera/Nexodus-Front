import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../utils/ThemeContext';
import { ThemeColors } from '../../utils/theme';
import { FinanceService, FinanceTransaction } from '../../services/finance.service';
import { CategoryService, Category } from '../../services/category.service';
import { ActionSheet } from '../../components/ActionSheet';
import { TransactionModal } from './components/TransactionModal';

export const AllTransactionsScreen = () => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);
  const navigation = useNavigation();
  
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [actionTransaction, setActionTransaction] = useState<FinanceTransaction | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [txLoading, setTxLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [txData, catData] = await Promise.all([
        FinanceService.getAll(),
        CategoryService.getAll(),
      ]);
      setTransactions(txData);
      setCategories(catData);
    } catch (err) {
      console.error('Failed to fetch transactions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Math.abs(val));
  };
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={theme.colors.text} strokeWidth={2}>
            <Path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Todos los movimientos</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.neonCyan} style={{ marginTop: 40 }} />
        ) : transactions.length === 0 ? (
          <Text style={styles.emptyText}>No hay movimientos registrados.</Text>
        ) : (
          <View style={styles.list}>
            {transactions.map(item => {
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
          </View>
        )}
      </ScrollView>

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
                fetchData();
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
        onSuccess={fetchData}
      />
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.obsidian,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderGlow,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontFamily: 'Geist_500Medium',
    fontSize: 18,
    color: colors.text,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  list: {
    gap: 16,
  },
  emptyText: {
    fontFamily: 'Geist_400Regular',
    color: colors.slate400,
    textAlign: 'center',
    marginTop: 40,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surfaceLight,
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
});
