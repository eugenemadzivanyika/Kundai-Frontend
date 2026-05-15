import { useState, useEffect, useCallback } from 'react';
import { notificationService } from '../services/api';
import type { NotificationItem } from '../services/notificationService';

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = useCallback(async () => {
    try {
      const [items, count] = await Promise.all([
        notificationService.getNotifications(1, 20),
        notificationService.getUnreadCount(),
      ]);
      setNotifications(items);
      setUnreadCount(count);
    } catch {
      // silently fail — notifications are non-critical
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const markRead = useCallback(async (id: string) => {
    await notificationService.markAsRead(id);
    setNotifications(prev =>
      prev.map(n => (n._id === id || n.id === id) ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    await notificationService.markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  return { notifications, unreadCount, markRead, markAllRead, reload: load };
}
