import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, Switch } from 'react-native';
import { theme } from '../../../utils/theme';
import { Input } from '../../../components/Input';
import { Button } from '../../../components/Button';
import { CreateTodoDto } from '../../../services/todo.service';

interface CreateTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (item: CreateTodoDto) => void;
  isLoading?: boolean;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ visible, onClose, onAdd, isLoading }) => {
  const [isHabit, setIsHabit] = useState<boolean>(false);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [tag, setTag] = useState('');
  const [urgent, setUrgent] = useState(false);

  const handleAdd = () => {
    if (!title.trim()) return;

    onAdd({
      isHabit,
      task: title.trim(),
      subtitle: subtitle.trim() || undefined,
      tag: tag.trim() || undefined,
      urgent: urgent,
      frequency: isHabit ? 'Daily' : undefined,
    });
    
    // Reset form
    setTitle('');
    setSubtitle('');
    setTag('');
    setUrgent(false);
    setIsHabit(false);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <View style={styles.modalContent}>
              <View style={styles.header}>
                <Text style={styles.title}>New Item</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <Text style={styles.closeText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.typeSelector}>
                <TouchableOpacity 
                  style={[styles.typeBtn, !isHabit && styles.typeBtnActive]}
                  onPress={() => setIsHabit(false)}
                >
                  <Text style={[styles.typeBtnText, !isHabit && styles.typeBtnTextActive]}>TASK</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.typeBtn, isHabit && styles.typeBtnActive]}
                  onPress={() => setIsHabit(true)}
                >
                  <Text style={[styles.typeBtnText, isHabit && styles.typeBtnTextActive]}>HABIT</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.form}>
                <Input 
                  label="TITLE" 
                  placeholder="What needs to be done?" 
                  value={title}
                  onChangeText={setTitle}
                  autoFocus
                />
                <Input 
                  label="DESCRIPTION (OPTIONAL)" 
                  placeholder="Extra details..." 
                  value={subtitle}
                  onChangeText={setSubtitle}
                />
                <Input 
                  label="TAG (OPTIONAL)" 
                  placeholder="e.g. WORK, HEALTH" 
                  value={tag}
                  onChangeText={setTag}
                />

                {!isHabit && (
                  <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>Mark as Urgent</Text>
                    <Switch 
                      value={urgent} 
                      onValueChange={setUrgent} 
                      trackColor={{ false: theme.colors.slate600, true: theme.colors.warning }}
                      thumbColor={theme.colors.white}
                    />
                  </View>
                )}

                <Button 
                  title={!isHabit ? 'ADD TASK' : 'CREATE HABIT'} 
                  onPress={handleAdd} 
                  loading={isLoading}
                  style={styles.submitBtn}
                />
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 24,
  },
  closeBtn: {
    padding: 8,
  },
  closeText: {
    color: theme.colors.slate400,
    fontSize: 20,
  },
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
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
    backgroundColor: theme.colors.surfaceElevated,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  typeBtnText: {
    color: theme.colors.slate500,
    fontFamily: theme.typography.fontMono,
    fontSize: 12,
    letterSpacing: 1,
  },
  typeBtnTextActive: {
    color: theme.colors.neonCyan,
    fontFamily: theme.typography.fontFamilyBold,
  },
  form: {
    gap: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 12,
  },
  switchLabel: {
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
  },
  submitBtn: {
    marginTop: 8,
  }
});
