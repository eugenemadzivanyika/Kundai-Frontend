import { fetchData } from './apiClient';

export type NotificationItem = {
  id: string;
  _id?: string;
  recipient: string;
  notifType?: string;
  type?: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read?: boolean;
  priority?: string;
  createdAt?: string;
  expiresAt?: string;
};

export const notificationService = {
  /**
   * Returns a flat array of notifications.
   * The backend wraps them in { notifications: [], pagination: {} } so we unwrap here.
   */
  getNotifications: async (
    page = 1,
    limit = 20,
    unreadOnly = false,
    recipientId?: string,
  ): Promise<NotificationItem[]> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      unreadOnly: unreadOnly.toString(),
    });
    if (recipientId) params.append('recipientId', recipientId);

    const res = await fetchData<any>(`/notifications?${params.toString()}`);
    // Handle both { notifications: [] } shape and plain array
    return Array.isArray(res) ? res : (res?.notifications ?? []);
  },

  /**
   * Returns the unread count as a plain number.
   * The backend returns { count: N } so we unwrap here.
   */
  getUnreadCount: async (recipientId?: string): Promise<number> => {
    const params = recipientId ? `?recipientId=${recipientId}` : '';
    const res = await fetchData<any>(`/notifications/unread-count${params}`);
    return typeof res === 'number' ? res : (res?.count ?? 0);
  },

  markAsRead: async (notificationId: string, _recipientId?: string): Promise<void> => {
    await fetchData(`/notifications/${notificationId}/read`, { method: 'PUT' });
  },

  markAllAsRead: async (_recipientId?: string): Promise<void> => {
    await fetchData('/notifications/read-all', { method: 'PUT' });
  },

  createNotification: async (notification: {
    recipient: string;
    title: string;
    message: string;
    notifType?: string;
    data?: Record<string, unknown>;
    priority?: string;
  }): Promise<NotificationItem> => {
    return fetchData<NotificationItem>('/notifications', {
      method: 'POST',
      body: JSON.stringify(notification),
    });
  },
};