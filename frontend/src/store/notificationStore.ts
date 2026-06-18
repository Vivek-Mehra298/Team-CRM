import { create } from 'zustand';

export interface NotificationItem {
  _id: string;
  orgId: string;
  recipientId: string;
  type: 'customer_assigned' | 'task_assigned' | 'customer_updated' | 'deal_won' | 'new_message';
  title: string;
  message: string;
  isRead: boolean;
  referenceId?: string;
  createdAt: string;
}

interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  
  setNotifications: (notifs: NotificationItem[], unreadCount: number) => void;
  addNotification: (notif: NotificationItem) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,

  setNotifications: (notifications, unreadCount) => set({ notifications, unreadCount }),
  
  addNotification: (notif) => 
    set((state) => {
      // Prevent duplicates
      if (state.notifications.some((n) => n._id === notif._id)) return {};
      return {
        notifications: [notif, ...state.notifications],
        unreadCount: state.unreadCount + 1
      };
    }),
    
  markAsRead: (id) => 
    set((state) => ({
      notifications: state.notifications.map((n) => 
        n._id === id ? { ...n, isRead: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1)
    })),
    
  markAllAsRead: () => 
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0
    })),
}));
