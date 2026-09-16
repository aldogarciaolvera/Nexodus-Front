import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Alert, Animated } from 'react-native';
import { useTheme } from '../../../utils/ThemeContext';
import { ThemeColors } from '../../../utils/theme';
import { FinanceService, FinanceTransaction } from '../../../services/finance.service';
import { ActionSheet } from '../../../components/ActionSheet';
import { Category, CategoryService } from '../../../services/category.service';
import { CategoryModal } from './CategoryModal';

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
  const [loading, setLoading] = useState(false);

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

  // Error Alert State
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setErrorVisible(true);
  };

  useEffect(() => {
    if (visible) {
      if (editingTransaction) {
        setAmount(editingTransaction.amount.toString());
        setType(editingTransaction.transactionType as 'Ingreso' | 'Gasto');
        setSelectedCategory(editingTransaction.categoryId || null);
      } else {
        setAmount('');
        setType('Gasto');
        setSelectedCategory(null);
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

  const handleSubmit = async () => {
    if (!amount || isNaN(Number(amount))) {
      showError('Por favor ingresa un monto válido');
      return;
    }
    if (!selectedCategory) {
      showError('Por favor selecciona una categoría');
      return;
    }

    try {
      setLoading(true);
      if (editingTransaction) {
        await FinanceService.update(editingTransaction.id!, {
          amount: Number(amount),
          transactionType: type,
          categoryId: selectedCategory,
        });
      } else {
        await FinanceService.create({
          amount: Number(amount),
          transactionType: type,
          categoryId: selectedCategory,
        });
      }
      
      setAmount('');
      setType('Gasto');
      setSelectedCategory(null);
      
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error) {
      console.error(error);
      showError(editingTransaction ? 'No se pudo actualizar la transacción' : 'No se pudo crear la transacción');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryLongPress = (cat: Category) => {
    setActionCategory(cat);
    setActionSheetVisible(true);
  };

  const openAddCategory = () => {
    setEditingCategory(null);
    setCategoryModalVisible(true);
  };

  return (
    <Modal
      visible={showModal}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
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

          <TouchableOpacity style={styles.submitBtn} activeOpacity={0.8} onPress={handleSubmit} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={theme.colors.obsidian} />
            ) : (
              <Text style={styles.submitText}>CONFIRMAR</Text>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Modal para Crear/Editar Categoría */}
      <CategoryModal
        visible={categoryModalVisible}
        onClose={() => setCategoryModalVisible(false)}
        editingCategory={editingCategory}
        onSuccess={(savedCat) => {
          setSelectedCategory(savedCat.id!);
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
            onPress: async () => {
              if (!actionCategory) return;
              try {
                setCatLoading(true);
                
                // Eliminar primero todas las transacciones asociadas a la categoría
                const catTxs = transactions.filter(t => t.categoryId === actionCategory.id);
                await Promise.all(catTxs.map(t => FinanceService.delete(t.id)));
                
                // Luego eliminar la categoría
                await CategoryService.delete(actionCategory.id!);
                
                if (selectedCategory === actionCategory.id) setSelectedCategory(null);
                if (onSuccess) onSuccess();
              } catch (e) {
                showError('No se pudo eliminar la categoría o sus transacciones');
              } finally {
                setCatLoading(false);
              }
            }
          }
        ]}
      />

      {/* Action Sheet para errores */}
      <ActionSheet
        visible={errorVisible}
        onClose={() => setErrorVisible(false)}
        title="Error"
        subtitle={errorMsg}
        isError={true}
        options={[
          {
            label: 'OK',
            onPress: () => setErrorVisible(false)
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
