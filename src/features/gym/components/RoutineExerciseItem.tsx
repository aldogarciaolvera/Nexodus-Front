import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Trash2 } from 'lucide-react-native';
import { useTheme } from '../../../utils/ThemeContext';
import { ThemeColors } from '../../../utils/theme';

import { translateBodyPart, translateMuscle } from '../../../utils/gymTranslations';

export interface RoutineExerciseForm {
  id: string;
  exerciseId: string;
  name: string;
  sets: number;
  reps: number;
  weight?: number;
  restTimeInSeconds: number;
  thumbUrl?: string;
  muscle?: string;
  bodyPart?: string;
}

interface RoutineExerciseItemProps {
  exercise: RoutineExerciseForm;
  index: number;
  onUpdate: (id: string, field: keyof RoutineExerciseForm, value: number) => void;
  onRemove: (id: string) => void;
}

export const RoutineExerciseItem: React.FC<RoutineExerciseItemProps> = ({
  exercise: ex,
  index,
  onUpdate,
  onRemove,
}) => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);

  const subLabel = [translateBodyPart(ex.bodyPart), translateMuscle(ex.muscle)].filter(Boolean).join(' • ');

  return (
    <View style={styles.exerciseCard}>
      <View style={styles.exCardTop}>
        {ex.thumbUrl && (
          <Image source={{ uri: ex.thumbUrl }} style={styles.thumb} />
        )}
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={styles.exCardTitle}>{index + 1}. {ex.name}</Text>
          {Boolean(subLabel) && (
            <Text style={styles.exCardSub}>{subLabel}</Text>
          )}
        </View>
        <TouchableOpacity 
          onPress={() => onRemove(ex.id)} 
          style={styles.removeBtn}
          accessibilityRole="button"
          accessibilityLabel={`Eliminar ${ex.name}`}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Trash2 color={theme.colors.error} size={18} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.exMetricsRow}>
        <View style={styles.metricControl}>
          <Text style={styles.metricLabel}>SETS</Text>
          <View style={styles.metricInputContainer}>
            <TouchableOpacity 
              onPress={() => onUpdate(ex.id, 'sets', Math.max(1, ex.sets - 1))}
              accessibilityRole="button"
              accessibilityLabel={`Reducir series de ${ex.name}`}
              hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
            >
              <Text style={styles.metricBtn}>-</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.metricValue}
              value={ex.sets.toString()}
              keyboardType="numeric"
              accessibilityLabel={`Número de series para ${ex.name}`}
              onChangeText={(text) => {
                const parsed = parseInt(text, 10);
                if (!isNaN(parsed) && parsed > 0) {
                  onUpdate(ex.id, 'sets', parsed);
                } else if (text === '') {
                  onUpdate(ex.id, 'sets', 1);
                }
              }}
            />
            <TouchableOpacity 
              onPress={() => onUpdate(ex.id, 'sets', ex.sets + 1)}
              accessibilityRole="button"
              accessibilityLabel={`Aumentar series de ${ex.name}`}
              hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
            >
              <Text style={styles.metricBtn}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.metricControl}>
          <Text style={styles.metricLabel}>REPS</Text>
          <View style={styles.metricInputContainer}>
            <TouchableOpacity 
              onPress={() => onUpdate(ex.id, 'reps', Math.max(1, ex.reps - 1))}
              accessibilityRole="button"
              accessibilityLabel={`Reducir repeticiones de ${ex.name}`}
              hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
            >
              <Text style={styles.metricBtn}>-</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.metricValue}
              value={ex.reps.toString()}
              keyboardType="numeric"
              accessibilityLabel={`Número de repeticiones para ${ex.name}`}
              onChangeText={(text) => {
                const parsed = parseInt(text, 10);
                if (!isNaN(parsed) && parsed > 0) {
                  onUpdate(ex.id, 'reps', parsed);
                } else if (text === '') {
                  onUpdate(ex.id, 'reps', 1);
                }
              }}
            />
            <TouchableOpacity 
              onPress={() => onUpdate(ex.id, 'reps', ex.reps + 1)}
              accessibilityRole="button"
              accessibilityLabel={`Aumentar repeticiones de ${ex.name}`}
              hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
            >
              <Text style={styles.metricBtn}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.metricControl}>
          <Text style={styles.metricLabel}>REST (s)</Text>
          <View style={styles.metricInputContainer}>
            <TouchableOpacity 
              onPress={() => onUpdate(ex.id, 'restTimeInSeconds', Math.max(0, ex.restTimeInSeconds - 15))}
              accessibilityRole="button"
              accessibilityLabel={`Reducir tiempo de descanso de ${ex.name}`}
              hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
            >
              <Text style={styles.metricBtn}>-</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.metricValue}
              value={ex.restTimeInSeconds.toString()}
              keyboardType="numeric"
              accessibilityLabel={`Segundos de descanso para ${ex.name}`}
              onChangeText={(text) => {
                const parsed = parseInt(text, 10);
                if (!isNaN(parsed)) {
                  onUpdate(ex.id, 'restTimeInSeconds', parsed);
                } else if (text === '') {
                  onUpdate(ex.id, 'restTimeInSeconds', 0);
                }
              }}
            />
            <TouchableOpacity 
              onPress={() => onUpdate(ex.id, 'restTimeInSeconds', ex.restTimeInSeconds + 15)}
              accessibilityRole="button"
              accessibilityLabel={`Aumentar tiempo de descanso de ${ex.name}`}
              hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
            >
              <Text style={styles.metricBtn}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={[styles.exMetricsRow, { marginTop: 12, justifyContent: 'flex-start' }]}>
        <View style={styles.metricControl}>
          <Text style={styles.metricLabel}>PESO (kg)</Text>
          <View style={styles.metricInputContainer}>
            <TouchableOpacity 
              onPress={() => onUpdate(ex.id, 'weight', Math.max(0, (ex.weight || 0) - 0.5))}
              accessibilityRole="button"
              accessibilityLabel={`Reducir peso de ${ex.name}`}
              hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
            >
              <Text style={styles.metricBtn}>-</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.metricValue}
              value={ex.weight?.toString() || '0'}
              keyboardType="numeric"
              accessibilityLabel={`Peso en kilogramos para ${ex.name}`}
              onChangeText={(text) => {
                const parsed = parseFloat(text.replace(',', '.'));
                if (!isNaN(parsed)) {
                  onUpdate(ex.id, 'weight', parsed);
                } else if (text === '') {
                  onUpdate(ex.id, 'weight', 0);
                }
              }}
            />
            <TouchableOpacity 
              onPress={() => onUpdate(ex.id, 'weight', (ex.weight || 0) + 0.5)}
              accessibilityRole="button"
              accessibilityLabel={`Aumentar peso de ${ex.name}`}
              hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
            >
              <Text style={styles.metricBtn}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  exerciseCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    marginBottom: 16,
  },
  exCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  thumb: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
  },
  exCardTitle: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 16,
    color: colors.text,
  },
  exCardSub: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 11,
    color: colors.neonCyan,
    marginTop: 2,
  },
  removeBtn: {
    marginLeft: 'auto',
    padding: 4,
  },
  exMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  metricControl: {
    flex: 1,
  },
  metricLabel: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 10,
    color: colors.mutedText,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  metricInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    paddingHorizontal: 6,
    height: 38,
  },
  metricBtn: {
    color: colors.neonCyan,
    fontSize: 18,
    fontFamily: 'JetBrainsMono_600SemiBold',
    paddingHorizontal: 8,
  },
  metricValue: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 14,
    color: colors.text,
    padding: 0,
    flex: 1,
    textAlign: 'center',
  },
});
