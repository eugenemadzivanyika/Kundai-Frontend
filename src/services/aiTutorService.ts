// src/services/aiTutorService.ts
import { fetchData } from './apiClient';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AiTutorSession = {
  id: string;
  studentId: string;
  subjectId: string | null;
  planId:    string | null;
  status:    string;
};

export type AiTutorMessage = {
  id: string;
  sessionId: string;
  senderRole: 'student' | 'tutor' | 'system';
  contentType: 'text' | 'voice' | 'content';
  content?: string;
  transcript?: string;
  /** Populated when a student sent an image attachment */
  imageUrl?: string;
  /** True when this message also triggered a checkpoint pass */
  checkpointPassed?: boolean;
  isSystemAction?: boolean;
  ts: string;
};

export type CreateAiTutorMessagePayload = {
  sessionId: string;
  senderId: string;
  senderRole: 'student';
  contentType: 'text' | 'voice';
  content?: string;
  transcript?: string;
  /** Base64-encoded image data (no data-URI prefix) */
  imageBase64?: string;
  contentPayload?: {
    coachingMode?: 'socratic' | 'hint';
    noDirectSolutions?: boolean;
    expectation?: string;
    selectedPlanStep?: string | null;
    hasImageAttachment?: boolean;
    reasoningCanvas?: string | null;
  };
  autoReply: boolean;
};

// ─── Service ──────────────────────────────────────────────────────────────────

export const aiTutorService = {
  /**
   * Returns an existing active session for (studentId, planId/subjectId) or creates one.
   * Pass planId for plan-scoped sessions; subjectId as fallback for legacy callers.
   */
  getOrCreateSession: async (
    studentId: string,
    subjectId: string,
    _senderId?: string,
    planId?: string
  ): Promise<AiTutorSession> => {
    return fetchData<AiTutorSession>('/ai-tutor/sessions', {
      method: 'POST',
      body: JSON.stringify({ studentId, subjectId, planId }),
    });
  },

  listMessages: async (sessionId: string): Promise<AiTutorMessage[]> => {
    return fetchData<AiTutorMessage[]>(`/ai-tutor/messages?sessionId=${sessionId}`);
  },

  sendMessage: async (payload: CreateAiTutorMessagePayload): Promise<AiTutorMessage> => {
    return fetchData<AiTutorMessage>('/ai-tutor/messages', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
