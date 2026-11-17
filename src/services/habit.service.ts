import { apiFetch, handleResponse } from './api';

export interface HabitDayCellDto {
  date: string;
  status: 'Done' | 'Partial' | 'Free' | 'Missed' | 'Slip';
  amount: number;
  targetValue: number;
  percentage: number;
  note?: string;
  isToday: boolean;
}

export interface TodayHabitStatusDto {
  date: string;
  isCompleted: boolean;
  currentAmount: number;
  targetValue: number;
  percentage: number;
  status: string;
  note?: string;
}

export interface HabitReminderDto {
  id: string;
  time: string;
  daysOfWeek?: string;
  isEnabled: boolean;
}

export interface CreateHabitReminderDto {
  time: string;
  daysOfWeek?: string;
  isEnabled: boolean;
}

export interface HabitDto {
  id: string;
  userId: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  category: string;
  habitType: 'Build' | 'Quit';
  trackingType: 'YesNo' | 'Count' | 'Measure';
  targetValue: number;
  targetUnit?: string;
  onTapAction: 'Increment' | 'Manual';
  frequencyType: 'Daily' | 'SpecificDays' | 'TimesPerWeek' | 'TimesPerMonth' | 'EveryNDays';
  frequencyDays?: string;
  frequencyTargetCount: number;
  everyNDaysInterval: number;
  streakUnit: string;
  streakGoal?: number;
  fillMetPeriods: boolean;
  autoCompleteSource?: string;
  currentStreak: number;
  bestStreak: number;
  lastCompletedDate?: string;
  isArchived: boolean;
  orderIndex: number;
  createdAt: string;
  reminders: HabitReminderDto[];
  todayStatus: TodayHabitStatusDto;
  recentHistory: HabitDayCellDto[];
}

export interface CreateHabitDto {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  category?: string;
  habitType?: 'Build' | 'Quit';
  trackingType?: 'YesNo' | 'Count' | 'Measure';
  targetValue?: number;
  targetUnit?: string;
  onTapAction?: 'Increment' | 'Manual';
  frequencyType?: 'Daily' | 'SpecificDays' | 'TimesPerWeek' | 'TimesPerMonth' | 'EveryNDays';
  frequencyDays?: string;
  frequencyTargetCount?: number;
  everyNDaysInterval?: number;
  streakUnit?: string;
  streakGoal?: number;
  fillMetPeriods?: boolean;
  autoCompleteSource?: string;
  reminders?: CreateHabitReminderDto[];
}

export interface UpdateHabitDto extends CreateHabitDto {
  isArchived?: boolean;
  orderIndex?: number;
}

export interface HabitCheckInDto {
  date?: string;
  amount?: number;
  status?: string;
  note?: string;
  toggle?: boolean;
}

export interface HabitWeeklyProgressDto {
  weekLabel: string;
  completedCount: number;
  targetCount: number;
  rate: number;
}

export interface HabitStatsDto {
  habitId: string;
  currentStreak: number;
  bestStreak: number;
  totalCompletions: number;
  totalCleanDays: number;
  consistencyRate: number;
  totalLoggedDays: number;
  fullYearHistory: HabitDayCellDto[];
  weeklyTrends: HabitWeeklyProgressDto[];
}

export const getLocalDateString = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getHabitTodayStatus = (
  habit: HabitDto,
  referenceDate?: string
): { isCompleted: boolean; currentAmount: number; percentage: number; status: string } => {
  const localToday = referenceDate || getLocalDateString();
  if (habit.todayStatus && habit.todayStatus.date === localToday) {
    return habit.todayStatus;
  }
  const cell = habit.recentHistory?.find((c) => c.date === localToday);
  if (cell) {
    return {
      isCompleted: cell.status === 'Done',
      currentAmount: cell.amount,
      percentage: cell.percentage,
      status: cell.status,
    };
  }
  return {
    isCompleted: false,
    currentAmount: 0,
    percentage: 0,
    status: habit.habitType === 'Quit' ? 'Done' : 'Missed',
  };
};

export const HabitService = {
  getAll: async (includeArchived: boolean = false, recentDays: number = 60): Promise<HabitDto[]> => {
    const res = await apiFetch(`/api/habits?includeArchived=${includeArchived}&recentDays=${recentDays}`);
    return handleResponse(res);
  },

  getById: async (id: string, recentDays: number = 60): Promise<HabitDto> => {
    const res = await apiFetch(`/api/habits/${id}?recentDays=${recentDays}`);
    return handleResponse(res);
  },

  create: async (data: CreateHabitDto): Promise<HabitDto> => {
    const res = await apiFetch('/api/habits', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  update: async (id: string, data: UpdateHabitDto): Promise<HabitDto> => {
    const res = await apiFetch(`/api/habits/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  delete: async (id: string): Promise<void> => {
    const res = await apiFetch(`/api/habits/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },

  checkIn: async (id: string, data: HabitCheckInDto): Promise<HabitDto> => {
    const payload: HabitCheckInDto = {
      ...data,
      date: data.date || getLocalDateString(),
    };
    const res = await apiFetch(`/api/habits/${id}/check-in`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  getHistory: async (id: string, days: number = 90): Promise<HabitDayCellDto[]> => {
    const res = await apiFetch(`/api/habits/${id}/history?days=${days}`);
    return handleResponse(res);
  },

  getStats: async (id: string): Promise<HabitStatsDto> => {
    const res = await apiFetch(`/api/habits/${id}/stats`);
    return handleResponse(res);
  },

  reorder: async (habitIdsInOrder: string[]): Promise<void> => {
    const res = await apiFetch('/api/habits/reorder', {
      method: 'POST',
      body: JSON.stringify({ habitIdsInOrder }),
    });
    return handleResponse(res);
  },
};
