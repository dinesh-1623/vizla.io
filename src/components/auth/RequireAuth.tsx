/**
 * RequireAuth - Route Guard for Protected Routes
 * 
 * Redirects to /auth if user is not authenticated
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

interface RequireAuthProps {
  children: React.ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const { session, loading } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) {
      navigate('/auth', { replace: true });
    }
  }, [session, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-vizla-canvas">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-vizla-brand-primary" />
          <p className="text-sm text-vizla-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return <>{children}</>;
}


