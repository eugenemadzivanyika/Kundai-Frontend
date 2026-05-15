import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8000';

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
  // Handle the plain-object shape thrown by fetchData: { response: { data: {...} }, message: '...' }
  if (error && typeof error === 'object' && error.response?.data) {
    const data = error.response.data;
    if (typeof data.message === 'string') return data.message;
    if (typeof data.error === 'string') return data.error;
  }
  return error instanceof Error ? error.message : 'An unexpected error occurred';
};

export async function fetchData<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const defaultHeaders: HeadersInit = { 'Content-Type': 'application/json' };

  if (token) defaultHeaders['Authorization'] = `Bearer ${token}`;

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: { ...defaultHeaders, ...options.headers },
    });
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));

      // Redirect blocked school users to login with a suspension notice
      if (response.status === 403 && errorBody.code === 'SCHOOL_SUSPENDED') {
        sessionStorage.setItem('suspension_notice', JSON.stringify({
          reason: errorBody.reason || '',
          note:   errorBody.note   || '',
        }));
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return undefined as unknown as T;
      }

      throw { response: { data: errorBody }, message: `HTTP error! status: ${response.status}` };
    }
    return response.json();
  } catch (error) {
    throw new Error(parseErrorMessage(error));
  }
}

export { API_URL };

// Converts a server-relative path like /uploads/avatars/foo.jpeg into an
// absolute URL pointing at the backend origin, so <img src> works from the
// Vite dev server (different port) or any other host.
const BACKEND_ORIGIN = API_URL.replace(/\/api$/, '');
export const resolveAssetUrl = (url?: string | null): string => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) return url;
  return `${BACKEND_ORIGIN}${url}`;
};


/**
 * Like fetchData but targets the Python AI service instead of the Node API.
 * Includes the JWT token so the AI service can optionally validate requests.
 */
export async function fetchAiData<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
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