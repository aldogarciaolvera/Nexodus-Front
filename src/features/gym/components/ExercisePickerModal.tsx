import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList, TextInput, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, CheckCircle2, Search, X } from 'lucide-react-native';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import { gymService, Exercise } from '../../../services/gym.service';
import { queryKeys } from '../../../services/queryKeys';
import { Skeleton } from '../../../components/Skeleton';
import { useTheme } from '../../../utils/ThemeContext';
import { ThemeColors } from '../../../utils/theme';
import { translateBodyPart, translateMuscle, translateEquipment, normalizeSearchText } from '../../../utils/gymTranslations';

interface ExercisePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (selected: Exercise[]) => void;
  initialSelectedIds?: string[];
}

export const ExercisePickerModal: React.FC<ExercisePickerModalProps> = ({
  visible,
  onClose,
  onConfirm,
  initialSelectedIds = [],
}) => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBodyPart, setSelectedBodyPart] = useState<string>('Todos');
  const [selectedForAddition, setSelectedForAddition] = useState<Set<string>>(new Set());

  const { data: availableExercises = [], isLoading: isLoadingExercises } = useQuery({
    queryKey: queryKeys.gym.exercises,
    queryFn: () => gymService.getAllExercises(),
    enabled: visible,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  useEffect(() => {
    if (visible) {
      setSelectedForAddition(new Set(initialSelectedIds));
      setSearchQuery('');
    }
  }, [visible, initialSelectedIds]);

  const bodyParts = useMemo(() => {
    const rawParts = Array.from(new Set(availableExercises.map(e => e.bodyPart || e.targetMuscleGroup).filter(Boolean))) as string[];
    // Sort alphabetically by their translated Spanish representation
    rawParts.sort((a, b) => translateBodyPart(a).localeCompare(translateBodyPart(b)));
    return ['Todos', ...rawParts];
  }, [availableExercises]);

  const filteredExercises = useMemo(() => {
    const query = normalizeSearchText(searchQuery);

    return availableExercises.filter(e => {
      const part = e.bodyPart || e.targetMuscleGroup;
      const matchesBodyPart = selectedBodyPart === 'Todos' || part === selectedBodyPart;
      if (!matchesBodyPart) return false;

      if (!query) return true;

      const nameMatch = normalizeSearchText(e.name).includes(query);
      const muscleMatch = normalizeSearchText(e.muscle).includes(query) || normalizeSearchText(translateMuscle(e.muscle)).includes(query);
      const bodyPartMatch = normalizeSearchText(part).includes(query) || normalizeSearchText(translateBodyPart(part)).includes(query);
      const equipmentMatch = normalizeSearchText(e.equipment).includes(query) || normalizeSearchText(translateEquipment(e.equipment)).includes(query);

      return Boolean(nameMatch || muscleMatch || bodyPartMatch || equipmentMatch);
    });
  }, [availableExercises, selectedBodyPart, searchQuery]);

  const toggleExerciseSelection = (exerciseId: string) => {
    const newSet = new Set(selectedForAddition);
    if (newSet.has(exerciseId)) {
      newSet.delete(exerciseId);
    } else {
      newSet.add(exerciseId);
    }
    setSelectedForAddition(newSet);
  };

  const handleConfirm = () => {
    const selectedList = availableExercises.filter(ex => selectedForAddition.has(ex.id));
    onConfirm(selectedList);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={onClose} 
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Volver y cancelar selección"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <ArrowLeft color={theme.colors.text} size={24} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Selecciona tus Ejercicios</Text>
            <TouchableOpacity 
              onPress={handleConfirm}
              accessibilityRole="button"
              accessibilityLabel="Confirmar selección de ejercicios"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.confirmText}>Listo</Text>
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchWrapper}>
            <View style={styles.searchBar}>
              <Search color={theme.colors.mutedText} size={18} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar por nombre, músculo o equipo..."
                placeholderTextColor={theme.colors.mutedText}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="search"
                accessibilityLabel="Buscar ejercicio por nombre"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  style={styles.clearSearchBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Limpiar búsqueda"
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X color={theme.colors.mutedText} size={16} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Body Part Filter Chips */}
          <View style={styles.filterContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.filterScroll}
              keyboardShouldPersistTaps="handled"
            >
              {bodyParts.map(bp => {
                const isSelected = selectedBodyPart === bp;
                const displayLabel = bp === 'Todos' ? 'Todos' : translateBodyPart(bp);
                return (
                  <TouchableOpacity 
                    key={bp} 
                    style={[styles.filterChip, isSelected && styles.filterChipActive]}
                    onPress={() => setSelectedBodyPart(bp)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={`Filtrar por ${displayLabel}`}
                    hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                  >
                    <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                      {displayLabel}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Exercise List */}
          {isLoadingExercises ? (
            <View style={styles.skeletonContainer}>
              <Skeleton width="100%" height={80} borderRadius={16} style={{ marginBottom: 12 }} />
              <Skeleton width="100%" height={80} borderRadius={16} style={{ marginBottom: 12 }} />
              <Skeleton width="100%" height={80} borderRadius={16} style={{ marginBottom: 12 }} />
              <Skeleton width="100%" height={80} borderRadius={16} style={{ marginBottom: 12 }} />
            </View>
          ) : (
            <FlatList
              data={filteredExercises}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              initialNumToRender={10}
              maxToRenderPerBatch={10}
              windowSize={5}
              extraData={selectedForAddition}
              ListHeaderComponent={
                <View style={styles.resultsHeader}>
                  <Text style={styles.resultsCount}>
                    {filteredExercises.length} {filteredExercises.length === 1 ? 'EJERCICIO ENCONTRADO' : 'EJERCICIOS DISPONIBLES'}
                  </Text>
                </View>
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyTitle}>No se encontraron ejercicios</Text>
                  <Text style={styles.emptySubtitle}>
                    {searchQuery ? `No hay resultados para "${searchQuery}"` : 'No hay ejercicios en esta categoría.'}
                  </Text>
                </View>
              }
              renderItem={({ item: ex }) => {
                const isSelected = selectedForAddition.has(ex.id);
                const imgUrl = ex.thumbUrl || ex.gifUrl;
                const muscleText = translateMuscle(ex.muscle || ex.targetMuscleGroup);
                const equipmentText = translateEquipment(ex.equipment);
                const bodyPartText = translateBodyPart(ex.bodyPart);

                return (
                  <TouchableOpacity 
                    style={[styles.exerciseOptionCard, isSelected && styles.exerciseOptionCardSelected]} 
                    onPress={() => toggleExerciseSelection(ex.id)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isSelected }}
                    accessibilityLabel={`${ex.name}, ${bodyPartText}, ${muscleText}`}
                  >
                    <View style={styles.cardInfo}>
                      <Text style={styles.exerciseOptionName}>{ex.name}</Text>
                      
                      <View style={styles.tagsRow}>
                        {Boolean(bodyPartText) && (
                          <View style={styles.bodyPartBadge}>
                            <Text style={styles.bodyPartBadgeText}>{bodyPartText}</Text>
                          </View>
                        )}
                        <Text style={styles.exerciseOptionTarget} numberOfLines={1}>
                          {muscleText} • {equipmentText}
                        </Text>
                      </View>
                    </View>

                    {imgUrl ? (
                      <Image source={{ uri: imgUrl }} style={styles.exerciseThumb} contentFit="cover" />
                    ) : null}

                    {isSelected && (
                      <View style={styles.selectedBadge}>
                        <CheckCircle2 color={theme.colors.neonCyan} size={20} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
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
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderGlow,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontFamily: 'Geist_700Bold',
    fontSize: 17,
    color: colors.text,
  },
  confirmText: {
    color: colors.neonCyan,
    fontFamily: 'Geist_600SemiBold',
    fontSize: 15,
  },
  searchWrapper: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontFamily: 'Geist_400Regular',
    fontSize: 14,
    height: '100%',
    padding: 0,
  },
  clearSearchBtn: {
    padding: 4,
    marginLeft: 4,
  },
  filterContainer: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderGlow,
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  filterChipActive: {
    backgroundColor: colors.neonCyan,
    borderColor: colors.neonCyan,
  },
  filterChipText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    color: colors.mutedText,
  },
  filterChipTextActive: {
    color: colors.obsidian,
    fontFamily: 'Geist_600SemiBold',
  },
  resultsHeader: {
    marginBottom: 12,
  },
  resultsCount: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 11,
    color: colors.mutedText,
    letterSpacing: 0.8,
  },
  skeletonContainer: {
    padding: 20,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  exerciseOptionCard: {
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exerciseOptionCardSelected: {
    borderColor: colors.neonCyan,
    backgroundColor: colors.surfaceLight,
  },
  cardInfo: {
    flex: 1,
    paddingRight: 10,
  },
  exerciseOptionName: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 15,
    color: colors.text,
    marginBottom: 6,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  bodyPartBadge: {
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
  },
  bodyPartBadgeText: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 10,
    color: colors.neonCyan,
  },
  exerciseOptionTarget: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 11,
    color: colors.mutedText,
    flexShrink: 1,
  },
  exerciseThumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontFamily: 'Geist_400Regular',
    fontSize: 13,
    color: colors.mutedText,
    textAlign: 'center',
  },
});
