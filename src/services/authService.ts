import { fetchData, parseErrorMessage } from './apiClient'; // Added parseErrorMessage
import { User } from '../types';

export const authService = {
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    try {
      // fetchData already returns the JSON body, no need for .data wrapper
      const response = await fetchData<{ token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      if (response.token) {
        localStorage.setItem('token', response.token);
        
        localStorage.setItem('user', JSON.stringify(response.user)); 
      }
      
      return response;
    } catch (error) {
      console.error('API LOGIN ERROR:', error);
      // We use the imported helper to parse the error
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
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
      }
      return response;
    } catch (error) {
      throw new Error(parseErrorMessage(error));
    }
  },

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },
};