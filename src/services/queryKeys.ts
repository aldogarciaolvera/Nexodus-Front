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
} as const;
