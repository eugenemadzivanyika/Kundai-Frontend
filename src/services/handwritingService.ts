import { fetchData } from './apiClient';
import type { OcrAnswerEntry } from '../components/ocr/ocr.types';

export const submitHandwrittenAnswers = (
  assessmentId: string,
  studentId: string,
  answers: OcrAnswerEntry[],
): Promise<{ submissionId: string }> =>
  fetchData<{ submissionId: string }>(
    `/handwriting/${assessmentId}/mark`,
    {
      method: 'POST',
      body: JSON.stringify({ studentId, answers }),
    },
  );
