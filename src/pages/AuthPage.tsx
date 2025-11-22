/**
 * Auth Page - Login and Sign Up
 * 
 * Tabbed interface for authentication with Supabase email/password
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSession, signInWithEmail, signUpWithEmail } from '@/lib/auth';
import { AuthGate } from '@/components/auth/AuthGate';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AuthPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>(
    (searchParams.get('tab') as 'login' | 'signup') || 'login'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { session } = useSession();

  useEffect(() => {
    const tab = searchParams.get('tab') as 'login' | 'signup' | null;
    if (tab === 'login' || tab === 'signup') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (tab: 'login' | 'signup') => {
    setActiveTab(tab);
    setSearchParams({ tab });
    setError(null);
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const result = await signInWithEmail(email, password);
      
      if (result.error) {
        setError(result.error.message);
        return;
      }

      if (result.session) {
        toast.success('Welcome back!', {
          description: 'You have been successfully logged in.',
        });
        navigate('/app/dashboard', { replace: true });
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password length
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    try {
      const result = await signUpWithEmail(email, password);
      
      if (result.error) {
        setError(result.error.message);
        return;
      }

      if (result.session) {
        // Auto-login successful
        toast.success('Account created!', {
          description: 'Welcome to Vizla Console.',
        });
        navigate('/app/dashboard', { replace: true });
      } else if (result.user && !result.session) {
        // Email confirmation required
        toast.info('Check your email', {
          description: 'Please verify your email address to complete sign up.',
        });
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGate>
      <div className="min-h-screen flex items-center justify-center bg-vizla-canvas p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Logo size="lg" linkToHome={true} showText={true} />
          </div>

          {/* Auth Card */}
          <div className="bg-vizla-glassElev border border-vizla-glassBorder rounded-2xl p-6 shadow-xl">
            {/* Tabs */}
            <div className="flex border-b border-vizla-glassBorder mb-6">
              <button
                type="button"
                onClick={() => handleTabChange('login')}
                className={`flex-1 py-3 text-center font-medium transition-colors ${
                  activeTab === 'login'
                    ? 'text-vizla-brand-primary border-b-2 border-vizla-brand-primary'
                    : 'text-vizla-text-secondary hover:text-vizla-text-primary'
                }`}
              >
                Log in
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('signup')}
                className={`flex-1 py-3 text-center font-medium transition-colors ${
                  activeTab === 'signup'
                    ? 'text-vizla-brand-primary border-b-2 border-vizla-brand-primary'
                    : 'text-vizla-text-secondary hover:text-vizla-text-primary'
                }`}
              >
                Sign up
              </button>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Login Form */}
            {activeTab === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    name="email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    className="rounded-xl"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password">Password</Label>
                    <button
                      type="button"
                      className="text-sm text-vizla-brand-primary hover:underline"
                      onClick={() => toast.info('Password reset coming soon')}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <Input
                    id="login-password"
                    name="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    className="rounded-xl"
                    disabled={loading}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-vizla-brand-primary hover:bg-vizla-brand-primary/90"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    'Log in'
                  )}
                </Button>
              </form>
            )}

            {/* Sign Up Form */}
            {activeTab === 'signup' && (
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    className="rounded-xl"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    required
                    minLength={8}
                    placeholder="••••••••"
                    className="rounded-xl"
                    disabled={loading}
                  />
                  <p className="text-xs text-vizla-text-muted">
                    Must be at least 8 characters long
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm">Confirm Password</Label>
                  <Input
                    id="signup-confirm"
                    name="confirmPassword"
                    type="password"
                    required
                    minLength={8}
                    placeholder="••••••••"
                    className="rounded-xl"
                    disabled={loading}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-vizla-brand-primary hover:bg-vizla-brand-primary/90"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    'Sign up'
                  )}
                </Button>
              </form>
            )}
          </div>

          {/* Footer */}
          <p className="text-center text-sm text-vizla-text-secondary mt-6">
            By continuing, you agree to Vizla's Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </AuthGate>
  );
}

