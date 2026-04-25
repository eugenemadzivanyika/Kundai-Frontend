import { API_URL, fetchData } from './api';
import { Assessment } from '../types';

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

  /**
   * 5. UPLOAD CONTEXT (File Handling)
   * If you've implemented Multer on the backend, use this to send files
   * to be used during generation.
   */
  uploadContextFile: async (file: File, courseId: string) => {
    const formData = new FormData();
    formData.append('context_file', file);
    formData.append('courseId', courseId);

    // This hits your Node server, which then forwards to Python
    const response = await fetch(`${API_URL}/assessments/upload-context`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData,
    });

    return response.json();
  }
};

export default aiService;