export interface NotificationLog {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  is_read: boolean;
  action_url?: string;
  category?: string;
  read_at?: string;
  channels_sent?: string[];
}

export const useNotificationService = () => {
  return {
    getNotificationPreferences: async () => ({
      in_app: true,
      email: true,
      sms: false,
    }),
    updateNotificationPreferences: async (prefs: any) => prefs,
    notificationLogs: [] as NotificationLog[],
    markAsRead: async (id: string) => {},
    stats: {
      total: 0,
      unread: 0,
      high_priority: 0,
      total_notifications: 0,
      by_category: {},
    },
    fetchNotificationLogs: async () => {},
    loading: false,
  };
};
