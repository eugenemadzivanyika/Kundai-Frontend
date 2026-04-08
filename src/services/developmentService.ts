import { fetchData } from './apiClient';
import { DevelopmentPlan } from '../types';

export interface MasterySignalsSummary {
  totalSignals: number;
  bySubject: Array<{ subjectId: string; masteryPercent: number }>;
}

export interface StudentStreakSummary {
  streakWeeks: number;
  level: number;
  progressToNextWeek: number; // 0-100
}

export const developmentService = {
  // Plans
  getStudentPlan: (studentId: string, courseId: string) =>
    fetchData<DevelopmentPlan>(`/development/plans/student/${studentId}/course/${courseId}`),

  assignPlanToStudent: (studentId: string, planId: string) =>
    fetchData(`/development/plans/student/${studentId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ planId }),
    }),

  // Optional aggregated signals
  getMasterySignalsSummary: (studentId: string) =>
    fetchData<MasterySignalsSummary>(`/development/${studentId}/mastery-signals`).catch(() => ({ totalSignals: 0, bySubject: [] })),

  getStudentStreakSummary: (studentId: string) =>
    fetchData<StudentStreakSummary>(`/development/${studentId}/streak-summary`).catch(() => ({ streakWeeks: 0, level: 1, progressToNextWeek: 0 })),
  
  getAllPlansForStudent: (studentId: string, status?: string) =>
    fetchData<DevelopmentPlan[]>(`/development/plans/student/${studentId}${status ? `?status=${status}` : ''}`).catch(() => []),
  
  touchStudentStreak: (studentId: string) =>
    fetchData(`/development/${studentId}/touch-streak`).catch(() => null),

  // Add to developmentService in services/api.ts
  getAIResourceById: (resourceId: string) => 
    fetchData<any>(`/development/plans/ai-content/${resourceId}`),

  activatePlan: (planId: string, teacherNotes?: string) =>
    fetchData<DevelopmentPlan>(`/development/plans/${planId}/activate`, {
      method: 'PUT',
      body: JSON.stringify({ teacherNotes }),
    }),
};
