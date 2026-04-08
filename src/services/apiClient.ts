import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
      throw { response: { data: errorBody }, message: `HTTP error! status: ${response.status}` };
    }
    return response.json();
  } catch (error) {
    throw new Error(parseErrorMessage(error));
  }
}

export { API_URL };
