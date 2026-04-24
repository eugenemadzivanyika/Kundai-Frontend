import { fetchData } from './apiClient';
import { Assessment, Result } from '../types';

export const assessmentService = {
  getAssessmentsByCourseId: async (courseId: string): Promise<Assessment[]> => {
    // Ensure we don't send 'all' as a literal ID to the backend
    const endpoint = courseId === 'all' ? '/assessments' : `/assessments?courseId=${courseId}`;
    const data = await fetchData<Assessment[]>(endpoint);
    return Array.isArray(data) ? data : []; // Force array return
  },

  getAssessmentHistory: async (studentId: string, params: { subjectId?: string }) => {
    const query = params.subjectId ? `?subjectId=${params.subjectId}` : '';
    return fetchData<any[]>(`/students/${studentId}/assessment-history${query}`);
  },

  getAssessment: async (id: string): Promise<Assessment> => {
    return fetchData<Assessment>(`/assessments/${id}`);
  },

  getAssessmentWithQuestions: async (id: string): Promise<Assessment> => {
    // This matches your backend route: router.get('/:id/with-questions', ...)
    return fetchData<Assessment>(`/assessments/${id}/with-questions`);
  },
  
  confirmResult: async (
    resultId: string, 
    data: { finalScores: Record<string, number>; teacherFeedback: string }
  ): Promise<{ message: string; result: any; bktResults: any[] }> => {
    return fetchData(`/assessments/${resultId}/confirm-grade`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

getResults: async (
    assessmentId: string, 
    filters?: { studentId?: string; status?: string }
  ): Promise<Result[]> => {
    // Build query string dynamically
    const params = new URLSearchParams();
    
    if (filters?.studentId) params.append('studentId', filters.studentId);
    if (filters?.status) params.append('status', filters.status);
    
    const queryString = params.toString();
    const url = `/assessments/${assessmentId}/results${queryString ? `?${queryString}` : ''}`;
    
    return fetchData<Result[]>(url);
  },
  addResult: async (id: string, resultData: any): Promise<Result> => {
    return fetchData<Result>(`/assessments/${id}/results`, {
      method: 'POST',
      body: JSON.stringify(resultData),
    });
  },
  updateAssessment: async (id: string, updateData: Partial<Assessment>): Promise<Assessment> => {
    return fetchData<Assessment>(`/assessments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  },
  deleteAssessment: async (id: string): Promise<void> => {
    await fetchData(`/assessments/${id}`, { method: 'DELETE' });
  },

  getAssessmentsOverview: async (filters?: { courseId?: string; status?: string }): Promise<any[]> => {
    const params = new URLSearchParams();
    if (filters?.courseId) params.append('courseId', filters.courseId);
    if (filters?.status)   params.append('status',   filters.status);
    const qs = params.toString();
    const data = await fetchData<any[]>(`/assessments/overview${qs ? `?${qs}` : ''}`);
    return Array.isArray(data) ? data : [];
  },

  // Lightweight mark/feedback update used by the detail page
  updateResult: async (resultId: string, data: { actualMark?: number; teacherFeedback?: string }): Promise<any> => {
    return fetchData(`/assessments/${resultId}/confirm-grade`, {
      method: 'POST',
      body: JSON.stringify({
        finalScores: data.actualMark != null ? { total: data.actualMark } : {},
        teacherFeedback: data.teacherFeedback ?? '',
      }),
    });
  },
  getSubmissionResult: async (submissionId: string): Promise<any> => {
    return fetchData(`/assessments/results/by-submission/${submissionId}`);
  },
  // assessmentService.ts
  getResultById: async (id: string): Promise<any> => {
    return fetchData(`/assessments/results/${id}`);
  },

  getStudentAssessmentsAndResults: async (studentId: string): Promise<any[]> => {
    // This hits the backend: GET /api/students/:id/assessment-history
    // Note: We use /students/ path because that's where your controller is mounted
    return fetchData<any[]>(`/students/${studentId}/assessment-history`);
  },
};
