import { fetchData } from './apiClient';

export const adminService = {
  // User Management
  getUsers: () => fetchData('/admin/users'),
  createUser: (userData: any) => fetchData('/admin/users', { method: 'POST', body: JSON.stringify(userData) }),
  deleteUser: (id: string) => fetchData(`/admin/users/${id}`, { method: 'DELETE' }),

  // Student & Enrollment (Updated for Course Code logic)
  getStudent: (id: string) => fetchData(`/admin/students/${id}`),
  
  enrollStudent: (studentId: string, courseCode: string) => 
    fetchData(`/admin/students/${studentId}/enroll`, {
      method: 'POST',
      body: JSON.stringify({ courseCode }), // Using courseCode as requested
    }),

  unenrollStudent: (studentId: string, courseCode: string) => 
    fetchData(`/admin/students/${studentId}/enroll/${courseCode}`, {
      method: 'DELETE',
    }),

  // Results
  createResult: (studentId: string, payload: any) => 
    fetchData(`/admin/students/${studentId}/results`, { method: 'POST', body: JSON.stringify(payload) }),
};
