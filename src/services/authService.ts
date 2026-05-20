import { fetchData, parseErrorMessage, API_URL } from './apiClient';
import { tokenStore } from './tokenStore';
import { User } from '../types';

export const authService = {
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    try {
      const response = await fetchData<{ token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (response.token) {
        tokenStore.set(response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
      }
      return response;
    } catch (error) {
      throw new Error(parseErrorMessage(error));
    }
  },

  async register(userData: Partial<User>): Promise<{ token: string; user: User }> {
    try {
      const response = await fetchData<{ token: string; user: User }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      if (response.token) {
        tokenStore.set(response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
      }
      return response;
    } catch (error) {
      throw new Error(parseErrorMessage(error));
    }
  },

  // Bootstrap on page refresh: try to get a fresh access token via the cookie.
  async tryRefresh(): Promise<boolean> {
    try {
      const r = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!r.ok) return false;
      const data = await r.json();
      if (data.token) {
        tokenStore.set(data.token);
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  logout(): void {
    // Clear local state immediately so the UI responds at once.
    tokenStore.set(null);
    localStorage.removeItem('user');
    // Revoke the HttpOnly refresh-token cookie on the server, then navigate.
    // Using .finally() so the redirect only fires after the cookie is cleared —
    // otherwise the browser cancels the in-flight fetch when the page unloads.
    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(), 5000);
    fetch(`${API_URL}/auth/logout`, { method: 'POST', credentials: 'include', signal: ctrl.signal })
      .catch(() => {})
      .finally(() => { window.location.href = '/login'; });
  },
};
