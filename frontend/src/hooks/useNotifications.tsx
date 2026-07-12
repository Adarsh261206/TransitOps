import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import api from '@/services/api';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  module?: string;
  link?: string;
  read: boolean;
  createdAt: Date;
}

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (n: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextValue>({
  notifications: [], unreadCount: 0,
  addNotification: () => {}, markRead: () => {}, markAllRead: () => {}, clearAll: () => {},
});

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const [notifRes, countRes] = await Promise.all([
        api.get('/notifications'),
        api.get('/notifications/unread-count'),
      ]);
      const mapped = (notifRes.data || []).map((n: any) => ({
        ...n,
        type: n.type || 'info',
        createdAt: new Date(n.createdAt),
      }));
      setNotifications(mapped);
      setUnreadCount(countRes.data?.count || 0);
    } catch {}
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const addNotification = useCallback((n: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => {
    const notif: AppNotification = { ...n, id: crypto.randomUUID(), read: false, createdAt: new Date() };
    setNotifications(prev => [notif, ...prev].slice(0, 50));
    setUnreadCount(c => c + 1);
  }, []);

  const markRead = useCallback(async (id: string) => {
    try { await api.patch(`/notifications/${id}/read`); } catch {}
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(c => Math.max(0, c - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    try { await api.post('/notifications/mark-all-read'); } catch {}
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const clearAll = useCallback(() => setNotifications([]), []);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markRead, markAllRead, clearAll }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
