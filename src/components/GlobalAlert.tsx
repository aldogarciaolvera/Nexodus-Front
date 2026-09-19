import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { useAlertStore } from '../store/alertStore';
import { theme } from '../utils/theme';
import { BlurView } from 'expo-blur';

const ErrorIcon = () => (
  <Svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffb4ab" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="10" />
    <Line x1="15" y1="9" x2="9" y2="15" />
    <Line x1="9" y1="9" x2="15" y2="15" />
  </Svg>
);

const SuccessIcon = () => (
  <Svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={theme.colors.neonCyan} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <Path d="M22 4L12 14.01l-3-3" />
  </Svg>
);

const InfoIcon = () => (
  <Svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={theme.colors.slate400} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="10" />
    <Line x1="12" y1="16" x2="12" y2="12" />
    <Line x1="12" y1="8" x2="12.01" y2="8" />
  </Svg>
);

export const GlobalAlert = () => {
  const { visible, title, message, type, hideAlert } = useAlertStore();

  if (!visible) return null;

  const renderIcon = () => {
    switch (type) {
      case 'error': return <ErrorIcon />;
      case 'success': return <SuccessIcon />;
      case 'info': return <InfoIcon />;
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={hideAlert}
    >
      <TouchableWithoutFeedback onPress={hideAlert}>
        <View style={styles.overlay}>
          {/* @ts-ignore */}
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
          
          <TouchableWithoutFeedback>
            <View style={styles.alertContainer}>
              <View style={styles.iconContainer}>
                {renderIcon()}
              </View>
              
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.message}>{message}</Text>
              
              <TouchableOpacity style={styles.button} onPress={hideAlert} activeOpacity={0.8}>
                <Text style={styles.buttonText}>Aceptar</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(13, 14, 17, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.metrics.marginHorizontal,
  },
  alertContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderGlow,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: theme.colors.obsidian,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.borderGlow,
  },
  title: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 20,
    color: theme.colors.white,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  message: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 15,
    color: theme.colors.slate400,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  button: {
    backgroundColor: theme.colors.neonCyan,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: theme.colors.obsidian,
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 16,
  }
});
