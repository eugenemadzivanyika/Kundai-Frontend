import { fetchData } from './apiClient';
import { StaffMessage } from '../types';

export const staffMessageService = {
  getStaff: async (): Promise<Array<{ _id: string; firstName: string; lastName: string; role: string }>> => {
    return fetchData('/staff');
  },

  getInbox: async (): Promise<StaffMessage[]> => {
    return fetchData<StaffMessage[]>('/staff-messages');
  },

  getSent: async (): Promise<StaffMessage[]> => {
    return fetchData<StaffMessage[]>('/staff-messages/sent');
  },

  getUnreadCount: async (): Promise<{ count: number }> => {
    return fetchData<{ count: number }>('/staff-messages/unread-count');
  },

  send: async (recipientId: string, subject: string, body: string): Promise<StaffMessage> => {
    return fetchData<StaffMessage>('/staff-messages', {
      method: 'POST',
      body: JSON.stringify({ recipientId, subject, body }),
    });
  },

  markAsRead: async (messageId: string): Promise<void> => {
    return fetchData(`/staff-messages/${messageId}/read`, { method: 'PUT' });
  },

  delete: async (messageId: string): Promise<void> => {
    return fetchData(`/staff-messages/${messageId}`, { method: 'DELETE' });
  },
};
