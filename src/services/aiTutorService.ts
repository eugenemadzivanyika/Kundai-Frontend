// src/services/aiTutorService.ts
import { fetchData } from './api'; // Adjust path to where your fetchData is exported

export type AiTutorSession = {
  id: string;
  studentId: string;
  subjectId: string;
  status: string;
};

export type AiTutorMessage = {
  id: string;
  sessionId: string;
  senderRole: 'student' | 'tutor' | 'system';
  contentType: 'text' | 'voice' | 'content';
  content?: string;
  transcript?: string;
  ts: string;
};

export type CreateAiTutorMessagePayload = {
  sessionId: string;
  senderId: string;
  senderRole: 'student';
  contentType: 'text' | 'voice';
  content?: string;
  transcript?: string;
  contentPayload?: any;
  autoReply: boolean;
};

export const aiTutorService = {
  getOrCreateSession: async (studentId: string, subjectId: string) => {
    // This will hit your Node server, which we'll configure in Step 2
    return fetchData<AiTutorSession>('/ai-tutor/sessions', {
      method: 'POST',
      body: JSON.stringify({ studentId, subjectId }),
    });
  },

  listMessages: async (sessionId: string) => {
    return fetchData<AiTutorMessage[]>(`/ai-tutor/messages?sessionId=${sessionId}`);
  },

  sendMessage: async (payload: CreateAiTutorMessagePayload) => {
    return fetchData<AiTutorMessage>('/ai-tutor/messages', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};