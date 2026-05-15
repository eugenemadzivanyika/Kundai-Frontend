import { fetchData, API_URL } from './apiClient';

// --- Types ---

export interface ReportParam {
  id: string;
  label: string;
  kind: 'select' | 'multi-class' | 'class-picker' | 'multi-subject'
      | 'multi-form' | 'multi-teacher' | 'toggle' | 'multi-select';
  required?: boolean;
  options?: string[];
  default?: any;
}

export interface ReportType {
  id: string;
  name: string;
  tagline: string;
  icon: string;
  avgTime: string;
  pages: string;
  description: string;
  params: ReportParam[];
}

export interface ReportRecord {
  id: string;
  name: string;
  typeId: string;
  status: 'queued' | 'generating' | 'ready' | 'failed';
  format: 'pdf' | 'html';
  pages?: number;
  sizeBytes?: number;
  generatedBy: string;
  generatedAt: string;
  params: Record<string, any>;
  errorMessage?: string;
}

export interface ReportJob {
  jobId: string;
  reportId: string;
  status: 'queued' | 'generating' | 'ready' | 'failed';
  progress: number;
  currentStep?: string;
  errorMessage?: string;
}

export interface ReportSchedule {
  id: string;
  name: string;
  typeId: string;
  params: Record<string, any>;
  cadence: string;
  cronExpression: string;
  delivery: string;
  recipients: string[];
  enabled: boolean;
  nextRunAt: string;
  lastRunAt?: string;
  lastRunReportId?: string;
  createdBy: string;
}

export interface GenerateReportRequest {
  typeId: string;
  name?: string;
  params: Record<string, any>;
  schedule?: {
    cadence: string;
    cronExpression: string;
    delivery: string;
    recipients: string[];
  };
}

export interface GenerateReportResponse {
  jobId: string;
  reportId: string;
  status: 'queued';
  estimatedCompleteAt?: string;
}

export interface ClassOption { id: string; name: string; form: number; stream: string; students: number; }
export interface SubjectOption { id: string; name: string; code: string; }
export interface TeacherOption { id: string; name: string; department: string; }

// --- Service ---

export const reportAdminService = {
  getReportTypes: (): Promise<ReportType[]> =>
    fetchData('/admin/reports/types'),

  getOptions: (type: 'classes' | 'subjects' | 'teachers' | 'terms'): Promise<any[]> =>
    fetchData(`/admin/reports/options/${type}`),

  generate: (data: GenerateReportRequest): Promise<GenerateReportResponse> =>
    fetchData('/admin/reports/generate', { method: 'POST', body: JSON.stringify(data) }),

  pollJob: (jobId: string): Promise<ReportJob> =>
    fetchData(`/admin/reports/jobs/${jobId}`),

  listReports: (query?: { status?: string; type?: string; limit?: number }): Promise<ReportRecord[]> => {
    const params = query ? new URLSearchParams(query as any).toString() : '';
    return fetchData(`/admin/reports${params ? '?' + params : ''}`);
  },

  getDownloadUrl: (id: string): string =>
    `${API_URL}/admin/reports/${id}/download`,

  deleteReport: (id: string): Promise<void> =>
    fetchData(`/admin/reports/${id}`, { method: 'DELETE' }),

  listSchedules: (): Promise<ReportSchedule[]> =>
    fetchData('/admin/reports/schedules'),

  createSchedule: (data: Omit<ReportSchedule, 'id' | 'createdBy' | 'lastRunAt' | 'lastRunReportId'>): Promise<ReportSchedule> =>
    fetchData('/admin/reports/schedules', { method: 'POST', body: JSON.stringify(data) }),

  updateSchedule: (id: string, data: Partial<Pick<ReportSchedule, 'enabled' | 'name' | 'cadence' | 'cronExpression' | 'recipients' | 'delivery'>>): Promise<ReportSchedule> =>
    fetchData(`/admin/reports/schedules/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  runScheduleNow: (id: string): Promise<GenerateReportResponse> =>
    fetchData(`/admin/reports/schedules/${id}/run-now`, { method: 'POST' }),

  deleteSchedule: (id: string): Promise<void> =>
    fetchData(`/admin/reports/schedules/${id}`, { method: 'DELETE' }),
};
