/**
 * Premium Top Navigation Bar
 * 
 * Enterprise-grade top bar with:
 * - Clean typography hierarchy
 * - Premium spacing
 * - Responsive design
 * - Theme-aware styling
 */

import React from 'react';
import { Settings, Bell, Search } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { DataSourceToggle } from '@/components/DataSourceToggle';

interface DashboardTopBarProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const DashboardTopBar: React.FC<DashboardTopBarProps> = ({
  title,
  subtitle,
  actions,
}) => {
  return (
    <header className="sticky top-0 z-50 border-b border-vizla-glassBorder bg-vizla-elev1/80 backdrop-blur-xl supports-[backdrop-filter]:bg-vizla-elev1/60">
      <div className="max-w-[1920px] mx-auto px-8 lg:px-12">
        <div className="flex items-center justify-between h-20">
          {/* Left: Title Section */}
          <div className="flex items-center gap-8 flex-1 min-w-0">
            <div className="flex flex-col min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight text-vizla-text-primary truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm font-normal text-vizla-text-muted mt-0.5 truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Right: Actions & Controls */}
          <div className="flex items-center gap-3 ml-8 flex-shrink-0">
            {/* Global Actions */}
            {actions}

            {/* Search - Subtle Icon */}
            <button
              className="p-2.5 rounded-lg hover:bg-vizla-glassElev transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-vizla-ring-focus focus:ring-offset-2 focus:ring-offset-vizla-canvas"
              aria-label="Search"
            >
              <Search className="w-5 h-5 text-vizla-text-secondary" />
            </button>

            {/* Notifications */}
            <button
              className="relative p-2.5 rounded-lg hover:bg-vizla-glassElev transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-vizla-ring-focus focus:ring-offset-2 focus:ring-offset-vizla-canvas"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-vizla-text-secondary" />
              {/* Notification badge */}
              <span className="absolute top-2 right-2 w-2 h-2 bg-vizla-danger rounded-full ring-2 ring-vizla-elev1" />
            </button>

            {/* Settings */}
            <button
              className="p-2.5 rounded-lg hover:bg-vizla-glassElev transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-vizla-ring-focus focus:ring-offset-2 focus:ring-offset-vizla-canvas"
              aria-label="Settings"
            >
              <Settings className="w-5 h-5 text-vizla-text-secondary" />
            </button>

            {/* Theme Toggle */}
            <div className="pl-2 border-l border-vizla-glassBorder">
              <ThemeToggle />
            </div>

            {/* Data Source Toggle */}
            <DataSourceToggle />
          </div>
        </div>
      </div>
    </header>
  );
};




