import { fetchData } from './apiClient';

export interface ClassItem {
  id: string;
  code: string;
  name: string;
  gradeLevel?: string;
  academicYear?: string;
  studentCount?: number;
  courses?: string[];
  homeroomTeacher?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  } | null;
  school?: {
    id: string;
    name?: string;
    code?: string;
  } | null;
}

export interface ClassSubject {
  _id: string;
  code: string;
  name: string;
}

export const classService = {
  getClasses: (): Promise<ClassItem[]> => fetchData('/admin/classes'),

  createClass: (data: {
    schoolId: string;
    code: string;
    name: string;
    gradeLevel?: string;
    academicYear?: string;
    homeroomTeacherId?: string;
  }): Promise<ClassItem> => fetchData('/admin/classes', { method: 'POST', body: JSON.stringify(data) }),

  updateClass: (id: string, data: {
    schoolId?: string;
    code?: string;
    name?: string;
    gradeLevel?: string;
    academicYear?: string;
    homeroomTeacherId?: string;
    clearHomeroomTeacher?: boolean;
  }): Promise<ClassItem> => fetchData(`/admin/classes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteClass: (id: string): Promise<any> =>
    fetchData(`/admin/classes/${id}`, { method: 'DELETE' }),

  getClassSubjects: (classId: string): Promise<ClassSubject[]> =>
    fetchData(`/admin/classes/${classId}/subjects`),

  addSubjectToClass: (classId: string, courseId: string): Promise<{ message: string; studentsEnrolled: number; attributesCreated: number }> =>
    fetchData(`/admin/classes/${classId}/subjects`, { method: 'POST', body: JSON.stringify({ courseId }) }),

  removeSubjectFromClass: (classId: string, courseId: string): Promise<{ message: string; studentsUnenrolled: number }> =>
    fetchData(`/admin/classes/${classId}/subjects/${courseId}`, { method: 'DELETE' }),

  getClassStudentSubjectStatus: (classId: string): Promise<any> =>
    fetchData(`/admin/classes/${classId}/students/subject-status`),

  enrollStudentInSubject: (classId: string, studentId: string, courseId: string): Promise<{ message: string; attributesCreated: number }> =>
    fetchData(`/admin/classes/${classId}/students/${studentId}/subjects/${courseId}`, { method: 'POST' }),

  unenrollStudentFromSubject: (classId: string, studentId: string, courseId: string): Promise<{ message: string }> =>
    fetchData(`/admin/classes/${classId}/students/${studentId}/subjects/${courseId}`, { method: 'DELETE' }),
};
