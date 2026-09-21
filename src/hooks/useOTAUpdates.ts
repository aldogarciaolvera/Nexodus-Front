import { useEffect, useState } from 'react';
import * as Updates from 'expo-updates';
import { useAlertStore } from '../store/alertStore';
import { AppState } from 'react-native';

export const useOTAUpdates = () => {
  const showAlert = useAlertStore((state) => state.showAlert);
  const [isChecking, setIsChecking] = useState(false);

  const checkForUpdates = async () => {
    // Solo verificar si no estamos en entorno de desarrollo y las actualizaciones están habilitadas
    if (__DEV__) return;
    
    if (isChecking) return;
    setIsChecking(true);

    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        await Updates.fetchUpdateAsync();
        
        showAlert({
          title: 'Actualización Disponible',
          message: 'Hay una nueva actualización rápida de la aplicación. Es necesario reiniciar para aplicarla.',
          type: 'info',
          buttons: [
            {
              text: 'Reiniciar ahora',
              onPress: async () => {
                await Updates.reloadAsync();
              }
            }
          ]
        });
      }
    } catch (error) {
      console.log('Error buscando actualizaciones OTA:', error);
      // Fallar de forma silenciosa para no molestar al usuario si no hay red
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    // Verificar al iniciar la app
    checkForUpdates();

    // Verificar cuando la app vuelve al primer plano
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        checkForUpdates();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return { checkForUpdates };
};
