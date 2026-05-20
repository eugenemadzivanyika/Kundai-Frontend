import { fetchData, fetchAiData } from './apiClient';
import { tokenStore } from './tokenStore';
import type { SubjectNotesDoc } from '../types/subjectNotes';

export async function getSubjectNotes(subjectId: string): Promise<SubjectNotesDoc | null> {
  try {
    return await fetchData<SubjectNotesDoc>(`/subject-notes/${subjectId}`);
  } catch {
    return null;
  }
}

export async function generateAndPersistSubtopicNotes(
  subjectId: string,
  topicName: string,
  subtopicName: string,
  level: string,
): Promise<{ content: string; sources: Record<string, unknown>[]; grounded_by_rag: boolean }> {
  const token = tokenStore.get();
  const result = await fetchAiData<{
    content: string;
    persisted: boolean;
    sources: Record<string, unknown>[];
    grounded_by_rag: boolean;
  }>('/persisted-notes/generate', {
    method: 'POST',
    body: JSON.stringify({
      subject_id: subjectId,
      topic_name: topicName,
      subtopic_name: subtopicName,
      level,
      auth_token: token,
    }),
  });
  return { content: result.content, sources: result.sources, grounded_by_rag: result.grounded_by_rag };
}

export async function refreshSubtopicNotes(
  subjectId: string,
  topicName: string,
  subtopicName: string,
): Promise<void> {
  await fetchData(
    `/subject-notes/${subjectId}/topics/${encodeURIComponent(topicName)}/subtopics/${encodeURIComponent(subtopicName)}`,
    { method: 'DELETE' },
  );
}
