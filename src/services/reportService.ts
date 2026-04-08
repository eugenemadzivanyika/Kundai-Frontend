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

export const reportService = {
  getStudentReportCard: async (studentId: string): Promise<StudentReportCardResponse> => {
    // Try a commonly used endpoint; if it doesn't exist the component will handle nulls.
    return fetchData<StudentReportCardResponse>(`/students/${studentId}/report-card`);
  },
};

export default reportService;
