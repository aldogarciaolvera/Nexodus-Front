import { useAuthStore } from '../store/authStore';

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

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
        if (!isRefreshing) {
          isRefreshing = true;
          refreshPromise = new Promise(async (resolve) => {
            try {
              // ALWAYS GET THE FRESH ACCESS TOKEN HERE to ensure we're sending the latest one
              const currentAccessToken = useAuthStore.getState().accessToken;
              const refreshResponse = await fetch(`${API_URL}/api/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: currentAccessToken, refreshToken })
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
                resolve(true);
              } else {
                await logout();
                resolve(false);
              }
            } catch (error) {
              await logout();
              resolve(false);
            } finally {
              isRefreshing = false;
              refreshPromise = null;
            }
          });
        }

        const refreshSuccess = await refreshPromise;
        
        if (refreshSuccess) {
          // Retry original request with new token
          const freshAccessToken = useAuthStore.getState().accessToken;
          headers.Authorization = `Bearer ${freshAccessToken}`;
          return fetch(`${API_URL}${endpoint}`, { ...options, headers });
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
