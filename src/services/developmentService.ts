import { fetchData } from './apiClient';
import { DevelopmentPlan } from '../types';

export const developmentService = {


  // Plans
  getStudentPlan: (studentId: string, courseId: string) => 
    fetchData<DevelopmentPlan>(`/development/plans/student/${studentId}/course/${courseId}`),
    
  assignPlanToStudent: (studentId: string, planId: string) => 
    fetchData(`/development/plans/student/${studentId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ planId }),
    }),
};
