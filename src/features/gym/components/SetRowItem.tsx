import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Check, Trash2 } from 'lucide-react-native';
import { SetType, WorkoutSetDto } from '../../../services/gym.service';
import { SetTypeBadge } from './SetTypeBadge';
import { useTheme } from '../../../utils/ThemeContext';
import { ThemeColors } from '../../../utils/theme';

interface SetRowItemProps {
  setOrder: number;
  initialSet?: WorkoutSetDto;
  previousRecord?: string;
  onSaveSet: (data: {
    setId?: string;
    setOrder: number;
    type: SetType;
    weightKg: number;
    reps: number;
    rpe?: number;
    isCompleted: boolean;
  }) => void;
  onDeleteSet?: (setId?: string) => void;
  onToggleComplete?: (isCompleted: boolean) => void;
}

export const SetRowItem = React.memo(({
  setOrder,
  initialSet,
  previousRecord,
  onSaveSet,
  onDeleteSet,
  onToggleComplete,
}: SetRowItemProps) => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);

  const [type, setType] = useState<SetType>(initialSet?.type || 'Normal');
  const [weightKg, setWeightKg] = useState<string>(
    initialSet?.weightKg !== undefined && initialSet?.weightKg > 0 ? String(initialSet.weightKg) : ''
  );
  const [reps, setReps] = useState<string>(
    initialSet?.reps !== undefined && initialSet?.reps > 0 ? String(initialSet.reps) : ''
  );
  const [isCompleted, setIsCompleted] = useState<boolean>(initialSet?.isCompleted ?? false);

  useEffect(() => {
    if (initialSet) {
      setType(initialSet.type || 'Normal');
      if (initialSet.weightKg !== undefined && initialSet.weightKg > 0) {
        setWeightKg(String(initialSet.weightKg));
      }
      if (initialSet.reps !== undefined && initialSet.reps > 0) {
        setReps(String(initialSet.reps));
      }
      setIsCompleted(initialSet.isCompleted ?? false);
    }
  }, [initialSet]);

  const handleTypeChange = (newType: SetType) => {
    setType(newType);
    onSaveSet({
      setId: initialSet?.id,
      setOrder,
      type: newType,
      weightKg: parseFloat(weightKg) || 0,
      reps: parseInt(reps, 10) || 0,
      isCompleted,
    });
  };

  const handleWeightBlur = () => {
    const parsed = parseFloat(weightKg) || 0;
    onSaveSet({
      setId: initialSet?.id,
      setOrder,
      type,
      weightKg: parsed,
      reps: parseInt(reps, 10) || 0,
      isCompleted,
    });
  };

  const handleRepsBlur = () => {
    const parsed = parseInt(reps, 10) || 0;
    onSaveSet({
      setId: initialSet?.id,
      setOrder,
      type,
      weightKg: parseFloat(weightKg) || 0,
      reps: parsed,
      isCompleted,
    });
  };

  const handleToggleCheck = () => {
    const nextCompleted = !isCompleted;
    setIsCompleted(nextCompleted);

    const parsedWeight = parseFloat(weightKg) || 0;
    const parsedReps = parseInt(reps, 10) || 0;

    onSaveSet({
      setId: initialSet?.id,
      setOrder,
      type,
      weightKg: parsedWeight,
      reps: parsedReps,
      isCompleted: nextCompleted,
    });

    if (onToggleComplete) {
      onToggleComplete(nextCompleted);
    }
  };

  return (
    <View style={[styles.row, isCompleted && styles.completedRow]}>
      {/* Set Order */}
      <View style={styles.orderCol}>
        <Text style={[styles.orderText, isCompleted && styles.completedText]}>
          {setOrder}
        </Text>
      </View>

      {/* Set Type Badge */}
      <View style={styles.typeCol}>
        <SetTypeBadge type={type} onChange={handleTypeChange} size="medium" />
      </View>

      {/* Previous Performance */}
      <View style={styles.prevCol}>
        <Text style={styles.prevText} numberOfLines={1}>
          {previousRecord || '-'}
        </Text>
      </View>

      {/* Weight Input */}
      <View style={styles.inputCol}>
        <TextInput
          style={[styles.input, isCompleted && styles.completedInput]}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor={theme.colors.slate600}
          value={weightKg}
          onChangeText={setWeightKg}
          onBlur={handleWeightBlur}
          maxLength={6}
          selectTextOnFocus
        />
      </View>

      {/* Reps Input */}
      <View style={styles.inputCol}>
        <TextInput
          style={[styles.input, isCompleted && styles.completedInput]}
          keyboardType="number-pad"
          placeholder="0"
          placeholderTextColor={theme.colors.slate600}
          value={reps}
          onChangeText={setReps}
          onBlur={handleRepsBlur}
          maxLength={4}
          selectTextOnFocus
        />
      </View>

      {/* Checkbox Complete */}
      <View style={styles.actionCol}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleToggleCheck}
          style={[styles.checkBtn, isCompleted && styles.checkBtnActive]}
        >
          {isCompleted ? (
            <Check size={16} color={theme.colors.obsidian} strokeWidth={3} />
          ) : null}
        </TouchableOpacity>

        {onDeleteSet && initialSet?.id ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onDeleteSet(initialSet.id)}
            style={styles.deleteBtn}
          >
            <Trash2 size={14} color={theme.colors.slate600} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
});

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderGlow,
      backgroundColor: colors.surface,
      borderRadius: 10,
      marginBottom: 6,
    },
    completedRow: {
      backgroundColor: 'rgba(56, 189, 248, 0.05)',
      borderColor: 'rgba(56, 189, 248, 0.2)',
    },
    orderCol: {
      width: 28,
      alignItems: 'center',
    },
    orderText: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 13,
      color: colors.slate400,
    },
    completedText: {
      color: colors.neonCyan,
      fontWeight: '700',
    },
    typeCol: {
      width: 40,
      alignItems: 'center',
    },
    prevCol: {
      flex: 1,
      paddingHorizontal: 6,
      alignItems: 'center',
    },
    prevText: {
      fontFamily: 'JetBrainsMono_400Regular',
      fontSize: 11,
      color: colors.slate500,
    },
    inputCol: {
      width: 68,
      paddingHorizontal: 4,
    },
    input: {
      backgroundColor: colors.surfaceLight,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      borderRadius: 8,
      color: colors.text,
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 14,
      textAlign: 'center',
      paddingVertical: 6,
    },
    completedInput: {
      borderColor: colors.neonCyan,
      color: colors.neonCyan,
    },
    actionCol: {
      width: 44,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingRight: 4,
    },
    checkBtn: {
      width: 28,
      height: 28,
      borderRadius: 8,
      borderWidth: 1.5,
      borderColor: colors.slate600,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
    },
    checkBtnActive: {
      backgroundColor: colors.neonCyan,
      borderColor: colors.neonCyan,
    },
    deleteBtn: {
      marginLeft: 6,
      padding: 4,
    },
  });

