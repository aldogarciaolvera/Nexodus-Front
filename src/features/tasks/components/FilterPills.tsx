import React from 'react';
import { ScrollView, Text, TouchableOpacity, StyleSheet, View } from 'react-native';
import { useTheme } from '../../../utils/ThemeContext';
import { ThemeColors, ThemeTypography, ThemeMetrics } from '../../../utils/theme';

interface FilterOption {
  id: string;
  label: string;
  count?: number;
}

interface FilterPillsProps {
  options: FilterOption[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export const FilterPills: React.FC<FilterPillsProps> = ({ options, selectedId, onSelect }) => {
  const theme = useTheme();
  const styles = createStyles(theme.colors, theme.typography, theme.metrics);

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {options.map((option) => {
          const isSelected = option.id === selectedId;
          return (
            <TouchableOpacity 
              key={option.id}
              style={[
                styles.pill,
                isSelected && styles.pillSelected
              ]}
              onPress={() => onSelect(option.id)}
            >
              {isSelected && <View style={styles.dot} />}
              <Text style={[
                styles.label,
                isSelected && styles.labelSelected
              ]}>
                {option.label}
              </Text>
              {option.count !== undefined && (
                <Text style={[
                  styles.count,
                  isSelected && styles.countSelected
                ]}>
                  ({option.count})
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: ThemeColors, typography: ThemeTypography, metrics: ThemeMetrics) => StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  scrollContent: {
    paddingHorizontal: metrics.marginHorizontal,
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  pillSelected: {
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderColor: colors.neonCyan,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.neonCyan,
    marginRight: 8,
  },
  label: {
    color: colors.slate400,
    fontFamily: typography.fontMono,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  labelSelected: {
    color: colors.neonCyan,
    fontFamily: typography.fontFamilyBold,
  },
  count: {
    color: colors.slate500,
    fontFamily: typography.fontMono,
    fontSize: 11,
    marginLeft: 4,
  },
  countSelected: {
    color: colors.neonCyan,
  },
});
