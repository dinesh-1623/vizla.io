import React, { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { setGlobalToast } from '@/lib/toast';

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();

  useEffect(() => {
    setGlobalToast(toast);
  }, [toast]);

  return <>{children}</>;
};
