import { create } from 'zustand';

export type AlertType = 'error' | 'success' | 'info';

export interface AlertButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

export interface AlertOptions {
  title: string;
  message: string;
  type?: AlertType;
  buttons?: AlertButton[];
}

interface AlertState {
  visible: boolean;
  title: string;
  message: string;
  type: AlertType;
  buttons?: AlertButton[];
  showAlert: (titleOrOptions: string | AlertOptions, message?: string, type?: AlertType) => void;
  hideAlert: () => void;
}

export const useAlertStore = create<AlertState>((set) => ({
  visible: false,
  title: '',
  message: '',
  type: 'info',
  buttons: undefined,
  showAlert: (titleOrOptions, message?, type = 'error') => {
    if (typeof titleOrOptions === 'object') {
      set({ 
        visible: true, 
        title: titleOrOptions.title, 
        message: titleOrOptions.message, 
        type: titleOrOptions.type || 'info',
        buttons: titleOrOptions.buttons
      });
    } else {
      set({ 
        visible: true, 
        title: titleOrOptions, 
        message: message || '', 
        type: type,
        buttons: undefined
      });
    }
  },
  hideAlert: () => set({ visible: false }),
}));
