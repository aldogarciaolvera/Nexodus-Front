import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { X, Zap, ZapOff, ScanBarcode, Camera } from 'lucide-react-native';
import { useTheme } from '../../../utils/ThemeContext';
import { ThemeColors } from '../../../utils/theme';
import { useAlertStore } from '../../../store/alertStore';

interface BarcodeScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onBarcodeScanned: (barcode: string) => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SCAN_BOX_SIZE = Math.min(SCREEN_WIDTH * 0.75, 280);

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  visible,
  onClose,
  onBarcodeScanned,
}) => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);
  const showAlert = useAlertStore((state) => state.showAlert);

  const [permission, requestPermission] = useCameraPermissions();
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (visible) {
      setScanned(false);
      setTorchEnabled(false);
      if (permission && !permission.granted && permission.canAskAgain) {
        requestPermission();
      }
    }
  }, [visible, permission]);

  const handleScan = ({ data }: { data: string }) => {
    if (scanned || !data) return;
    setScanned(true);
    onBarcodeScanned(data.trim());
    onClose();
  };

  const handleRequestPermission = async () => {
    const res = await requestPermission();
    if (!res.granted) {
      showAlert(
        'Permiso de Cámara',
        'Se requiere acceso a la cámara para escanear el código de barras. Puedes habilitarlo desde los ajustes de la aplicación.',
        'info'
      );
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {!permission ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.colors.neonCyan} />
            <Text style={styles.permissionText}>Comprobando permisos de cámara...</Text>
          </View>
        ) : !permission.granted ? (
          <View style={styles.centerContainer}>
            <Camera size={48} color={theme.colors.neonCyan} style={{ marginBottom: 16 }} />
            <Text style={styles.permissionTitle}>Permiso de Cámara Requerido</Text>
            <Text style={styles.permissionDesc}>
              Para detectar códigos de barras automáticamente, Nexodus requiere acceso a tu cámara.
            </Text>
            <TouchableOpacity style={styles.permissionBtn} onPress={handleRequestPermission}>
              <Text style={styles.permissionBtnText}>Conceder Permiso</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            enableTorch={torchEnabled}
            barcodeScannerSettings={{
              barcodeTypes: [
                'ean13',
                'ean8',
                'upc_a',
                'upc_e',
                'code128',
                'code39',
                'qr',
              ],
            }}
            onBarcodeScanned={scanned ? undefined : handleScan}
          >
            {/* Dark Mask Overlays around scanning area */}
            <View style={styles.overlay}>
              {/* Header Bar */}
              <View style={styles.headerBar}>
                <TouchableOpacity
                  style={styles.headerBtn}
                  onPress={onClose}
                  accessibilityRole="button"
                  accessibilityLabel="Cerrar escáner"
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <X size={20} color={theme.colors.text} />
                </TouchableOpacity>

                <View style={styles.headerTitleBox}>
                  <ScanBarcode size={16} color={theme.colors.neonCyan} />
                  <Text style={styles.headerTitle}>Escáner de Alimentos</Text>
                </View>

                <TouchableOpacity
                  style={[styles.headerBtn, torchEnabled && styles.headerBtnActive]}
                  onPress={() => setTorchEnabled(!torchEnabled)}
                  accessibilityRole="button"
                  accessibilityLabel={torchEnabled ? 'Apagar linterna' : 'Encender linterna'}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  {torchEnabled ? (
                    <Zap size={18} color={theme.colors.obsidian} />
                  ) : (
                    <ZapOff size={18} color={theme.colors.text} />
                  )}
                </TouchableOpacity>
              </View>

              {/* Viewfinder Target Reticle */}
              <View style={styles.viewfinderContainer}>
                <View style={styles.viewfinder}>
                  {/* Neon Cyan Corner Indicators */}
                  <View style={[styles.corner, styles.topLeft]} />
                  <View style={[styles.corner, styles.topRight]} />
                  <View style={[styles.corner, styles.bottomLeft]} />
                  <View style={[styles.corner, styles.bottomRight]} />

                  {/* Horizontal animated-look scan line */}
                  <View style={styles.scanLine} />
                </View>
              </View>

              {/* Footer Guidance */}
              <View style={styles.footerContainer}>
                <Text style={styles.guidanceText}>
                  Apunta la cámara al código de barras de tu producto
                </Text>
                <TouchableOpacity style={styles.manualEntryBtn} onPress={onClose}>
                  <Text style={styles.manualEntryText}>Ingresar código manualmente</Text>
                </TouchableOpacity>
              </View>
            </View>
          </CameraView>
        )}
      </View>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.obsidian,
    },
    centerContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
    },
    permissionTitle: {
      fontFamily: 'Geist_700Bold',
      fontSize: 18,
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    permissionDesc: {
      fontFamily: 'Geist_400Regular',
      fontSize: 13,
      color: colors.mutedText,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 24,
    },
    permissionText: {
      fontFamily: 'Geist_500Medium',
      fontSize: 13,
      color: colors.mutedText,
      marginTop: 12,
    },
    permissionBtn: {
      backgroundColor: colors.neonCyan,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 12,
      width: '100%',
      alignItems: 'center',
      marginBottom: 12,
    },
    permissionBtnText: {
      fontFamily: 'Geist_700Bold',
      fontSize: 14,
      color: colors.obsidian,
    },
    cancelBtn: {
      paddingVertical: 10,
      alignItems: 'center',
    },
    cancelBtnText: {
      fontFamily: 'Geist_500Medium',
      fontSize: 13,
      color: colors.mutedText,
    },
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(11, 13, 17, 0.55)',
      justifyContent: 'space-between',
    },
    headerBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 54,
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    headerBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(20, 23, 31, 0.85)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.borderGlow,
    },
    headerBtnActive: {
      backgroundColor: colors.neonCyan,
    },
    headerTitleBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: 'rgba(20, 23, 31, 0.85)',
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.borderGlow,
    },
    headerTitle: {
      fontFamily: 'JetBrainsMono_600SemiBold',
      fontSize: 12,
      color: colors.text,
      letterSpacing: 0.5,
    },
    viewfinderContainer: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    viewfinder: {
      width: SCAN_BOX_SIZE,
      height: SCAN_BOX_SIZE * 0.7,
      position: 'relative',
      backgroundColor: 'transparent',
      alignItems: 'center',
      justifyContent: 'center',
    },
    corner: {
      position: 'absolute',
      width: 24,
      height: 24,
      borderColor: colors.neonCyan,
    },
    topLeft: {
      top: 0,
      left: 0,
      borderTopWidth: 3,
      borderLeftWidth: 3,
      borderTopLeftRadius: 6,
    },
    topRight: {
      top: 0,
      right: 0,
      borderTopWidth: 3,
      borderRightWidth: 3,
      borderTopRightRadius: 6,
    },
    bottomLeft: {
      bottom: 0,
      left: 0,
      borderBottomWidth: 3,
      borderLeftWidth: 3,
      borderBottomLeftRadius: 6,
    },
    bottomRight: {
      bottom: 0,
      right: 0,
      borderBottomWidth: 3,
      borderRightWidth: 3,
      borderBottomRightRadius: 6,
    },
    scanLine: {
      width: '90%',
      height: 2,
      backgroundColor: colors.neonCyan,
      shadowColor: colors.neonCyan,
      shadowOpacity: 0.8,
      shadowRadius: 6,
    },
    footerContainer: {
      paddingHorizontal: 30,
      paddingBottom: 48,
      alignItems: 'center',
      gap: 14,
    },
    guidanceText: {
      fontFamily: 'Geist_500Medium',
      fontSize: 13,
      color: colors.text,
      textAlign: 'center',
      textShadowColor: 'rgba(0, 0, 0, 0.8)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 3,
    },
    manualEntryBtn: {
      backgroundColor: 'rgba(20, 23, 31, 0.85)',
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.borderGlow,
    },
    manualEntryText: {
      fontFamily: 'Geist_600SemiBold',
      fontSize: 12,
      color: colors.neonCyan,
    },
  });

