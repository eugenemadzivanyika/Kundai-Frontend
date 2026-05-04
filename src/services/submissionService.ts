import { API_URL, fetchData } from './apiClient';

export interface SubmissionReviewQuestionDetail {
  assessmentQuestionId?: string;
  prompt?: string;
  studentAnswer?: string;
  partAnswers?: string[];
  parts?: Array<{ text?: string; correctAnswer?: string; maxPoints?: number }>;
  awardedMarks?: number | null;
  maxMarks?: number | null;
  expectedMarkingPoints?: string[];
  feedback?: string | null;
  order?: number;
}

export interface SubmissionReviewDetail {
  _id: string;
  status?: string;
  answers?: Array<{
    questionId?: any;
    studentAnswer?: string;
    partAnswers?: string[];
    pointsEarned?: number;
    isCorrect?: boolean;
    feedback?: string;
  }>;
}

export const submissionService = {
  // Method 1: For File/Text submissions (Existing endpoint)
  submitAssignment: async (submissionData: any): Promise<any> => {
    const formData = new FormData();
    formData.append('assessmentId', submissionData.assessmentId);
    formData.append('studentId', submissionData.studentId);
    formData.append('submissionType', submissionData.submissionType);

    if (submissionData.file) formData.append('file', submissionData.file);
    if (submissionData.textContent) formData.append('answers', JSON.stringify([{ studentAnswer: submissionData.textContent }]));

    const debugPayload = {
      assessmentId: submissionData.assessmentId,
      studentId: submissionData.studentId,
      submissionType: submissionData.submissionType,
      answers: submissionData.textContent ? [{ studentAnswer: submissionData.textContent }] : [],
      hasFile: !!submissionData.file,
    };
    console.log('[submitAssignment] Sending to backend:', debugPayload);

    const response = await fetch(`${API_URL}/submissions`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      body: formData,
    });
    const result = await response.json();
    console.log('[submitAssignment] Backend response:', result);
    return result;
  },

  // Method 2: For BKT-enabled Question Responses (Surgical BKT Loop)
  submitAnswers: async (payload: {
    assessmentId: string;
    studentId: string;
    submissionType: string;
    answers: Array<{ questionId: string; studentAnswer: string; isCorrect?: boolean; partAnswers?: string[] }>;
  }) => {
    console.log('[submitAnswers] Sending to backend:', JSON.stringify(payload, null, 2));
    const result = await fetchData('/submissions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    console.log('[submitAnswers] Backend response:', result);
    return result;
  },

  getSubmissionReviewDetail: async (id: string) => {
    return fetchData(`/submissions/${id}`);
  },

  // Get history for the Digital Twin mastery bars
  getStudentSubmissions: async (studentId: string) => {
    return fetchData(`/submissions/student/${studentId}`);
  },

  getStudentHistory: async (studentId: string) => {
    return fetchData(`/submissions/student/${studentId}`);
  },

  /**
   * Fetches the queue of submissions requiring review.
   * @param filters { courseId: string; status?: string }
   */
  getPendingQueue: async (filters: { courseId: string; status?: string }) => {
    const params = new URLSearchParams(filters as any).toString();
    return fetchData(`/submissions/pending/teacher?${params}`);
  },

  /**
   * Fetches the BKT vs Remediation efficiency stats
   */
  getGradingStats: async (courseId: string, timeframe: '7d' | '30d' = '30d') => {
    return fetchData(`/submissions/stats/grading?courseId=${courseId}&timeframe=${timeframe}`);
  },

  /**
   * Teachers use this to manually correct a BKT signal or provide feedback
   */
  reviewSubmission: async (id: string, reviewData: { 
    feedback: string; 
    overrides?: Array<{ questionId: string; isCorrect: boolean }> 
  }) => {
    return fetchData(`/submissions/${id}/review`, {
      method: 'PUT',
      body: JSON.stringify(reviewData),
    });
  }
};