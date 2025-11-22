/**
 * AuthGate - Redirect Authenticated Users
 * 
 * Used on public pages (/ and /auth) to redirect authenticated users
 * to the protected app area
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/lib/auth';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { session } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (session) {
      navigate('/app/dashboard', { replace: true });
    }
  }, [session, navigate]);

  return <>{children}</>;
}


