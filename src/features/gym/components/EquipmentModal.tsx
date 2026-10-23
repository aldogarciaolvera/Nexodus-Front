import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Check, Dumbbell, User, Minus, Square, Repeat, Cpu, Columns, Circle, Activity, Volleyball, RotateCcw } from 'lucide-react-native';
import { useTheme } from '../../../utils/ThemeContext';
import { ThemeColors } from '../../../utils/theme';
import { useEquipmentStore, ALL_EQUIPMENT_ITEMS, EquipmentItem } from '../../../store/equipmentStore';

interface EquipmentModalProps {
  visible: boolean;
  onClose: () => void;
}

const renderEquipmentIcon = (iconName: string, color: string) => {
  switch (iconName) {
    case 'User': return <User color={color} size={20} />;
    case 'Dumbbell': return <Dumbbell color={color} size={20} />;
    case 'Minus': return <Minus color={color} size={20} />;
    case 'Square': return <Square color={color} size={20} />;
    case 'Repeat': return <Repeat color={color} size={20} />;
    case 'Cpu': return <Cpu color={color} size={20} />;
    case 'Columns': return <Columns color={color} size={20} />;
    case 'Circle': return <Circle color={color} size={20} />;
    case 'Activity': return <Activity color={color} size={20} />;
    case 'Volleyball': return <Volleyball color={color} size={20} />;
    default: return <Dumbbell color={color} size={20} />;
  }
};

export const EquipmentModal: React.FC<EquipmentModalProps> = ({ visible, onClose }) => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);

  const {
    profiles,
    activeProfileId,
    setActiveProfile,
    toggleEquipmentInActiveProfile,
    resetToDefaultProfile,
    getActiveProfile,
  } = useEquipmentStore();

  const activeProfile = getActiveProfile();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Equipamiento de Gym</Text>
            <Text style={styles.headerSubtitle}>Personaliza los equipos disponibles</Text>
          </View>
          <TouchableOpacity 
            onPress={onClose} 
            style={styles.closeBtn}
            accessibilityRole="button"
            accessibilityLabel="Cerrar modal de equipamiento"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <X color={theme.colors.text} size={22} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
        >
          {/* Preset Profiles */}
          <Text style={styles.sectionTitle}>PERFIL ACTIVO</Text>
          <View style={styles.profilesRow}>
            {profiles.map(p => {
              const isActive = p.id === activeProfileId;
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.profilePill, isActive && styles.profilePillActive]}
                  onPress={() => setActiveProfile(p.id)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={`Seleccionar perfil ${p.name}`}
                >
                  <Text style={[styles.profilePillText, isActive && styles.profilePillTextActive]}>
                    {p.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Active Equipment Summary & Reset */}
          <View style={styles.summaryBar}>
            <Text style={styles.summaryText}>
              <Text style={{ color: theme.colors.neonCyan, fontFamily: 'JetBrainsMono_600SemiBold' }}>
                {activeProfile.availableEquipment.length}
              </Text> de {ALL_EQUIPMENT_ITEMS.length} equipos activos
            </Text>
            <TouchableOpacity 
              style={styles.resetBtn}
              onPress={() => resetToDefaultProfile(activeProfile.id)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Restablecer equipos por defecto de este perfil"
            >
              <RotateCcw color={theme.colors.mutedText} size={14} style={{ marginRight: 4 }} />
              <Text style={styles.resetBtnText}>Restablecer</Text>
            </TouchableOpacity>
          </View>

          {/* Equipment Items Checklist */}
          <Text style={styles.sectionTitle}>MÁQUINAS Y PESAS DISPONIBLES</Text>
          <View style={styles.itemsList}>
            {ALL_EQUIPMENT_ITEMS.map((item: EquipmentItem) => {
              const isChecked = activeProfile.availableEquipment.includes(item.id);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.itemCard, isChecked && styles.itemCardActive]}
                  onPress={() => toggleEquipmentInActiveProfile(item.id)}
                  activeOpacity={0.8}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isChecked }}
                  accessibilityLabel={`${item.name}, ${isChecked ? 'disponible' : 'no disponible'}`}
                >
                  <View style={[styles.itemIconContainer, isChecked && styles.itemIconContainerActive]}>
                    {renderEquipmentIcon(item.iconName, isChecked ? theme.colors.obsidian : theme.colors.mutedText)}
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={[styles.itemName, isChecked && styles.itemNameActive]}>{item.name}</Text>
                    <Text style={styles.itemDesc}>{item.description}</Text>
                  </View>
                  <View style={[styles.checkboxCircle, isChecked && styles.checkboxCircleActive]}>
                    {isChecked && <Check color={theme.colors.obsidian} size={14} strokeWidth={3} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.doneBtn} 
            onPress={onClose} 
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Guardar y cerrar"
          >
            <Text style={styles.doneBtnText}>Listo, Guardar Equipamiento</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.obsidian,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 20 : 10,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderGlow,
  },
  headerTitle: {
    fontFamily: 'Geist_700Bold',
    fontSize: 20,
    color: colors.text,
  },
  headerSubtitle: {
    fontFamily: 'Geist_400Regular',
    fontSize: 12,
    color: colors.mutedText,
    marginTop: 2,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 11,
    color: colors.mutedText,
    letterSpacing: 0.8,
    marginBottom: 12,
    marginTop: 8,
  },
  profilesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  profilePill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  profilePillActive: {
    backgroundColor: colors.neonCyan,
    borderColor: colors.neonCyan,
  },
  profilePillText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    color: colors.mutedText,
  },
  profilePillTextActive: {
    color: colors.obsidian,
    fontFamily: 'Geist_700Bold',
  },
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    marginBottom: 20,
  },
  summaryText: {
    fontFamily: 'Geist_400Regular',
    fontSize: 13,
    color: colors.text,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  resetBtnText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 12,
    color: colors.mutedText,
  },
  itemsList: {
    gap: 10,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  itemCardActive: {
    borderColor: colors.neonCyan,
    backgroundColor: 'rgba(0, 240, 255, 0.04)',
  },
  itemIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemIconContainerActive: {
    backgroundColor: colors.neonCyan,
  },
  itemInfo: {
    flex: 1,
    paddingRight: 10,
  },
  itemName: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 14,
    color: colors.text,
    marginBottom: 2,
  },
  itemNameActive: {
    color: colors.text,
  },
  itemDesc: {
    fontFamily: 'Geist_400Regular',
    fontSize: 11,
    color: colors.mutedText,
    lineHeight: 15,
  },
  checkboxCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.mutedText,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCircleActive: {
    backgroundColor: colors.neonCyan,
    borderColor: colors.neonCyan,
  },
  footer: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderGlow,
    backgroundColor: colors.obsidian,
  },
  doneBtn: {
    backgroundColor: colors.neonCyan,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: {
    fontFamily: 'Geist_700Bold',
    fontSize: 15,
    color: colors.obsidian,
  },
});
