import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '../../../utils/ThemeContext';
import { ThemeColors } from '../../../utils/theme';
import { Shield, Zap, Flame, X, Coins } from 'lucide-react-native';
import { gamificationService } from '../../../services/gamification.service';
import { useAlertStore } from '../../../store/alertStore';

interface StreakRestoreModalProps {
  visible: boolean;
  onClose: () => void;
  currentStreak: number;
  highestStreak: number;
  cyphers: number;
  freezesAvailable: number;
  onRestored: () => void;
}

export const StreakRestoreModal: React.FC<StreakRestoreModalProps> = ({
  visible,
  onClose,
  currentStreak,
  highestStreak,
  cyphers,
  freezesAvailable,
  onRestored,
}) => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);
  const [loading, setLoading] = useState(false);

  const handleRestore = async () => {
    try {
      setLoading(true);
      const res = await gamificationService.restoreStreak();
      useAlertStore.getState().showAlert(
        'Racha Restaurada',
        res.message || '¡Tu racha ha sido restaurada con éxito mediante el Protocolo Nexodus!',
        'success'
      );
      onRestored();
      onClose();
    } catch (err: any) {
      useAlertStore.getState().showAlert(
        'Error',
        err.message || 'No se pudo restaurar la racha.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <X size={18} color={theme.colors.mutedText} />
          </TouchableOpacity>

          <View style={styles.iconContainer}>
            <Flame size={32} color="#00F0FF" />
          </View>

          <Text style={styles.title}>THE NEXODUS PROTOCOL</Text>
          <Text style={styles.subtitle}>RESTAURACIÓN DE RACHA</Text>

          <Text style={styles.description}>
            Tu racha histórica es de <Text style={styles.highlight}>{highestStreak} días</Text>.
            El Protocolo te permite restaurar tu disciplina sin perder el progreso acumulado.
          </Text>

          {/* Resources Summary */}
          <View style={styles.resourceCard}>
            <View style={styles.resourceRow}>
              <View style={styles.resourceLeft}>
                <Coins size={16} color="#F59E0B" />
                <Text style={styles.resourceLabel}>Tus Cyphers</Text>
              </View>
              <Text style={styles.resourceValue}>{cyphers} ⬡</Text>
            </View>

            <View style={styles.resourceRow}>
              <View style={styles.resourceLeft}>
                <Shield size={16} color="#00F0FF" />
                <Text style={styles.resourceLabel}>Escudos Disponibles</Text>
              </View>
              <Text style={styles.resourceValue}>{freezesAvailable}</Text>
            </View>
          </View>

          <View style={styles.costNote}>
            <Text style={styles.costText}>
              {freezesAvailable > 0
                ? '⚡ Se consumirá 1 Escudo de Racha sin costo de Cyphers.'
                : '⚡ Costo de restauración: 50 Cyphers.'}
            </Text>
          </View>

          {/* Action Button */}
          <TouchableOpacity
            style={[styles.actionBtn, loading && styles.actionBtnDisabled]}
            onPress={handleRestore}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#0B0D11" size="small" />
            ) : (
              <Text style={styles.actionBtnText}>
                {freezesAvailable > 0 ? 'USAR ESCUDO Y RESTAURAR' : 'RESTAURAR (50 CYPHERS)'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 10, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#14171F',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#222836',
    padding: 24,
    alignItems: 'center',
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    padding: 6,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderWidth: 1,
    borderColor: '#00F0FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: 'JetBrains Mono',
    fontSize: 10,
    color: '#00F0FF',
    letterSpacing: 2,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'JetBrains Mono',
    fontSize: 16,
    color: colors.text,
    fontWeight: '700',
    marginBottom: 12,
  },
  description: {
    fontFamily: 'Geist',
    fontSize: 13,
    color: colors.slate400,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  highlight: {
    color: '#00F0FF',
    fontWeight: '700',
  },
  resourceCard: {
    width: '100%',
    backgroundColor: '#0B0D11',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#222836',
    padding: 12,
    gap: 8,
    marginBottom: 12,
  },
  resourceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resourceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resourceLabel: {
    fontSize: 12,
    color: colors.mutedText,
    fontFamily: 'Geist',
  },
  resourceValue: {
    fontFamily: 'JetBrains Mono',
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  costNote: {
    marginBottom: 16,
  },
  costText: {
    fontFamily: 'JetBrains Mono',
    fontSize: 10,
    color: '#F59E0B',
    textAlign: 'center',
  },
  actionBtn: {
    width: '100%',
    backgroundColor: '#00F0FF',
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnDisabled: {
    opacity: 0.6,
  },
  actionBtnText: {
    fontFamily: 'JetBrains Mono',
    fontSize: 12,
    fontWeight: '700',
    color: '#0B0D11',
    letterSpacing: 1,
  },
});
