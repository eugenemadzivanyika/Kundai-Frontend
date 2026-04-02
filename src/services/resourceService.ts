import { fetchData } from './apiClient';

export const resourceService = {
  // List all resources with optional filters
  getAllResources: async (opts?: { search?: string; courseId?: string; tag?: string; type?: string; page?: number; limit?: number }) => {
    const params = new URLSearchParams();
    if (opts?.search) params.append('search', opts.search);
    if (opts?.courseId) params.append('courseId', opts.courseId);
    if (opts?.tag) params.append('tag', opts.tag);
    if (opts?.type) params.append('type', opts.type as string);
    if (opts?.page) params.append('page', String(opts.page));
    if (opts?.limit) params.append('limit', String(opts.limit));
    
    const q = params.toString();
    return fetchData<{ items: any[]; total: number; page: number; limit: number }>(`/resources${q ? `?${q}` : ''}`);
  },

  updateResource: async (id: string, updates: { name?: string; tags?: string[] | string; course?: string; type?: string }) => {
    return fetchData(`/resources/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  deleteResource: async (id: string) => {
    return fetchData(`/resources/${id}`, { method: 'DELETE' });
  },

  reorderResources: async (orderedIds: Array<{ id: string }>) => {
    return fetchData('/resources/order', {
      method: 'PUT',
      body: JSON.stringify({ resources: orderedIds }),
    });
  }
};
