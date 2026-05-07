import { fetchData, API_URL, parseErrorMessage } from './apiClient';

export interface SyllabusFile {
  name: string;
  url: string;
  size: number;
  uploadedAt: string | Date;
}

export interface SubjectResource {
  _id: string;
  name: string;
  url: string;
  size: number;
  mimeType: string;
  uploadedAt: string | Date;
}

async function uploadFile(endpoint: string, file: File): Promise<any> {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw { response: { data: body }, message: `HTTP ${response.status}` };
    }
    return response.json();
  } catch (err) {
    throw new Error(parseErrorMessage(err));
  }
}

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

  uploadSyllabus: (subjectId: string, file: File): Promise<{ syllabusFile: SyllabusFile }> =>
    uploadFile(`/admin/subjects/${subjectId}/syllabus`, file),

  deleteSyllabus: (subjectId: string): Promise<any> =>
    fetchData(`/admin/subjects/${subjectId}/syllabus`, { method: 'DELETE' }),

  uploadResource: (subjectId: string, file: File): Promise<SubjectResource> =>
    uploadFile(`/admin/subjects/${subjectId}/resources`, file),

  deleteResource: (subjectId: string, resourceId: string): Promise<any> =>
    fetchData(`/admin/subjects/${subjectId}/resources/${resourceId}`, { method: 'DELETE' }),

  extractAttributes: (subjectId: string, replaceExisting = true): Promise<{ message: string }> =>
    fetchData(`/admin/subjects/${subjectId}/extract-attributes`, {
      method: 'POST',
      body: JSON.stringify({ replaceExisting }),
    }),
};
