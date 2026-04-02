import { fetchData } from './apiClient';
import { Student } from '../types';

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
};
