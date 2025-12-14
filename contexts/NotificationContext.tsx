
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type NotificationType = 'success' | 'error' | 'info' | 'loading';

interface Notification {
  id: string;
  message: string;
  type: NotificationType;
}

interface NotificationContextType {
  notify: (message: string, type?: NotificationType, duration?: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const notify = useCallback((message: string, type: NotificationType = 'info', duration = 3000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications((prev) => [...prev, { id, message, type }]);

    // Auto-dismiss all notifications after duration
    setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, duration);
  }, []);

  const removeNotification = (id: string) => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none no-print">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`pointer-events-auto min-w-[300px] max-w-sm p-4 rounded-xl shadow-2xl border-l-4 transform transition-all duration-500 animate-fade-in flex items-center gap-3 bg-white relative overflow-hidden ${
              n.type === 'success' ? 'border-green-500' :
              n.type === 'error' ? 'border-red-500' :
              n.type === 'loading' ? 'border-blue-500' : 'border-gray-500'
            }`}
          >
            {/* Icon */}
            <div className="flex-shrink-0">
                {n.type === 'loading' && (
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                )}
                {n.type === 'success' && <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold">✓</div>}
                {n.type === 'error' && <div className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center font-bold">✕</div>}
                {n.type === 'info' && <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">i</div>}
            </div>
            
            {/* Content */}
            <p className="text-sm font-medium text-gray-800 pr-6">{n.message}</p>
            
            {/* Close Button */}
            <button onClick={() => removeNotification(n.id)} className="absolute top-2 right-2 text-gray-300 hover:text-gray-500 transition">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
