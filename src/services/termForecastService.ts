import { fetchData } from './apiClient';

export interface TermForecastRecord {
  id: string;
  term: string;
  academicYear: string;
  expectedCoveragePct?: number;
  expectedTopicIds?: string[];
  classSubject?: {
    id: string;
    className?: string;
    subjectName?: string;
    subject?: {
      id: string;
      name?: string;
    } | null;
  } | null;
}

export const termForecastService = {
  list: (subjectId: string, term?: string): Promise<TermForecastRecord[]> => {
    const params = new URLSearchParams({ subjectId });
    if (term && term !== 'All terms') params.set('term', term);
    return fetchData(`/admin/term-forecasts?${params.toString()}`);
  },

  delete: (id: string): Promise<any> =>
    fetchData(`/admin/term-forecasts/${id}`, { method: 'DELETE' }),
};
