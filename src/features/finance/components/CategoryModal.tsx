import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useTheme } from '../../../utils/ThemeContext';
import { ThemeColors } from '../../../utils/theme';
import { Category, CategoryService } from '../../../services/category.service';
import { ActionSheet } from '../../../components/ActionSheet';
import { useMutation } from '@tanstack/react-query';
import { useAlertStore } from '../../../store/alertStore';

interface CategoryModalProps {
  visible: boolean;
  onClose: () => void;
  editingCategory?: Category | null;
  onSuccess?: (savedCategory: Category) => void;
}

export const CategoryModal = ({ visible, onClose, editingCategory, onSuccess }: CategoryModalProps) => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);
  
  const [categoryName, setCategoryName] = useState('');
  const [categoryDesc, setCategoryDesc] = useState('');
  const [monthlyLimit, setMonthlyLimit] = useState('');

  const { showAlert } = useAlertStore();

  useEffect(() => {
    if (visible) {
      if (editingCategory) {
        setCategoryName(editingCategory.name);
        setCategoryDesc(editingCategory.description || '');
        setMonthlyLimit(editingCategory.monthlyLimit ? editingCategory.monthlyLimit.toString() : '');
      } else {
        setCategoryName('');
        setCategoryDesc('');
        setMonthlyLimit('');
      }
    }
  }, [visible, editingCategory]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingCategory) {
        return CategoryService.update(editingCategory.id!, data);
      } else {
        return CategoryService.create(data);
      }
    },
    onSuccess: (savedCat) => {
      if (onSuccess) onSuccess(savedCat);
      onClose();
    },
    onError: (error) => {
      console.error(error);
      showAlert('Error', 'Fallo al guardar categoría');
    }
  });

  const handleSave = () => {
    if (!categoryName.trim()) {
      showAlert('Error', 'Ingresa un nombre para la categoría');
      return;
    }

    const parsedLimit = parseFloat(monthlyLimit) || 0.0;
    
    mutation.mutate({
      name: categoryName,
      description: categoryDesc,
      monthlyLimit: parsedLimit,
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[styles.overlay]}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
            <TouchableOpacity activeOpacity={1} style={[styles.content, { maxHeight: '90%', flexShrink: 1 }]} onPress={() => {}}>
              <View style={styles.header}>
                <Text style={styles.title}>{editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <Text style={styles.closeText}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. Transporte"
              placeholderTextColor={theme.colors.slate600}
              value={categoryName}
              onChangeText={setCategoryName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descripción (Opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. Ubers, gasolina..."
              placeholderTextColor={theme.colors.slate600}
              value={categoryDesc}
              onChangeText={setCategoryDesc}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Límite Mensual (Opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. 500.00"
              placeholderTextColor={theme.colors.slate600}
              value={monthlyLimit}
              onChangeText={setMonthlyLimit}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={[styles.submitBtn, { flex: 1, backgroundColor: 'transparent', borderColor: theme.colors.borderGlow, borderWidth: 1 }]} 
              activeOpacity={0.8} 
              onPress={onClose} 
              disabled={mutation.isPending}
            >
              <Text style={[styles.submitText, { color: theme.colors.slate300 }]}>CANCELAR</Text>
            </TouchableOpacity>
            
            <View style={{ width: 12 }} />

            <TouchableOpacity 
              style={[styles.submitBtn, { flex: 1 }]} 
              activeOpacity={0.8} 
              onPress={handleSave} 
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <ActivityIndicator color={theme.colors.obsidian} />
              ) : (
                <Text style={styles.submitText}>GUARDAR</Text>
              )}
            </TouchableOpacity>
          </View>
              </ScrollView>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(13, 14, 17, 0.85)',
  },
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: 16,
  },
  flexArea: {
    flex: 1,
  },
  content: {
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
  closeBtn: {
    padding: 8,
  },
  closeText: {
    color: colors.slate400,
    fontSize: 20,
  },
  title: {
    color: colors.white,
    fontFamily: 'Geist_500Medium',
    fontSize: 20,
    textTransform: 'uppercase',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 12,
    color: colors.slate400,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    borderRadius: 12,
    padding: 16,
    color: colors.text,
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 16,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  submitBtn: {
    backgroundColor: colors.neonCyan,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  submitText: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 14,
    color: colors.surface,
    letterSpacing: 0.5,
  },
});
