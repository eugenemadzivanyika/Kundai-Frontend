import { fetchData } from './apiClient';

export interface SchoolItem {
  id: string;
  name?: string;
  code?: string;
}

export const schoolService = {
  getSchools: (): Promise<SchoolItem[]> => fetchData('/admin/schools'),
};
