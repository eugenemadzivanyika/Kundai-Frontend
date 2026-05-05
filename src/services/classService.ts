import { fetchData } from './apiClient';

export interface ClassItem {
  id: string;
  code: string;
  name: string;
  gradeLevel?: string;
  academicYear?: string;
  studentCount?: number;
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
};
