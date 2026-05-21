import axios from 'axios';
import { tokenStore } from './tokenStore';

const API_URL = import.meta.env.VITE_API_URL;
const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL;

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export const parseErrorMessage = (error: any): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data) {
      if (typeof data.message === 'string') return data.message;
      if (Array.isArray(data.errors) && data.errors.length > 0) {
        return data.errors.map((e: any) => e.msg || String(e)).join(' | ');
      }
    }
    return error.message || 'Server connection failed';
  }
  if (error && typeof error === 'object' && error.response?.data) {
    const data = error.response.data;
    if (typeof data.message === 'string') return data.message;
    if (typeof data.error === 'string') return data.error;
  }
  return error instanceof Error ? error.message : 'An unexpected error occurred';
};

// Attempt a token refresh using the HttpOnly cookie. Returns the new access token or null.
let _refreshPromise: Promise<string | null> | null = null;
async function attemptRefresh(): Promise<string | null> {
  if (_refreshPromise) return _refreshPromise;
  _refreshPromise = fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  })
    .then(async r => {
      if (!r.ok) return null;
      const data = await r.json();
      if (data.token) {
        tokenStore.set(data.token);
        return data.token as string;
      }
      return null;
    })
    .catch(() => null)
    .finally(() => { _refreshPromise = null; });
  return _refreshPromise;
}

export async function fetchData<T = any>(endpoint: string, options: RequestInit = {}, _isRetry = false): Promise<T> {
  const token = tokenStore.get();
  const defaultHeaders: HeadersInit = { 'Content-Type': 'application/json' };

  if (token) defaultHeaders['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: { ...defaultHeaders, ...options.headers },
  });

  if (response.status === 401 && !_isRetry) {
    const newToken = await attemptRefresh();
    if (newToken) return fetchData<T>(endpoint, options, true);
    // Refresh failed — clear auth state and redirect to login
    tokenStore.set(null);
    localStorage.removeItem('user');
    window.location.href = '/login';
    return undefined as unknown as T;
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));

    if (response.status === 403 && errorBody.code === 'SCHOOL_SUSPENDED') {
      sessionStorage.setItem('suspension_notice', JSON.stringify({
        reason: errorBody.reason || '',
        note:   errorBody.note   || '',
      }));
      tokenStore.set(null);
      localStorage.removeItem('user');
      window.location.href = '/login';
      return undefined as unknown as T;
    }

    throw { response: { data: errorBody }, message: `HTTP error! status: ${response.status}` };
  }

  return response.json();
}

export { API_URL };

const BACKEND_ORIGIN = API_URL.replace(/\/api$/, '');
export const resolveAssetUrl = (url?: string | null): string => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) return url;
  return `${BACKEND_ORIGIN}${url}`;
};

export async function fetchAiData<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = tokenStore.get();
  const defaultHeaders: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) defaultHeaders['Authorization'] = `Bearer ${token}`;

  try {
    const response = await fetch(`${AI_SERVICE_URL}${endpoint}`, {
      ...options,
      headers: { ...defaultHeaders, ...options.headers },
    });
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw { response: { data: errorBody }, message: `HTTP error! status: ${response.status}` };
    }
    return response.json();
  } catch (error) {
    throw new Error(parseErrorMessage(error));
  }
}
