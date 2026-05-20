// src/services/profileService.ts
import { fetchData, API_URL } from './apiClient';
import { tokenStore } from './tokenStore';
import type { Profile, ProfileUpdate } from '../types/profile';

export const profileService = {
  getMyProfile(): Promise<Profile> {
    return fetchData<Profile>('/profile/me');
  },

  updateMyProfile(data: Partial<ProfileUpdate>): Promise<Profile> {
    return fetchData<Profile>('/profile/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
    const token = tokenStore.get();
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await fetch(`${API_URL}/profile/me/avatar`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || `HTTP ${response.status}`);
    return data as { avatarUrl: string };
  },
};
