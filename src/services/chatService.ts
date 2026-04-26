import { fetchData } from './apiClient';
import { ChatMessage, ChatConversation, UnreadChatCount } from '../types';

export const chatService = {
  getConversations: async (): Promise<ChatConversation[]> => {
    return fetchData<ChatConversation[]>('/chat/conversations');
  },

  getMessages: async (studentId: string): Promise<ChatMessage[]> => {
    return fetchData<ChatMessage[]>(`/chat/messages/${studentId}`);
  },

  sendMessage: async (studentId: string, content: string): Promise<ChatMessage> => {
    return fetchData<ChatMessage>(`/chat/messages/${studentId}`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  markAsRead: async (studentId: string): Promise<{ message: string }> => {
    return fetchData<{ message: string }>(`/chat/read/${studentId}`, {
      method: 'PUT',
    });
  },

  getUnreadCounts: async (): Promise<UnreadChatCount[]> => {
    return fetchData<UnreadChatCount[]>('/chat/unread');
  },

  getStudentThread: async (): Promise<{ messages: any[]; chatId: string; teacherId: string; teacherName: string; courseName: string; courseCode: string }> => {
    return fetchData('/chat/student/thread');
  },

  sendStudentMessage: async (content: string): Promise<any> => {
    return fetchData('/chat/student/thread', {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  getStudentConversations: async (): Promise<Array<{
    teacherId: string;
    teacherName: string;
    courses: Array<{ code: string; name: string }>;
    chatId: string;
    lastMessage: { content: string; timestamp: string; senderRole: string } | null;
    unreadCount: number;
  }>> => {
    return fetchData('/chat/student/conversations');
  },

  getStudentThreadByTeacher: async (teacherId: string): Promise<{ messages: any[]; chatId: string }> => {
    return fetchData(`/chat/student/thread/${teacherId}`);
  },

  sendStudentMessageToTeacher: async (teacherId: string, content: string): Promise<any> => {
    return fetchData(`/chat/student/thread/${teacherId}`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },
};
