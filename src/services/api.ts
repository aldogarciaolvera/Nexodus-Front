import { useAuthStore } from '../store/authStore';

// Dynamic API URL is now fetched via useAuthStore
// const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const { accessToken } = useAuthStore.getState();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (accessToken && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const API_URL = useAuthStore.getState().getApiUrl();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal as any,
    });
    
    clearTimeout(timeoutId);

    if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
      const { refreshToken, updateAccessToken, updateTokens, logout } = useAuthStore.getState();
      if (refreshToken) {
        try {
          const refreshResponse = await fetch(`${API_URL}/api/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: accessToken, refreshToken })
          });
          if (refreshResponse.ok) {
            const data = await refreshResponse.json();
            const newToken = data.content?.token || data.token || data.content?.accessToken || data.accessToken;
            const newRefreshToken = data.content?.refreshToken || data.refreshToken;
            
            if (newToken && newRefreshToken) {
              await updateTokens(newToken, newRefreshToken);
            } else if (newToken) {
              await updateAccessToken(newToken);
            }
            
            headers.Authorization = `Bearer ${newToken}`;
            return fetch(`${API_URL}${endpoint}`, { ...options, headers });
          } else {
            await logout();
          }
        } catch (error) {
          await logout();
        }
      } else {
        await logout();
      }
    }

    return response;
  } catch (err: any) {
    clearTimeout(timeoutId);
    throw err;
  }
};

export const handleResponse = async (response: Response) => {
  const text = await response.text();
  
  if (!response.ok) {
    let errorMessage = 'Request failed';
    if (text) {
      try {
        const errorData = JSON.parse(text);
        if (errorData.errors) {
          const firstErrorKey = Object.keys(errorData.errors)[0];
          if (firstErrorKey) {
            errorMessage = errorData.errors[firstErrorKey][0];
          } else {
            errorMessage = errorData.content?.message || errorData.message || errorData.title || JSON.stringify(errorData);
          }
        } else {
          errorMessage = errorData.content?.message || errorData.message || errorData.title || JSON.stringify(errorData);
        }
      } catch (e) {
        errorMessage = text;
      }
    } else {
      errorMessage = `Error ${response.status}`;
    }
    throw new Error(errorMessage);
  }
  
  if (!text) return null;

  try {
    const data = JSON.parse(text);
    return data.content !== undefined ? data.content : data;
  } catch (e) {
    return text;
  }
};
