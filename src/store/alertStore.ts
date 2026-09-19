import { create } from 'zustand';

export type AlertType = 'error' | 'success' | 'info';

interface AlertState {
  visible: boolean;
  title: string;
  message: string;
  type: AlertType;
  showAlert: (title: string, message: string, type?: AlertType) => void;
  hideAlert: () => void;
}

export const useAlertStore = create<AlertState>((set) => ({
  visible: false,
  title: '',
  message: '',
  type: 'info',
  showAlert: (title, message, type = 'error') => 
    set({ visible: true, title, message, type }),
  hideAlert: () => 
    set({ visible: false }),
}));
