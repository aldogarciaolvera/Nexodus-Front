import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useTheme } from '../../../utils/ThemeContext';
import { ThemeColors } from '../../../utils/theme';
import { NoteDto } from '../../../services/journal.service';
import { CheckCircle2, Circle, Plus, X } from 'lucide-react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import journalService from '../../../services/journal.service';

interface IdeaDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  idea: NoteDto | null;
}

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const IdeaDetailsModal = ({ visible, onClose, idea }: IdeaDetailsModalProps) => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);
  const queryClient = useQueryClient();

  const [newItemText, setNewItemText] = useState('');
  const [localChecklist, setLocalChecklist] = useState<any[]>([]);

  useEffect(() => {
    if (idea) {
      setLocalChecklist(idea.checklist || []);
    }
  }, [idea]);

  const updateMutation = useMutation({
    mutationFn: (updatedChecklist: any[]) => {
      if (!idea) return Promise.reject();
      return journalService.update(idea.id, {
        title: idea.title,
        content: idea.content,
        checklist: updatedChecklist,
        isCompleted: idea.isCompleted
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    }
  });

  const handleToggleItem = (itemId: string) => {
    const updated = localChecklist.map(item => 
      item.id === itemId ? { ...item, isCompleted: !item.isCompleted } : item
    );
    setLocalChecklist(updated);
    updateMutation.mutate(updated);
  };

  const handleAddItem = () => {
    if (!newItemText.trim()) return;
    const updated = [...localChecklist, { id: generateUUID(), text: newItemText.trim(), isCompleted: false }];
    setLocalChecklist(updated);
    setNewItemText('');
    updateMutation.mutate(updated);
  };

  if (!idea) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text style={styles.title} numberOfLines={2}>{idea.title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
              <X color={theme.colors.mutedText} size={24} />
            </TouchableOpacity>
          </View>

          {idea.content ? (
            <Text style={styles.description}>{idea.content}</Text>
          ) : null}

          <View style={styles.checklistSection}>
            
            <ScrollView style={styles.scrollArea} keyboardShouldPersistTaps="handled">
              {localChecklist.map((item) => (
                <View key={item.id} style={styles.checklistItem}>
                  <TouchableOpacity onPress={() => handleToggleItem(item.id)} style={styles.checkbox}>
                    {item.isCompleted ? (
                      <CheckCircle2 color={theme.colors.neonCyan} size={20} />
                    ) : (
                      <Circle color={theme.colors.mutedText} size={20} />
                    )}
                  </TouchableOpacity>
                  <Text style={[styles.checklistText, item.isCompleted && styles.checklistTextCompleted]}>
                    {item.text}
                  </Text>
                </View>
              ))}
              {localChecklist.length === 0 && (
                <Text style={styles.emptyText}>No hay elementos en esta idea.</Text>
              )}
            </ScrollView>
          </View>

          <View style={styles.addSection}>
            <TextInput
              style={styles.input}
              placeholder="Nueva tarea rápida..."
              placeholderTextColor={theme.colors.mutedText}
              value={newItemText}
              onChangeText={setNewItemText}
              onSubmitEditing={handleAddItem}
            />
            <TouchableOpacity 
              style={[styles.addBtn, !newItemText.trim() && { opacity: 0.5 }]} 
              onPress={handleAddItem}
              disabled={!newItemText.trim()}
            >
              <Plus color={theme.colors.obsidian} size={20} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    maxHeight: '80%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Geist_700Bold',
    fontSize: 22,
    color: colors.text,
    flex: 1,
    marginRight: 12,
  },
  closeIcon: {
    padding: 4,
  },
  description: {
    fontFamily: 'Geist_400Regular',
    fontSize: 14,
    color: colors.slate300,
    marginBottom: 20,
    lineHeight: 20,
  },
  checklistSection: {
    flexShrink: 1,
    marginBottom: 16,
  },
  scrollArea: {
    maxHeight: 200,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkbox: {
    marginRight: 12,
  },
  checklistText: {
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
    color: colors.text,
    flex: 1,
  },
  checklistTextCompleted: {
    textDecorationLine: 'line-through',
    color: colors.mutedText,
  },
  emptyText: {
    fontFamily: 'Geist_400Regular',
    fontSize: 13,
    color: colors.mutedText,
    fontStyle: 'italic',
  },
  addSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: 'Geist_400Regular',
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    marginRight: 12,
  },
  addBtn: {
    backgroundColor: colors.neonCyan,
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
