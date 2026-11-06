import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Plus, Sparkles, UtensilsCrossed } from 'lucide-react-native';
import { useTheme } from '../../../utils/ThemeContext';
import { ThemeColors } from '../../../utils/theme';
import { dietService, Food } from '../../../services/diet.service';
import { useAlertStore } from '../../../store/alertStore';

interface CreateFoodModalProps {
  visible: boolean;
  onClose: () => void;
  onFoodCreated: (food: Food) => void;
  initialBarcode?: string;
}

export const CreateFoodModal: React.FC<CreateFoodModalProps> = ({
  visible,
  onClose,
  onFoodCreated,
  initialBarcode = '',
}) => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);
  const showAlert = useAlertStore((state) => state.showAlert);

  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [barcode, setBarcode] = useState(initialBarcode);
  const [servingSize, setServingSize] = useState('100');
  const [servingUnit, setServingUnit] = useState('g');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [sodiumMg, setSodiumMg] = useState('');
  const [potassiumMg, setPotassiumMg] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      showAlert('Campo Requerido', 'Ingresa el nombre del alimento.', 'error');
      return;
    }
    const numCalories = parseFloat(calories);
    const numServingSize = parseFloat(servingSize) || 100;
    const numProtein = parseFloat(protein) || 0;
    const numCarbs = parseFloat(carbs) || 0;
    const numFat = parseFloat(fat) || 0;

    if (isNaN(numCalories) || numCalories < 0) {
      showAlert('Calorías Requeridas', 'Ingresa las calorías por porción.', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const newFood = await dietService.createFood({
        name: name.trim(),
        brand: brand.trim() || undefined,
        barcode: barcode.trim() || undefined,
        servingSize: numServingSize,
        servingUnit: servingUnit.trim() || 'g',
        calories: numCalories,
        protein: numProtein,
        carbs: numCarbs,
        fat: numFat,
        sodiumMg: sodiumMg ? parseFloat(sodiumMg) : undefined,
        potassiumMg: potassiumMg ? parseFloat(potassiumMg) : undefined,
      });

      showAlert('Alimento Creado', `Se registró "${name}" en el catálogo.`, 'success');
      onFoodCreated(newFood);
      onClose();
    } catch (e: any) {
      showAlert('Error', e.message || 'No se pudo guardar el alimento.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <UtensilsCrossed size={18} color={theme.colors.neonCyan} />
              <View>
                <Text style={styles.headerTitle}>Crear Alimento</Text>
                <Text style={styles.headerSubtitle}>Agregar al catálogo personalizado</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Cerrar modal de crear alimento"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={20} color={theme.colors.mutedText} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Nombre y Marca */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>INFORMACIÓN BÁSICA</Text>

              <Text style={styles.inputLabel}>NOMBRE DEL ALIMENTO *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Ej. Pechuga de pollo cocida"
                placeholderTextColor={theme.colors.mutedText}
                accessibilityLabel="Nombre del alimento"
              />

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.inputLabel}>MARCA (OPCIONAL)</Text>
                  <TextInput
                    style={styles.input}
                    value={brand}
                    onChangeText={setBrand}
                    placeholder="Ej. Bachoco"
                    placeholderTextColor={theme.colors.mutedText}
                    accessibilityLabel="Marca"
                  />
                </View>

                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.inputLabel}>CÓDIGO DE BARRAS</Text>
                  <TextInput
                    style={styles.input}
                    value={barcode}
                    onChangeText={setBarcode}
                    placeholder="Ej. 7501000111222"
                    placeholderTextColor={theme.colors.mutedText}
                    keyboardType="numeric"
                    accessibilityLabel="Código de barras"
                  />
                </View>
              </View>
            </View>

            {/* Porción */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>TAMAÑO DE PORCIÓN</Text>
              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.inputLabel}>CANTIDAD BASE</Text>
                  <TextInput
                    style={styles.input}
                    value={servingSize}
                    onChangeText={setServingSize}
                    placeholder="100"
                    placeholderTextColor={theme.colors.mutedText}
                    keyboardType="numeric"
                    accessibilityLabel="Cantidad base de porción"
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.inputLabel}>UNIDAD</Text>
                  <TextInput
                    style={styles.input}
                    value={servingUnit}
                    onChangeText={setServingUnit}
                    placeholder="g, ml, pieza"
                    placeholderTextColor={theme.colors.mutedText}
                    accessibilityLabel="Unidad de porción"
                  />
                </View>
              </View>
            </View>

            {/* Macros */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>MACRONUTRIENTES (POR PORCIÓN)</Text>

              <Text style={styles.inputLabel}>CALORÍAS (KCAL) *</Text>
              <TextInput
                style={[styles.input, styles.inputHighlight]}
                value={calories}
                onChangeText={setCalories}
                placeholder="0"
                placeholderTextColor={theme.colors.mutedText}
                keyboardType="numeric"
                accessibilityLabel="Calorías"
              />

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 6 }}>
                  <Text style={styles.inputLabel}>PROTEÍNA (G)</Text>
                  <TextInput
                    style={styles.input}
                    value={protein}
                    onChangeText={setProtein}
                    placeholder="0"
                    placeholderTextColor={theme.colors.mutedText}
                    keyboardType="numeric"
                    accessibilityLabel="Proteína"
                  />
                </View>

                <View style={{ flex: 1, marginHorizontal: 6 }}>
                  <Text style={styles.inputLabel}>CARBOS (G)</Text>
                  <TextInput
                    style={styles.input}
                    value={carbs}
                    onChangeText={setCarbs}
                    placeholder="0"
                    placeholderTextColor={theme.colors.mutedText}
                    keyboardType="numeric"
                    accessibilityLabel="Carbohidratos"
                  />
                </View>

                <View style={{ flex: 1, marginLeft: 6 }}>
                  <Text style={styles.inputLabel}>GRASAS (G)</Text>
                  <TextInput
                    style={styles.input}
                    value={fat}
                    onChangeText={setFat}
                    placeholder="0"
                    placeholderTextColor={theme.colors.mutedText}
                    keyboardType="numeric"
                    accessibilityLabel="Grasas"
                  />
                </View>
              </View>
            </View>

            {/* Micronutrientes opcionales */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>MICRONUTRIENTES (OPCIONAL)</Text>
              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.inputLabel}>SODIO (MG)</Text>
                  <TextInput
                    style={styles.input}
                    value={sodiumMg}
                    onChangeText={setSodiumMg}
                    placeholder="0"
                    placeholderTextColor={theme.colors.mutedText}
                    keyboardType="numeric"
                    accessibilityLabel="Sodio en miligramos"
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.inputLabel}>POTASIO (MG)</Text>
                  <TextInput
                    style={styles.input}
                    value={potassiumMg}
                    onChangeText={setPotassiumMg}
                    placeholder="0"
                    placeholderTextColor={theme.colors.mutedText}
                    keyboardType="numeric"
                    accessibilityLabel="Potasio en miligramos"
                  />
                </View>
              </View>
            </View>

            {/* Botón Guardar */}
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSave}
              disabled={isSubmitting}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Guardar alimento"
            >
              {isSubmitting ? (
                <ActivityIndicator color={theme.colors.obsidian} />
              ) : (
                <>
                  <Plus size={16} color={theme.colors.obsidian} />
                  <Text style={styles.saveBtnText}>Guardar en Catálogo</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.obsidian,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderGlow,
    },
    headerTitle: {
      fontFamily: 'Geist_700Bold',
      fontSize: 17,
      color: colors.text,
    },
    headerSubtitle: {
      fontFamily: 'Geist_400Regular',
      fontSize: 12,
      color: colors.mutedText,
      marginTop: 1,
    },
    closeBtn: {
      padding: 6,
      backgroundColor: colors.surfaceLight,
      borderRadius: 8,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      padding: 20,
      gap: 16,
      paddingBottom: 40,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.borderGlow,
    },
    sectionTitle: {
      fontFamily: 'JetBrainsMono_600SemiBold',
      fontSize: 11,
      color: colors.neonCyan,
      letterSpacing: 0.8,
      marginBottom: 12,
    },
    inputLabel: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 10,
      color: colors.mutedText,
      letterSpacing: 0.8,
      marginBottom: 6,
    },
    input: {
      backgroundColor: colors.surfaceLight,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      color: colors.text,
      fontFamily: 'Geist_500Medium',
      fontSize: 14,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 12,
    },
    inputHighlight: {
      fontFamily: 'JetBrainsMono_600SemiBold',
      borderColor: 'rgba(0, 240, 255, 0.4)',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    saveBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.neonCyan,
      paddingVertical: 14,
      borderRadius: 12,
      marginTop: 8,
    },
    saveBtnText: {
      fontFamily: 'Geist_600SemiBold',
      fontSize: 14,
      color: colors.obsidian,
    },
  });
