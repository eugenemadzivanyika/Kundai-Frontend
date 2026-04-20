// src/services/curriculumService.ts
import { fetchData } from './api'; // Use your existing api.ts

export interface CurriculumTopic {
  id: string;
  subjectId: string;
  code: string;
  name: string;
  description?: string;
}

export const curriculumService = {
  // We map 'listTopics' to your existing 'CourseAttributes' logic
  listTopics: async (subjectId: string): Promise<CurriculumTopic[]> => {
    // This hits your current backend which stores syllabus items as attributes
    const attributes = await fetchData<any[]>(`/courses/${subjectId}/attributes`);
    
    // Transform your backend attributes into the 'Topic' format the UI expects
    return attributes.map(attr => ({
      id: attr._id,
      subjectId: attr.course,
      code: attr.level || 'TOPIC',
      name: attr.name,
      description: attr.description
    }));
  }
};
