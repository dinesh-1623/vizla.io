/**
 * Authentication helpers for Supabase email/password auth
 */

import { supabase } from './supabase/browser';
import { Session, User, AuthError } from '@supabase/supabase-js';

export interface SignInResult {
  session: Session | null;
  user: User | null;
  error: AuthError | null;
}

export interface SignUpResult {
  user: User | null;
  session: Session | null;
  error: AuthError | null;
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string): Promise<SignInResult> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return {
    session: data.session,
    user: data.user,
    error: error as AuthError | null,
  };
}

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(email: string, password: string): Promise<SignUpResult> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/app/dashboard`,
    },
  });

  return {
    user: data.user,
    session: data.session,
    error: error as AuthError | null,
  };
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<{ error: AuthError | null }> {
  const { error } = await supabase.auth.signOut();
  return { error: error as AuthError | null };
}

/**
 * Get current session
 */
export async function getCurrentSession(): Promise<Session | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

/**
 * Get current user
 */
export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Subscribe to auth state changes
 * Returns a function to unsubscribe
 */
export function onAuthStateChange(
  callback: (event: 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED', session: Session | null) => void
) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event as 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED', session);
  });

  return () => subscription.unsubscribe();
}

/**
 * React hook for auth state
 */
import { useEffect, useState } from 'react';

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    getCurrentSession().then(setSession).finally(() => setLoading(false));

    // Subscribe to auth changes
    const unsubscribe = onAuthStateChange((event, newSession) => {
      setSession(newSession);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { session, loading, user: session?.user ?? null };
}


