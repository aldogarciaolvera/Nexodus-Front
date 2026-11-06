import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { X, Disc, Plus, Minus } from 'lucide-react-native';
import { useTheme } from '../../../utils/ThemeContext';
import { ThemeColors } from '../../../utils/theme';

interface PlateCalculatorModalProps {
  visible: boolean;
  initialWeight?: number;
  onClose: () => void;
}

const AVAILABLE_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];

export const PlateCalculatorModal = React.memo(({
  visible,
  initialWeight = 60,
  onClose,
}: PlateCalculatorModalProps) => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);

  const [targetWeight, setTargetWeight] = useState<string>(String(initialWeight || 60));
  const [barWeight, setBarWeight] = useState<number>(20); // 20kg Olympic bar default

  const numericTarget = Math.max(0, parseFloat(targetWeight) || 0);
  const remainingForPlates = Math.max(0, numericTarget - barWeight);
  const weightPerSide = remainingForPlates / 2;

  // Calculate plates per side
  const calculatePlates = (sideWeight: number) => {
    let current = sideWeight;
    const platesNeeded: { weight: number; count: number }[] = [];

    for (const plate of AVAILABLE_PLATES) {
      if (current >= plate) {
        const count = Math.floor(current / plate);
        current = Math.round((current - count * plate) * 100) / 100;
        platesNeeded.push({ weight: plate, count });
      }
    }

    return { platesNeeded, remainder: current };
  };

  const { platesNeeded, remainder } = calculatePlates(weightPerSide);

  const adjustWeight = (delta: number) => {
    const next = Math.max(barWeight, numericTarget + delta);
    setTargetWeight(String(next));
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Disc size={20} color={theme.colors.neonCyan} />
              <Text style={styles.title}>Calculadora de Discos</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color={theme.colors.slate400} />
            </TouchableOpacity>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.contentContainer}
          >
            {/* Target Weight Input & Quick Adjust */}
            <Text style={styles.sectionLabel}>PESO OBJETIVO TOTAL (KG)</Text>
            <View style={styles.inputRow}>
              <TouchableOpacity
                style={styles.adjustBtn}
                onPress={() => adjustWeight(-5)}
              >
                <Minus size={16} color={theme.colors.slate300} />
              </TouchableOpacity>

              <TextInput
                style={styles.weightInput}
                keyboardType="decimal-pad"
                value={targetWeight}
                onChangeText={setTargetWeight}
                selectTextOnFocus
              />

              <TouchableOpacity
                style={styles.adjustBtn}
                onPress={() => adjustWeight(5)}
              >
                <Plus size={16} color={theme.colors.slate300} />
              </TouchableOpacity>
            </View>

            {/* Barbell Weight Selector */}
            <Text style={styles.sectionLabel}>PESO DE LA BARRA</Text>
            <View style={styles.barSelectorRow}>
              {[20, 15, 10].map((w) => (
                <TouchableOpacity
                  key={w}
                  style={[
                    styles.barBtn,
                    barWeight === w && styles.barBtnActive,
                  ]}
                  onPress={() => setBarWeight(w)}
                >
                  <Text
                    style={[
                      styles.barBtnText,
                      barWeight === w && styles.barBtnTextActive,
                    ]}
                  >
                    {w} kg {w === 20 ? '(Olímpica)' : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Results: Per side calculation */}
            <View style={styles.summaryCard}>
              <Text style={styles.perSideLabel}>CARGA POR LADO</Text>
              <Text style={styles.perSideValue}>{weightPerSide.toFixed(2)} kg</Text>
              <Text style={styles.perSideSub}>
                Barra: {barWeight} kg + 2 × {weightPerSide.toFixed(2)} kg
              </Text>
            </View>

            {/* Plates breakdown */}
            <Text style={styles.sectionLabel}>DISCOS POR LADO</Text>
            {platesNeeded.length > 0 ? (
              <View style={styles.platesGrid}>
                {platesNeeded.map((p) => (
                  <View key={p.weight} style={styles.plateItem}>
                    <View style={styles.plateBadge}>
                      <Text style={styles.plateWeightText}>{p.weight}</Text>
                      <Text style={styles.plateUnitText}>kg</Text>
                    </View>
                    <Text style={styles.plateCountText}>× {p.count}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyPlatesText}>
                {numericTarget <= barWeight
                  ? 'Solo la barra vacía.'
                  : 'Sin discos calculados.'}
              </Text>
            )}

            {remainder > 0 ? (
              <Text style={styles.remainderWarning}>
                Diferencia no divisible exacta: {remainder * 2} kg restantes.
              </Text>
            ) : null}
          </ScrollView>

          <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
            <Text style={styles.doneBtnText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
});

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      justifyContent: 'center',
      padding: 20,
    },
    modalCard: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      maxHeight: '80%',
      padding: 20,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    title: {
      fontFamily: 'Geist_700Bold',
      fontSize: 16,
      color: colors.text,
    },
    closeBtn: {
      padding: 6,
    },
    contentContainer: {
      paddingBottom: 16,
    },
    sectionLabel: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 10,
      color: colors.slate400,
      marginTop: 12,
      marginBottom: 8,
      letterSpacing: 0.5,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    },
    adjustBtn: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: colors.surfaceLight,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      alignItems: 'center',
      justifyContent: 'center',
    },
    weightInput: {
      flex: 1,
      height: 48,
      backgroundColor: colors.surfaceLight,
      borderWidth: 1,
      borderColor: colors.neonCyan,
      borderRadius: 12,
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 22,
      color: colors.neonCyan,
      textAlign: 'center',
    },
    barSelectorRow: {
      flexDirection: 'row',
      gap: 8,
    },
    barBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: colors.surfaceLight,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      alignItems: 'center',
    },
    barBtnActive: {
      borderColor: colors.neonCyan,
      backgroundColor: 'rgba(56, 189, 248, 0.1)',
    },
    barBtnText: {
      fontFamily: 'Geist_500Medium',
      fontSize: 12,
      color: colors.slate400,
    },
    barBtnTextActive: {
      color: colors.neonCyan,
      fontWeight: '700',
    },
    summaryCard: {
      backgroundColor: colors.surfaceLight,
      borderRadius: 12,
      padding: 14,
      marginTop: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.borderGlow,
    },
    perSideLabel: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 10,
      color: colors.slate400,
      marginBottom: 4,
    },
    perSideValue: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 24,
      color: colors.text,
      fontWeight: '700',
    },
    perSideSub: {
      fontFamily: 'Geist_400Regular',
      fontSize: 11,
      color: colors.mutedText,
      marginTop: 2,
    },
    platesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    plateItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colors.surfaceLight,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.borderGlow,
    },
    plateBadge: {
      backgroundColor: colors.obsidian,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 2,
    },
    plateWeightText: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 14,
      color: colors.neonCyan,
    },
    plateUnitText: {
      fontFamily: 'JetBrainsMono_400Regular',
      fontSize: 9,
      color: colors.slate500,
    },
    plateCountText: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 14,
      color: colors.text,
    },
    emptyPlatesText: {
      fontFamily: 'Geist_400Regular',
      fontSize: 13,
      color: colors.mutedText,
      marginVertical: 8,
    },
    remainderWarning: {
      fontFamily: 'Geist_400Regular',
      fontSize: 11,
      color: colors.warning,
      marginTop: 8,
    },
    doneBtn: {
      backgroundColor: colors.neonCyan,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: 'center',
      marginTop: 12,
    },
    doneBtnText: {
      fontFamily: 'Geist_700Bold',
      fontSize: 14,
      color: colors.obsidian,
    },
  });

