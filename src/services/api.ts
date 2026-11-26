import { useAuthStore } from '../store/authStore';

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

export const normalizeErrorMessage = (err: any): string => {
  if (!err) return 'Ocurrió un error inesperado al procesar la solicitud.';

  const rawMessage = typeof err === 'string' ? err : (err?.message || '');
  const lowerMsg = rawMessage.toLowerCase();
  const name = err?.name || '';

  // Network / Connection / Host Unreachable / DNS / Native Java exceptions
  if (
    lowerMsg.includes('network request failed') ||
    lowerMsg.includes('failed to fetch') ||
    lowerMsg.includes('failed to connect') ||
    lowerMsg.includes('connectexception') ||
    lowerMsg.includes('econnrefused') ||
    lowerMsg.includes('enotfound') ||
    lowerMsg.includes('ehostunreach') ||
    lowerMsg.includes('networkerror') ||
    lowerMsg.includes('java.net') ||
    lowerMsg.includes('faildfetch') ||
    lowerMsg.includes('connection refused') ||
    name === 'TypeError'
  ) {
    return 'No se pudo conectar con el servidor. Verifica tu conexión a internet o que el servidor esté activo.';
  }

  // Timeout / Aborted
  if (
    name === 'AbortError' || 
    lowerMsg.includes('aborted') || 
    lowerMsg.includes('timeout') || 
    lowerMsg.includes('sockettimeoutexception')
  ) {
    return 'La solicitud tardó demasiado tiempo en responder. Por favor, intenta de nuevo.';
  }

  // HTML error pages from web server (Nginx/Kestrel/IIS 502/503/504)
  if (lowerMsg.includes('<html') || lowerMsg.includes('<!doctype') || lowerMsg.includes('<body') || lowerMsg.includes('<head>')) {
    return 'El servidor no está disponible en este momento. Por favor, intenta más tarde.';
  }

  // C# / Stack trace dumps
  if (lowerMsg.includes('.cs:line') || lowerMsg.includes('stacktrace') || lowerMsg.includes('system.exception') || lowerMsg.includes('at microsoft.aspnetcore')) {
    return 'El servidor encontró un error interno al procesar la solicitud.';
  }

  return rawMessage || 'Ocurrió un error inesperado al comunicarse con el servidor.';
};

export const apiFetch = async (endpoint: string, options: RequestInit & { timeout?: number } = {}) => {
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
  const isAiEndpoint = endpoint.includes('/ai/') || endpoint.includes('/vision');
  const defaultTimeout = isAiEndpoint ? 60000 : 30000;
  const requestTimeout = options.timeout ?? defaultTimeout;
  const timeoutId = setTimeout(() => controller.abort(), requestTimeout);

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
    throw new Error(normalizeErrorMessage(err));
  }
};

export const handleResponse = async (response: Response) => {
  const text = await response.text();
  
  if (!response.ok) {
    let errorMessage = '';
    if (text) {
      try {
        const errorData = JSON.parse(text);
        if (errorData.errors && typeof errorData.errors === 'object') {
          const firstErrorKey = Object.keys(errorData.errors)[0];
          if (firstErrorKey && Array.isArray(errorData.errors[firstErrorKey]) && errorData.errors[firstErrorKey].length > 0) {
            errorMessage = errorData.errors[firstErrorKey][0];
          } else {
            errorMessage = errorData.content?.message || errorData.message || errorData.title;
          }
        } else {
          errorMessage = errorData.content?.message || errorData.message || errorData.title;
        }
      } catch {
        // text is not JSON (e.g. HTML or plain text)
      }
    }

    if (!errorMessage) {
      if (response.status === 400) {
        errorMessage = 'Los datos proporcionados no son válidos.';
      } else if (response.status === 401) {
        errorMessage = 'Credenciales incorrectas o sesión no autorizada.';
      } else if (response.status === 403) {
        errorMessage = 'No tienes permiso para realizar esta acción.';
      } else if (response.status === 404) {
        errorMessage = 'El recurso solicitado no fue encontrado.';
      } else if (response.status === 409) {
        errorMessage = 'El registro ya existe o genera un conflicto.';
      } else if (response.status === 422) {
        errorMessage = 'No se pudo procesar la solicitud con los datos enviados.';
      } else if (response.status === 429) {
        errorMessage = 'Demasiadas solicitudes. Espera un momento antes de reintentar.';
      } else if (response.status >= 500) {
        errorMessage = `Error del servidor (${response.status}). Por favor intenta más tarde.`;
      } else {
        errorMessage = `Error de servidor (${response.status})`;
      }
    }

    throw new Error(normalizeErrorMessage(errorMessage));
  }
  
  if (!text) return null;

  try {
    const data = JSON.parse(text);
    return data.content !== undefined ? data.content : data;
  } catch (e) {
    return text;
  }
};
