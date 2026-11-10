import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Sparkles, Utensils, Refrigerator, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../../utils/ThemeContext';
import { ThemeColors } from '../../../utils/theme';

interface NexodusChefCardProps {
  remainingCals: number;
  remainingProtein: number;
  remainingCarbs: number;
  onOpenChefAi: () => void;
  onOpenCatalog: () => void;
  onOpenPantry: () => void;
}

export const NexodusChefCard: React.FC<NexodusChefCardProps> = ({
  remainingCals,
  remainingProtein,
  remainingCarbs,
  onOpenChefAi,
  onOpenCatalog,
  onOpenPantry,
}) => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleWithIcon}>
          <View style={styles.iconCircle}>
            <Sparkles size={16} color={theme.colors.neonCyan} />
          </View>
          <View>
            <Text style={styles.title}>NEXODUS CHEF & RECETARIO</Text>
            <Text style={styles.subtitle}>Nutrición de precisión adaptada a tu objetivo</Text>
          </View>
        </View>
      </View>

      {/* Remaining Macros Banner */}
      <View style={styles.macroHintBox}>
        <Text style={styles.macroHintText}>
          Faltan{' '}
          <Text style={{ color: theme.colors.neonCyan, fontFamily: 'JetBrainsMono_700Bold' }}>
            {Math.max(0, remainingCals)} kcal
          </Text>
          {' '}y{' '}
          <Text style={{ color: theme.colors.neonCyan, fontFamily: 'JetBrainsMono_700Bold' }}>
            {Math.max(0, remainingProtein)}g de proteína
          </Text>{' '}
          para completar tu meta de hoy.
        </Text>
      </View>

      {/* Action Buttons Row */}
      <View style={styles.actionsGrid}>
        {/* Button 1: Chef IA Macros */}
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnPrimary]}
          onPress={onOpenChefAi}
          activeOpacity={0.8}
        >
          <View style={styles.btnIconRow}>
            <Sparkles size={15} color={theme.colors.obsidian} />
            <Text style={styles.btnPrimaryText}>Completar Macros</Text>
          </View>
          <Text style={styles.btnPrimarySub}>Genera receta para tus macros</Text>
        </TouchableOpacity>

        {/* Button 2: Recetario Saludable */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={onOpenCatalog}
          activeOpacity={0.8}
        >
          <View style={styles.btnIconRow}>
            <Utensils size={15} color={theme.colors.neonCyan} />
            <Text style={styles.btnSecText}>Recetario</Text>
          </View>
          <Text style={styles.btnSecSub}>Platos completos y variantes</Text>
        </TouchableOpacity>

        {/* Button 3: Modo Despensa */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={onOpenPantry}
          activeOpacity={0.8}
        >
          <View style={styles.btnIconRow}>
            <Refrigerator size={15} color={theme.colors.neonCyan} />
            <Text style={styles.btnSecText}>Despensa</Text>
          </View>
          <Text style={styles.btnSecSub}>Cocina con lo que tienes</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      padding: 16,
      marginBottom: 16,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    titleWithIcon: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    iconCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(56, 189, 248, 0.12)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.neonCyan,
    },
    title: {
      fontFamily: 'JetBrainsMono_700Bold',
      fontSize: 12,
      color: colors.text,
      letterSpacing: 0.5,
    },
    subtitle: {
      fontFamily: 'Geist_400Regular',
      fontSize: 11,
      color: colors.mutedText,
    },
    macroHintBox: {
      backgroundColor: colors.surfaceLight,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      marginBottom: 14,
    },
    macroHintText: {
      fontFamily: 'Geist_400Regular',
      fontSize: 12,
      color: colors.text,
      lineHeight: 18,
    },
    actionsGrid: {
      flexDirection: 'column',
      gap: 8,
    },
    actionBtn: {
      backgroundColor: colors.surfaceLight,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: colors.borderGlow,
    },
    actionBtnPrimary: {
      backgroundColor: colors.neonCyan,
      borderColor: colors.neonCyan,
    },
    btnIconRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 2,
    },
    btnPrimaryText: {
      fontFamily: 'Geist_700Bold',
      fontSize: 13,
      color: colors.obsidian,
    },
    btnPrimarySub: {
      fontFamily: 'Geist_400Regular',
      fontSize: 11,
      color: 'rgba(11, 13, 17, 0.75)',
    },
    btnSecText: {
      fontFamily: 'Geist_600SemiBold',
      fontSize: 13,
      color: colors.text,
    },
    btnSecSub: {
      fontFamily: 'Geist_400Regular',
      fontSize: 11,
      color: colors.mutedText,
    },
  });
