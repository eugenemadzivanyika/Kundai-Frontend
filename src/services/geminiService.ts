import { fetchData } from './apiClient';

export const findResources = async (query: string, subject: string): Promise<string[]> => {
  try {
    const res = await fetchData<{ urls: string[] }>('/ai/find-resources', {
      method: 'POST',
      body: JSON.stringify({ query, subject }),
    });
    return res.urls ?? [];
  } catch {
    return [];
  }
};
