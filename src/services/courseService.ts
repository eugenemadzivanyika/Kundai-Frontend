import { fetchData } from './apiClient';
import { Course, CourseAttribute, StudentAttribute, } from '../types';

export const courseService = {
  // Get all courses the user has access to
  getCourses: async (): Promise<Course[]> => {
    return fetchData<Course[]>('/courses');
  },

  // NEW: Specifically fetch by the ZIMSEC/Internal Code (e.g., MATH101)
  getCourseByCode: async (code: string): Promise<Course> => {
    return fetchData<Course>(`/courses/code/${code}`);
  },

  // Legacy/Fallback: Fetch by MongoDB _id if needed
  getCourseById: async (id: string): Promise<Course> => {
    return fetchData<Course>(`/courses/${id}`);
  },

  getTeachingCourses: async (): Promise<Course[]> => {
    return fetchData<Course[]>('/courses/teaching');
  },

  createCourse: async (courseData: { code: string; name: string; description: string }): Promise<Course> => {
    return fetchData<Course>('/courses', {
      method: 'POST',
      body: JSON.stringify(courseData),
    });
  },

  // Updated to use code as the identifier for updates
  updateCourse: async (code: string, courseData: Partial<Course>): Promise<Course> => {
    return fetchData<Course>(`/courses/code/${code}`, {
      method: 'PUT',
      body: JSON.stringify(courseData),
    });
  },

  // Updated to use code as the identifier for deletion
  deleteCourse: async (code: string): Promise<{ message: string }> => {
    return fetchData<{ message: string }>(`/courses/code/${code}`, {
      method: 'DELETE',
    });
  },
    // Syllabus Attributes
  getCourseAttributes: (courseId: string) => 
    fetchData<CourseAttribute[]>(`/courses/attributes/course/${courseId}`),

// src/services/api.ts (developmentService)
  getStudentAttributes: (studentId: string, courseId: string) => 
    fetchData<StudentAttribute[]>(`/courses/attributes/student/${studentId}/course/${courseId}`)
};

