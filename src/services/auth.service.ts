import { apiFetch, handleResponse } from './api';

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  phoneNumber?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const AuthService = {
  login: async (credentials: LoginPayload) => {
    const response = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    return handleResponse(response);
  },
  register: async (userData: RegisterPayload) => {
    const response = await apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },
  refresh: async (token: string, refreshToken: string) => {
    const response = await apiFetch('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ token, refreshToken }),
    });
    return handleResponse(response);
  }
};
