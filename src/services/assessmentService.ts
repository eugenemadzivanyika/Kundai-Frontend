import { fetchData } from './apiClient';
import { Assessment, Result } from '../types';

export const assessmentService = {
  getAssessmentsByCourseId: async (courseId: string): Promise<Assessment[]> => {
    return fetchData<Assessment[]>(`/assessments?courseId=${courseId}`);
  },

  getAssessment: async (id: string): Promise<Assessment> => {
    return fetchData<Assessment>(`/assessments/${id}`);
  },

  getResults: async (assessmentId: string, studentId?: string): Promise<Result[]> => {
    const url = studentId 
      ? `/assessments/${assessmentId}/results?studentId=${studentId}`
      : `/assessments/${assessmentId}/results`;
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
  }
};
