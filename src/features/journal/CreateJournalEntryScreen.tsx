import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../utils/ThemeContext';
import { ThemeColors } from '../../utils/theme';
import { ArrowLeft, CheckCircle2, Circle, Plus, Save } from 'lucide-react-native';
import { useAlertStore } from '../../store/alertStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import journalService from '../../services/journal.service';

type EntryType = 'idea' | 'diario';

interface ChecklistItem {
  id: string;
  text: string;
  isCompleted: boolean;
}

export const CreateJournalEntryScreen = () => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);
  const navigation = useNavigation();
  const route = useRoute<any>();
  const showAlert = useAlertStore((state: any) => state.showAlert);
  const queryClient = useQueryClient();

  const editNote = route.params?.editNote;

  const [entryType, setEntryType] = useState<EntryType>(editNote?.type || 'idea');
  const [title, setTitle] = useState(editNote?.title || '');
  const [content, setContent] = useState(editNote?.content || '');
  
  const [checklist, setChecklist] = useState<ChecklistItem[]>(
    editNote?.checklist?.length 
      ? editNote.checklist.map((item: any) => ({ ...item, id: item.id || Date.now().toString() + Math.random() }))
      : [{ id: '1', text: '', isCompleted: false }]
  );

  const handleAddChecklistItem = () => {
    setChecklist([...checklist, { id: Date.now().toString(), text: '', isCompleted: false }]);
  };

  const handleUpdateChecklistItem = (id: string, text: string) => {
    setChecklist(checklist.map(item => item.id === id ? { ...item, text } : item));
  };

  const handleToggleChecklistItem = (id: string) => {
    setChecklist(checklist.map(item => item.id === id ? { ...item, isCompleted: !item.isCompleted } : item));
  };

  const saveMutation = useMutation({
    mutationFn: (data: any) => {
      if (editNote) {
        return journalService.update(editNote.id, data);
      }
      return journalService.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      showAlert('Guardado', 'Entrada guardada correctamente.', 'success');
      navigation.goBack();
    },
    onError: (error: any) => {
      showAlert('Error', error.message || 'Ocurrió un error al guardar.', 'error');
    }
  });

  const handleSave = () => {
    if (!title.trim() && entryType === 'idea') {
      showAlert('Error', 'El título no puede estar vacío.', 'error');
      return;
    }
    
    if (!content.trim() && entryType === 'diario') {
      showAlert('Error', 'La entrada no puede estar vacía.', 'error');
      return;
    }

    const payload = {
      type: entryType,
      title: entryType === 'idea' ? title : '',
      content: entryType === 'diario' ? content : '',
      checklist: entryType === 'idea' ? checklist.filter(c => c.text.trim().length > 0).map(({ id, ...rest }) => rest) : [],
    };
    
    saveMutation.mutate(payload);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft color={theme.colors.text} size={24} />
          </TouchableOpacity>
          
          <View style={styles.typeToggle}>
            <TouchableOpacity 
              style={[styles.toggleBtn, entryType === 'idea' && styles.toggleBtnActive]}
              onPress={() => !editNote && setEntryType('idea')}
              disabled={!!editNote}
            >
              <Text style={[styles.toggleText, entryType === 'idea' && styles.toggleTextActive]}>Idea</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.toggleBtn, entryType === 'diario' && styles.toggleBtnActive]}
              onPress={() => !editNote && setEntryType('diario')}
              disabled={!!editNote}
            >
              <Text style={[styles.toggleText, entryType === 'diario' && styles.toggleTextActive]}>Diario</Text>
            </TouchableOpacity>
          </View>
          
          <View style={{ width: 24 }} /> {/* Placeholder for balance */}
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <TextInput
            style={styles.titleInput}
            placeholder="Título..."
            placeholderTextColor={theme.colors.mutedText}
            value={title}
            onChangeText={setTitle}
          />

          {entryType === 'idea' ? (
            <View style={styles.checklistContainer}>
              {checklist.map((item, index) => (
                <View key={item.id} style={styles.checklistItem}>
                  <TouchableOpacity onPress={() => handleToggleChecklistItem(item.id)} style={styles.checkbox}>
                    {item.isCompleted ? (
                      <CheckCircle2 color={theme.colors.neonCyan} size={20} />
                    ) : (
                      <Circle color={theme.colors.mutedText} size={20} />
                    )}
                  </TouchableOpacity>
                  <TextInput
                    style={[styles.checklistInput, item.isCompleted && styles.checklistInputCompleted]}
                    placeholder={`Elemento ${index + 1}...`}
                    placeholderTextColor={theme.colors.mutedText}
                    value={item.text}
                    onChangeText={(text) => handleUpdateChecklistItem(item.id, text)}
                  />
                </View>
              ))}
              <TouchableOpacity style={styles.addChecklistBtn} onPress={handleAddChecklistItem}>
                <Plus color={theme.colors.neonCyan} size={16} />
                <Text style={styles.addChecklistText}>Agregar elemento</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TextInput
              style={styles.contentInput}
              placeholder="Escribe tu entrada de diario aquí..."
              placeholderTextColor={theme.colors.mutedText}
              multiline
              textAlignVertical="top"
              value={content}
              onChangeText={setContent}
            />
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.saveButton, saveMutation.isPending && { opacity: 0.7 }]} 
            onPress={handleSave}
            disabled={saveMutation.isPending}
          >
            <Save color={theme.colors.obsidian} size={20} />
            <Text style={styles.saveButtonText}>
              {saveMutation.isPending ? 'Guardando...' : 'Guardar'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.obsidian,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderGlow,
  },
  backButton: {
    padding: 4,
  },
  typeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  toggleBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  toggleBtnActive: {
    backgroundColor: colors.neonCyan,
  },
  toggleText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    color: colors.mutedText,
  },
  toggleTextActive: {
    fontFamily: 'Geist_700Bold',
    color: colors.obsidian,
  },
  scrollContent: {
    padding: 20,
    flexGrow: 1,
  },
  titleInput: {
    fontFamily: 'Geist_700Bold',
    fontSize: 24,
    color: colors.text,
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderGlow,
    paddingBottom: 12,
  },
  contentInput: {
    fontFamily: 'Geist_400Regular',
    fontSize: 16,
    color: colors.text,
    minHeight: 200,
    lineHeight: 24,
  },
  checklistContainer: {
    gap: 16,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    marginRight: 12,
  },
  checklistInput: {
    flex: 1,
    fontFamily: 'Geist_400Regular',
    fontSize: 16,
    color: colors.text,
  },
  checklistInputCompleted: {
    textDecorationLine: 'line-through',
    color: colors.mutedText,
  },
  addChecklistBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 8,
  },
  addChecklistText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 14,
    color: colors.neonCyan,
    marginLeft: 8,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.borderGlow,
    backgroundColor: colors.obsidian,
  },
  saveButton: {
    backgroundColor: colors.neonCyan,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonText: {
    fontFamily: 'Geist_700Bold',
    fontSize: 16,
    color: colors.obsidian,
  }
});
