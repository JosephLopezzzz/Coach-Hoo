import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast, { ToastData } from '../components/Toast';

interface ToastContextType {
  showToast: (data: Omit<ToastData, 'id'>) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastData | null>(null);

  const showToast = useCallback((data: Omit<ToastData, 'id'>) => {
    setToast({
      ...data,
      id: Date.now().toString(),
    });
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <Toast toast={toast} onDismiss={hideToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}
