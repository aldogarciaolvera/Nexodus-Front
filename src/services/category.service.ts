import { apiFetch, handleResponse } from './api';

export interface CategoryPayload {
  name: string;
  description?: string;
  monthlyLimit?: number;
}

export interface Category extends CategoryPayload {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export const CategoryService = {
  getAll: async (): Promise<Category[]> => {
    const response = await apiFetch('/api/categories/');
    return handleResponse(response);
  },
  getById: async (id: string): Promise<Category> => {
    const response = await apiFetch(`/api/categories/${id}`);
    return handleResponse(response);
  },
  create: async (data: CategoryPayload): Promise<Category> => {
    const response = await apiFetch('/api/categories/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
  update: async (id: string, data: CategoryPayload): Promise<Category> => {
    const response = await apiFetch(`/api/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
  delete: async (id: string): Promise<void> => {
    const response = await apiFetch(`/api/categories/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  }
};
