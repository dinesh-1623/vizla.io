/**
 * Toast notification system using shadcn/ui
 */

import { useToast } from '@/hooks/use-toast';

// Global toast functions for use outside React components
let globalToast: ReturnType<typeof useToast>['toast'] | null = null;

export function setGlobalToast(toastFn: ReturnType<typeof useToast>['toast']) {
  globalToast = toastFn;
}

export function showToast(message: string, type: 'default' | 'destructive' = 'default') {
  if (globalToast) {
    globalToast({
      description: message,
      variant: type,
    });
  } else {
    console.warn('Toast system not initialized. Call setGlobalToast() first.');
  }
}

export function showSuccess(message: string) {
  showToast(message, 'default');
}

export function showError(message: string) {
  showToast(message, 'destructive');
}

export function showWarning(message: string) {
  showToast(message, 'default');
}

export function showInfo(message: string) {
  showToast(message, 'default');
}
