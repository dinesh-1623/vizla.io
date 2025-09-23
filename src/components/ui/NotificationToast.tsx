import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { ToastMessage } from '@/types/dashboard';

interface ToastProps {
  toast: ToastMessage;
  onRemove: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Auto remove after duration
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onRemove(toast.id), 300); // Wait for animation
    }, toast.duration || 3000);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  const getTypeStyles = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-vizla-success text-white';
      case 'error':
        return 'bg-vizla-danger text-white';
      case 'warning':
        return 'bg-vizla-warning text-white';
      default:
        return 'bg-vizla-info text-white';
    }
  };

  return (
    <div
      className={`
        fixed bottom-4 right-4 z-50 max-w-sm w-full mx-auto
        transform transition-all duration-300 ease-in-out
        ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}
      `}
      role="alert"
      aria-live="polite"
    >
      <div className={`
        ${getTypeStyles()}
        rounded-lg shadow-lg p-4 flex items-start gap-3
      `}>
        <div className="flex-1 text-sm font-medium">
          {toast.message}
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(() => onRemove(toast.id), 300);
          }}
          className="flex-shrink-0 p-1 rounded-full hover:bg-black/20 focus:outline-none focus:ring-2 focus:ring-white/50"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleToast = (event: CustomEvent<ToastMessage>) => {
      setToasts(prev => [...prev, event.detail]);
    };

    window.addEventListener('toast', handleToast as EventListener);
    return () => window.removeEventListener('toast', handleToast as EventListener);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <>
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </>
  );
};