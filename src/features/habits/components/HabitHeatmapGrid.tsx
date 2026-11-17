import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Text } from 'react-native';
import { HabitDayCellDto, getLocalDateString } from '../../../services/habit.service';
import { useTheme } from '../../../utils/ThemeContext';

interface HabitHeatmapGridProps {
  history: HabitDayCellDto[];
  color?: string;
  cellSize?: number;
  cellGap?: number;
  scrollable?: boolean;
  showDayLabels?: boolean;
  onPressCell?: (cell: HabitDayCellDto) => void;
}

const DAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export const HabitHeatmapGrid: React.FC<HabitHeatmapGridProps> = ({
  history = [],
  color = '#00F0FF',
  cellSize = 13,
  cellGap = 3,
  scrollable = false,
  showDayLabels = false,
  onPressCell,
}) => {
  const theme = useTheme();

  // Group cells into columns of 7 days (Monday to Sunday)
  const columns = useMemo(() => {
    if (!history || history.length === 0) return [];

    // Map each cell by its day of week (1=Mon, ..., 7=Sun)
    // History is expected in chronological order: oldest to newest
    const cols: (HabitDayCellDto | null)[][] = [];
    let currentWeek: (HabitDayCellDto | null)[] = [];

    // Pad the first column if the first day is not Monday
    const firstDate = new Date(history[0].date + 'T00:00:00');
    let firstDayIndex = firstDate.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    let firstDayMonIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1; // 0=Mon, ..., 6=Sun

    for (let p = 0; p < firstDayMonIndex; p++) {
      currentWeek.push(null);
    }

    history.forEach((cell) => {
      currentWeek.push(cell);
      if (currentWeek.length === 7) {
        cols.push(currentWeek);
        currentWeek = [];
      }
    });

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      cols.push(currentWeek);
    }

    return cols;
  }, [history]);

  const renderCell = (cell: HabitDayCellDto | null, index: number) => {
    if (!cell) {
      return (
        <View
          key={`empty-${index}`}
          style={{
            width: cellSize,
            height: cellSize,
            marginBottom: cellGap,
            opacity: 0,
          }}
        />
      );
    }

    let cellBg = theme.colors.surface;
    let cellBorder = 'transparent';
    let borderWidth = 0;
    let opacity = 1;
    let isFreeDot = false;

    switch (cell.status) {
      case 'Done':
        cellBg = color;
        break;
      case 'Partial':
        cellBg = color;
        opacity = Math.max(0.3, Math.min(0.85, cell.percentage / 100));
        break;
      case 'Free':
        cellBg = theme.colors.surfaceLight;
        isFreeDot = true;
        break;
      case 'Slip':
        cellBg = theme.colors.error;
        break;
      case 'Missed':
      default:
        cellBg = theme.colors.surface;
        cellBorder = theme.colors.borderGlow;
        borderWidth = 1;
        break;
    }

    const isCellToday = cell.isToday || cell.date === getLocalDateString();
    if (isCellToday) {
      cellBorder = theme.colors.white;
      borderWidth = 1.5;
    }

    return (
      <TouchableOpacity
        key={cell.date}
        activeOpacity={0.7}
        disabled={!onPressCell}
        onPress={() => onPressCell?.(cell)}
        style={[
          styles.cell,
          {
            width: cellSize,
            height: cellSize,
            marginBottom: cellGap,
            backgroundColor: cellBg,
            borderColor: cellBorder,
            borderWidth: borderWidth,
            opacity: opacity,
          },
        ]}
      >
        {isFreeDot && (
          <View
            style={[
              styles.freeDot,
              { backgroundColor: theme.colors.slate500 },
            ]}
          />
        )}
      </TouchableOpacity>
    );
  };

  const content = (
    <View style={styles.gridContainer}>
      {showDayLabels && (
        <View style={[styles.dayLabelsColumn, { marginRight: cellGap + 2 }]}>
          {DAY_LABELS.map((label, idx) => (
            <View
              key={label}
              style={{
                height: cellSize,
                marginBottom: cellGap,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text
                style={[
                  styles.dayLabelText,
                  { color: theme.colors.mutedText, fontSize: Math.max(8, cellSize - 5) },
                ]}
              >
                {idx % 2 === 0 ? label : ''}
              </Text>
            </View>
          ))}
        </View>
      )}

      {columns.map((col, colIdx) => (
        <View key={`col-${colIdx}`} style={{ marginRight: cellGap }}>
          {col.map((cell, rowIdx) => renderCell(cell, rowIdx))}
        </View>
      ))}
    </View>
  );

  if (scrollable) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {content}
      </ScrollView>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  scrollContent: {
    paddingVertical: 4,
  },
  dayLabelsColumn: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
  },
  dayLabelText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontWeight: '700',
    textAlign: 'center',
  },
  cell: {
    borderRadius: 3.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  freeDot: {
    width: 2.5,
    height: 2.5,
    borderRadius: 1.5,
  },
});
