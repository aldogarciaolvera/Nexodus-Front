import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Switch,
} from 'react-native';
import { useTheme } from '../../../utils/ThemeContext';
import { CreateHabitDto, HabitDto, UpdateHabitDto } from '../../../services/habit.service';
import {
  X,
  Dumbbell,
  Droplets,
  BookOpen,
  Coffee,
  Heart,
  Shield,
  Zap,
  Target,
  Sparkles,
  Check,
} from 'lucide-react-native';

interface CreateHabitModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: CreateHabitDto) => void;
  onUpdate?: (id: string, data: UpdateHabitDto) => void;
  initialHabit?: HabitDto | null;
}

const COLOR_PALETTE = [
  '#00F0FF', // Cyan
  '#10B981', // Emerald
  '#8B5CF6', // Violet
  '#F59E0B', // Amber
  '#EF4444', // Crimson
  '#3B82F6', // Blue
  '#EC4899', // Pink
  '#84CC16', // Lime
];

const ICONS = [
  { key: 'sparkles', label: 'General', Icon: Sparkles },
  { key: 'dumbbell', label: 'Fitness', Icon: Dumbbell },
  { key: 'droplets', label: 'Agua', Icon: Droplets },
  { key: 'book', label: 'Lectura', Icon: BookOpen },
  { key: 'heart', label: 'Salud', Icon: Heart },
  { key: 'shield', label: 'Vicios', Icon: Shield },
  { key: 'coffee', label: 'Rutina', Icon: Coffee },
  { key: 'target', label: 'Meta', Icon: Target },
  { key: 'zap', label: 'Energía', Icon: Zap },
];

const CATEGORIES = ['General', 'Fitness', 'Salud', 'Mente', 'Productividad'];

const DAYS_OF_WEEK = [
  { index: '1', label: 'L' },
  { index: '2', label: 'M' },
  { index: '3', label: 'X' },
  { index: '4', label: 'J' },
  { index: '5', label: 'V' },
  { index: '6', label: 'S' },
  { index: '7', label: 'D' },
];

