/**
 * Translations and mappings for gym terminology (body parts, muscles, equipment, categories)
 * from English backend data to Spanish UI labels.
 */

const BODY_PART_MAP: Record<string, string> = {
  'back': 'Espalda',
  'cardio': 'Cardio',
  'chest': 'Pecho',
  'lower arms': 'Antebrazos',
  'lower legs': 'Pantorrillas',
  'neck': 'Cuello',
  'shoulders': 'Hombros',
  'upper arms': 'Brazos',
  'upper legs': 'Piernas',
  'waist': 'Cintura / Abdomen',
  'core': 'Core',
  'full body': 'Cuerpo completo',
  'arms': 'Brazos',
  'legs': 'Piernas',
  'abs': 'Abdominales',
};

const MUSCLE_MAP: Record<string, string> = {
  'delts': 'Deltoides',
  'anterior deltoid': 'Deltoides anterior',
  'lateral deltoid': 'Deltoides lateral',
  'posterior deltoid': 'Deltoides posterior',
  'biceps': 'Bíceps',
  'triceps': 'Tríceps',
  'lats': 'Dorsales',
  'traps': 'Trapecios',
  'upper back': 'Espalda alta',
  'lower back': 'Espalda baja',
  'pectorals': 'Pectorales',
  'chest': 'Pecho',
  'abs': 'Abdominales',
  'abdominals': 'Abdominales',
  'obliques': 'Oblicuos',
  'quads': 'Cuádriceps',
  'quadriceps': 'Cuádriceps',
  'hamstrings': 'Femorales',
  'glutes': 'Glúteos',
  'calves': 'Pantorrillas',
  'forearms': 'Antebrazos',
  'adductors': 'Aductores',
  'abductors': 'Abductores',
  'neck': 'Cuello',
  'serratus anterior': 'Serrato anterior',
  'brachialis': 'Braquial',
  'cardiovascular system': 'Cardiovascular',
  'spine': 'Columna',
  'groin': 'Ingle',
};

const EQUIPMENT_MAP: Record<string, string> = {
  'body weight': 'Peso corporal',
  'bodyweight': 'Peso corporal',
  'barbell': 'Barra',
  'dumbbell': 'Mancuerna',
  'kettlebell': 'Kettlebell',
  'cable': 'Polea',
  'machine': 'Máquina',
  'band': 'Banda elástica',
  'resistance band': 'Banda elástica',
  'smith machine': 'Máquina Smith',
  'medicine ball': 'Balón medicinal',
  'foam roll': 'Rodillo de espuma',
  'stability ball': 'Pelota suiza',
  'weighted': 'Con peso',
  'rope': 'Cuerda',
  'elliptical machine': 'Elíptica',
  'stationary bike': 'Bicicleta fija',
  'wheel roller': 'Rueda abdominal',
  'roller': 'Rodillo',
  'leverage machine': 'Máquina de palanca',
  'sled machine': 'Trineo',
  'assisted': 'Asistido',
  'hammer': 'Martillo',
};

const CATEGORY_MAP: Record<string, string> = {
  'strength': 'Fuerza',
  'cardio': 'Cardio',
  'stretching': 'Estiramiento',
  'plyometrics': 'Pliometría',
  'powerlifting': 'Powerlifting',
  'strongman': 'Strongman',
  'olympic weightlifting': 'Halterofilia',
};

const capitalize = (text: string): string => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
};

export const translateBodyPart = (bodyPart?: string): string => {
  if (!bodyPart) return '';
  const key = bodyPart.toLowerCase().trim();
  return BODY_PART_MAP[key] || capitalize(bodyPart);
};

export const translateMuscle = (muscle?: string): string => {
  if (!muscle) return '';
  const key = muscle.toLowerCase().trim();
  return MUSCLE_MAP[key] || capitalize(muscle);
};

export const translateEquipment = (equipment?: string): string => {
  if (!equipment) return '';
  const key = equipment.toLowerCase().trim();
  return EQUIPMENT_MAP[key] || capitalize(equipment);
};

export const translateCategory = (category?: string): string => {
  if (!category) return '';
  const key = category.toLowerCase().trim();
  return CATEGORY_MAP[key] || capitalize(category);
};

/**
 * Normalizes text by removing accents/diacritics, trimming whitespace, and converting to lowercase.
 * Useful for accent-agnostic searches (e.g. 'jalon' matches 'Jalón', 'press' matches 'Press').
 */
export const normalizeSearchText = (text?: string): string => {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
};
