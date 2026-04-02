import { API_URL, fetchData } from './apiClient';
import { SubmissionPayload } from '../types';

export const submissionService = {
  submitAssignment: async (submissionData: SubmissionPayload): Promise<any> => {
    const formData = new FormData();
    
    formData.append('assessmentId', submissionData.assessmentId);
    formData.append('studentId', submissionData.studentId);
    formData.append('submissionType', submissionData.submissionType);

    if (submissionData.submissionType === 'file' && submissionData.file) {
      formData.append('file', submissionData.file);
    } 
    
    if (submissionData.submissionType === 'text' && submissionData.textContent) {
      formData.append('textContent', submissionData.textContent);
    }

    if (submissionData.externalAssessmentData) {
      formData.append('externalAssessmentData', JSON.stringify(submissionData.externalAssessmentData));
    }

    try {
      const response = await fetch(`${API_URL}/submissions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: Failed to submit`);
      }

      return response.json();
    } catch (error) {
      console.error('Submission error:', error);
      throw error;
    }
  },

  getGradingStats: async (courseId?: string, timeframe?: string) => {
    const params = new URLSearchParams();
    if (courseId) params.append('courseId', courseId);
    if (timeframe) params.append('timeframe', timeframe);
    
    return fetchData(`/submissions/stats?${params.toString()}`);
  }
};
