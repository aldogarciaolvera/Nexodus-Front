/**
 * Servicio de integración con Open Food Facts API (v2)
 * Permite buscar productos y valores nutricionales por código de barras (EAN/UPC).
 */

export interface OpenFoodFactsProduct {
  name: string;
  brand?: string;
  barcode: string;
  servingSize: number;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sodiumMg?: number;
  potassiumMg?: number;
}

export const openFoodFactsService = {
  /**
   * Consulta los datos nutricionales de un producto mediante su código de barras.
   * Retorna null si el producto no se encuentra registrado en Open Food Facts.
   */
  fetchByBarcode: async (barcode: string): Promise<OpenFoodFactsProduct | null> => {
    try {
      const cleanBarcode = barcode.trim();
      if (!cleanBarcode) return null;

      const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(cleanBarcode)}.json`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'NexodusApp/1.0 (contacto@nexodus.app)',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) return null;

      const data = await response.json();
      if (data.status !== 1 || !data.product) {
        return null;
      }

      const product = data.product;
      const nutriments = product.nutriments || {};

      // Extraer nombre del alimento (priorizando español, genérico o inglés)
      const name =
        product.product_name_es ||
        product.product_name ||
        product.product_name_en ||
        product.generic_name_es ||
        product.generic_name ||
        'Alimento Escaneado';

      // Extraer marca principal
      const brand = product.brands ? product.brands.split(',')[0].trim() : undefined;

      // Extraer porción y unidad
      let servingSize = 100;
      let servingUnit = 'g';

      if (product.serving_quantity && !isNaN(Number(product.serving_quantity))) {
        servingSize = Number(product.serving_quantity);
      } else if (product.serving_size) {
        const match = String(product.serving_size).match(/([\d.,]+)\s*([a-zA-Z]+)?/);
        if (match) {
          servingSize = parseFloat(match[1].replace(',', '.')) || 100;
          if (match[2]) servingUnit = match[2].trim();
        }
      }

      // Extraer calorías (energía)
      let calories = 0;
      if (nutriments['energy-kcal_100g'] !== undefined) {
        calories = Math.round(Number(nutriments['energy-kcal_100g']));
      } else if (nutriments['energy-kcal'] !== undefined) {
        calories = Math.round(Number(nutriments['energy-kcal']));
      } else if (nutriments['energy-kj_100g'] !== undefined) {
        calories = Math.round(Number(nutriments['energy-kj_100g']) / 4.184);
      }

      // Extraer macronutrientes por 100g
      const protein = Math.round(Number(nutriments.proteins_100g ?? nutriments.proteins ?? 0) * 10) / 10;
      const carbs = Math.round(Number(nutriments.carbohydrates_100g ?? nutriments.carbohydrates ?? 0) * 10) / 10;
      const fat = Math.round(Number(nutriments.fat_100g ?? nutriments.fat ?? 0) * 10) / 10;
      const sodiumMg =
        nutriments.sodium_100g !== undefined ? Math.round(Number(nutriments.sodium_100g) * 1000) : undefined;
      const potassiumMg =
        nutriments.potassium_100g !== undefined ? Math.round(Number(nutriments.potassium_100g) * 1000) : undefined;

      return {
        name,
        brand,
        barcode: cleanBarcode,
        servingSize,
        servingUnit,
        calories: Math.max(0, calories),
        protein: Math.max(0, protein),
        carbs: Math.max(0, carbs),
        fat: Math.max(0, fat),
        sodiumMg,
        potassiumMg,
      };
    } catch (e) {
      console.warn('[OpenFoodFacts] Error al consultar API externa:', e);
      return null;
    }
  },
};

