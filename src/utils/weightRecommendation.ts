import { Exercise } from '../services/gym.service';

export interface WeightRecommendation {
  weight: number;
  rationale: string;
  isBodyweight: boolean;
  suggestedSets: number;
  suggestedReps: number;
}

/**
 * Normalizes text to assist in keyword matching
 */
const normalize = (text?: string): string => {
  return (text || '').toLowerCase().trim();
};

/**
 * Calculates a biomechanically-sound recommended starting weight based on:
 * - User body weight (kg)
 * - User height (m)
 * - Exercise target muscle, body part, equipment, and movement type
 * - Routine difficulty level ('Beginner' | 'Intermediate' | 'Advanced')
 */
export function calculateRecommendedWeight(
  exercise: Partial<Exercise>,
  userWeightKg = 70,
  userHeightM = 1.75,
  difficultyLevel: 'Beginner' | 'Intermediate' | 'Advanced' = 'Beginner'
): WeightRecommendation {
  const safeWeight = userWeightKg > 20 && userWeightKg < 300 ? userWeightKg : 70;
  const safeHeight = userHeightM > 1.0 && userHeightM < 2.5 ? userHeightM : 1.75;

  const eq = normalize(exercise.equipment);
  const name = normalize(exercise.name);
  const muscle = normalize(exercise.muscle || exercise.targetMuscleGroup);
  const bodyPart = normalize(exercise.bodyPart);

  // Difficulty multiplier
  const diffMultiplier = 
    difficultyLevel === 'Advanced' ? 1.25 :
    difficultyLevel === 'Intermediate' ? 1.0 :
    0.75; // Beginner

  // Height / leverage adjustment (taller lifters have longer levers)
  const leverageFactor = Math.min(1.1, Math.max(0.9, (safeHeight / 1.75) * 0.95 + 0.05));

  // 1. Bodyweight exercises
  if (
    eq === 'body weight' || 
    eq === 'bodyweight' || 
    eq === 'none' ||
    name.includes('push up') || 
    name.includes('pull up') || 
    name.includes('chin up') || 
    name.includes('crunch') ||
    name.includes('plank') ||
    name.includes('burpee') ||
    name.includes('dip') && !eq.includes('machine')
  ) {
    return {
      weight: 0,
      rationale: 'Peso corporal base',
      isBodyweight: true,
      suggestedSets: 3,
      suggestedReps: 12,
    };
  }

  let baseWeight = 0;
  let isDumbbell = false;

  // 2. Barbell Exercises (Multiarticular & Isolation)
  if (eq.includes('barbell') || eq.includes('smith')) {
    if (name.includes('squat') || name.includes('sentadilla')) {
      baseWeight = safeWeight * 0.65;
    } else if (name.includes('deadlift') || name.includes('peso muerto')) {
      baseWeight = safeWeight * 0.75;
    } else if (name.includes('bench press') || name.includes('press banca') || (bodyPart.includes('chest') && name.includes('press'))) {
      baseWeight = safeWeight * 0.50;
    } else if (name.includes('overhead press') || name.includes('military') || name.includes('militar')) {
      baseWeight = safeWeight * 0.32;
    } else if (name.includes('row') || name.includes('remo')) {
      baseWeight = safeWeight * 0.45;
    } else if (name.includes('hip thrust')) {
      baseWeight = safeWeight * 0.70;
    } else if (muscle.includes('bicep') || name.includes('curl')) {
      baseWeight = safeWeight * 0.22;
    } else {
      baseWeight = safeWeight * 0.35;
    }

    baseWeight = baseWeight * diffMultiplier * leverageFactor;
    // Standard Olympic bar minimum is 15kg or 20kg
    const minBarbell = difficultyLevel === 'Beginner' ? 15 : 20;
    baseWeight = Math.max(minBarbell, baseWeight);
    // Round to nearest 2.5 kg
    const rounded = Math.round(baseWeight / 2.5) * 2.5;

    return {
      weight: rounded,
      rationale: `Sugerido para barra (${difficultyLevel})`,
      isBodyweight: false,
      suggestedSets: 4,
      suggestedReps: 8,
    };
  }

  // 3. Dumbbell Exercises (Peso por mancuerna)
  if (eq.includes('dumbbell') || eq.includes('mancuerna')) {
    isDumbbell = true;
    if (name.includes('bench') || (bodyPart.includes('chest') && name.includes('press'))) {
      baseWeight = safeWeight * 0.18;
    } else if (name.includes('shoulder press') || name.includes('hombro')) {
      baseWeight = safeWeight * 0.14;
    } else if (name.includes('row') || name.includes('remo')) {
      baseWeight = safeWeight * 0.18;
    } else if (name.includes('lateral raise') || name.includes('elevacion') || name.includes('fly') || name.includes('pajaro')) {
      baseWeight = safeWeight * 0.06;
    } else if (muscle.includes('bicep') || name.includes('curl')) {
      baseWeight = safeWeight * 0.10;
    } else if (muscle.includes('tricep') || name.includes('extension')) {
      baseWeight = safeWeight * 0.09;
    } else if (name.includes('lunge') || name.includes('squat')) {
      baseWeight = safeWeight * 0.16;
    } else {
      baseWeight = safeWeight * 0.10;
    }

    baseWeight = baseWeight * diffMultiplier;
    // Round to nearest 2 kg for dumbbells, minimum 2 kg
    const rounded = Math.max(2, Math.round(baseWeight / 2) * 2);

    return {
      weight: rounded,
      rationale: `Por mancuerna (${difficultyLevel})`,
      isBodyweight: false,
      suggestedSets: 3,
      suggestedReps: 10,
    };
  }

  // 4. Cable & Machine Exercises
  if (eq.includes('cable') || eq.includes('machine') || eq.includes('polea') || eq.includes('leverage')) {
    if (name.includes('leg press') || name.includes('prensa')) {
      baseWeight = safeWeight * 1.0;
    } else if (name.includes('lat pulldown') || name.includes('jalon') || name.includes('pulldown')) {
      baseWeight = safeWeight * 0.45;
    } else if (name.includes('cable row') || name.includes('seated row')) {
      baseWeight = safeWeight * 0.40;
    } else if (name.includes('chest press') || (bodyPart.includes('chest') && name.includes('press'))) {
      baseWeight = safeWeight * 0.40;
    } else if (name.includes('leg extension') || name.includes('extension')) {
      baseWeight = safeWeight * 0.35;
    } else if (name.includes('leg curl') || name.includes('femoral')) {
      baseWeight = safeWeight * 0.30;
    } else if (name.includes('tricep') || name.includes('pushdown')) {
      baseWeight = safeWeight * 0.22;
    } else if (name.includes('face pull')) {
      baseWeight = safeWeight * 0.18;
    } else if (name.includes('crossover') || name.includes('cable fly')) {
      baseWeight = safeWeight * 0.12;
    } else {
      baseWeight = safeWeight * 0.30;
    }

    baseWeight = baseWeight * diffMultiplier;
    const rounded = Math.max(5, Math.round(baseWeight / 2.5) * 2.5);

    return {
      weight: rounded,
      rationale: `Sugerido para máquina/polea (${difficultyLevel})`,
      isBodyweight: false,
      suggestedSets: 3,
      suggestedReps: 12,
    };
  }

  // 5. Kettlebell / Other
  if (eq.includes('kettlebell')) {
    baseWeight = Math.max(4, Math.round((safeWeight * 0.14 * diffMultiplier) / 2) * 2);
    return {
      weight: baseWeight,
      rationale: `Sugerido kettlebell (${difficultyLevel})`,
      isBodyweight: false,
      suggestedSets: 3,
      suggestedReps: 12,
    };
  }

  // Fallback generic calculation
  const fallbackWeight = Math.max(5, Math.round((safeWeight * 0.25 * diffMultiplier) / 2.5) * 2.5);
  return {
    weight: fallbackWeight,
    rationale: `Estimado según peso corporal (${difficultyLevel})`,
    isBodyweight: false,
    suggestedSets: 3,
    suggestedReps: 10,
  };
}
