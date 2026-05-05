import { fetchData } from './apiClient';

export const subjectService = {
  getSubjects: (): Promise<any[]> => fetchData('/admin/subjects'),

  createSubject: (data: {
    code: string;
    name: string;
    examBoardCode?: string;
    description?: string;
    grades?: string[];
    active?: boolean;
  }): Promise<any> => fetchData('/admin/subjects', { method: 'POST', body: JSON.stringify(data) }),

  updateSubject: (id: string, data: {
    code?: string;
    name?: string;
    examBoardCode?: string;
    description?: string;
    grades?: string[];
    active?: boolean;
  }): Promise<any> => fetchData(`/admin/subjects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteSubject: (id: string): Promise<any> =>
    fetchData(`/admin/subjects/${id}`, { method: 'DELETE' }),
};
