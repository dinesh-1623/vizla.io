/**
 * Simple toast notification system
 */

import { toast, type ToastMessage } from '@/types/dashboard';

let toastId = 0;

export function showToast(message: string, type: ToastMessage['type'] = 'info', duration = 3000) {
  const id = `toast-${++toastId}`;
  const toastData: ToastMessage = {
    id,
    message,
    type,
    duration,
  };
  
  // Dispatch custom event for toast system
  window.dispatchEvent(new CustomEvent('toast', { detail: toastData }));
}

export function showSuccess(message: string) {
  showToast(message, 'success');
}

export function showError(message: string) {
  showToast(message, 'error');
}

export function showWarning(message: string) {
  showToast(message, 'warning');
}

export function showInfo(message: string) {
  showToast(message, 'info');
}
