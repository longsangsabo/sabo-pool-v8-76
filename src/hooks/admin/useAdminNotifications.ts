import { useState, useEffect, useCallback } from 'react';

export interface AdminNotification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  timestamp: Date;
  read: boolean;
}

export function useAdminNotifications() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);

  useEffect(() => {
    // TODO: Set up real-time notifications
    // Tạm thời tạo mock data
    setNotifications([
      {
        id: '1',
        type: 'info',
        message: 'Có 3 câu lạc bộ mới chờ duyệt',
        timestamp: new Date(),
        read: false
      },
      {
        id: '2',
        type: 'warning',
        message: 'Có 2 giao dịch cần xác nhận',
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        read: false
      }
    ]);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  }, []);

  return {
    notifications,
    unreadCount: notifications.filter(n => !n.read).length,
    markAsRead,
    markAllAsRead
  };
}
