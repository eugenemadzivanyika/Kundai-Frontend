// src/services/api/resourceService.ts
import { fetchData } from './apiClient';

export interface ResourceCounts {
  [courseId: string]: {
    count: number;
    documents: number;
    images: number;
    videos: number;
    others: number;
    lastUpdated: string;
  };
}

export const resourceService = {
  // 1. Get counts for the Dashboard cards
  getResourceCounts: async (): Promise<ResourceCounts> => {
    return fetchData<ResourceCounts>('/resources/counts');
  },
  // 2. Get resources for a specific course (ResourcesView)
  getCourseResources: async (courseId: string, params?: { search?: string; type?: string; sort?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.type) query.append('type', params.type);
    if (params?.sort) query.append('sort', params.sort);
    
    const qString = query.toString();
    return fetchData<any[]>(`/resources/course/${courseId}${qString ? `?${qString}` : ''}`);
  },

  // 3. Get latest activity for Sidebar
  getRecentUploads: async (limit: number = 5) => {
    return fetchData<any[]>(`/resources/recent?limit=${limit}`);
  },

  // 4. Get the final URL for previewing/downloading (FilePreviewModal)
  getDownloadUrl: async (id: string) => {
    return fetchData<{ url: string; name: string; mimeType: string }>(`/resources/download/${id}`);
  },

  // 5. Admin: List all resources with filters
  getAllResources: async (opts?: { search?: string; courseId?: string; tag?: string; type?: string; page?: number; limit?: number }) => {
    const params = new URLSearchParams();
    if (opts?.search) params.append('search', opts.search);
    if (opts?.courseId) params.append('courseId', opts.courseId);
    if (opts?.tag) params.append('tag', opts.tag);
    if (opts?.type) params.append('type', opts.type);
    if (opts?.page) params.append('page', String(opts.page));
    if (opts?.limit) params.append('limit', String(opts.limit));
    
    const q = params.toString();
    return fetchData<{ items: any[]; total: number; page: number; limit: number }>(`/resources${q ? `?${q}` : ''}`);
  },

  // 6. Update resource metadata
  updateResource: async (id: string, updates: { name?: string; tags?: string[] | string; course?: string; type?: string }) => {
    return fetchData(`/resources/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // 7. Delete resource and local file
  deleteResource: async (id: string) => {
    return fetchData(`/resources/${id}`, { method: 'DELETE' });
  },

  // 8. Reorder within a course
  reorderResources: async (orderedIds: Array<{ id: string }>) => {
    return fetchData('/resources/order', {
      method: 'PUT',
      body: JSON.stringify({ resources: orderedIds }),
    });
  }
};

