// src/services/peerStudyService.ts
import { fetchData } from './api';

export type PeerStudyRequestType = 'need-help' | 'offer-help' | 'study-group';
export type PeerStudyRequestStatus = 'open' | 'filled' | 'closed' | 'cancelled';

export interface PeerStudyRequestItem {
  id: string;
  subjectId: string;
  subjectName?: string;
  type: PeerStudyRequestType;
  note: string;
  status: PeerStudyRequestStatus;
  maxParticipants: number;
  participants: number;
  createdByName: string;
  createdAt: string;
}

export const peerStudyService = {
  listRequests: async (params: any = {}): Promise<PeerStudyRequestItem[]> => {
    const query = new URLSearchParams(params).toString();
    return fetchData<PeerStudyRequestItem[]>(`/peer-study/requests${query ? `?${query}` : ''}`);
  },

  createRequest: async (payload: any): Promise<PeerStudyRequestItem> =>
    fetchData<PeerStudyRequestItem>('/peer-study/requests', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  joinRequest: async (id: string, studentId: string): Promise<any> =>
    fetchData(`/peer-study/requests/${id}/join`, {
      method: 'POST',
      body: JSON.stringify({ studentId }),
    }),
};
