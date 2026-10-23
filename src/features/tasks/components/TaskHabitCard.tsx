import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../utils/ThemeContext';
import { ThemeColors, ThemeTypography } from '../../../utils/theme';

export interface TaskHabitItem {
  id: string;
  type: 'task' | 'habit';
  title: string;
  subtitle?: string;
  time?: string;
  tag?: string;
  streak?: number;
  isCompleted: boolean;
  urgent?: boolean;
  frequency?: string;
  customDays?: string;
  lastCompletedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  notificationsEnabled?: boolean;
}

interface TaskHabitCardProps {
  item: TaskHabitItem;
  onToggle: (id: string) => void;
  onLongPress?: (item: TaskHabitItem) => void;
}

export const TaskHabitCard: React.FC<TaskHabitCardProps> = ({ item, onToggle, onLongPress }) => {
  const theme = useTheme();
  const styles = createStyles(theme.colors, theme.typography, theme.isDarkMode);
  return (
    <TouchableOpacity 
      style={[styles.container, item.isCompleted && styles.containerCompleted]}
      onLongPress={() => onLongPress?.(item)}
      activeOpacity={0.8}
      delayLongPress={400}
      accessibilityRole="button"
      accessibilityLabel={`Elemento: ${item.title}`}
    >
      <TouchableOpacity 
        style={styles.checkboxContainer} 
        onPress={() => onToggle(item.id)}
        activeOpacity={0.7}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: !!item.isCompleted }}
        accessibilityLabel={`Marcar ${item.title} como ${item.isCompleted ? 'pendiente' : 'completado'}`}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <View style={[
          styles.checkbox,
          item.isCompleted && styles.checkboxCompleted
        ]}>
          {item.isCompleted && (
            <Text style={styles.checkmark}>✓</Text>
          )}
        </View>
      </TouchableOpacity>

      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <Text style={[
            styles.title,
            item.isCompleted && styles.textCompleted
          ]}>
            {item.title}
          </Text>
          {item.type === 'habit' && item.streak !== undefined && (
            <Text style={styles.streakText}>🔥 {item.streak}</Text>
          )}
          {item.type === 'task' && item.urgent && (
            <View style={styles.urgentDot} />
          )}
        </View>

        {item.subtitle && (
          <Text style={[
            styles.subtitle,
            item.isCompleted && styles.textCompleted
          ]} numberOfLines={1}>
            {item.subtitle}
          </Text>
        )}

        <View style={styles.footerRow}>
          {item.time && (
            <View style={styles.timeTag}>
              <Text style={styles.timeIcon}>⏱</Text>
              <Text style={styles.timeText}>{item.time}</Text>
            </View>
          )}
          {item.tag && (
            <View style={styles.categoryTag}>
              <Text style={styles.categoryText}>{item.tag}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const createStyles = (colors: ThemeColors, typography: ThemeTypography, isDarkMode: boolean) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  containerCompleted: {
    opacity: 0.6,
  },
  checkboxContainer: {
    marginRight: 16,
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.slate600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCompleted: {
    backgroundColor: colors.neonCyan,
    borderColor: colors.neonCyan,
  },
  checkmark: {
    color: isDarkMode ? colors.obsidian : '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    color: colors.text,
    fontFamily: typography.fontFamilyBold,
    fontSize: 16,
    flex: 1,
  },
  textCompleted: {
    textDecorationLine: 'line-through',
    color: colors.slate400,
  },
  streakText: {
    color: '#F5A623',
    fontFamily: typography.fontMono,
    fontSize: 12,
    fontWeight: 'bold',
  },
  urgentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
  },
  subtitle: {
    color: colors.slate400,
    fontFamily: typography.fontFamily,
    fontSize: 14,
    marginBottom: 8,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeIcon: {
    fontSize: 12,
    color: colors.slate500,
    marginRight: 4,
  },
  timeText: {
    color: colors.slate400,
    fontFamily: typography.fontMono,
    fontSize: 11,
  },
  categoryTag: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  categoryText: {
    color: colors.slate300,
    fontFamily: typography.fontMono,
    fontSize: 10,
    textTransform: 'uppercase',
  },
});
