import { API_URL, fetchData, fetchAiData } from './api';
import { Assessment } from '../types';
import { tokenStore } from './tokenStore';

interface AttributeInput {
  _id: string;
  name: string;
  description?: string;
}

// src/types/index.ts (or wherever your types live)

export interface GenerateQuestionsParams {
  courseId: string;
  name: string;
  attributes: {
    _id: string;
    name: string;
    description?: string;
    level?: string;
  }[];
  questionCount: number;
  difficulty: 'easy' | 'medium' | 'hard';
  type: string;
  maxScore?: number;
  dueDate?: string;
  dueTime?: string;
  questionTypeDistribution?: {
    multiple_choice: number;
    true_false: number;
    short_answer: number;
    essay: number;
  };
  mathPaperType?: 'paper1' | 'paper2' | 'both' | null;
  uploadedFile?: File | null;
  targetClassGroups?: string[];
}

export const aiService = {
  /**
   * 1. GENERATE ASSESSMENT
   * Hits Node.js: POST /api/assessments/generate
   * This endpoint pipes to Python, saves to MongoDB, and returns the Assessment
   */
generateQuestions: async (params: GenerateQuestionsParams): Promise<Assessment> => {
  return fetchData<Assessment>('/assessments/generate', {
    method: 'POST',
    body: JSON.stringify({
      courseId: params.courseId,
      name: params.name,
      attributes: params.attributes,
      questionCount: params.questionCount,
      difficulty: params.difficulty,
      type: params.type || 'Quiz',
      
      // --- ADD THESE NEW FIELDS ---
      maxScore: params.maxScore,
      dueDate: params.dueDate,
      dueTime: params.dueTime,
      questionTypeDistribution: params.questionTypeDistribution,
      mathPaperType: params.mathPaperType,
      targetClassGroups: params.targetClassGroups || [],
    }),
  });
},

  /**
   * 2. SUGGEST AI GRADE (ASAG)
   * Hits Node.js: POST /api/assessments/:submissionId/grade-suggest
   * Triggers the Chain-of-Thought grading and creates/updates the Result model
   */
  suggestAIGrade: async (submissionId: string) => {
    return fetchData<{
      message: string;
      resultId: string;
      aiThought: any[];
    }>(`/assessments/${submissionId}/grade-suggest`, {
      method: 'POST',
    });
  },

  /**
   * 3. CONFIRM FINAL GRADE
   * Hits Node.js: POST /api/results/:resultId/confirm
   * Teacher verifies AI suggestion, updates BKT, and releases grade
   */
  confirmGrade: async (resultId: string, finalScores: Record<string, number>, teacherFeedback: string) => {
    return fetchData(`/results/${resultId}/confirm`, {
      method: 'POST',
      body: JSON.stringify({
        finalScores,
        teacherFeedback
      }),
    });
  },

  /**
   * 4. REGENERATE (Surgical adjustment)
   * Note: In your current backend, this would likely be a re-call to 'generate'
   * with modified parameters or a feedback string.
   */
  regenerateQuestions: async (params: any): Promise<Assessment> => {
    return aiService.generateQuestions(params);
  },

  generateNotes: async (
    subjectId: string,
    topic: string,
    attributeName: string,
    level: string,
    studentProfile?: Record<string, unknown>,
  ): Promise<{ notes: string; sources: Array<Record<string, unknown>>; grounded_by_rag: boolean }> => {
    return fetchAiData('/notes/generate', {
      method: 'POST',
      body: JSON.stringify({ subject_id: subjectId, topic, attribute_name: attributeName, level, student_profile: studentProfile }),
    });
  },

  getRagStatus: async (
    subjectId: string,
  ): Promise<{ has_documents: boolean; chunk_count: number }> => {
    return fetchAiData(`/rag/status/${subjectId}`);
  },

  chatAboutTopic: async (
    subjectId: string,
    topic: string,
    notesContext: string,
    question: string,
    history: Array<{ role: 'user' | 'assistant'; content: string }>,
  ): Promise<{ answer: string; grounded_by_rag: boolean }> => {
    return fetchAiData('/notes/chat', {
      method: 'POST',
      body: JSON.stringify({
        subject_id: subjectId,
        topic,
        notes_context: notesContext,
        question,
        history,
      }),
    });
  },

  /**
   * 5. UPLOAD CONTEXT (File Handling)
   * If you've implemented Multer on the backend, use this to send files
   * to be used during generation.
   */
  uploadContextFile: async (file: File, courseId: string) => {
    const token = tokenStore.get();
    const formData = new FormData();
    formData.append('context_file', file);
    formData.append('courseId', courseId);

    const response = await fetch(`${API_URL}/assessments/upload-context`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || `Upload failed (${response.status})`);
    return data;
  }
};

export default aiService;