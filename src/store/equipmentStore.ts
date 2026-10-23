import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

export interface EquipmentItem {
  id: string;
  name: string;
  iconName: string;
  description: string;
}

export const ALL_EQUIPMENT_ITEMS: EquipmentItem[] = [
  { id: 'bodyweight', name: 'Peso Corporal', iconName: 'User', description: 'Flexiones, dominadas, sentadillas al aire' },
  { id: 'dumbbell', name: 'Mancuernas', iconName: 'Dumbbell', description: 'Pares de mancuernas fijas o ajustables' },
  { id: 'barbell', name: 'Barra Olímpica / Estándar', iconName: 'Minus', description: 'Barras rectas, discos y soportes' },
  { id: 'bench', name: 'Banco Plano / Ajustable', iconName: 'Square', description: 'Banco de entrenamiento para presses y apoyos' },
  { id: 'cable', name: 'Poleas / Crossover', iconName: 'Repeat', description: 'Torres de poleas altas y bajas' },
  { id: 'machine', name: 'Máquinas de Placas / Palanca', iconName: 'Cpu', description: 'Prensa, extensión de piernas, peck deck' },
  { id: 'smith machine', name: 'Máquina Smith', iconName: 'Columns', description: 'Barra guiada con rieles de seguridad' },
  { id: 'kettlebell', name: 'Kettlebells (Pesas Rusas)', iconName: 'Circle', description: 'Swings, cargadas y movimientos dinámicos' },
  { id: 'band', name: 'Bandas de Resistencia', iconName: 'Activity', description: 'Bandas elásticas para calentamiento y tensión continua' },
  { id: 'medicine ball', name: 'Balón Medicinal / Slam', iconName: 'Volleyball', description: 'Lanzamientos y entrenamiento explosivo' },
];

export interface EquipmentProfile {
  id: string;
  name: string;
  availableEquipment: string[];
}

export const DEFAULT_PROFILES: EquipmentProfile[] = [
  {
    id: 'commercial',
    name: 'Gimnasio Comercial',
    availableEquipment: ALL_EQUIPMENT_ITEMS.map(e => e.id),
  },
  {
    id: 'home',
    name: 'Home Gym / En Casa',
    availableEquipment: ['bodyweight', 'dumbbell', 'band', 'bench'],
  },
  {
    id: 'calisthenics',
    name: 'Calistenia / Viaje',
    availableEquipment: ['bodyweight', 'band'],
  },
];

const STORE_KEY_EQUIPMENT_PROFILES = 'nexodus_equipment_profiles_v1';
const STORE_KEY_ACTIVE_PROFILE_ID = 'nexodus_active_equipment_profile_v1';
const STORE_KEY_FILTER_ENABLED = 'nexodus_equipment_filter_enabled_v1';

interface EquipmentState {
  profiles: EquipmentProfile[];
  activeProfileId: string;
  filterEnabled: boolean;
  initialized: boolean;
  
  initialize: () => Promise<void>;
  setActiveProfile: (profileId: string) => Promise<void>;
  toggleEquipmentInActiveProfile: (equipmentId: string) => Promise<void>;
  setFilterEnabled: (enabled: boolean) => Promise<void>;
  resetToDefaultProfile: (profileId: string) => Promise<void>;
  getActiveProfile: () => EquipmentProfile;
}

