import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Platform, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../utils/ThemeContext';
import { ThemeColors } from '../../utils/theme';
import { useFocusEffect } from '@react-navigation/native';
import { FinanceService, FinanceSummary, FinanceTransaction } from '../../services/finance.service';
import { CategoryService, Category } from '../../services/category.service';

import { Header } from '../../components/Header';
import { NetWorthCard } from './components/NetWorthCard';
import { WeeklyOutflowCard } from './components/WeeklyOutflowCard';
import { OperatingTargetsCard } from './components/OperatingTargetsCard';
import { TransactionsCard } from './components/TransactionsCard';
import { TransactionModal } from './components/TransactionModal';

export const FinanceScreen = () => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sumData, txData, catData] = await Promise.all([
        FinanceService.getSummary(),
        FinanceService.getAll(),
        CategoryService.getAll(),
      ]);
      setSummary(sumData);
      setTransactions(txData);
      setCategories(catData);
    } catch (err) {
      console.error('Failed to fetch finance data', err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Header title="Finanzas" />
          
          <View style={styles.stack}>
            <NetWorthCard summary={summary} loading={loading} />
            <WeeklyOutflowCard transactions={transactions} loading={loading} />
            <OperatingTargetsCard transactions={transactions} categories={categories} loading={loading} onSuccess={fetchData} />
            <TransactionsCard transactions={transactions} categories={categories} loading={loading} onSuccess={fetchData} />
          </View>
          
          {/* Spacer for bottom nav */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </View>

      <TransactionModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)}
        categories={categories}
        transactions={transactions}
        onSuccess={fetchData}
      />

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab} 
        activeOpacity={0.8} 
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.obsidian,
  },
  container: {
    flex: 1,
    backgroundColor: colors.obsidian,
  },
  scrollContent: {
    paddingHorizontal: 20, // marginHorizontal
    paddingTop: Platform.OS === 'android' ? 24 : 12,
    paddingBottom: 20,
  },
  stack: {
    gap: 14,
  },
  fab: {
    position: 'absolute',
    bottom: 100, // Above bottom nav
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.neonCyan,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  fabIcon: {
    fontSize: 28,
    fontWeight: '300',
    color: '#000000', // Assuming black for contrast against neon cyan
    lineHeight: 32, // to vertically center the + symbol properly
  },
});
