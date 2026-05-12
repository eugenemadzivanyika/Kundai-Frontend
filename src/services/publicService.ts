import { API_URL } from './apiClient';
import type { SubscriptionPackage } from './sysAdminService';

async function publicFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `HTTP ${res.status}`);
  }
  return res.json();
}

export const publicService = {
  getPackages: (): Promise<SubscriptionPackage[]> =>
    publicFetch('/public/packages'),

  registerSchool: (data: {
    schoolName: string;
    adminFirstName: string;
    adminLastName: string;
    email: string;
    password: string;
    phone?: string;
    planId?: string;
  }): Promise<{ message: string }> =>
    publicFetch('/public/register-school', { method: 'POST', body: JSON.stringify(data) }),
};
