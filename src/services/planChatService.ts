import { fetchData } from './apiClient';

export type PlanChatSessionSummary = {
  sessionId:     string;
  planId:        string | null;
  title:         string;
  planStatus:    'Draft' | 'Active' | 'On Hold' | 'Mastered' | 'Failed' | null;
  progress:      number;
  skillCategory: string | null;
  sessionStatus: 'active' | 'archived';
  lastMessage:   { content: string; senderRole: string; ts: string } | null;
  lastMessageAt: string;
  messageCount:  number;
};

export const planChatService = {
  listSessions: (studentId: string): Promise<PlanChatSessionSummary[]> =>
    fetchData<PlanChatSessionSummary[]>(`/ai-tutor/sessions/${studentId}`),
};
