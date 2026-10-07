import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Animated, Platform } from 'react-native';
import { useTheme } from '../utils/ThemeContext';
import { ThemeColors } from '../utils/theme';

interface CustomTimePickerProps {
  visible: boolean;
  value: Date;
  onClose: () => void;
  onConfirm: (date: Date) => void;
}

const ITEM_HEIGHT = 50;

const hours12 = Array.from({ length: 12 }, (_, i) => i + 1); // 1 to 12
const minutes = Array.from({ length: 60 }, (_, i) => i);
const periods = ['AM', 'PM'];

export const CustomTimePicker = ({ visible, value, onClose, onConfirm }: CustomTimePickerProps) => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);

  const initialHour24 = value.getHours();
  const isPM = initialHour24 >= 12;
  const initialHour12 = initialHour24 % 12 === 0 ? 12 : initialHour24 % 12;

  const [selectedHour, setSelectedHour] = useState(initialHour12);
  const [selectedMinute, setSelectedMinute] = useState(value.getMinutes());
  const [selectedPeriod, setSelectedPeriod] = useState(isPM ? 'PM' : 'AM');

  const hourScrollRef = useRef<ScrollView>(null);
  const minuteScrollRef = useRef<ScrollView>(null);
  const periodScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible) {
      const h24 = value.getHours();
      const pm = h24 >= 12;
      const h12 = h24 % 12 === 0 ? 12 : h24 % 12;

      setSelectedHour(h12);
      setSelectedMinute(value.getMinutes());
      setSelectedPeriod(pm ? 'PM' : 'AM');

      setTimeout(() => {
        hourScrollRef.current?.scrollTo({ y: (h12 - 1) * ITEM_HEIGHT, animated: false });
        minuteScrollRef.current?.scrollTo({ y: value.getMinutes() * ITEM_HEIGHT, animated: false });
        periodScrollRef.current?.scrollTo({ y: pm ? ITEM_HEIGHT : 0, animated: false });
      }, 100);
    }
  }, [visible, value]);

  const handleConfirm = () => {
    const newDate = new Date(value);
    let h24 = selectedHour;
    if (selectedPeriod === 'PM' && selectedHour < 12) {
      h24 += 12;
    } else if (selectedPeriod === 'AM' && selectedHour === 12) {
      h24 = 0;
    }
    newDate.setHours(h24);
    newDate.setMinutes(selectedMinute);
    newDate.setSeconds(0);
    onConfirm(newDate);
  };

  const renderScrollColumn = <T extends number | string>(
    data: T[],
    selectedValue: T,
    onValueChange: (val: T) => void,
    scrollRef: React.RefObject<ScrollView | null>,
    width: number = 80
  ) => {
    return (
      <View style={[styles.scrollColumn, { width }]}>
        <View style={styles.selectionHighlight} />
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          onMomentumScrollEnd={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.y / ITEM_HEIGHT);
            if (data[index] !== undefined) {
              onValueChange(data[index]);
            }
          }}
          contentContainerStyle={{ paddingVertical: ITEM_HEIGHT }}
        >
          {data.map((item) => {
            const isSelected = item === selectedValue;
            const textDisplay = typeof item === 'number' ? item.toString().padStart(2, '0') : item;
            return (
              <View key={String(item)} style={styles.itemContainer}>
                <Text style={[styles.itemText, isSelected && styles.itemTextSelected]}>
                  {textDisplay}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.modalContent}>
          <Text style={styles.title}>Seleccionar Hora</Text>

          <View style={styles.pickerContainer}>
            {renderScrollColumn(hours12, selectedHour, setSelectedHour, hourScrollRef, 60)}
            <Text style={styles.colon}>:</Text>
            {renderScrollColumn(minutes, selectedMinute, setSelectedMinute, minuteScrollRef, 60)}
            <View style={{ width: 16 }} />
            {renderScrollColumn(periods, selectedPeriod, setSelectedPeriod, periodScrollRef, 60)}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.btnCancel} onPress={onClose}>
              <Text style={styles.cancelText}>CANCELAR</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnConfirm} onPress={handleConfirm}>
              <Text style={styles.confirmText}>CONFIRMAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(13, 14, 17, 0.85)', // Obsidian overlay
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    width: '85%',
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.slate700,
    alignItems: 'center',
  },
  title: {
    color: colors.white,
    fontFamily: 'Geist_600SemiBold',
    fontSize: 18,
    marginBottom: 24,
  },
  pickerContainer: {
    flexDirection: 'row',
    height: ITEM_HEIGHT * 3, // Shows 3 items
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 24,
  },
  scrollColumn: {
    height: ITEM_HEIGHT * 3,
    width: 80,
  },
  selectionHighlight: {
    position: 'absolute',
    top: ITEM_HEIGHT,
    height: ITEM_HEIGHT,
    width: '100%',
    backgroundColor: colors.surfaceLight,
    borderRadius: 12,
  },
  itemContainer: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    color: colors.slate400,
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 20,
  },
  itemTextSelected: {
    color: colors.neonCyan,
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 24,
  },
  colon: {
    color: colors.white,
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 24,
    marginHorizontal: 16,
  },
  actions: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'flex-end',
    gap: 12,
  },
  btnCancel: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.slate700,
  },
  cancelText: {
    color: colors.white,
    fontFamily: 'Geist_500Medium',
    fontSize: 14,
  },
  btnConfirm: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.neonCyan,
  },
  confirmText: {
    color: colors.obsidian,
    fontFamily: 'Geist_600SemiBold',
    fontSize: 14,
  },
});
