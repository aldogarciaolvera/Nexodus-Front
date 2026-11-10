import { apiFetch, handleResponse } from './api';
import { Meal } from './diet.service';

export interface RecipeIngredient {
  id: string;
  recipeId: string;
  foodId?: string | null;
  customFoodName: string;
  cookingState: 'Raw' | 'Boiled' | 'Grilled' | 'Fried' | 'Baked' | 'Steamed' | string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  isOptional: boolean;
}

export interface RecipeStep {
  id: string;
  recipeId: string;
  stepNumber: number;
  instruction: string;
}

export interface Recipe {
  id: string;
  userId?: string | null;
  authorName?: string | null;
  parentRecipeId?: string | null;
  parentRecipeName?: string | null;
  name: string;
  description: string;
  mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' | 'Any' | string;
  dietType: 'Standard' | 'HighProtein' | 'Keto' | 'Vegan' | 'Vegetarian' | 'LowCarb' | string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  difficulty: 'Easy' | 'Medium' | 'Hard' | string;
  isCommunity: boolean;
  tags: string[];
  imageUrl?: string | null;
  variantsCount: number;
  createdAt: string;
  updatedAt: string;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
}

export interface CreateRecipeIngredient {
  foodId?: string | null;
  customFoodName: string;
  cookingState?: string;
  quantity: number;
  unit?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  isOptional?: boolean;
}

export interface CreateRecipeStep {
  stepNumber: number;
  instruction: string;
}

export interface CreateRecipeRequest {
  name: string;
  description: string;
  mealType: string;
  dietType: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  difficulty: string;
  isCommunity: boolean;
  tags: string[];
  imageUrl?: string | null;
  ingredients: CreateRecipeIngredient[];
  steps: CreateRecipeStep[];
}

export interface LogRecipeAsMealRequest {
  recipeId: string;
  date: string;
  mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' | string;
  servings: number;
}

export interface PantryItem {
  id: string;
  userId: string;
  foodId?: string | null;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  expirationDate?: string | null;
  createdAt: string;
  updatedAt: string;
  caloriesPer100g?: number | null;
  proteinPer100g?: number | null;
  carbsPer100g?: number | null;
  fatPer100g?: number | null;
}

export interface CreatePantryItemRequest {
  foodId?: string | null;
  name: string;
  quantity: number;
  unit?: string;
  category?: string;
  expirationDate?: string | null;
}

export interface MatchMacrosRequest {
  remainingCalories: number;
  remainingProtein: number;
  remainingCarbs: number;
  remainingFat: number;
  mealType: string;
  dietType: string;
  preferences?: string;
  maxPrepTimeMinutes?: number;
}

export interface PantryCookRequest {
  ingredients?: string[];
  freeTextIngredients?: string;
  mealType?: string;
  dietType?: string;
  useUserPantry?: boolean;
  maxPrepTimeMinutes?: number;
}

export interface PantryCookSuggestion {
  name: string;
  description: string;
  mealType: string;
  dietType: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  difficulty: string;
  matchPercentage: number;
  usedIngredients: string[];
  missingIngredients: string[];
  ingredients: CreateRecipeIngredient[];
  steps: CreateRecipeStep[];
}

