import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../../utils/ThemeContext';
import { ThemeColors } from '../../../utils/theme';
import { FinanceTransaction, FinanceService } from '../../../services/finance.service';
import { Category, CategoryService } from '../../../services/category.service';
import { ActionSheet } from '../../../components/ActionSheet';
import { CategoryModal } from './CategoryModal';
import { CategoryDetailsModal } from './CategoryDetailsModal';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface OperatingTargetsCardProps {
  transactions?: FinanceTransaction[];
  categories?: Category[];
  loading?: boolean;
}

export const OperatingTargetsCard = ({ transactions = [], categories = [], loading = false }: OperatingTargetsCardProps) => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);

  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [actionCategory, setActionCategory] = useState<Category | null>(null);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  const queryClient = useQueryClient();

  const targets = useMemo(() => {
    return categories.map((cat, index) => {
      // Sum all 'Gasto' transactions for this category in the current month
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const spent = transactions
        .filter(t => {
          if ((t.transactionType !== 'Gasto' && t.transactionType !== 'Expense') || t.categoryId !== cat.id || !t.transactionDate) return false;
          const tDate = new Date(t.transactionDate);
          return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      const income = transactions
        .filter(t => {
          if ((t.transactionType !== 'Ingreso' && t.transactionType !== 'Income') || t.categoryId !== cat.id || !t.transactionDate) return false;
          const tDate = new Date(t.transactionDate);
          return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      // Colors to cycle through
      const colors = [theme.colors.neonCyan, '#FFD700', '#FF3366', '#00E676'];
      
      return {
        id: cat.id,
        label: cat.name,
        sub: cat.description || '',
        value: spent,
        income: income,
        total: cat.monthlyLimit || 0,
        color: colors[index % colors.length],
      };
    })
    .sort((a, b) => b.value - a.value); // Sort by highest spend
  }, [transactions, categories, theme.colors]);

  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      const catTxs = transactions.filter(t => t.categoryId === categoryId);
      await Promise.all(catTxs.map(t => FinanceService.delete(t.id!)));
      await CategoryService.delete(categoryId);
    },
    onMutate: async (categoryId) => {
      await queryClient.cancelQueries({ queryKey: ['categories'] });
      await queryClient.cancelQueries({ queryKey: ['financeTransactions'] });

      const previousCategories = queryClient.getQueryData(['categories']);
      const previousTransactions = queryClient.getQueryData(['financeTransactions']);

      queryClient.setQueryData(['categories'], (old: any) => old?.filter((c: any) => c.id !== categoryId));
      queryClient.setQueryData(['financeTransactions'], (old: any) => old?.filter((t: any) => t.categoryId !== categoryId));

      return { previousCategories, previousTransactions };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['categories'], context?.previousCategories);
      queryClient.setQueryData(['financeTransactions'], context?.previousTransactions);
      console.error(err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['financeTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['financeSummary'] });
    }
  });

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>ASIGNACIONES</Text>
          <Text style={styles.title}>Restricciones de Mes</Text>
        </View>
      </View>

      <View style={styles.list}>
        {loading ? (
          <ActivityIndicator color={theme.colors.neonCyan} style={{ alignSelf: 'center', marginVertical: 20 }} />
        ) : targets.length === 0 ? (
          <Text style={{ color: theme.colors.slate400, fontFamily: 'JetBrainsMono_400Regular', textAlign: 'center' }}>No targets found</Text>
        ) : (
          targets.map((item, index) => {
            const hasLimit = item.total > 0;
            const fillPercent = hasLimit ? Math.min((item.value / item.total) * 100, 100) : 0;
            const isOverLimit = hasLimit && item.value > item.total;
            return (
              <TouchableOpacity 
                key={item.id || index} 
                style={styles.listItem}
                activeOpacity={0.8}
                onPress={() => {
                  const cat = categories.find(c => c.id === item.id);
                  if (cat) {
                    setActionCategory(cat);
                    setDetailsModalVisible(true);
                  }
                }}
                onLongPress={() => {
                  const cat = categories.find(c => c.id === item.id);
                  if (cat) {
                    setActionCategory(cat);
                    setActionSheetVisible(true);
                  }
                }}
                delayLongPress={300}
              >
                <View style={styles.itemHeader}>
                  <View style={styles.itemLabelRow}>
                    <View style={[styles.dot, { backgroundColor: item.color }]} />
                    <Text style={[styles.itemLabel, isOverLimit && { color: theme.colors.error }]} numberOfLines={1}>{item.label}</Text>
                    {isOverLimit && (
                      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={theme.colors.error} strokeWidth={2} style={{ marginLeft: 4 }}>
                        <Path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </Svg>
                    )}
                  </View>
                  <View style={styles.amountContainer}>
                    <Text style={[styles.amountValue, isOverLimit && { color: theme.colors.error }]}>${item.value.toFixed(2)}</Text>
                    {hasLimit && <Text style={styles.amountTotal}> / ${item.total.toFixed(2)}</Text>}
                  </View>
                </View>
                {hasLimit && (
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${fillPercent}%`, backgroundColor: isOverLimit ? theme.colors.error : item.color }]} />
                </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </View>

      <CategoryModal
        visible={categoryModalVisible}
        onClose={() => setCategoryModalVisible(false)}
        editingCategory={editingCategory}
        onSuccess={() => {}}
      />

      <CategoryDetailsModal
        visible={detailsModalVisible}
        onClose={() => setDetailsModalVisible(false)}
        category={actionCategory}
        transactions={transactions}
      />

      <ActionSheet
        visible={actionSheetVisible}
        onClose={() => setActionSheetVisible(false)}
        title="Opciones de Categoría"
        subtitle={actionCategory ? `¿Qué deseas hacer con "${actionCategory.name}"?` : ''}
        options={[
          {
            label: 'Editar',
            onPress: () => {
              if (actionCategory) {
                setEditingCategory(actionCategory);
                setCategoryModalVisible(true);
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
        subtitle={actionCategory ? `¿Estás seguro que deseas eliminar "${actionCategory.name}"?` : ''}
        options={[
          {
            label: 'Sí, Eliminar',
            destructive: true,
            onPress: () => {
              if (!actionCategory) return;
              deleteCategoryMutation.mutate(actionCategory.id!);
            }
          }
        ]}
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
    marginBottom: 24,
  },
  kicker: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 9,
    color: colors.slate400,
    letterSpacing: 1,
    marginBottom: 4,
  },
  title: {
    fontFamily: 'Geist_500Medium',
    fontSize: 16,
    color: colors.text,
  },
  iconBtn: {
    padding: 8,
    backgroundColor: colors.borderGlow,
    borderRadius: 8,
  },
  list: {
    gap: 20,
  },
  listItem: {},
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  itemLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginRight: 8,
  },
  itemLabel: {
    fontFamily: 'Geist_400Regular',
    fontSize: 13,
    color: colors.text,
    marginRight: 4,
  },
  itemSub: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 10,
    color: colors.slate500,
    flexShrink: 1,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  amountValue: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 13,
    color: colors.text,
  },
  amountTotal: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 10,
    color: colors.slate400,
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.borderGlow,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
});
