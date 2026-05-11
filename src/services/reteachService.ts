import { fetchData } from './apiClient';
import { ReteachCard } from '../types/reteach';

export async function getReteachCards(classId: string, subjectId: string): Promise<{ cards: ReteachCard[]; generating?: boolean }> {
  const res = await fetchData<any>(`/reteach/${classId}?subjectId=${subjectId}`);
  if (Array.isArray(res)) return { cards: res };
  return { cards: [], generating: res?.generating ?? false };
}

export async function generateReteachCards(classId: string, subjectId: string): Promise<{ generated: number }> {
  return fetchData<{ generated: number }>(`/reteach/${classId}/generate`, {
    method: 'POST',
    body: JSON.stringify({ subjectId }),
  });
}

export async function dismissReteachCard(cardId: string): Promise<void> {
  await fetchData(`/reteach/cards/${cardId}`, { method: 'DELETE' });
}
