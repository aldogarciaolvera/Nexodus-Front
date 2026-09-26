import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, Switch, ScrollView } from 'react-native';
import { useTheme } from '../../../utils/ThemeContext';
import { ThemeColors } from '../../../utils/theme';
import { Input } from '../../../components/Input';
import { Button } from '../../../components/Button';
import { CreateTodoDto, TodoDto } from '../../../services/todo.service';

interface CreateTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (item: CreateTodoDto) => void;
  onEdit?: (id: string, item: CreateTodoDto) => void;
  isLoading?: boolean;
  editingItem?: TodoDto | null;
}

const TAGS = ['TRABAJO', 'PERSONAL', 'SALUD'];
const FREQUENCIES = [
  { id: 'Daily', label: 'Diario' },
  { id: 'Weekly', label: 'Semanal' },
  { id: 'Monthly', label: 'Mensual' },
];

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ visible, onClose, onAdd, onEdit, isLoading, editingItem }) => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);
  
  const [isHabit, setIsHabit] = useState<boolean>(false);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [tag, setTag] = useState<string | null>(null);
  const [urgent, setUrgent] = useState(false);
  const [frequency, setFrequency] = useState('Daily');
  const [isRepeating, setIsRepeating] = useState(false);
  const [selectedWeeklyDays, setSelectedWeeklyDays] = useState<number[]>([]);
  const [selectedMonthlyDays, setSelectedMonthlyDays] = useState<number[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  React.useEffect(() => {
    if (visible) {
      if (editingItem) {
        setIsHabit(editingItem.isHabit);
        setTitle(editingItem.task);
        setSubtitle(editingItem.subtitle || '');
        setTag(editingItem.tag || null);
        setUrgent(editingItem.urgent);
        
        if (editingItem.frequency) {
          setIsRepeating(true);
          setFrequency(editingItem.frequency);
          if (editingItem.frequency === 'Weekly' && editingItem.customDays) {
            setSelectedWeeklyDays(editingItem.customDays.split(',').map(Number));
          } else if (editingItem.frequency === 'Monthly' && editingItem.customDays) {
            setSelectedMonthlyDays(editingItem.customDays.split(',').map(Number));
          }
        } else {
          setIsRepeating(false);
          setFrequency('Daily');
          setSelectedWeeklyDays([]);
          setSelectedMonthlyDays([]);
        }
        
        setNotificationsEnabled(!!editingItem.notificationsEnabled);
      } else {
        // Reset form
        setTitle('');
        setSubtitle('');
        setTag(null);
        setUrgent(false);
        setIsHabit(false);
        setFrequency('Daily');
        setIsRepeating(false);
        setSelectedWeeklyDays([]);
        setSelectedMonthlyDays([]);
        setNotificationsEnabled(false);
      }
    }
  }, [visible, editingItem]);

  const handleAdd = () => {
    if (!title.trim()) return;

    let finalCustomDays = undefined;
    const finalFrequency = (isHabit || isRepeating) ? frequency : undefined;
    if (finalFrequency === 'Weekly' && selectedWeeklyDays.length > 0) {
      finalCustomDays = selectedWeeklyDays.sort((a,b) => a-b).join(',');
    } else if (finalFrequency === 'Monthly' && selectedMonthlyDays.length > 0) {
      finalCustomDays = selectedMonthlyDays.sort((a,b) => a-b).join(',');
    }

    const payload = {
      isHabit,
      task: title.trim(),
      subtitle: subtitle.trim() || undefined,
      tag: tag || undefined,
      urgent: urgent,
      frequency: finalFrequency,
      customDays: finalCustomDays,
      notificationsEnabled,
    };

    if (editingItem && onEdit) {
      onEdit(editingItem.id, payload);
    } else {
      onAdd(payload);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={Keyboard.dismiss}>
          <TouchableOpacity activeOpacity={1} style={[styles.modalContent, { maxHeight: '90%', flexShrink: 1 }]} onPress={() => {}}>
            <View style={styles.header}>
              <Text style={styles.title}>{editingItem ? (isHabit ? 'Editar Hábito' : 'Editar Tarea') : 'Nueva Task'}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView 
              showsVerticalScrollIndicator={false} 
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 16 }}
            >
              <View style={styles.typeSelector}>
                <TouchableOpacity 
                  style={[styles.typeBtn, !isHabit && styles.typeBtnActive]}
                  onPress={() => setIsHabit(false)}
                >
                  <Text style={[styles.typeBtnText, !isHabit && styles.typeBtnTextActive]}>TAREA</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.typeBtn, isHabit && styles.typeBtnActive]}
                  onPress={() => setIsHabit(true)}
                >
                  <Text style={[styles.typeBtnText, isHabit && styles.typeBtnTextActive]}>HABITO</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.form}>
                <Input 
                  label="TITULO" 
                  placeholder="¿Que necesitas hacer?" 
                  value={title}
                  onChangeText={setTitle}
                  autoFocus
                />
                <Input 
                  label="DESCRIPCION (OPCIONAL)" 
                  placeholder="Detalles extra..." 
                  value={subtitle}
                  onChangeText={setSubtitle}
                />
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>ETIQUETA (OPCIONAL)</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagScroll}>
                    {TAGS.map(t => (
                      <TouchableOpacity 
                        key={t} 
                        style={[styles.tagBtn, tag === t && styles.tagBtnActive]}
                        onPress={() => setTag(tag === t ? null : t)}
                      >
                        <Text style={[styles.tagText, tag === t && styles.tagTextActive]}>{t}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {!isHabit && (
                  <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>¿Repetir tarea?</Text>
                    <Switch 
                      value={isRepeating} 
                      onValueChange={setIsRepeating} 
                      trackColor={{ false: theme.colors.slate600, true: theme.colors.neonCyan }}
                      thumbColor={theme.colors.white}
                    />
                  </View>
                )}

                {(isHabit || isRepeating) && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>FRECUENCIA</Text>
                    <View style={styles.frequencySelector}>
                      {FREQUENCIES.map(f => (
                        <TouchableOpacity
                          key={f.id}
                          style={[styles.frequencyBtn, frequency === f.id && styles.frequencyBtnActive]}
                          onPress={() => setFrequency(f.id)}
                        >
                          <Text style={[styles.frequencyText, frequency === f.id && styles.frequencyTextActive]}>
                            {f.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {(isHabit || isRepeating) && frequency === 'Weekly' && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>DÍAS DE LA SEMANA</Text>
                    <View style={styles.daysGrid}>
                      {[
                        { id: 1, label: 'L' }, { id: 2, label: 'M' }, { id: 3, label: 'X' },
                        { id: 4, label: 'J' }, { id: 5, label: 'V' }, { id: 6, label: 'S' }, { id: 7, label: 'D' }
                      ].map(d => (
                        <TouchableOpacity 
                          key={d.id}
                          style={[styles.dayBtn, selectedWeeklyDays.includes(d.id) && styles.dayBtnActive]}
                          onPress={() => {
                            if (selectedWeeklyDays.includes(d.id)) {
                              setSelectedWeeklyDays(prev => prev.filter(v => v !== d.id));
                            } else {
                              setSelectedWeeklyDays(prev => [...prev, d.id]);
                            }
                          }}
                        >
                          <Text style={[styles.dayText, selectedWeeklyDays.includes(d.id) && styles.dayTextActive]}>{d.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {(isHabit || isRepeating) && frequency === 'Monthly' && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>DÍAS DEL MES</Text>
                    <View style={styles.daysGrid}>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                        <TouchableOpacity 
                          key={d}
                          style={[styles.dayBtn, selectedMonthlyDays.includes(d) && styles.dayBtnActive, { width: 32, height: 32, borderRadius: 16, margin: 2 }]}
                          onPress={() => {
                            if (selectedMonthlyDays.includes(d)) {
                              setSelectedMonthlyDays(prev => prev.filter(v => v !== d));
                            } else {
                              setSelectedMonthlyDays(prev => [...prev, d]);
                            }
                          }}
                        >
                          <Text style={[styles.dayText, selectedMonthlyDays.includes(d) && styles.dayTextActive]}>{d}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {!isHabit && (
                  <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>¿Marcar como Urgente?</Text>
                    <Switch 
                      value={urgent} 
                      onValueChange={setUrgent} 
                      trackColor={{ false: theme.colors.slate600, true: theme.colors.error }}
                      thumbColor={theme.colors.white}
                    />
                  </View>
                )}

                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>¿Recibir notificaciones?</Text>
                  <Switch 
                    value={notificationsEnabled} 
                    onValueChange={setNotificationsEnabled} 
                    trackColor={{ false: theme.colors.slate600, true: theme.colors.neonCyan }}
                    thumbColor={theme.colors.white}
                  />
                </View>

                <Button 
                  title={editingItem ? 'Guardar Cambios' : (!isHabit ? 'Añadir Tarea' : 'Crear Hábito')} 
                  onPress={handleAdd} 
                  loading={isLoading}
                  style={styles.submitBtn}
                />
              </View>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(13, 14, 17, 0.85)',
    justifyContent: 'center',
    padding: 20,
  },
  keyboardView: {
    width: '100%',
  },
  modalContent: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    color: colors.white,
    fontFamily: 'Geist_500Medium',
    fontSize: 24,
  },
  closeBtn: {
    padding: 8,
  },
  closeText: {
    color: colors.slate400,
    fontSize: 20,
  },
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  typeBtnActive: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    elevation: 2,
  },
  typeBtnText: {
    color: colors.slate500,
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 12,
    letterSpacing: 1,
  },
  typeBtnTextActive: {
    color: colors.neonCyan,
    fontFamily: 'JetBrainsMono_700Bold',
  },
  form: {
    gap: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
  },
  switchLabel: {
    color: colors.white,
    fontFamily: 'Geist_400Regular',
    fontSize: 14,
  },
  submitBtn: {
    marginTop: 8,
  },
  inputGroup: {
    marginBottom: 4,
  },
  label: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 12,
    color: colors.slate400,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  tagScroll: {
    gap: 8,
    paddingRight: 20,
  },
  tagBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 9999,
  },
  tagBtnActive: {
    borderColor: colors.neonCyan,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
  },
  tagText: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 12,
    color: colors.mutedText,
  },
  tagTextActive: {
    color: colors.neonCyan,
    fontWeight: '600',
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
