import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useTheme } from '../../../utils/ThemeContext';
import { ThemeColors } from '../../../utils/theme';
import { Category, CategoryService } from '../../../services/category.service';
import { ActionSheet } from '../../../components/ActionSheet';

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
  const [loading, setLoading] = useState(false);

  // Error State
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setErrorVisible(true);
  };

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

  const handleSave = async () => {
    if (!categoryName.trim()) {
      showError('Ingresa un nombre para la categoría');
      return;
    }

    try {
      setLoading(true);
      
      const parsedLimit = parseFloat(monthlyLimit) || 0.0;

      if (editingCategory) {
        const updated = await CategoryService.update(editingCategory.id!, {
          name: categoryName,
          description: categoryDesc,
          monthlyLimit: parsedLimit,
        });
        if (onSuccess) onSuccess(updated);
      } else {
        const newCat = await CategoryService.create({
          name: categoryName,
          description: categoryDesc,
          monthlyLimit: parsedLimit,
        });
        if (onSuccess) onSuccess(newCat);
      }
      onClose();
    } catch (error) {
      console.error(error);
      showError('Fallo al guardar categoría');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.content}>
          <Text style={styles.title}>{editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}</Text>

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
              disabled={loading}
            >
              <Text style={[styles.submitText, { color: theme.colors.slate300 }]}>CANCELAR</Text>
            </TouchableOpacity>
            
            <View style={{ width: 12 }} />

            <TouchableOpacity 
              style={[styles.submitBtn, { flex: 1 }]} 
              activeOpacity={0.8} 
              onPress={handleSave} 
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={theme.colors.obsidian} />
              ) : (
                <Text style={styles.submitText}>GUARDAR</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      {/* Action Sheet para errores */}
      <ActionSheet
        visible={errorVisible}
        onClose={() => setErrorVisible(false)}
        title="Error"
        subtitle={errorMsg}
        isError={true}
        options={[
          {
            label: 'OK',
            onPress: () => setErrorVisible(false)
          }
        ]}
      />
    </Modal>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
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
    marginBottom: 40,
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  title: {
    fontFamily: 'Geist_500Medium',
    fontSize: 20,
    color: colors.text,
    marginBottom: 24,
    textTransform: 'uppercase',
    textAlign: 'center',
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
