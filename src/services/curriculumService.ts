import { fetchData } from './apiClient';

export interface CurriculumTopic {
  id: string;
  subjectId: string;
  code: string;
  name: string;
  description?: string;
  sequenceIndex?: number | null;
}

export const curriculumService = {
  listTopics: (subjectId: string): Promise<CurriculumTopic[]> =>
    fetchData(`/admin/subjects/${subjectId}/topics`),

  createTopic: (subjectId: string, data: {
    code: string;
    name: string;
    description?: string;
    sequenceIndex?: number;
  }): Promise<CurriculumTopic> =>
    fetchData(`/admin/subjects/${subjectId}/topics`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateTopic: (id: string, data: {
    code?: string;
    name?: string;
    description?: string;
    sequenceIndex?: number;
  }): Promise<CurriculumTopic> =>
    fetchData(`/admin/topics/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteTopic: (id: string): Promise<any> =>
    fetchData(`/admin/topics/${id}`, { method: 'DELETE' }),
};
