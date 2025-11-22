import React, { useState, useEffect } from 'react';
import { Menu, User, LogOut, Settings } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { DataSourceToggle } from '@/components/DataSourceToggle';
import { Logo } from '@/components/ui/Logo';
import { useSession, signOut } from '@/lib/auth';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AIAssistant } from '@/components/ai-chat/AIAssistant';

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
}

const AppShell: React.FC<AppShellProps> = ({ children, title }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useSession();

  const openSidebar = () => setIsOpen(true);
  const closeSidebar = () => setIsOpen(false);

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Logged out successfully');
      navigate('/', { replace: true });
    } catch (error) {
      toast.error('Failed to log out');
    }
  };

  const getUserInitials = () => {
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  // Hide sidebar on specific pages (Owner View and Tow Driver View)
  const shouldHideSidebar = location.pathname === '/owner' || location.pathname === '/tow-driver';

  // Lock body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle escape key to close sidebar
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeSidebar();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  return (
    <div className="min-h-screen text-vizla-text-secondary">
              {/* Mobile top bar removed since sidebar is removed */}

      {/* Desktop header */}
      {title && (
        <div className="sticky top-0 z-40 bg-vizla-glass backdrop-blur-md ring-1 ring-vizla-glassBorder px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={openSidebar}
                className="p-2 rounded-lg hover:bg-vizla-glassElev focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
                aria-expanded={isOpen}
                aria-label="Open navigation menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <Logo size="sm" linkToHome={true} showText={false} />
              <h1 className="text-xl font-semibold text-vizla-text-primary">{title}</h1>
            </div>
            <div className="flex items-center gap-2">
              <DataSourceToggle />
              <ThemeToggle />
              
              {/* User Menu */}
              <DropdownMenu open={userMenuOpen} onOpenChange={setUserMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <button
                    className="p-2 rounded-lg hover:bg-vizla-glassElev focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
                    aria-label="User menu"
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-vizla-brand-primary text-white">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium text-vizla-text-primary">
                        {user?.email || 'User'}
                      </p>
                      <p className="text-xs text-vizla-text-secondary">
                        {user?.id ? `ID: ${user.id.slice(0, 8)}...` : 'Not signed in'}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => {
                      setUserMenuOpen(false);
                      // Navigate to settings page (create if doesn't exist)
                      toast.info('Settings page coming soon');
                    }}
                    className="cursor-pointer"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="cursor-pointer text-red-500 focus:text-red-500"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      )}

              {/* Scrim - shows when dropdown is open */}
              {isOpen && (
                <div 
                  className="fixed inset-0 z-[50] bg-black/50 backdrop-blur-sm"
                  onClick={closeSidebar}
                  aria-hidden="true"
                />
              )}

              {/* Dropdown sidebar - shows when hamburger is clicked */}
              {isOpen && (
                <div className="fixed top-0 left-0 z-[60] w-72 h-screen bg-vizla-elev1/95 backdrop-blur-md ring-1 ring-vizla-glassBorder text-vizla-text-secondary">
                  <Sidebar isOpen={isOpen} onClose={closeSidebar} />
                </div>
              )}

      {/* Content area */}
      <div className="transition-all duration-300">
        <div className="mx-auto max-w-7xl px-6 py-6">
          {children}
        </div>
      </div>

      {/* AI Assistant - Global Access */}
      <AIAssistant />
    </div>
  );
};

export default AppShell;
