import { fetchData } from './apiClient';
import { Student } from '../types';

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
  getStudents: async (courseId?: string): Promise<Student[]> => {
    const endpoint = courseId ? `/students?courseId=${courseId}` : '/students';
    return fetchData(endpoint);
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
  getStudentDevelopment: async (studentId: string): Promise<StudentDevelopmentResponse> => {
    return fetchData<StudentDevelopmentResponse>(`/students/${studentId}/development`);
  },
};