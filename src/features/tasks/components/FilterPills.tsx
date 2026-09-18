import React from 'react';
import { ScrollView, Text, TouchableOpacity, StyleSheet, View } from 'react-native';
import { theme } from '../../../utils/theme';

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

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  scrollContent: {
    paddingHorizontal: theme.metrics.marginHorizontal,
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  pillSelected: {
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderColor: 'rgba(0, 240, 255, 0.2)',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.neonCyan,
    marginRight: 8,
  },
  label: {
    color: theme.colors.slate400,
    fontFamily: theme.typography.fontMono,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  labelSelected: {
    color: theme.colors.neonCyan,
    fontFamily: theme.typography.fontFamilyBold,
  },
  count: {
    color: theme.colors.slate500,
    fontFamily: theme.typography.fontMono,
    fontSize: 11,
    marginLeft: 4,
  },
  countSelected: {
    color: theme.colors.neonCyan,
  },
});
