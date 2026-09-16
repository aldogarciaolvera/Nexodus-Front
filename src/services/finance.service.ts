import { apiFetch, handleResponse } from './api';

export interface FinancePayload {
  transactionType: 'Ingreso' | 'Gasto';
  amount: number;
  categoryId?: string;
  transactionDate?: string;
}

export interface FinanceTransaction extends FinancePayload {
  id: string;
}

export interface FinanceSummary {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
}

export const FinanceService = {
  getAll: async (): Promise<FinanceTransaction[]> => {
    const response = await apiFetch('/api/finances/');
    return handleResponse(response);
  },
  getSummary: async (): Promise<FinanceSummary> => {
    const response = await apiFetch('/api/finances/summary');
    return handleResponse(response);
  },
  getById: async (id: string) => {
    const response = await apiFetch(`/api/finances/${id}`);
    return handleResponse(response);
  },
  create: async (data: FinancePayload) => {
    const response = await apiFetch('/api/finances/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
  update: async (id: string, data: FinancePayload) => {
    const response = await apiFetch(`/api/finances/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
  delete: async (id: string) => {
    const response = await apiFetch(`/api/finances/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  }
};
