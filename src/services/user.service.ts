import { apiFetch, handleResponse } from './api';

export interface UserProfile {
  username: string;
  email: string;
  phoneNumber: string;
}

export const UserService = {
  getProfile: async (): Promise<UserProfile> => {
    const response = await apiFetch('/api/user/me');
    return handleResponse(response);
  },
  updateProfile: async (data: UserProfile): Promise<UserProfile> => {
    const response = await apiFetch('/api/user/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  }
};
