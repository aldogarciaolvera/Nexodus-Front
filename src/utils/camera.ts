import { Camera } from 'expo-camera';

/**
 * Solicita permisos de cámara de manera segura.
 * Retorna true si fueron concedidos o ya estaban activos, false en caso contrario.
 */
export async function requestCameraPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Camera.getCameraPermissionsAsync();
    if (existingStatus === 'granted') {
      return true;
    }
    const { status } = await Camera.requestCameraPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.warn('Error al solicitar permisos de cámara:', error);
    return false;
  }
}

/**
 * Consulta de solo lectura del estado actual de permisos de cámara.
 */
export async function checkCameraPermissions(): Promise<boolean> {
  try {
    const { status } = await Camera.getCameraPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.warn('Error al verificar permisos de cámara:', error);
    return false;
  }
}
