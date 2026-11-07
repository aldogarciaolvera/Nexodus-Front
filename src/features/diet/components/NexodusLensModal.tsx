import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Camera,
  Image as ImageIcon,
  Sparkles,
  X,
  Check,
  Flame,
  ChevronRight,
  RefreshCw,
  Plus,
} from 'lucide-react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../../utils/ThemeContext';
import { ThemeColors } from '../../../utils/theme';
import { useAlertStore } from '../../../store/alertStore';
import { dietService, FoodAnalysisResult, MealItem } from '../../../services/diet.service';
import { Skeleton } from '../../../components/Skeleton';

interface NexodusLensModalProps {
  visible: boolean;
  onClose: () => void;
  onAddAnalyzedMeal?: (items: MealItem[], mealName: string) => void;
}

export const NexodusLensModal: React.FC<NexodusLensModalProps> = ({
  visible,
  onClose,
  onAddAnalyzedMeal,
}) => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);
  const showAlert = useAlertStore((state) => state.showAlert);

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [contextNote, setContextNote] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<FoodAnalysisResult | null>(null);

  const resetState = () => {
    setImageUri(null);
    setImageBase64(null);
    setContextNote('');
    setIsAnalyzing(false);
    setAnalysisResult(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleTakePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        showAlert('Permiso Requerido', 'Se requiere acceso a la cámara para capturar fotos con Nexodus Lens.', 'info');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setImageUri(asset.uri);
        setImageBase64(asset.base64 || null);
        setAnalysisResult(null);
      }
    } catch {
      showAlert('Error', 'No se pudo abrir la cámara.', 'error');
    }
  };

  const handlePickFromGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showAlert('Permiso Requerido', 'Se requiere acceso a la galería para seleccionar fotos.', 'info');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setImageUri(asset.uri);
        setImageBase64(asset.base64 || null);
        setAnalysisResult(null);
      }
    } catch {
      showAlert('Error', 'No se pudo abrir la galería.', 'error');
    }
  };

  const handleAnalyze = async () => {
    if (!imageBase64) {
      showAlert('Foto Requerida', 'Toma una foto o selecciona una imagen de tu plato de comida primero.', 'info');
      return;
    }

    try {
      setIsAnalyzing(true);
      const res = await dietService.analyzeFoodImage({
        base64Image: imageBase64,
        mimeType: 'image/jpeg',
        additionalContext: contextNote.trim() || undefined,
      });

      setAnalysisResult(res);
      showAlert('Plato Identificado', `Nexodus Lens identificó "${res.dishName}".`, 'success');
    } catch (e: any) {
      const errorMessage = e?.message || 'Error al comunicarse con Nexodus Lens.';
      showAlert('Error de Análisis', errorMessage, 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplyToMeal = () => {
    if (!analysisResult) return;

    const mappedItems: MealItem[] = analysisResult.items.map((item) => ({
      foodName: item.foodName,
      quantity: item.estimatedGrams || 100,
      unit: 'g',
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
    }));

    if (onAddAnalyzedMeal) {
      onAddAnalyzedMeal(mappedItems, analysisResult.dishName || 'Comida Analizada');
    }

    handleClose();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={handleClose}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View style={styles.lensIconCircle}>
              <Sparkles size={16} color={theme.colors.neonCyan} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Nexodus Lens</Text>
              <Text style={styles.headerSub}>Visión Artificial y Nutrición IA</Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
            <X size={20} color={theme.colors.mutedText} />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Image Preview or Capture Buttons */}
            {imageUri ? (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: imageUri }} style={styles.imagePreview} contentFit="cover" />
                <TouchableOpacity
                  style={styles.retakeBtn}
                  onPress={() => {
                    setImageUri(null);
                    setImageBase64(null);
                    setAnalysisResult(null);
                  }}
                  activeOpacity={0.8}
                >
                  <RefreshCw size={14} color={theme.colors.white} />
                  <Text style={styles.retakeBtnText}>Cambiar Foto</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.capturePromptCard}>
                <View style={styles.promptIconCircle}>
                  <Camera size={32} color={theme.colors.neonCyan} />
                </View>
                <Text style={styles.promptTitle}>Fotografía tu Plato</Text>
                <Text style={styles.promptSub}>
                  Captura una foto de tu comida o bebida. Nexodus Lens estimará los ingredientes, gramajes y macronutrientes.
                </Text>

                <View style={styles.captureActionsRow}>
                  <TouchableOpacity
                    style={styles.cameraActionBtn}
                    onPress={handleTakePhoto}
                    activeOpacity={0.8}
                  >
                    <Camera size={18} color={theme.colors.obsidian} />
                    <Text style={styles.cameraActionText}>Tomar Foto</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.galleryActionBtn}
                    onPress={handlePickFromGallery}
                    activeOpacity={0.8}
                  >
                    <ImageIcon size={18} color={theme.colors.neonCyan} />
                    <Text style={styles.galleryActionText}>Galería</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Context Note Input (when image is selected and not analyzed yet) */}
            {imageUri && !analysisResult && (
              <View style={styles.contextContainer}>
                <Text style={styles.sectionLabel}>DETALLES ADICIONALES (OPCIONAL)</Text>
                <TextInput
                  style={styles.contextInput}
                  placeholder="Ej. Pechuga a la plancha sin aceite, salsa verde picante..."
                  placeholderTextColor={theme.colors.slate600}
                  value={contextNote}
                  onChangeText={setContextNote}
                  maxLength={150}
                />

                <TouchableOpacity
                  style={[styles.analyzeBtn, isAnalyzing && styles.analyzeBtnDisabled]}
                  onPress={handleAnalyze}
                  disabled={isAnalyzing}
                  activeOpacity={0.8}
                >
                  {isAnalyzing ? (
                    <View style={styles.analyzingRow}>
                      <ActivityIndicator color={theme.colors.obsidian} />
                      <Text style={styles.analyzeBtnText}>Analizando con Gemini Vision...</Text>
                    </View>
                  ) : (
                    <View style={styles.analyzingRow}>
                      <Sparkles size={18} color={theme.colors.obsidian} />
                      <Text style={styles.analyzeBtnText}>Analizar con Nexodus Lens</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Loading Skeleton during analysis */}
            {isAnalyzing && (
              <View style={styles.loadingSkeletonCard}>
                <Skeleton width="60%" height={24} style={{ marginBottom: 12 }} />
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                  <Skeleton width="22%" height={50} borderRadius={8} />
                  <Skeleton width="22%" height={50} borderRadius={8} />
                  <Skeleton width="22%" height={50} borderRadius={8} />
                  <Skeleton width="22%" height={50} borderRadius={8} />
                </View>
                <Skeleton width="100%" height={16} style={{ marginBottom: 8 }} />
                <Skeleton width="80%" height={16} />
              </View>
            )}

            {/* Results Card */}
            {analysisResult && !isAnalyzing && (
              <View style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.resultDishLabel}>PLATO IDENTIFICADO</Text>
                    <Text style={styles.resultDishName}>{analysisResult.dishName}</Text>
                  </View>
                  <View style={styles.confidenceBadge}>
                    <Text style={styles.confidenceText}>
                      {Math.round(analysisResult.confidence * 100)}% Confianza
                    </Text>
                  </View>
                </View>

                {/* Macro Grid */}
                <View style={styles.macroGrid}>
                  <View style={styles.macroItem}>
                    <Text style={styles.macroItemLabel}>KCAL</Text>
                    <Text style={[styles.macroItemVal, { color: theme.colors.text }]}>
                      {Math.round(analysisResult.totalCalories)}
                    </Text>
                  </View>

                  <View style={styles.macroItem}>
                    <Text style={styles.macroItemLabel}>PROTEÍNA</Text>
                    <Text style={[styles.macroItemVal, { color: theme.colors.neonCyan }]}>
                      {Math.round(analysisResult.totalProtein)}g
                    </Text>
                  </View>

                  <View style={styles.macroItem}>
                    <Text style={styles.macroItemLabel}>CARBOS</Text>
                    <Text style={[styles.macroItemVal, { color: theme.colors.warning }]}>
                      {Math.round(analysisResult.totalCarbs)}g
                    </Text>
                  </View>

                  <View style={styles.macroItem}>
                    <Text style={styles.macroItemLabel}>GRASAS</Text>
                    <Text style={[styles.macroItemVal, { color: theme.colors.error }]}>
                      {Math.round(analysisResult.totalFat)}g
                    </Text>
                  </View>
                </View>

                {/* Notes */}
                {analysisResult.notes ? (
                  <Text style={styles.resultNotesText}>{analysisResult.notes}</Text>
                ) : null}

                {/* Breakdown items */}
                <Text style={styles.sectionLabel}>INGREDIENTES DETECTADOS</Text>
                <View style={styles.itemsList}>
                  {analysisResult.items.map((item, idx) => (
                    <View key={idx} style={styles.ingredientRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.ingredientName}>{item.foodName}</Text>
                        <Text style={styles.ingredientSub}>
                          ~{item.estimatedGrams}g • P: {item.protein}g • C: {item.carbs}g • G: {item.fat}g
                        </Text>
                      </View>
                      <Text style={styles.ingredientCalories}>{Math.round(item.calories)} kcal</Text>
                    </View>
                  ))}
                </View>

                {/* Add to meals button */}
                <TouchableOpacity
                  style={styles.applyBtn}
                  onPress={handleApplyToMeal}
                  activeOpacity={0.8}
                >
                  <Plus size={18} color={theme.colors.obsidian} />
                  <Text style={styles.applyBtnText}>Agregar a Registro de Comidas</Text>
                </TouchableOpacity>
              </View>
            )}
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
      backgroundColor: colors.surface,
    },
    headerTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    lensIconCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(56, 189, 248, 0.15)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.neonCyan,
    },
    headerTitle: {
      fontFamily: 'Geist_700Bold',
      fontSize: 16,
      color: colors.text,
    },
    headerSub: {
      fontFamily: 'JetBrainsMono_400Regular',
      fontSize: 10,
      color: colors.mutedText,
    },
    closeBtn: {
      padding: 6,
    },
    scrollContent: {
      padding: 20,
      paddingBottom: 60,
    },
    capturePromptCard: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      padding: 24,
      alignItems: 'center',
      marginBottom: 20,
    },
    promptIconCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: 'rgba(56, 189, 248, 0.12)',
      borderWidth: 1,
      borderColor: colors.neonCyan,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    promptTitle: {
      fontFamily: 'Geist_700Bold',
      fontSize: 20,
      color: colors.text,
      marginBottom: 6,
    },
    promptSub: {
      fontFamily: 'Geist_400Regular',
      fontSize: 13,
      color: colors.mutedText,
      textAlign: 'center',
      lineHeight: 18,
      marginBottom: 24,
    },
    captureActionsRow: {
      flexDirection: 'row',
      gap: 12,
      width: '100%',
    },
    cameraActionBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.neonCyan,
      paddingVertical: 14,
      borderRadius: 14,
    },
    cameraActionText: {
      fontFamily: 'Geist_700Bold',
      fontSize: 14,
      color: colors.obsidian,
    },
    galleryActionBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.surfaceLight,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      paddingVertical: 14,
      borderRadius: 14,
    },
    galleryActionText: {
      fontFamily: 'Geist_500Medium',
      fontSize: 14,
      color: colors.neonCyan,
    },
    imagePreviewContainer: {
      width: '100%',
      height: 260,
      borderRadius: 18,
      overflow: 'hidden',
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      position: 'relative',
    },
    imagePreview: {
      width: '100%',
      height: '100%',
    },
    retakeBtn: {
      position: 'absolute',
      bottom: 12,
      right: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(11, 13, 17, 0.85)',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.borderGlow,
    },
    retakeBtnText: {
      fontFamily: 'Geist_500Medium',
      fontSize: 12,
      color: colors.white,
    },
    contextContainer: {
      marginBottom: 20,
    },
    sectionLabel: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 10,
      color: colors.slate400,
      marginBottom: 8,
      letterSpacing: 0.5,
    },
    contextInput: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      borderRadius: 12,
      padding: 14,
      fontFamily: 'Geist_400Regular',
      fontSize: 13,
      color: colors.text,
      marginBottom: 16,
    },
    analyzeBtn: {
      backgroundColor: colors.neonCyan,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    analyzeBtnDisabled: {
      opacity: 0.7,
    },
    analyzingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    analyzeBtnText: {
      fontFamily: 'Geist_700Bold',
      fontSize: 14,
      color: colors.obsidian,
    },
    loadingSkeletonCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      marginBottom: 20,
    },
    resultCard: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      padding: 20,
      marginBottom: 20,
    },
    resultHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 12,
      marginBottom: 16,
    },
    resultDishLabel: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 9,
      color: colors.neonCyan,
      letterSpacing: 0.8,
      marginBottom: 2,
    },
    resultDishName: {
      fontFamily: 'Geist_700Bold',
      fontSize: 18,
      color: colors.text,
    },
    confidenceBadge: {
      backgroundColor: 'rgba(56, 189, 248, 0.12)',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.neonCyan,
    },
    confidenceText: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 10,
      color: colors.neonCyan,
    },
    macroGrid: {
      flexDirection: 'row',
      gap: 8,
      backgroundColor: colors.surfaceLight,
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      marginBottom: 14,
    },
    macroItem: {
      flex: 1,
      alignItems: 'center',
    },
    macroItemLabel: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 9,
      color: colors.slate400,
      marginBottom: 2,
    },
    macroItemVal: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 16,
      fontWeight: '700',
    },
    resultNotesText: {
      fontFamily: 'Geist_400Regular',
      fontSize: 12,
      color: colors.mutedText,
      fontStyle: 'italic',
      marginBottom: 16,
      lineHeight: 16,
    },
    itemsList: {
      gap: 8,
      marginBottom: 20,
    },
    ingredientRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 10,
      paddingHorizontal: 12,
      backgroundColor: colors.surfaceLight,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.borderGlow,
    },
    ingredientName: {
      fontFamily: 'Geist_500Medium',
      fontSize: 13,
      color: colors.text,
    },
    ingredientSub: {
      fontFamily: 'JetBrainsMono_400Regular',
      fontSize: 10,
      color: colors.slate500,
      marginTop: 2,
    },
    ingredientCalories: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 12,
      color: colors.neonCyan,
    },
    applyBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.neonCyan,
      paddingVertical: 14,
      borderRadius: 14,
    },
    applyBtnText: {
      fontFamily: 'Geist_700Bold',
      fontSize: 14,
      color: colors.obsidian,
    },
  });
