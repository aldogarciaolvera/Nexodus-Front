export const queryKeys = {
  todos: {
    all: ['todos'] as const,
  },
  gym: {
    profile: ['profile'] as const,
    routines: ['routines'] as const,
    routine: (id?: string) => ['routine', id] as const,
    exercises: ['exercises'] as const,
    exercise: (id?: string) => ['exercise', id] as const,
    workouts: ['workouts'] as const,
    workout: (id?: string) => ['workout', id] as const,
  },
  finance: {
    summary: ['financeSummary'] as const,
    transactions: ['financeTransactions'] as const,
    categories: ['categories'] as const,
  },
  journal: {
    notes: ['notes'] as const,
  },
  user: {
    profile: ['profile'] as const,
  },
  diet: {
    target: ['dietTarget'] as const,
    dailyAll: ['dietDaily'] as const,
    daily: (date?: string) => ['dietDaily', date] as const,
    foods: (query?: string) => ['dietFoods', query] as const,
    barcode: (code?: string) => ['dietBarcode', code] as const,
    waterAll: ['dietWater'] as const,
    water: (date?: string) => ['dietWater', date] as const,
    fasting: ['dietFasting'] as const,
  },
} as const;
