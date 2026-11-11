import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { X, PauseCircle, Trash2, AlertTriangle } from 'lucide-react-native';
import { useTheme } from '../../../utils/ThemeContext';
import { ThemeColors } from '../../../utils/theme';

interface ExitWorkoutModalProps {
  visible: boolean;
  onClose: () => void;
  onPauseAndExit: () => void;
  onConfirmDiscard: () => Promise<void> | void;
}

export const ExitWorkoutModal = React.memo(({
  visible,
  onClose,
  onPauseAndExit,
  onConfirmDiscard,
}: ExitWorkoutModalProps) => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);
  const [isConfirmingDiscard, setIsConfirmingDiscard] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleClose = () => {
    setIsConfirmingDiscard(false);
    onClose();
  };

  const handleExecuteDiscard = async () => {
    setIsDeleting(true);
    try {
      await onConfirmDiscard();
    } finally {
      setIsDeleting(false);
      setIsConfirmingDiscard(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Top Right Close 'X' Button */}
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={handleClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            disabled={isDeleting}
          >
            <X size={20} color={theme.colors.slate400} />
          </TouchableOpacity>

          {!isConfirmingDiscard ? (
            /* Step 1: Pause or Discard */
            <View style={styles.content}>
              <View style={styles.iconCircle}>
                <PauseCircle size={28} color={theme.colors.neonCyan} />
              </View>

              <Text style={styles.title}>Sesión en Curso</Text>
              <Text style={styles.message}>
                ¿Deseas pausar el entrenamiento para salir o descartar la sesión por completo?
              </Text>

              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={styles.primaryBtn}
                  activeOpacity={0.8}
                  onPress={onPauseAndExit}
                >
                  <Text style={styles.primaryBtnText}>Pausar y Salir</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.destructiveOutlineBtn}
                  activeOpacity={0.8}
                  onPress={() => setIsConfirmingDiscard(true)}
                >
                  <Trash2 size={16} color="#FF3366" />
                  <Text style={styles.destructiveOutlineText}>Descartar Sesión</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* Step 2: Double Confirmation to Delete from DB */
            <View style={styles.content}>
              <View style={[styles.iconCircle, styles.dangerIconCircle]}>
                <AlertTriangle size={28} color="#FF3366" />
              </View>

              <Text style={styles.title}>¿Eliminar de la BD?</Text>
              <Text style={styles.message}>
                Se eliminarán permanentemente de la base de datos la sesión y las series registradas. Esta acción no se puede deshacer.
              </Text>

              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={styles.dangerSolidBtn}
                  activeOpacity={0.8}
                  onPress={handleExecuteDiscard}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Trash2 size={16} color="#FFFFFF" />
                      <Text style={styles.dangerSolidText}>Sí, Eliminar de BD</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryBtn}
                  activeOpacity={0.8}
                  onPress={() => setIsConfirmingDiscard(false)}
                  disabled={isDeleting}
                >
                  <Text style={styles.secondaryBtnText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
});

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(5, 7, 10, 0.85)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    card: {
      width: '100%',
      maxWidth: 360,
      backgroundColor: colors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      padding: 24,
      position: 'relative',
    },
    closeBtn: {
      position: 'absolute',
      top: 16,
      right: 16,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.surfaceLight,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10,
    },
    content: {
      alignItems: 'center',
    },
    iconCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: 'rgba(56, 189, 248, 0.1)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
      borderWidth: 1,
      borderColor: 'rgba(56, 189, 248, 0.25)',
    },
    dangerIconCircle: {
      backgroundColor: 'rgba(255, 51, 102, 0.1)',
      borderColor: 'rgba(255, 51, 102, 0.3)',
    },
    title: {
      fontFamily: 'Geist_700Bold',
      fontSize: 18,
      color: colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    message: {
      fontFamily: 'Geist_400Regular',
      fontSize: 13,
      color: colors.slate400,
      textAlign: 'center',
      lineHeight: 18,
      marginBottom: 24,
      paddingHorizontal: 8,
    },
    buttonGroup: {
      width: '100%',
      gap: 10,
    },
    primaryBtn: {
      width: '100%',
      height: 48,
      borderRadius: 12,
      backgroundColor: colors.neonCyan,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryBtnText: {
      fontFamily: 'Geist_600SemiBold',
      fontSize: 15,
      color: colors.obsidian,
      fontWeight: '700',
    },
    destructiveOutlineBtn: {
      width: '100%',
      height: 48,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'rgba(255, 51, 102, 0.4)',
      backgroundColor: 'rgba(255, 51, 102, 0.08)',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    destructiveOutlineText: {
      fontFamily: 'Geist_600SemiBold',
      fontSize: 14,
      color: '#FF3366',
    },
    dangerSolidBtn: {
      width: '100%',
      height: 48,
      borderRadius: 12,
      backgroundColor: '#FF3366',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    dangerSolidText: {
      fontFamily: 'Geist_600SemiBold',
      fontSize: 14,
      color: '#FFFFFF',
      fontWeight: '700',
    },
    secondaryBtn: {
      width: '100%',
      height: 44,
      borderRadius: 12,
      backgroundColor: colors.surfaceLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    secondaryBtnText: {
      fontFamily: 'Geist_500Medium',
      fontSize: 14,
      color: colors.slate300,
    },
  });

