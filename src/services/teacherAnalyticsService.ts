import { fetchData } from './apiClient';
import type {
  ClassOverview, StudentRosterItem, StudentMasteryDetail,
  HeatmapData, Misconception, StudentSubmission,
} from '../types/teacherAnalytics';

export const getClassOverview = (classId: string, termId?: string): Promise<ClassOverview> =>
  fetchData<ClassOverview>(`/teacher/classes/${classId}/overview${termId ? `?termId=${termId}` : ''}`);

export const getClassStudents = (classId: string): Promise<StudentRosterItem[]> =>
  fetchData<StudentRosterItem[]>(`/teacher/classes/${classId}/students`);

export const getStudentMasteryDetail = (classId: string, studentId: string): Promise<StudentMasteryDetail> =>
  fetchData<StudentMasteryDetail>(`/teacher/classes/${classId}/students/${studentId}/mastery`);

export const getStudentSubmissions = (classId: string, studentId: string): Promise<StudentSubmission[]> =>
  fetchData<StudentSubmission[]>(`/teacher/classes/${classId}/students/${studentId}/submissions`);

export const getClassHeatmap = (classId: string): Promise<HeatmapData> =>
  fetchData<HeatmapData>(`/teacher/classes/${classId}/heatmap`);

export const getClassMisconceptions = (classId: string): Promise<Misconception[]> =>
  fetchData<Misconception[]>(`/teacher/classes/${classId}/misconceptions`);
