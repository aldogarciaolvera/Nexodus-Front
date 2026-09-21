import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated, Platform } from 'react-native';
import { useTheme } from '../../../utils/ThemeContext';
import { ThemeColors } from '../../../utils/theme';
import { FinanceTransaction } from '../../../services/finance.service';
import { Category } from '../../../services/category.service';
import Svg, { Path, Rect, Circle } from 'react-native-svg';

interface TransactionDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  transaction: FinanceTransaction | null;
  categories: Category[];
}

export const TransactionDetailsModal = ({ visible, onClose, transaction, categories }: TransactionDetailsModalProps) => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);
  
  const [showModal, setShowModal] = useState(visible);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setShowModal(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
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
  }, [visible]);

  if (!transaction) return null;

  const isIncome = transaction.transactionType === 'Ingreso' || transaction.transactionType === 'Income';
  const categoryName = transaction.category || categories.find(c => c.id === transaction.categoryId)?.name || 'Sin Categoría';
  
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Math.abs(val));
  };
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const IncomeIcon = () => (
    <Svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke={theme.colors.neonCyan} strokeWidth={1.5}>
      <Rect x="2" y="6" width="20" height="12" rx="2" />
      <Circle cx="12" cy="12" r="2" />
      <Path d="M6 12h.01M18 12h.01" />
    </Svg>
  );

  const ExpenseIcon = () => (
    <Svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke={theme.colors.slate300} strokeWidth={1.5}>
      <Path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </Svg>
  );

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
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>X</Text>
          </TouchableOpacity>
          
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              {isIncome ? <IncomeIcon /> : <ExpenseIcon />}
            </View>
            <Text style={[styles.amount, isIncome && { color: theme.colors.neonCyan }]}>
              {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
            </Text>
            <Text style={styles.date}>{formatDate(transaction.transactionDate)}</Text>
          </View>

          <View style={styles.detailsList}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>TIPO</Text>
              <Text style={styles.detailValue}>{isIncome ? 'Ingreso' : 'Gasto'}</Text>
            </View>
            <View style={styles.divider} />
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>CATEGORÍA</Text>
              <Text style={styles.detailValue}>{categoryName}</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>MÉTODO DE PAGO</Text>
              <Text style={styles.detailValue}>{transaction.paymentMethod || 'No especificado'}</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>DESCRIPCIÓN</Text>
              <Text style={[styles.detailValue, { flex: 2, textAlign: 'right' }]} numberOfLines={3}>
                {transaction.description || 'Sin descripción'}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.doneBtn} activeOpacity={0.8} onPress={onClose}>
            <Text style={styles.doneBtnText}>CERRAR</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  backdrop: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },
  content: {
    width: '85%',
    backgroundColor: colors.surfaceLight,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeBtnText: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 16,
    color: colors.slate400,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 10,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.borderGlow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  amount: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 28,
    color: colors.text,
    marginBottom: 8,
  },
  date: {
    fontFamily: 'Geist_400Regular',
    fontSize: 13,
    color: colors.slate400,
  },
  detailsList: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderGlow,
  },
  detailLabel: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 11,
    color: colors.slate400,
    letterSpacing: 0.5,
  },
  detailValue: {
    fontFamily: 'Geist_500Medium',
    fontSize: 14,
    color: colors.text,
  },
  doneBtn: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  doneBtnText: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 14,
    color: colors.slate300,
    letterSpacing: 0.5,
  },
});
