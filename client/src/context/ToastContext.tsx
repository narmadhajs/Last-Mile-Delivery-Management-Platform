import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { notificationApi } from '../services/api';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
}

export interface NotificationItem {
  id: string;
  channel: 'EMAIL' | 'SMS' | 'IN_APP';
  title: string;
  message: string;
  status: string;
  createdAt: string;
  recipientEmail: string;
  recipientPhone?: string;
  orderId?: string;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  notifications: NotificationItem[];
  unreadCount: number;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  markAllRead: () => void;
  refreshNotifications: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  const showToast = ({ type, title, message, duration = 4000 }: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message, duration }]);

    setTimeout(() => {
      removeToast(id);
    }, duration);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const refreshNotifications = async () => {
    try {
      const res: any = await notificationApi.getAllNotifications();
      if (res.success && res.data) {
        setNotifications(res.data);
      }
    } catch (e) {
      // Background fetch silent fallback
    }
  };

  const markAllRead = () => {
    setUnreadCount(0);
  };

  useEffect(() => {
    refreshNotifications();
    const interval = setInterval(refreshNotifications, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        removeToast,
        notifications,
        unreadCount,
        isDrawerOpen,
        setIsDrawerOpen,
        markAllRead,
        refreshNotifications,
      }}
    >
      {children}

      {/* Floating Toast Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-xl shadow-2xl border backdrop-blur-md transition-all transform animate-float flex items-start gap-3 ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-100'
                : toast.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/40 text-rose-100'
                : toast.type === 'warning'
                ? 'bg-amber-950/90 border-amber-500/40 text-amber-100'
                : 'bg-slate-900/90 border-brand-500/40 text-slate-100'
            }`}
          >
            <div className="flex-1">
              <h4 className="font-semibold text-sm">{toast.title}</h4>
              {toast.message && <p className="text-xs mt-1 opacity-90">{toast.message}</p>}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-xs opacity-60 hover:opacity-100 font-bold p-1"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