export const useEquipmentStore = create<EquipmentState>((set, get) => ({
  profiles: DEFAULT_PROFILES,
  activeProfileId: 'commercial',
  filterEnabled: true,
  initialized: false,

  initialize: async () => {
    try {
      const storedProfiles = await SecureStore.getItemAsync(STORE_KEY_EQUIPMENT_PROFILES);
      const storedActiveId = await SecureStore.getItemAsync(STORE_KEY_ACTIVE_PROFILE_ID);
      const storedFilter = await SecureStore.getItemAsync(STORE_KEY_FILTER_ENABLED);

      let profiles = DEFAULT_PROFILES;
      if (storedProfiles) {
        try {
          const parsed = JSON.parse(storedProfiles);
          if (Array.isArray(parsed) && parsed.length > 0) {
            profiles = parsed;
          }
        } catch {
          // Keep defaults
        }
      }

      const activeProfileId = storedActiveId && profiles.some(p => p.id === storedActiveId) 
        ? storedActiveId 
        : 'commercial';

      const filterEnabled = storedFilter !== null ? storedFilter === 'true' : true;

      set({
        profiles,
        activeProfileId,
        filterEnabled,
        initialized: true,
      });
    } catch (e) {
      set({ initialized: true });
    }
  },

  setActiveProfile: async (profileId: string) => {
    set({ activeProfileId: profileId });
    try {
      await SecureStore.setItemAsync(STORE_KEY_ACTIVE_PROFILE_ID, profileId);
    } catch (e) {
      console.error('Error saving active profile', e);
    }
  },

  toggleEquipmentInActiveProfile: async (equipmentId: string) => {
    const { profiles, activeProfileId } = get();
    const updatedProfiles = profiles.map(p => {
      if (p.id !== activeProfileId) return p;
      const exists = p.availableEquipment.includes(equipmentId);
      const updatedEquipment = exists
        ? p.availableEquipment.filter(id => id !== equipmentId)
        : [...p.availableEquipment, equipmentId];
      return {
        ...p,
        availableEquipment: updatedEquipment,
      };
    });

    set({ profiles: updatedProfiles });
    try {
      await SecureStore.setItemAsync(STORE_KEY_EQUIPMENT_PROFILES, JSON.stringify(updatedProfiles));
    } catch (e) {
      console.error('Error saving equipment profiles', e);
    }
  },

  setFilterEnabled: async (enabled: boolean) => {
    set({ filterEnabled: enabled });
    try {
      await SecureStore.setItemAsync(STORE_KEY_FILTER_ENABLED, String(enabled));
    } catch (e) {
      console.error('Error saving filter state', e);
    }
  },

  resetToDefaultProfile: async (profileId: string) => {
    const defaultOne = DEFAULT_PROFILES.find(p => p.id === profileId);
    if (!defaultOne) return;

    const { profiles } = get();
    const updatedProfiles = profiles.map(p => p.id === profileId ? { ...defaultOne } : p);
    set({ profiles: updatedProfiles });

    try {
      await SecureStore.setItemAsync(STORE_KEY_EQUIPMENT_PROFILES, JSON.stringify(updatedProfiles));
    } catch (e) {
      console.error('Error resetting profile', e);
    }
  },

  getActiveProfile: () => {
    const { profiles, activeProfileId } = get();
    const found = profiles.find(p => p.id === activeProfileId);
    return found || profiles[0] || DEFAULT_PROFILES[0];
  },
}));

/**
 * Helper to determine if an exercise is supported by the user's available equipment
 */
export function isExerciseSupported(
  exerciseEquipment: string | undefined | null,
  availableEquipment: string[]
): boolean {
  if (!exerciseEquipment) return true;
  const eq = exerciseEquipment.toLowerCase().trim();

  // If bodyweight or none
  if (eq === 'body weight' || eq === 'bodyweight' || eq === 'none' || eq === '') {
    return availableEquipment.includes('bodyweight');
  }

  // Barbell / Olympic
  if (eq.includes('barbell') || eq.includes('barra')) {
    return availableEquipment.includes('barbell');
  }

  // Dumbbell
  if (eq.includes('dumbbell') || eq.includes('mancuerna')) {
    return availableEquipment.includes('dumbbell');
  }

  // Cables
  if (eq.includes('cable') || eq.includes('polea') || eq.includes('rope')) {
    return availableEquipment.includes('cable');
  }

  // Smith Machine
  if (eq.includes('smith')) {
    return availableEquipment.includes('smith machine') || availableEquipment.includes('machine');
  }

  // Machines
  if (eq.includes('machine') || eq.includes('leverage') || eq.includes('sled') || eq.includes('assisted') || eq.includes('hammer')) {
    return availableEquipment.includes('machine');
  }

  // Kettlebell
  if (eq.includes('kettlebell')) {
    return availableEquipment.includes('kettlebell');
  }

  // Resistance bands
  if (eq.includes('band')) {
    return availableEquipment.includes('band');
  }

  // Medicine ball
  if (eq.includes('medicine ball') || eq.includes('slam')) {
    return availableEquipment.includes('medicine ball');
  }

  // If no specific match, check if any token matches
  return availableEquipment.some(item => eq.includes(item));
}
