import { fetchData } from './apiClient';
import { Course, Student } from '../types';

export interface StudentDevelopmentResponse {
  student: Student;
  overallMastery: number;
  unitMasteries: {
    unit: string;
    mastery: number;
  }[];
  developmentPlans: any[]; // You can use DevelopmentPlan[] if typed
  studentAttributes: any[];
}

export type StudentTeacher = {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
  subject?: string;
};

export const studentService = {
  getStudents: async (filters?: { courseId?: string; classGroupId?: string; classGroupIds?: string[]; form?: number }): Promise<Student[]> => {
    const params = new URLSearchParams();
    if (filters?.courseId)     params.append('courseId',     filters.courseId);
    // classGroupIds (multi-select) takes precedence over single classGroupId
    if (filters?.classGroupIds?.length) {
      params.append('classGroupIds', filters.classGroupIds.join(','));
    } else if (filters?.classGroupId) {
      params.append('classGroupId', filters.classGroupId);
    }
    if (filters?.form != null) params.append('form',         String(filters.form));
    const qs = params.toString();
    return fetchData(qs ? `/students?${qs}` : '/students');
  },

  getStudent: async (id: string): Promise<Student> => {
    return fetchData<Student>(`/students/${id}`);
  },

  createStudent: async (studentData: Partial<Student>): Promise<Student> => {
    return fetchData<Student>('/students', {
      method: 'POST',
      body: JSON.stringify(studentData),
    });
  },

  updateStudent: async (id: string, studentData: Partial<Student>): Promise<Student> => {
    return fetchData<Student>(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(studentData),
    });
  },

  deleteStudent: (id: string): Promise<{ message: string }> => {
    return fetchData(`/students/${id}`, {
      method: 'DELETE',
    });
  }
  ,
  // Additional helper: get teachers associated with a student (may not exist on all backends)
  getTeachers: async (studentId: string): Promise<StudentTeacher[]> => {
    try {
      return await fetchData(`/students/${studentId}/teachers`);
    } catch {
      // If endpoint is missing, gracefully return an empty array
      return [];
    }
  },
  getStudentDevelopment: async (studentId: string, options?: { courseId?: string }): Promise<StudentDevelopmentResponse> => {
    const qs = options?.courseId ? `?courseId=${encodeURIComponent(options.courseId)}` : '';
    return fetchData<StudentDevelopmentResponse>(`/students/${studentId}/development${qs}`);
  },

  getMySubjects: (): Promise<Course[]> =>
    fetchData<Course[]>('/students/me/subjects'),
};