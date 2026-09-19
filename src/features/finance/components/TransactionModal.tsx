import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Animated, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../../../utils/ThemeContext';
import { ThemeColors } from '../../../utils/theme';
import { FinanceService, FinanceTransaction } from '../../../services/finance.service';
import { ActionSheet } from '../../../components/ActionSheet';
import { Category, CategoryService } from '../../../services/category.service';
import { CategoryModal } from './CategoryModal';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAlertStore } from '../../../store/alertStore';

interface TransactionModalProps {
  visible: boolean;
  onClose: () => void;
  categories?: Category[];
  transactions?: FinanceTransaction[];
  onSuccess?: () => void;
  editingTransaction?: FinanceTransaction | null;
}

export const TransactionModal = ({ visible, onClose, categories = [], transactions = [], onSuccess, editingTransaction }: TransactionModalProps) => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);
  
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'Ingreso' | 'Gasto'>('Gasto');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('Tarjeta');
  const queryClient = useQueryClient();

  // Action Sheet State
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [actionCategory, setActionCategory] = useState<Category | null>(null);

  // Category Modal State
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catLoading, setCatLoading] = useState(false);

  // Animation State
  const [showModal, setShowModal] = useState(visible);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const { showAlert } = useAlertStore();

  useEffect(() => {
    if (visible) {
      if (editingTransaction) {
        setAmount(editingTransaction.amount.toString());
        const txType = (editingTransaction.transactionType === 'Income' || editingTransaction.transactionType === 'Ingreso') ? 'Ingreso' : 'Gasto';
        setType(txType);
        setSelectedCategory(editingTransaction.categoryId || null);
        setPaymentMethod(editingTransaction.paymentMethod || 'Tarjeta');
      } else {
        setAmount('');
        setType('Gasto');
        setSelectedCategory(null);
        setPaymentMethod('Tarjeta');
      }
      setShowModal(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150, // Animación de fade más rápida (150ms)
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        setShowModal(false);
      });
    }
  }, [visible, editingTransaction]);

  const mutation = useMutation({
    mutationFn: async (newTx: any) => {
      if (editingTransaction) {
        return FinanceService.update(editingTransaction.id!, newTx);
      } else {
        return FinanceService.create(newTx);
      }
    },
    onMutate: async (newTx) => {
      await queryClient.cancelQueries({ queryKey: ['financeTransactions'] });
      await queryClient.cancelQueries({ queryKey: ['financeSummary'] });

      const previousTransactions = queryClient.getQueryData(['financeTransactions']);
      const previousSummary = queryClient.getQueryData(['financeSummary']);

      queryClient.setQueryData(['financeTransactions'], (old: any) => {
        const tx = {
          id: editingTransaction ? editingTransaction.id : Math.random().toString(),
          ...newTx,
          transactionDate: editingTransaction ? editingTransaction.transactionDate : new Date().toISOString(),
        };
        if (editingTransaction && old) {
          return old.map((t: any) => t.id === editingTransaction.id ? tx : t);
        }
        return old ? [tx, ...old] : [tx];
      });

      return { previousTransactions, previousSummary };
    },
    onError: (err: any, newTx, context) => {
      queryClient.setQueryData(['financeTransactions'], context?.previousTransactions);
      queryClient.setQueryData(['financeSummary'], context?.previousSummary);
      showAlert('Error', err.message || (editingTransaction ? 'No se pudo actualizar la transacción' : 'No se pudo crear la transacción'));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['financeTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['financeSummary'] });
    },
    onSuccess: () => {
      if (onSuccess) onSuccess();
    }
  });

  const handleSubmit = () => {
    if (!amount || isNaN(Number(amount))) {
      showAlert('Error', 'Por favor ingresa un monto válido');
      return;
    }
    if (!selectedCategory) {
      showAlert('Error', 'Por favor selecciona una categoría');
      return;
    }

    const selectedCategoryObj = categories.find(c => c.id === selectedCategory);
    
    mutation.mutate({
      amount: Number(amount),
      transactionType: type === 'Ingreso' ? 'Ingreso' : 'Gasto',
      category: selectedCategoryObj?.name || 'Uncategorized',
      categoryId: selectedCategory,
      transactionDate: editingTransaction ? editingTransaction.transactionDate : new Date().toISOString(),
      paymentMethod: paymentMethod,
    });
    
    setAmount('');
    setType('Gasto');
    setSelectedCategory(null);
    setPaymentMethod('Tarjeta');
    onClose();
  };

  const handleCategoryLongPress = (cat: Category) => {
    setActionCategory(cat);
    setActionSheetVisible(true);
  };

  const openAddCategory = () => {
    setEditingCategory(null);
    setCategoryModalVisible(true);
  };

  const deleteMutation = useMutation({
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
      showAlert('Error', 'No se pudo eliminar la categoría o sus transacciones');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['financeTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['financeSummary'] });
    },
    onSuccess: () => {
      if (selectedCategory === actionCategory?.id) setSelectedCategory(null);
      if (onSuccess) onSuccess();
    }
  });

  return (
    <Modal
      visible={showModal}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
          <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <TouchableOpacity style={styles.flexArea} activeOpacity={1} onPress={onClose} />
            <View style={styles.content}>
              <Text style={styles.title}>{editingTransaction ? 'Editar Transaccion' : 'Nueva Transaccion'}</Text>
          
          <View style={styles.typeSelector}>
            <TouchableOpacity 
              style={[styles.typeBtn, type === 'Gasto' && styles.typeBtnActive]} 
              onPress={() => setType('Gasto')}
            >
              <Text style={[styles.typeText, type === 'Gasto' && styles.typeTextActive]}>GASTO</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.typeBtn, type === 'Ingreso' && styles.typeBtnActive]} 
              onPress={() => setType('Ingreso')}
            >
              <Text style={[styles.typeText, type === 'Ingreso' && styles.typeTextActive]}>INGRESO</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Monto (MXN)</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor={theme.colors.slate600}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Categoria</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
              {categories.map(cat => (
                <TouchableOpacity 
                  key={cat.id} 
                  style={[styles.categoryBtn, selectedCategory === cat.id && styles.categoryBtnActive]}
                  onPress={() => setSelectedCategory(cat.id!)}
                  onLongPress={() => handleCategoryLongPress(cat)}
                  delayLongPress={300}
                >
                  <Text style={[styles.categoryText, selectedCategory === cat.id && styles.categoryTextActive]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity 
                style={[styles.categoryBtn, { borderStyle: 'dashed' }]}
                onPress={openAddCategory}
              >
                <Text style={styles.categoryText}>+</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Método de Pago</Text>
            <View style={styles.paymentMethodSelector}>
              {['Tarjeta', 'Efectivo'].map(method => (
                <TouchableOpacity
                  key={method}
                  style={[styles.paymentMethodBtn, paymentMethod === method && styles.paymentMethodBtnActive]}
                  onPress={() => setPaymentMethod(method)}
                >
                  <Text style={[styles.paymentMethodText, paymentMethod === method && styles.paymentMethodTextActive]}>
                    {method}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity style={styles.submitBtn} activeOpacity={0.8} onPress={handleSubmit} disabled={mutation.isPending}>
            {mutation.isPending ? (
              <ActivityIndicator color={theme.colors.obsidian} />
            ) : (
              <Text style={styles.submitText}>CONFIRMAR</Text>
            )}
          </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>

      {/* Modal para Crear/Editar Categoría */}
      <CategoryModal
        visible={categoryModalVisible}
        onClose={() => setCategoryModalVisible(false)}
        editingCategory={editingCategory}
        onSuccess={(savedCat) => {
          setSelectedCategory(savedCat.id!);
          queryClient.invalidateQueries({ queryKey: ['categories'] });
          if (onSuccess) onSuccess();
        }}
      />

      {/* Action Sheet para opciones de Categoría */}
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

      {/* Action Sheet para confirmar eliminación */}
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
              deleteMutation.mutate(actionCategory.id!);
            }
          }
        ]}
      />
    </Modal>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  keyboardView: {
    width: '100%',
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  flexArea: {
    flex: 1,
  },
  content: {
    backgroundColor: colors.surfaceLight,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: '40%',
    borderWidth: 1,
    borderColor: colors.borderGlow,
    borderBottomWidth: 0,
  },
  title: {
    fontFamily: 'Geist_500Medium',
    fontSize: 20,
    color: colors.text,
    marginBottom: 24,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  typeBtnActive: {
    backgroundColor: colors.borderGlow,
  },
  typeText: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 12,
    color: colors.slate400,
  },
  typeTextActive: {
    color: colors.white, // Keep this white or neonCyan depending on preference
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 12,
    color: colors.slate400,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    borderRadius: 12,
    padding: 16,
    color: colors.text,
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 16,
  },
  categoryScroll: {
    gap: 8,
    paddingRight: 20,
  },
  categoryBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 9999,
  },
  categoryBtnActive: {
    borderColor: colors.neonCyan,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
  },
  categoryText: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 12,
    color: colors.mutedText,
  },
  categoryTextActive: {
    color: colors.neonCyan,
    fontWeight: '600',
  },
  paymentMethodSelector: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    overflow: 'hidden',
  },
  paymentMethodBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.borderGlow,
  },
  paymentMethodBtnActive: {
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
  },
  paymentMethodText: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 11,
    color: colors.slate400,
  },
  paymentMethodTextActive: {
    color: colors.neonCyan,
    fontFamily: 'JetBrainsMono_500Medium',
  },
  submitBtn: {
    backgroundColor: colors.neonCyan,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  submitText: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 14,
    color: colors.surface,
    letterSpacing: 0.5,
  },
});
