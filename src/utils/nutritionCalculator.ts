/**
 * Motor Biomecánico de Cálculo Nutricional y Tasa Metabólica
 * Basado en las ecuaciones Mifflin-St Jeor y gasto energético diario (TDEE).
 */

export type BiologicalSex = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very_active' | 'extra_active';
export type NutritionGoal = 'fat_loss' | 'maintenance' | 'muscle_gain';
export type FastingProtocol = '16:8' | '18:6' | 'none';

export interface NutritionInputs {
  weightKg: number;
  heightCm: number;
  age: number;
  sex: BiologicalSex;
  activityLevel: ActivityLevel;
  goal: NutritionGoal;
  fastingProtocol?: FastingProtocol;
}

export interface NutritionTargets {
  bmr: number;
  tdee: number;
  targetCalories: number;
  calorieDelta: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  proteinCalories: number;
  carbsCalories: number;
  fatCalories: number;
  waterTargetMl: number;
  fastingProtocol: FastingProtocol;
  summary: string;
}

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, { multiplier: number; label: string; description: string }> = {
  sedentary: { multiplier: 1.2, label: 'Sedentario', description: 'Trabajo de escritorio, poco ejercicio' },
  light: { multiplier: 1.375, label: 'Ligero', description: 'Entrenamiento 1-2 días / semana' },
  moderate: { multiplier: 1.55, label: 'Moderado', description: 'Entrenamiento 3-5 días / semana' },
  very_active: { multiplier: 1.725, label: 'Muy Activo', description: 'Entrenamiento 6-7 días / semana' },
  extra_active: { multiplier: 1.9, label: 'Atleta', description: 'Entrenamiento intenso doble turno' },
};

export const NUTRITION_GOALS: Record<NutritionGoal, { delta: number; label: string; description: string }> = {
  fat_loss: { delta: -450, label: 'Definición', description: 'Déficit calórico para perder grasa' },
  maintenance: { delta: 0, label: 'Mantenimiento', description: 'Recomposición corporal y energía estable' },
  muscle_gain: { delta: 300, label: 'Volumen', description: 'Superávit magro para ganar masa muscular' },
};

export const FASTING_PROTOCOLS: Record<FastingProtocol, { label: string; hoursFast: number; hoursEat: number; windowDesc: string }> = {
  '16:8': { label: 'Ayuno 16:8', hoursFast: 16, hoursEat: 8, windowDesc: 'Ventana de alimentación de 8h (ej. 12:00 PM a 08:00 PM)' },
  '18:6': { label: 'Ayuno 18:6', hoursFast: 18, hoursEat: 6, windowDesc: 'Ventana de alimentación de 6h (ej. 01:00 PM a 07:00 PM)' },
  'none': { label: 'Tradicional', hoursFast: 0, hoursEat: 24, windowDesc: 'Comidas distribuidas sin restricción de horario' },
};

/**
 * Normaliza la altura a centímetros.
 * Si el usuario introduce 1.75 (metros), lo convierte a 175 cm.
 */
export function normalizeHeightCm(height: number): number {
  if (height <= 0) return 170;
  if (height < 3) return Math.round(height * 100);
  return Math.round(height);
}

/**
 * Calcula la Tasa Metabólica Basal (BMR) usando la ecuación Mifflin-St Jeor.
 * Hombres: 10 * peso(kg) + 6.25 * altura(cm) - 5 * edad + 5
 * Mujeres: 10 * peso(kg) + 6.25 * altura(cm) - 5 * edad - 161
 */
export function calculateBmr(weightKg: number, heightCm: number, age: number, sex: BiologicalSex): number {
  const normWeight = Math.max(30, weightKg);
  const normHeight = normalizeHeightCm(heightCm);
  const normAge = Math.max(14, Math.min(100, age));

  const base = 10 * normWeight + 6.25 * normHeight - 5 * normAge;
  return sex === 'male' ? Math.round(base + 5) : Math.round(base - 161);
}

/**
 * Calcula el Gasto Energético Total Diario (TDEE).
 */
export function calculateTdee(bmr: number, activityLevel: ActivityLevel): number {
  const factor = ACTIVITY_MULTIPLIERS[activityLevel]?.multiplier || 1.2;
  return Math.round(bmr * factor);
}

/**
 * Calcula el requerimiento calórico objetivo y la distribución de macronutrientes.
 * - Proteína: 2.0g/kg para preservar/construir masa magra.
 * - Grasas: 25% de las calorías totales (1g = 9 kcal) para soporte hormonal.
 * - Carbohidratos: El remanente calórico (1g = 4 kcal) para energía y glucógeno.
 * - Hidratación: 35ml por kg de peso + 500ml por actividad.
 */
export function calculateNutritionTargets(inputs: NutritionInputs): NutritionTargets {
  const normHeight = normalizeHeightCm(inputs.heightCm);
  const normWeight = Math.max(30, inputs.weightKg);
  const bmr = calculateBmr(normWeight, normHeight, inputs.age, inputs.sex);
  const tdee = calculateTdee(bmr, inputs.activityLevel);

  const goalConfig = NUTRITION_GOALS[inputs.goal] || NUTRITION_GOALS.maintenance;
  const targetCalories = Math.max(1200, Math.round(tdee + goalConfig.delta));

  // Proteína: 2.0g por kg (en déficit puede ser 2.2g, en superávit 1.9g)
  let proteinFactor = 2.0;
  if (inputs.goal === 'fat_loss') proteinFactor = 2.2;
  if (inputs.goal === 'muscle_gain') proteinFactor = 2.0;

  const proteinGrams = Math.round(normWeight * proteinFactor);
  const proteinCals = proteinGrams * 4;

  // Grasas: 25% de las calorías diarias
  const fatCalories = targetCalories * 0.25;
  const fatGrams = Math.round(fatCalories / 9);

  // Carbohidratos: calorías restantes divididas por 4
  const remainingCalories = Math.max(0, targetCalories - (proteinCals + fatGrams * 9));
  const carbsGrams = Math.round(remainingCalories / 4);

  // Hidratación: 35ml/kg base + suplemento de actividad
  let activityWaterBonus = 0;
  if (inputs.activityLevel === 'moderate') activityWaterBonus = 400;
  if (inputs.activityLevel === 'very_active' || inputs.activityLevel === 'extra_active') activityWaterBonus = 750;

  const waterTargetMl = Math.round(normWeight * 35 + activityWaterBonus);

  const protocol = inputs.fastingProtocol || '16:8';

  const summary = `${goalConfig.label} (${targetCalories.toLocaleString()} kcal) • P: ${proteinGrams}g | C: ${carbsGrams}g | G: ${fatGrams}g`;

  return {
    bmr,
    tdee,
    targetCalories,
    calorieDelta: goalConfig.delta,
    proteinGrams,
    carbsGrams,
    fatGrams,
    proteinCalories: proteinCals,
    carbsCalories: carbsGrams * 4,
    fatCalories: fatGrams * 9,
    waterTargetMl,
    fastingProtocol: protocol,
    summary,
  };
}
