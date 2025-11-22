/**
 * ProtectedApp - Wrapper for Protected Routes
 * 
 * Wraps the entire console application with RequireAuth guard
 */

import { RequireAuth } from '@/components/auth/RequireAuth';
import { Outlet } from 'react-router-dom';

export default function ProtectedApp() {
  return (
    <RequireAuth>
      <Outlet />
    </RequireAuth>
  );
}


