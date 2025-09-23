import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
}

const AppShell: React.FC<AppShellProps> = ({ children, title }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const openSidebar = () => setIsOpen(true);
  const closeSidebar = () => setIsOpen(false);

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
          <div className="flex items-center gap-4">
            <button
              onClick={openSidebar}
              className="p-2 rounded-lg hover:bg-vizla-glassElev focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
              aria-expanded={isOpen}
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-semibold text-vizla-text-primary">{title}</h1>
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
    </div>
  );
};

export default AppShell;
