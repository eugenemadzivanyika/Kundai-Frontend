import { fetchData } from './apiClient';

export interface AdminSummary {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalAdmins: number;
  totalSubjects: number;
  activeSubjects: number;
  totalClasses: number;
  totalSchools: number;
  totalClassSubjectLinks: number;
  recentUsers: Array<{
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    roles?: string[];
    active?: boolean;
    createdAt?: string;
  }>;
}

export const adminService = {
  // Dashboard
  getSummary: (): Promise<AdminSummary> => fetchData('/admin/summary'),

  // User Management
  getUsers: (): Promise<any[]> => fetchData('/admin/users'),
  createUser: (userData: any): Promise<any> =>
    fetchData('/admin/users', { method: 'POST', body: JSON.stringify(userData) }),
  deleteUser: (id: string): Promise<any> =>
    fetchData(`/admin/users/${id}`, { method: 'DELETE' }),

  // Student & Enrollment
  getStudent: (id: string): Promise<any> => fetchData(`/admin/students/${id}`),

  enrollStudent: (studentId: string, courseCode: string): Promise<any> =>
    fetchData(`/admin/students/${studentId}/enroll`, {
      method: 'POST',
      body: JSON.stringify({ courseCode }),
    }),

  unenrollStudent: (studentId: string, courseCode: string): Promise<any> =>
    fetchData(`/admin/students/${studentId}/enroll/${courseCode}`, { method: 'DELETE' }),

  // Results
  createResult: (studentId: string, payload: any): Promise<any> =>
    fetchData(`/admin/students/${studentId}/results`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
