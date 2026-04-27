import { fetchData } from './apiClient';
import { DevelopmentPlan } from '../types';

export interface MasterySignalsSummary {
  totalSignals: number;
  bySubject: Array<{ subjectId: string; masteryPercent: number }>;
  averageOverall?: number;
}

export interface StudentStreakSummary {
  streakWeeks: number;
  level: number;
  progressToNextWeek: number; // 0-100
}

export const developmentService = {
  // ── Plans ────────────────────────────────────────────────────────────────────

  getStudentPlan: (studentId: string, courseId: string) =>
    fetchData<DevelopmentPlan>(`/development/plans/student/${studentId}/course/${courseId}`),

  assignPlanToStudent: (studentId: string, planId: string) =>
    fetchData(`/development/plans/student/${studentId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ planId }),
    }),

  getAllPlansForStudent: (studentId: string, status?: string) =>
    fetchData<DevelopmentPlan[]>(`/development/plans/student/${studentId}${status ? `?status=${status}` : ''}`)
      .catch(() => []),

  getAIResourceById: (resourceId: string) =>
    fetchData<any>(`/development/plans/ai-content/${resourceId}`),

  createCoursePlan: (planData: Record<string, unknown>) =>
    fetchData<Record<string, unknown>>('/development/plans', {
      method: 'POST',
      body: JSON.stringify(planData),
    }),

  createPlan: (planData: {
    student: string;
    course: string;
    title: string;
    skillCategory: string;
    targetAttributes?: Array<{ attributeId: string; initialMastery: number }>;
    description?: string;
    status?: string;
  }) =>
    fetchData<Record<string, unknown>>('/development/plans', {
      method: 'POST',
      body: JSON.stringify(planData),
    }),

  // Teacher manually selects attributes → triggers full AI mission + content generation
  createTeacherInitiatedPlan: (planData: {
    student: string;
    course: string;
    title: string;
    skillCategory: string;
    targetAttributes: Array<{ attributeId: string; initialMastery: number }>;
    description?: string;
  }) =>
    fetchData<Record<string, unknown>>('/development/plans/teacher-initiated', {
      method: 'POST',
      body: JSON.stringify(planData),
    }),

  activatePlan: (planId: string, teacherNotes?: string) =>
    fetchData<DevelopmentPlan>(`/development/plans/${planId}/activate`, {
      method: 'PUT',
      body: JSON.stringify({ teacherNotes }),
    }),

  deletePlan: (planId: string) =>
    fetchData<{ message: string }>(`/development/plans/${planId}`, { method: 'DELETE' }),

  // ── Mastery signals ──────────────────────────────────────────────────────────

  getMasterySignalsSummary: (studentId: string) =>
    fetchData<MasterySignalsSummary>(`/development/${studentId}/mastery-signals`)
      .catch(() => ({ totalSignals: 0, bySubject: [], averageOverall: 0 })),

  /**
   * Dashboard version — used by the home panel mastery widget.
   * Optionally filters bySubject client-side when subjectId is provided.
   */
  getStudentMasterySignalsSummary: (studentId: string, subjectId?: string): Promise<MasterySignalsSummary | null> =>
    fetchData<MasterySignalsSummary>(`/development/${studentId}/mastery-signals`)
      .then((res) => {
        if (!subjectId || !res?.bySubject) return res;
        return { ...res, bySubject: res.bySubject.filter((s) => s.subjectId === subjectId) };
      })
      .catch(() => null),

  // ── Streaks ──────────────────────────────────────────────────────────────────

  /**
   * Records that the student was active today and returns their updated streak.
   * Safe fallback to null when the backend route doesn't exist yet.
   */
  touchStudentStreak: (studentId: string): Promise<StudentStreakSummary | null> =>
    fetchData<StudentStreakSummary>(`/development/${studentId}/touch-streak`)
      .catch(() => null),

  /**
   * Reads the current streak without updating it.
   * Safe fallback to null when the backend route doesn't exist yet.
   */
  getStudentStreak: (studentId: string): Promise<StudentStreakSummary | null> =>
    fetchData<StudentStreakSummary>(`/development/${studentId}/streak`)
      .catch(() => null),

  // Legacy alias
  getStudentStreakSummary: (studentId: string) =>
    fetchData<StudentStreakSummary>(`/development/${studentId}/streak-summary`)
      .catch(() => ({ streakWeeks: 0, level: 1, progressToNextWeek: 0 })),
};