export const CreateHabitModal: React.FC<CreateHabitModalProps> = ({
  visible,
  onClose,
  onSubmit,
  onUpdate,
  initialHabit,
}) => {
  const theme = useTheme();

  const [habitType, setHabitType] = useState<'Build' | 'Quit'>('Build');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(COLOR_PALETTE[0]);
  const [icon, setIcon] = useState('sparkles');
  const [category, setCategory] = useState('General');
  const [trackingType, setTrackingType] = useState<'YesNo' | 'Count' | 'Measure'>('YesNo');
  const [targetValue, setTargetValue] = useState('1');
  const [targetUnit, setTargetUnit] = useState('');
  const [onTapAction, setOnTapAction] = useState<'Increment' | 'Manual'>('Increment');
  const [frequencyType, setFrequencyType] = useState<'Daily' | 'SpecificDays' | 'TimesPerWeek' | 'EveryNDays'>('Daily');
  const [selectedDays, setSelectedDays] = useState<string[]>(['1', '2', '3', '4', '5']);
  const [frequencyTargetCount, setFrequencyTargetCount] = useState('3');
  const [everyNDaysInterval, setEveryNDaysInterval] = useState('2');
  const [autoCompleteSource, setAutoCompleteSource] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (initialHabit) {
      setHabitType(initialHabit.habitType || 'Build');
      setName(initialHabit.name || '');
      setDescription(initialHabit.description || '');
      setColor(initialHabit.color || COLOR_PALETTE[0]);
      setIcon(initialHabit.icon || 'sparkles');
      setCategory(initialHabit.category || 'General');
      setTrackingType(initialHabit.trackingType || 'YesNo');
      setTargetValue(initialHabit.targetValue ? initialHabit.targetValue.toString() : '1');
      setTargetUnit(initialHabit.targetUnit || '');
      setOnTapAction(initialHabit.onTapAction || 'Increment');
      setFrequencyType(
        (initialHabit.frequencyType as any) || 'Daily'
      );
      if (initialHabit.frequencyDays) {
        setSelectedDays(initialHabit.frequencyDays.split(','));
      }
      setFrequencyTargetCount(initialHabit.frequencyTargetCount ? initialHabit.frequencyTargetCount.toString() : '3');
      setEveryNDaysInterval(initialHabit.everyNDaysInterval ? initialHabit.everyNDaysInterval.toString() : '2');
      setAutoCompleteSource(initialHabit.autoCompleteSource);
    } else {
      resetForm();
    }
  }, [initialHabit, visible]);

  const resetForm = () => {
    setHabitType('Build');
    setName('');
    setDescription('');
    setColor(COLOR_PALETTE[0]);
    setIcon('sparkles');
    setCategory('General');
    setTrackingType('YesNo');
    setTargetValue('1');
    setTargetUnit('');
    setOnTapAction('Increment');
    setFrequencyType('Daily');
    setSelectedDays(['1', '2', '3', '4', '5']);
    setFrequencyTargetCount('3');
    setEveryNDaysInterval('2');
    setAutoCompleteSource(undefined);
  };

  const handleDayToggle = (dayIndex: string) => {
    if (selectedDays.includes(dayIndex)) {
      if (selectedDays.length > 1) {
        setSelectedDays(selectedDays.filter((d) => d !== dayIndex));
      }
    } else {
      setSelectedDays([...selectedDays, dayIndex].sort());
    }
  };

  const applyPreset = (preset: {
    name: string;
    type: 'Build' | 'Quit';
    icon: string;
    color: string;
    category: string;
    trackingType: 'YesNo' | 'Count' | 'Measure';
    targetValue: string;
    targetUnit: string;
    autoSource?: string;
  }) => {
    setHabitType(preset.type);
    setName(preset.name);
    setIcon(preset.icon);
    setColor(preset.color);
    setCategory(preset.category);
    setTrackingType(preset.trackingType);
    setTargetValue(preset.targetValue);
    setTargetUnit(preset.targetUnit);
    setAutoCompleteSource(preset.autoSource);
  };

  const handleSave = () => {
    if (!name.trim()) return;

    const payload: CreateHabitDto = {
      name: name.trim(),
      description: description.trim() || undefined,
      color,
      icon,
      category,
      habitType,
      trackingType,
      targetValue: parseFloat(targetValue) || 1.0,
      targetUnit: targetUnit.trim() || undefined,
      onTapAction,
      frequencyType,
      frequencyDays: frequencyType === 'SpecificDays' ? selectedDays.join(',') : undefined,
      frequencyTargetCount: parseInt(frequencyTargetCount, 10) || 1,
      everyNDaysInterval: parseInt(everyNDaysInterval, 10) || 1,
      streakUnit: 'Days',
      fillMetPeriods: true,
      autoCompleteSource,
    };

    if (initialHabit && onUpdate) {
      onUpdate(initialHabit.id, {
        ...payload,
        isArchived: initialHabit.isArchived,
        orderIndex: initialHabit.orderIndex,
      });
    } else {
      onSubmit(payload);
    }

    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.modalContent, { backgroundColor: theme.colors.surface, borderColor: theme.colors.borderGlow }]}>
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: theme.colors.borderGlow }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              {initialHabit ? 'Editar Hábito' : 'Nuevo Hábito'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={theme.colors.mutedText} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Build vs Quit Selector */}
            <View style={[styles.typeSwitchContainer, { backgroundColor: theme.colors.surfaceLight }]}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setHabitType('Build')}
                style={[
                  styles.typeTab,
                  habitType === 'Build' && { backgroundColor: theme.colors.surface, borderColor: color },
                ]}
              >
                <Text
                  style={[
                    styles.typeTabText,
                    { color: habitType === 'Build' ? theme.colors.text : theme.colors.mutedText },
                  ]}
                >
                  ✨ Construir Hábito
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setHabitType('Quit')}
                style={[
                  styles.typeTab,
                  habitType === 'Quit' && { backgroundColor: theme.colors.surface, borderColor: '#EF4444' },
                ]}
              >
                <Text
                  style={[
                    styles.typeTabText,
                    { color: habitType === 'Quit' ? theme.colors.text : theme.colors.mutedText },
                  ]}
                >
                  🛡️ Romper Vicio
                </Text>
              </TouchableOpacity>
            </View>

            {/* Presets */}
            {!initialHabit && (
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: theme.colors.mutedText }]}>
                  SUGERENCIAS RÁPIDAS
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetsRow}>
                  {habitType === 'Build' ? (
                    <>
                      <TouchableOpacity
                        style={[styles.presetChip, { borderColor: theme.colors.borderGlow, backgroundColor: theme.colors.surfaceLight }]}
                        onPress={() => applyPreset({
                          name: 'Beber 2.5L Agua',
                          type: 'Build',
                          icon: 'droplets',
                          color: '#00F0FF',
                          category: 'Salud',
                          trackingType: 'Measure',
                          targetValue: '2.5',
                          targetUnit: 'L',
                          autoSource: 'WaterLog',
                        })}
                      >
                        <Text style={[styles.presetText, { color: theme.colors.text }]}>💧 2.5L Agua</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.presetChip, { borderColor: theme.colors.borderGlow, backgroundColor: theme.colors.surfaceLight }]}
                        onPress={() => applyPreset({
                          name: 'Ir al Gimnasio',
                          type: 'Build',
                          icon: 'dumbbell',
                          color: '#F59E0B',
                          category: 'Fitness',
                          trackingType: 'YesNo',
                          targetValue: '1',
                          targetUnit: '',
                          autoSource: 'WorkoutSession',
                        })}
                      >
                        <Text style={[styles.presetText, { color: theme.colors.text }]}>🏋️‍♂️ Ir al Gym</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.presetChip, { borderColor: theme.colors.borderGlow, backgroundColor: theme.colors.surfaceLight }]}
                        onPress={() => applyPreset({
                          name: 'Leer 20 páginas',
                          type: 'Build',
                          icon: 'book',
                          color: '#8B5CF6',
                          category: 'Mente',
                          trackingType: 'Count',
                          targetValue: '20',
                          targetUnit: 'pág',
                        })}
                      >
                        <Text style={[styles.presetText, { color: theme.colors.text }]}>📖 Leer 20 pág</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <TouchableOpacity
                        style={[styles.presetChip, { borderColor: theme.colors.borderGlow, backgroundColor: theme.colors.surfaceLight }]}
                        onPress={() => applyPreset({
                          name: 'Cero Cigarros',
                          type: 'Quit',
                          icon: 'shield',
                          color: '#EF4444',
                          category: 'Salud',
                          trackingType: 'YesNo',
                          targetValue: '1',
                          targetUnit: '',
                        })}
                      >
                        <Text style={[styles.presetText, { color: theme.colors.text }]}>🚭 No Fumar</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.presetChip, { borderColor: theme.colors.borderGlow, backgroundColor: theme.colors.surfaceLight }]}
                        onPress={() => applyPreset({
                          name: 'Cero Azúcar Añadida',
                          type: 'Quit',
                          icon: 'shield',
                          color: '#F59E0B',
                          category: 'Salud',
                          trackingType: 'YesNo',
                          targetValue: '1',
                          targetUnit: '',
                        })}
                      >
                        <Text style={[styles.presetText, { color: theme.colors.text }]}>🍬 Cero Azúcar</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.presetChip, { borderColor: theme.colors.borderGlow, backgroundColor: theme.colors.surfaceLight }]}
                        onPress={() => applyPreset({
                          name: 'Sin Comida Chatarra',
                          type: 'Quit',
                          icon: 'shield',
                          color: '#EC4899',
                          category: 'Salud',
                          trackingType: 'YesNo',
                          targetValue: '1',
                          targetUnit: '',
                        })}
                      >
                        <Text style={[styles.presetText, { color: theme.colors.text }]}>🍔 Cero Chatarra</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </ScrollView>
              </View>
            )}

            {/* Name Input */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: theme.colors.mutedText }]}>
                NOMBRE DEL HÁBITO *
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.surfaceLight, borderColor: theme.colors.borderGlow, color: theme.colors.text }]}
                placeholder={habitType === 'Build' ? 'Ej: Meditar 15 minutos' : 'Ej: No tomar refresco'}
                placeholderTextColor={theme.colors.mutedText}
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Category Selector */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: theme.colors.mutedText }]}>
                CATEGORÍA
              </Text>
              <View style={styles.chipsRow}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setCategory(cat)}
                    style={[
                      styles.choiceChip,
                      category === cat
                        ? { backgroundColor: color + '25', borderColor: color }
                        : { backgroundColor: theme.colors.surfaceLight, borderColor: theme.colors.borderGlow },
                    ]}
                  >
                    <Text
                      style={[
                        styles.choiceChipText,
                        { color: category === cat ? color : theme.colors.text },
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Tracking Type */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: theme.colors.mutedText }]}>
                TIPO DE REGISTRO
              </Text>
              <View style={styles.chipsRow}>
                <TouchableOpacity
                  onPress={() => setTrackingType('YesNo')}
                  style={[
                    styles.choiceChip,
                    trackingType === 'YesNo'
                      ? { backgroundColor: color + '25', borderColor: color }
                      : { backgroundColor: theme.colors.surfaceLight, borderColor: theme.colors.borderGlow },
                  ]}
                >
                  <Text style={[styles.choiceChipText, { color: trackingType === 'YesNo' ? color : theme.colors.text }]}>
                    Sí / No
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setTrackingType('Count')}
                  style={[
                    styles.choiceChip,
                    trackingType === 'Count'
                      ? { backgroundColor: color + '25', borderColor: color }
                      : { backgroundColor: theme.colors.surfaceLight, borderColor: theme.colors.borderGlow },
                  ]}
                >
                  <Text style={[styles.choiceChipText, { color: trackingType === 'Count' ? color : theme.colors.text }]}>
                    Contador
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setTrackingType('Measure')}
                  style={[
                    styles.choiceChip,
                    trackingType === 'Measure'
                      ? { backgroundColor: color + '25', borderColor: color }
                      : { backgroundColor: theme.colors.surfaceLight, borderColor: theme.colors.borderGlow },
                  ]}
                >
                  <Text style={[styles.choiceChipText, { color: trackingType === 'Measure' ? color : theme.colors.text }]}>
                    Medición
                  </Text>
                </TouchableOpacity>
              </View>

              {trackingType !== 'YesNo' && (
                <View style={styles.metaInputRow}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={[styles.subLabel, { color: theme.colors.mutedText }]}>Meta Diaria</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.colors.surfaceLight, borderColor: theme.colors.borderGlow, color: theme.colors.text }]}
                      keyboardType="numeric"
                      value={targetValue}
                      onChangeText={setTargetValue}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.subLabel, { color: theme.colors.mutedText }]}>Unidad</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.colors.surfaceLight, borderColor: theme.colors.borderGlow, color: theme.colors.text }]}
                      placeholder="L, km, vasos, pág"
                      placeholderTextColor={theme.colors.mutedText}
                      value={targetUnit}
                      onChangeText={setTargetUnit}
                    />
                  </View>
                </View>
              )}
            </View>

            {/* Frequency Selector */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: theme.colors.mutedText }]}>
                FRECUENCIA
              </Text>
              <View style={styles.chipsRow}>
                <TouchableOpacity
                  onPress={() => setFrequencyType('Daily')}
                  style={[
                    styles.choiceChip,
                    frequencyType === 'Daily'
                      ? { backgroundColor: color + '25', borderColor: color }
                      : { backgroundColor: theme.colors.surfaceLight, borderColor: theme.colors.borderGlow },
                  ]}
                >
                  <Text style={[styles.choiceChipText, { color: frequencyType === 'Daily' ? color : theme.colors.text }]}>
                    Todos los días
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setFrequencyType('SpecificDays')}
                  style={[
                    styles.choiceChip,
                    frequencyType === 'SpecificDays'
                      ? { backgroundColor: color + '25', borderColor: color }
                      : { backgroundColor: theme.colors.surfaceLight, borderColor: theme.colors.borderGlow },
                  ]}
                >
                  <Text style={[styles.choiceChipText, { color: frequencyType === 'SpecificDays' ? color : theme.colors.text }]}>
                    Días específicos
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setFrequencyType('TimesPerWeek')}
                  style={[
                    styles.choiceChip,
                    frequencyType === 'TimesPerWeek'
                      ? { backgroundColor: color + '25', borderColor: color }
                      : { backgroundColor: theme.colors.surfaceLight, borderColor: theme.colors.borderGlow },
                  ]}
                >
                  <Text style={[styles.choiceChipText, { color: frequencyType === 'TimesPerWeek' ? color : theme.colors.text }]}>
                    X por semana
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Specific days pills */}
              {frequencyType === 'SpecificDays' && (
                <View style={styles.daysRow}>
                  {DAYS_OF_WEEK.map((d) => {
                    const isSelected = selectedDays.includes(d.index);
                    return (
                      <TouchableOpacity
                        key={d.index}
                        onPress={() => handleDayToggle(d.index)}
                        style={[
                          styles.dayCircle,
                          isSelected
                            ? { backgroundColor: color, borderColor: color }
                            : { backgroundColor: theme.colors.surfaceLight, borderColor: theme.colors.borderGlow },
                        ]}
                      >
                        <Text
                          style={[
                            styles.dayCircleText,
                            { color: isSelected ? theme.colors.obsidian : theme.colors.mutedText },
                          ]}
                        >
                          {d.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {frequencyType === 'TimesPerWeek' && (
                <View style={{ marginTop: 10 }}>
                  <Text style={[styles.subLabel, { color: theme.colors.mutedText }]}>Veces por semana</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.colors.surfaceLight, borderColor: theme.colors.borderGlow, color: theme.colors.text }]}
                    keyboardType="numeric"
                    value={frequencyTargetCount}
                    onChangeText={setFrequencyTargetCount}
                  />
                </View>
              )}
            </View>

            {/* Neon Color Palette */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: theme.colors.mutedText }]}>
                COLOR DEL HÁBITO
              </Text>
              <View style={styles.paletteRow}>
                {COLOR_PALETTE.map((c) => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setColor(c)}
                    style={[
                      styles.colorCircle,
                      { backgroundColor: c },
                      color === c && { borderColor: '#FFFFFF', borderWidth: 2.5 },
                    ]}
                  >
                    {color === c && <Check size={14} color="#000" />}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Icon Selector */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: theme.colors.mutedText }]}>
                ICONO
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconsRow}>
                {ICONS.map((item) => {
                  const ItemIcon = item.Icon;
                  const isSelected = icon === item.key;
                  return (
                    <TouchableOpacity
                      key={item.key}
                      onPress={() => setIcon(item.key)}
                      style={[
                        styles.iconChip,
                        isSelected
                          ? { backgroundColor: color + '25', borderColor: color }
                          : { backgroundColor: theme.colors.surfaceLight, borderColor: theme.colors.borderGlow },
                      ]}
                    >
                      <ItemIcon size={20} color={isSelected ? color : theme.colors.mutedText} />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Synergy with Gym and Diet */}
            <View style={[styles.section, styles.synergyBox, { backgroundColor: theme.colors.surfaceLight, borderColor: theme.colors.borderGlow }]}>
              <View style={styles.synergyRow}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={[styles.synergyTitle, { color: theme.colors.text }]}>
                    Sinergia Automática
                  </Text>
                  <Text style={[styles.synergyDesc, { color: theme.colors.mutedText }]}>
                    Autocompletar cuando finalices entrenamientos en Gym o registres agua en Dieta.
                  </Text>
                </View>
                <Switch
                  value={autoCompleteSource === 'WorkoutSession' || autoCompleteSource === 'WaterLog'}
                  onValueChange={(val) => {
                    if (!val) {
                      setAutoCompleteSource(undefined);
                    } else {
                      setAutoCompleteSource(icon === 'dumbbell' ? 'WorkoutSession' : 'WaterLog');
                    }
                  }}
                  thumbColor={autoCompleteSource ? color : '#CBD5E1'}
                  trackColor={{ false: '#334155', true: color + '60' }}
                />
              </View>
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Footer Submit Button */}
          <View style={[styles.modalFooter, { borderTopColor: theme.colors.borderGlow }]}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleSave}
              disabled={!name.trim()}
              style={[
                styles.saveButton,
                { backgroundColor: color, opacity: name.trim() ? 1 : 0.5 },
              ]}
            >
              <Text style={[styles.saveButtonText, { color: theme.colors.obsidian }]}>
                {initialHabit ? 'Guardar Cambios' : 'Crear Hábito'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: 'Geist-Bold',
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  scrollArea: {
    padding: 16,
  },
  typeSwitchContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  typeTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  typeTabText: {
    fontSize: 13,
    fontFamily: 'Geist-Bold',
    fontWeight: '700',
  },
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'JetBrainsMono-Bold',
    fontWeight: '700',
    marginBottom: 8,
  },
  subLabel: {
    fontSize: 11,
    fontFamily: 'Geist-Regular',
    marginBottom: 4,
  },
  presetsRow: {
    flexDirection: 'row',
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  presetText: {
    fontSize: 12,
    fontFamily: 'Geist-Medium',
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: 'Geist-Regular',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  choiceChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9,
    borderWidth: 1,
  },
  choiceChipText: {
    fontSize: 12,
    fontFamily: 'Geist-Medium',
  },
  metaInputRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  dayCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCircleText: {
    fontSize: 13,
    fontFamily: 'JetBrainsMono-Bold',
    fontWeight: '700',
  },
  paletteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconsRow: {
    flexDirection: 'row',
  },
  iconChip: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  synergyBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  synergyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  synergyTitle: {
    fontSize: 13,
    fontFamily: 'Geist-Bold',
    fontWeight: '700',
    marginBottom: 2,
  },
  synergyDesc: {
    fontSize: 11,
    fontFamily: 'Geist-Regular',
    lineHeight: 16,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
  },
  saveButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 15,
    fontFamily: 'Geist-Bold',
    fontWeight: '700',
  },
});
