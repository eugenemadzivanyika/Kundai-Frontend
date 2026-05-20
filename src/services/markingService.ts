import { API_URL } from './apiClient';
import { tokenStore } from './tokenStore';

interface MarkingResult {
  marks: number;
  feedback: string;
  criteria: Array<{
    criterion: string;
    score: number;
    comments: string;
  }>;
}

export const markingService = {
  async markDocument(file: File): Promise<MarkingResult> {
    const token = tokenStore.get();
    const form = new FormData();
    form.append('file', file);

    const res = await fetch(`${API_URL}/ai/mark-document`, {
      method: 'POST',
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'AI marking failed');
    }
    return res.json();
  },
};

export default markingService;