export const recipeService = {
  // 1. Buscar recetas (catálogo, propias y comunitarias)
  searchRecipes: async (params?: {
    query?: string;
    mealType?: string;
    dietType?: string;
    communityOnly?: boolean;
    page?: number;
    pageSize?: number;
  }): Promise<{ items: Recipe[]; totalCount: number; page: number; pageSize: number }> => {
    const queryParts: string[] = [];
    if (params?.query) queryParts.push(`query=${encodeURIComponent(params.query)}`);
    if (params?.mealType && params.mealType !== 'Any') queryParts.push(`mealType=${encodeURIComponent(params.mealType)}`);
    if (params?.dietType && params.dietType !== 'Standard') queryParts.push(`dietType=${encodeURIComponent(params.dietType)}`);
    if (params?.communityOnly !== undefined) queryParts.push(`communityOnly=${params.communityOnly}`);
    if (params?.page) queryParts.push(`page=${params.page}`);
    if (params?.pageSize) queryParts.push(`pageSize=${params.pageSize}`);

    const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    const response = await apiFetch(`/api/recipes${queryString}`);
    return await handleResponse(response);
  },

  // 2. Obtener receta por ID detallada
  getRecipeById: async (id: string): Promise<Recipe> => {
    const response = await apiFetch(`/api/recipes/${id}`);
    return await handleResponse(response);
  },

  // 3. Obtener variantes comunitarias derivadas
  getRecipeVariants: async (id: string): Promise<Recipe[]> => {
    const response = await apiFetch(`/api/recipes/${id}/variants`);
    return await handleResponse(response);
  },

  // 4. Crear receta propia
  createRecipe: async (data: CreateRecipeRequest): Promise<Recipe> => {
    const response = await apiFetch('/api/recipes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return await handleResponse(response);
  },

  // 5. Crear variante de una receta comunitaria (Opción B)
  createVariant: async (parentRecipeId: string, data: CreateRecipeRequest): Promise<Recipe> => {
    const response = await apiFetch(`/api/recipes/${parentRecipeId}/variants`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return await handleResponse(response);
  },

  // 6. Actualizar receta propia
  updateRecipe: async (id: string, data: Partial<CreateRecipeRequest>): Promise<Recipe> => {
    const response = await apiFetch(`/api/recipes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return await handleResponse(response);
  },

  // 7. Eliminar receta propia
  deleteRecipe: async (id: string): Promise<void> => {
    const response = await apiFetch(`/api/recipes/${id}`, {
      method: 'DELETE',
    });
    await handleResponse(response);
  },

  // 8. Registrar receta como plato en el diario (Opción A Híbrido Fitia: título + ingredientes editables)
  logRecipeAsMeal: async (data: LogRecipeAsMealRequest): Promise<Meal> => {
    const response = await apiFetch('/api/recipes/log', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return await handleResponse(response);
  },

  // 9. Generar receta adaptada a los macros restantes (Estilo Yuki Fitia)
  generateRecipeForMacros: async (data: MatchMacrosRequest): Promise<Recipe> => {
    const response = await apiFetch('/api/recipes/ai/match-macros', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return await handleResponse(response);
  },

  // 10. Sugerir recetas en Modo Despensa ("Cocina con lo que tienes")
  suggestFromPantry: async (data: PantryCookRequest): Promise<PantryCookSuggestion[]> => {
    const response = await apiFetch('/api/recipes/ai/pantry-cook', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return await handleResponse(response);
  },

  // 11. Despensa: Obtener lista
  getPantry: async (): Promise<PantryItem[]> => {
    const response = await apiFetch('/api/pantry');
    return await handleResponse(response);
  },

  // 12. Despensa: Agregar ingrediente
  addPantryItem: async (data: CreatePantryItemRequest): Promise<PantryItem> => {
    const response = await apiFetch('/api/pantry', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return await handleResponse(response);
  },

  // 13. Despensa: Agregar en bloque
  bulkAddPantryItems: async (items: CreatePantryItemRequest[]): Promise<PantryItem[]> => {
    const response = await apiFetch('/api/pantry/bulk', {
      method: 'POST',
      body: JSON.stringify(items),
    });
    return await handleResponse(response);
  },

  // 14. Despensa: Actualizar ingrediente
  updatePantryItem: async (id: string, data: Partial<CreatePantryItemRequest>): Promise<PantryItem> => {
    const response = await apiFetch(`/api/pantry/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return await handleResponse(response);
  },

  // 15. Despensa: Eliminar ingrediente
  deletePantryItem: async (id: string): Promise<void> => {
    const response = await apiFetch(`/api/pantry/${id}`, {
      method: 'DELETE',
    });
    await handleResponse(response);
  },
};
