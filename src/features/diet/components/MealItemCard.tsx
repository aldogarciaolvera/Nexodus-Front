import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Check, Edit3, Trash2 } from 'lucide-react-native';
import { useTheme } from '../../../utils/ThemeContext';
import { ThemeColors } from '../../../utils/theme';
import { Meal } from '../../../services/diet.service';

interface MealItemCardProps {
  meal: Meal;
  onToggleComplete: (meal: Meal) => void;
  onEdit: (meal: Meal) => void;
  onDelete: (meal: Meal) => void;
}

export const MealItemCard: React.FC<MealItemCardProps> = ({
  meal,
  onToggleComplete,
  onEdit,
  onDelete,
}) => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);

  const isComp = meal.isCompleted;

  const getMealTypeLabel = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'breakfast':
        return 'DESAYUNO';
      case 'lunch':
        return 'COMIDA';
      case 'dinner':
        return 'CENA';
      case 'snack':
        return 'SNACK';
      default:
        return type?.toUpperCase() || 'COMIDA';
    }
  };

  return (
    <View style={[styles.card, !isComp && styles.cardPlanned]}>
      {/* Top Header */}
      <View style={styles.headerRow}>
        <View style={styles.typeBadge}>
          <View style={isComp ? styles.dotCyan : styles.dotYellow} />
          <Text style={styles.typeText}>
            {getMealTypeLabel(meal.mealType)} {meal.time ? `• ${meal.time}` : ''}
          </Text>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.statusBadge, isComp ? styles.statusBadgeCompleted : styles.statusBadgePlanned]}
            onPress={() => onToggleComplete(meal)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isComp }}
            accessibilityLabel={isComp ? 'Marcar como planeado' : 'Marcar como completado'}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {isComp && <Check size={11} color={theme.colors.neonCyan} style={{ marginRight: 4 }} />}
            <Text style={[styles.statusBadgeText, isComp ? styles.statusTextCyan : styles.statusTextYellow]}>
              {isComp ? 'Completado' : 'Planeado'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionIcon}
            onPress={() => onEdit(meal)}
            accessibilityRole="button"
            accessibilityLabel="Editar comida"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Edit3 size={15} color={theme.colors.mutedText} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionIcon}
            onPress={() => onDelete(meal)}
            accessibilityRole="button"
            accessibilityLabel="Eliminar comida"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Trash2 size={15} color={theme.colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <View style={styles.body}>
        <Text style={styles.mealName}>{meal.name}</Text>
        {meal.items && meal.items.length > 0 && (
          <Text style={styles.itemsSummary} numberOfLines={2}>
            {meal.items.map((it) => `${it.foodName} (${it.quantity}${it.unit})`).join(', ')}
          </Text>
        )}
      </View>

      {/* Footer Macros */}
      <View style={styles.footerRow}>
        <Text style={isComp ? styles.calsTextCyan : styles.calsTextYellow}>
          {meal.calories || 0} <Text style={styles.calsUnit}>kcal</Text>
        </Text>
        <Text style={styles.macrosBreakdown}>
          P: {meal.protein || 0}g   C: {meal.carbs || 0}g   G: {meal.fat || 0}g
        </Text>
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
      padding: 14,
      marginBottom: 12,
    },
    cardPlanned: {
      borderColor: colors.borderGlow,
      backgroundColor: colors.surface,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    typeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    dotCyan: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.neonCyan,
    },
    dotYellow: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.warning,
    },
    typeText: {
      fontFamily: 'JetBrainsMono_600SemiBold',
      fontSize: 10,
      color: colors.mutedText,
      letterSpacing: 0.6,
    },
    actionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      borderWidth: 1,
    },
    statusBadgeCompleted: {
      backgroundColor: 'rgba(0, 240, 255, 0.08)',
      borderColor: 'rgba(0, 240, 255, 0.25)',
    },
    statusBadgePlanned: {
      backgroundColor: 'rgba(255, 179, 0, 0.08)',
      borderColor: 'rgba(255, 179, 0, 0.25)',
    },
    statusBadgeText: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 9.5,
    },
    statusTextCyan: {
      color: colors.neonCyan,
    },
    statusTextYellow: {
      color: colors.warning,
    },
    actionIcon: {
      padding: 4,
    },
    body: {
      marginBottom: 10,
    },
    mealName: {
      fontFamily: 'Geist_600SemiBold',
      fontSize: 14,
      color: colors.text,
      marginBottom: 2,
    },
    itemsSummary: {
      fontFamily: 'Geist_400Regular',
      fontSize: 11,
      color: colors.mutedText,
      lineHeight: 16,
    },
    footerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: colors.borderGlow,
    },
    calsTextCyan: {
      fontFamily: 'JetBrainsMono_700Bold',
      fontSize: 13,
      color: colors.neonCyan,
    },
    calsTextYellow: {
      fontFamily: 'JetBrainsMono_700Bold',
      fontSize: 13,
      color: colors.text,
    },
    calsUnit: {
      fontFamily: 'JetBrainsMono_400Regular',
      fontSize: 10,
      color: colors.mutedText,
    },
    macrosBreakdown: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 11,
      color: colors.slate300,
    },
  });
