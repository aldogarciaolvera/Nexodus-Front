import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../utils/ThemeContext';
import { ThemeColors } from '../../../utils/theme';
export type TaskFrequency = 'Daily' | 'Weekly' | 'Monthly';

interface FrequencyOption {
  id: TaskFrequency;
  label: string;
}

interface FrequencySelectorProps {
  frequency: TaskFrequency;
  onFrequencyChange: (freq: TaskFrequency) => void;
  selectedWeeklyDays: number[];
  onToggleWeeklyDay: (dayId: number) => void;
  frequencies: FrequencyOption[];
}

const WEEK_DAYS = [
  { id: 1, label: 'L' },
  { id: 2, label: 'M' },
  { id: 3, label: 'X' },
  { id: 4, label: 'J' },
  { id: 5, label: 'V' },
  { id: 6, label: 'S' },
  { id: 7, label: 'D' },
];

export const FrequencySelector: React.FC<FrequencySelectorProps> = ({
  frequency,
  onFrequencyChange,
  selectedWeeklyDays,
  onToggleWeeklyDay,
  frequencies,
}) => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);

  return (
    <>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>FRECUENCIA</Text>
        <View style={styles.frequencySelector}>
          {frequencies.map((f, index) => {
            const isLast = index === frequencies.length - 1;
            const isActive = frequency === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                style={[
                  styles.frequencyBtn,
                  isActive && styles.frequencyBtnActive,
                  isLast && { borderRightWidth: 0 },
                ]}
                onPress={() => onFrequencyChange(f.id)}
              >
                <Text style={[styles.frequencyText, isActive && styles.frequencyTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {frequency === 'Weekly' && (
        <View style={styles.inputGroup}>
          <Text style={styles.label}>DÍAS DE LA SEMANA</Text>
          <View style={styles.daysGrid}>
            {WEEK_DAYS.map(d => {
              const isSelected = selectedWeeklyDays.includes(d.id);
              return (
                <TouchableOpacity 
                  key={d.id}
                  style={[styles.dayBtn, isSelected && styles.dayBtnActive]}
                  onPress={() => onToggleWeeklyDay(d.id)}
                >
                  <Text style={[styles.dayText, isSelected && styles.dayTextActive]}>
                    {d.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 10,
    color: colors.slate400,
    marginBottom: 8,
    letterSpacing: 1,
  },
  frequencySelector: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    overflow: 'hidden',
  },
  frequencyBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.borderGlow,
  },
  frequencyBtnActive: {
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
  },
  frequencyText: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 11,
    color: colors.slate400,
  },
  frequencyTextActive: {
    color: colors.neonCyan,
    fontFamily: 'JetBrainsMono_500Medium',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  dayBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  dayBtnActive: {
    borderColor: colors.neonCyan,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
  },
  dayText: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 12,
    color: colors.slate400,
  },
  dayTextActive: {
    color: colors.neonCyan,
    fontFamily: 'JetBrainsMono_500Medium',
  },
});
