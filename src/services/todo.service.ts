import { api } from './api';

export interface TodoDto {
  id: string;
  task: string;
  subtitle?: string;
  tag?: string;
  urgent: boolean;
  isCompleted: boolean;
  dueDate?: string;
  isHabit: boolean;
  frequency?: string;
  customDays?: string;
  currentStreak: number;
  highestStreak: number;
  lastCompletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTodoDto {
  task: string;
  subtitle?: string;
  tag?: string;
  urgent: boolean;
  isHabit: boolean;
  frequency?: string;
}

export interface UpdateTodoDto {
  task: string;
  subtitle?: string;
  tag?: string;
  urgent: boolean;
  isHabit: boolean;
  frequency?: string;
  isCompleted: boolean;
}

export const TodoService = {
  getAll: async (): Promise<TodoDto[]> => {
    const { data } = await api.get('/todos');
    return data;
  },

  getById: async (id: string): Promise<TodoDto> => {
    const { data } = await api.get(`/todos/${id}`);
    return data;
  },

  create: async (payload: CreateTodoDto): Promise<TodoDto> => {
    const { data } = await api.post('/todos', payload);
    return data;
  },

  update: async (id: string, payload: UpdateTodoDto): Promise<TodoDto> => {
    const { data } = await api.put(`/todos/${id}`, payload);
    return data;
  },

  complete: async (id: string): Promise<void> => {
    const { data } = await api.post(`/todos/${id}/complete`);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    const { data } = await api.delete(`/todos/${id}`);
    return data;
  }
};
