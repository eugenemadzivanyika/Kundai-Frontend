import { fetchData, API_URL } from './apiClient';

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

export interface BulkUploadRowResult {
  row: number;
  status: 'success' | 'failed' | 'skipped';
  studentId: string;
  name: string;
  error?: string;
  temporaryPassword?: string;
}

export interface BulkUploadResult {
  summary: {
    total: number;
    succeeded: number;
    failed: number;
    skipped: number;
  };
  results: BulkUploadRowResult[];
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

  // Bulk student upload
  downloadBulkTemplate: async (): Promise<void> => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/admin/students/bulk-template`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.message || `HTTP ${response.status}`);
    }
    const blob = await response.blob();
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href     = url;
    link.download = 'kundai_student_upload_template.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  // School billing
  getSchoolBilling: (): Promise<any> => fetchData('/admin/billing'),
  requestBillingContact: (message: string): Promise<any> =>
    fetchData('/admin/billing/contact', { method: 'POST', body: JSON.stringify({ message }) }),

  // School settings
  getSchoolSettings: (): Promise<any> => fetchData('/admin/settings'),
  updateSchoolSettings: (payload: Record<string, unknown>): Promise<any> =>
    fetchData('/admin/settings', { method: 'PUT', body: JSON.stringify(payload) }),

  bulkCreateStudents: async (file: File): Promise<BulkUploadResult> => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);
    // Do NOT set Content-Type — browser sets it with the multipart boundary
    const response = await fetch(`${API_URL}/admin/students/bulk`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || `HTTP ${response.status}`);
    return data as BulkUploadResult;
  },
};
