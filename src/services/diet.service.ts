import { apiFetch, handleResponse } from './api';

export interface DietTarget {
  targetCalories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  waterTargetMl: number;
  fastingProtocol: string;
  eatingWindowStart?: string;
  eatingWindowEnd?: string;
}

export interface CalculateTargetRequest {
  weight: number;
  height: number;
  age: number;
  biologicalSex: 'Male' | 'Female' | string;
  activityLevel: 'Sedentary' | 'Light' | 'Moderate' | 'VeryActive' | string;
  goal: 'Cut' | 'Maintain' | 'Bulk' | string;
}

export interface MealItem {
  id?: string;
  foodId?: string | null;
  foodName: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Meal {
  id: string;
  date: string;
  mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  name: string;
  time: string;
  isCompleted: boolean;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  items: MealItem[];
}

export interface CreateMealRequest {
  date: string;
  mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  name: string;
  time: string;
  isCompleted: boolean;
  items: MealItem[];
}

export interface DailySummary {
  date: string;
  targetCalories?: number;
  targetProtein?: number;
  targetCarbs?: number;
  targetFat?: number;
  consumedCalories?: number;
  consumedProtein?: number;
  consumedCarbs?: number;
  consumedFat?: number;
  waterTargetMl?: number;
  consumedWaterMl?: number;
  meals: Meal[];
}

export interface Food {
  id?: string;
  name: string;
  brand?: string;
  barcode?: string;
  servingSize: number;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sodiumMg?: number;
  potassiumMg?: number;
}

export interface FastingStatus {
  isActive: boolean;
  startTime?: string;
  targetHours?: number;
  fastingProtocol?: string;
  elapsedSeconds?: number;
  remainingSeconds?: number;
}

export const dietService = {
  // 1. Obtener Metas Nutricionales
  getTarget: async (): Promise<DietTarget | null> => {
    try {
      const response = await apiFetch('/api/diet/target');
      if (response.status === 404) return null;
      return await handleResponse(response);
    } catch (e: any) {
      if (e.message?.includes('404')) return null;
      throw e;
    }
  },

  // 2. Actualizar Metas Nutricionales
  updateTarget: async (target: DietTarget): Promise<DietTarget> => {
    const response = await apiFetch('/api/diet/target', {
      method: 'PUT',
      body: JSON.stringify(target),
    });
    return await handleResponse(response);
  },

  // 3. Calcular Metas Sugeridas según Biométricos (TDEE / Macros)
  calculateTarget: async (req: CalculateTargetRequest): Promise<DietTarget> => {
    const response = await apiFetch('/api/diet/calculate-target', {
      method: 'POST',
      body: JSON.stringify(req),
    });
    return await handleResponse(response);
  },

  // 4. Obtener Resumen Diario de Dieta (Comidas, Totales y Metas)
  getDailySummary: async (date: string): Promise<DailySummary> => {
    try {
      const response = await apiFetch(`/api/diet/daily?date=${date}`);
      if (response.status === 404) {
        return { date, meals: [], consumedCalories: 0, consumedProtein: 0, consumedCarbs: 0, consumedFat: 0, consumedWaterMl: 0 };
      }
      return await handleResponse(response);
    } catch (e: any) {
      if (e.message?.includes('404')) {
        return { date, meals: [], consumedCalories: 0, consumedProtein: 0, consumedCarbs: 0, consumedFat: 0, consumedWaterMl: 0 };
      }
      throw e;
    }
  },

  // 5. Registrar una Comida
  createMeal: async (meal: CreateMealRequest): Promise<Meal> => {
    const response = await apiFetch('/api/diet/meals', {
      method: 'POST',
      body: JSON.stringify(meal),
    });
    return await handleResponse(response);
  },

  // 6. Actualizar una Comida
  updateMeal: async (mealId: string, meal: Partial<CreateMealRequest>): Promise<Meal> => {
    const response = await apiFetch(`/api/diet/meals/${mealId}`, {
      method: 'PUT',
      body: JSON.stringify(meal),
    });
    return await handleResponse(response);
  },

  // 7. Eliminar una Comida
  deleteMeal: async (mealId: string): Promise<void> => {
    const response = await apiFetch(`/api/diet/meals/${mealId}`, {
      method: 'DELETE',
    });
    await handleResponse(response);
  },

  // 8. Buscar Alimentos en el Catálogo
  searchFoods: async (query: string, page = 1, pageSize = 20): Promise<{ items: Food[]; totalCount?: number }> => {
    try {
      const response = await apiFetch(`/api/diet/foods/search?query=${encodeURIComponent(query)}&page=${page}&pageSize=${pageSize}`);
      if (response.status === 404) return { items: [], totalCount: 0 };
      const res = await handleResponse(response);
      if (Array.isArray(res)) {
        return { items: res, totalCount: res.length };
      }
      return {
        items: res?.items || res?.data || [],
        totalCount: res?.totalCount || res?.total || (res?.items ? res.items.length : 0),
      };
    } catch {
      return { items: [], totalCount: 0 };
    }
  },

  // 9. Consultar Alimento por Código de Barras
  getFoodByBarcode: async (barcode: string): Promise<Food | null> => {
    try {
      const response = await apiFetch(`/api/diet/foods/barcode/${encodeURIComponent(barcode)}`);
      if (response.status === 404) return null;
      return await handleResponse(response);
    } catch {
      return null;
    }
  },

  // 10. Crear Alimento Personalizado
  createFood: async (food: Omit<Food, 'id'>): Promise<Food> => {
    const response = await apiFetch('/api/diet/foods', {
      method: 'POST',
      body: JSON.stringify(food),
    });
    return await handleResponse(response);
  },

  // 11. Obtener Consumo de Agua Diario
  getWater: async (date: string): Promise<{ consumedWaterMl: number; totalMl?: number; targetWaterMl?: number }> => {
    try {
      const response = await apiFetch(`/api/diet/water?date=${date}`);
      if (response.status === 404) return { consumedWaterMl: 0 };
      return await handleResponse(response);
    } catch {
      return { consumedWaterMl: 0 };
    }
  },

  // 12. Agregar Agua Rápida (+ml)
  addWater: async (date: string, amountMl: number): Promise<any> => {
    const response = await apiFetch('/api/diet/water', {
      method: 'POST',
      body: JSON.stringify({ date, amountMl }),
    });
    return await handleResponse(response);
  },

  // 13. Ajustar Total de Agua
  setWater: async (date: string, totalMl: number): Promise<any> => {
    const response = await apiFetch('/api/diet/water/set', {
      method: 'PUT',
      body: JSON.stringify({ date, totalMl }),
    });
    return await handleResponse(response);
  },

  // 14. Obtener Estado en Vivo del Ayuno
  getFastingStatus: async (): Promise<FastingStatus> => {
    try {
      const response = await apiFetch('/api/diet/fasting/status');
      if (response.status === 404) return { isActive: false };
      return await handleResponse(response);
    } catch {
      return { isActive: false };
    }
  },

  // 15. Iniciar Sesión de Ayuno
  startFasting: async (targetHours: number, fastingProtocol = '16:8'): Promise<FastingStatus> => {
    const response = await apiFetch('/api/diet/fasting/start', {
      method: 'POST',
      body: JSON.stringify({ targetHours, fastingProtocol }),
    });
    return await handleResponse(response);
  },

  // 16. Concluir Sesión de Ayuno
  stopFasting: async (): Promise<FastingStatus> => {
    const response = await apiFetch('/api/diet/fasting/stop', {
      method: 'POST',
    });
    return await handleResponse(response);
  },
};
