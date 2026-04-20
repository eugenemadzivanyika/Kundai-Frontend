import { fetchData } from './apiClient';

export const notificationService = {
  getNotifications: async (page = 1, limit = 20, unreadOnly = false, recipientId?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      unreadOnly: unreadOnly.toString()
    });
    if (recipientId) params.append('recipientId', recipientId);
    
    return fetchData(`/notifications?${params.toString()}`);
  },

  markAsRead: async (notificationId: string) => {
    return fetchData(`/notifications/${notificationId}/read`, {
      method: 'PUT'
    });
  },

  markAllAsRead: async () => {
    return fetchData('/notifications/read-all', {
      method: 'PUT'
    });
  },

  getUnreadCount: async () => {
    return fetchData('/notifications/unread-count');
  }
};

// Export a simple NotificationItem type for compatibility with older code
export type NotificationItem = {
  _id: string;
  recipient: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read?: boolean;
  priority?: string;
  expiresAt?: string;
};
