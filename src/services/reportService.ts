import { fetchData } from './apiClient';

export interface StudentReportCardSubjectRow {
  subjectId: string;
  subjectCode?: string;
  subjectName?: string;
  masteryPercent?: number;
  currentGrade?: string;
  predictedZimsecGrade?: string;
}

export interface StudentReportCardResponse {
  studentId: string;
  subjects: StudentReportCardSubjectRow[];
}

export interface TermForecastDetail {
  forecastId: string;
  term: string;
  academicYear: string;
  expectedTopicIds?: string[];
  expectedCoveragePercent?: number;
  topics: Array<{
    id: string;
    code: string;
    name: string;
    topic?: string;
    coveragePercent?: number;
    masteryPercent?: number;
    coveragePct?: number;
    masteryPct?: number;
  }>;
}

export const reportService = {
  getStudentReportCard: (studentId: string): Promise<StudentReportCardResponse> =>
    fetchData(`/students/${studentId}/report-card`),

  getTermForecast: (
    subjectId: string,
    term: string,
    academicYear: string,
    forecastId: string,
  ): Promise<TermForecastDetail> => {
    const params = new URLSearchParams({ subjectId, term, academicYear });
    return fetchData(`/admin/term-forecasts/${forecastId}/detail?${params.toString()}`);
  },
};

export default reportService;
