import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
}

const AppShell: React.FC<AppShellProps> = ({ children, title }) => {
  const [isOpen, setIsOpen] = useState(false);

  const openSidebar = () => setIsOpen(true);
  const closeSidebar = () => setIsOpen(false);

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
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-neutral-200">
      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 bg-white/5 backdrop-blur-md ring-1 ring-white/10 px-6 py-4 lg:hidden">
        <div className="flex items-center gap-4">
          <button
            onClick={openSidebar}
            className="p-2 rounded-lg hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-emerald-400/60 transition-colors"
            aria-expanded={isOpen}
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          {title && (
            <h1 className="text-xl font-semibold text-neutral-100">{title}</h1>
          )}
        </div>
      </div>

      {/* Desktop header */}
      {title && (
        <div className="hidden lg:block sticky top-0 z-40 bg-white/5 backdrop-blur-md ring-1 ring-white/10 px-6 py-4">
          <h1 className="text-xl font-semibold text-neutral-100">{title}</h1>
        </div>
      )}

      {/* Scrim - only on mobile when open */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[50] bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:z-40">
        <Sidebar />
      </div>

      {/* Mobile sidebar */}
      <div className="lg:hidden">
        <Sidebar isOpen={isOpen} onClose={closeSidebar} />
      </div>

      {/* Content area */}
      <div className={`
        lg:pl-72 transition-all duration-300
        ${isOpen ? 'pointer-events-none blur-[1px] lg:pointer-events-auto lg:blur-0' : 'pointer-events-auto blur-0'}
      `}>
        <div className="mx-auto max-w-7xl px-6 py-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AppShell;
