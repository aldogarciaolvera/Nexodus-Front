import { apiFetch, handleResponse } from './api';

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
  customDays?: string;
}

export interface UpdateTodoDto {
  task: string;
  subtitle?: string;
  tag?: string;
  urgent: boolean;
  isHabit: boolean;
  frequency?: string;
  customDays?: string;
  isCompleted: boolean;
}

export const TodoService = {
  getAll: async (): Promise<TodoDto[]> => {
    const response = await apiFetch('/api/todos');
    return handleResponse(response);
  },

  getById: async (id: string): Promise<TodoDto> => {
    const response = await apiFetch(`/api/todos/${id}`);
    return handleResponse(response);
  },

  create: async (payload: CreateTodoDto): Promise<TodoDto> => {
    const response = await apiFetch('/api/todos', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  update: async (id: string, payload: UpdateTodoDto): Promise<TodoDto> => {
    const response = await apiFetch(`/api/todos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  complete: async (id: string): Promise<void> => {
    const response = await apiFetch(`/api/todos/${id}/complete`, {
      method: 'POST',
    });
    return handleResponse(response);
  },

  delete: async (id: string): Promise<void> => {
    const response = await apiFetch(`/api/todos/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  }
};
