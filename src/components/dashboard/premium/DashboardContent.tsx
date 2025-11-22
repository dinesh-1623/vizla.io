/**
 * Premium Dashboard Content Container
 * 
 * Main content area with:
 * - Optimal spacing
 * - Responsive grid system
 * - Content sections
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface DashboardContentProps {
  children: React.ReactNode;
  /**
   * Custom className
   */
  className?: string;
  /**
   * Max width constraint
   */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' | 'screen';
}

const maxWidthClasses = {
  sm: 'max-w-screen-sm',
  md: 'max-w-screen-md',
  lg: 'max-w-screen-lg',
  xl: 'max-w-screen-xl',
  '2xl': 'max-w-screen-2xl',
  full: 'max-w-full',
  screen: 'max-w-[1920px]',
};

export const DashboardContent: React.FC<DashboardContentProps> = ({
  children,
  className,
  maxWidth = 'screen',
}) => {
  return (
    <div className={cn('mx-auto px-8 lg:px-12 py-8', maxWidthClasses[maxWidth], className)}>
      {children}
    </div>
  );
};

/**
 * Content Section Component
 * For organizing dashboard content into distinct sections
 */
interface ContentSectionProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const ContentSection: React.FC<ContentSectionProps> = ({
  children,
  title,
  subtitle,
  actions,
  className,
}) => {
  return (
    <section className={cn('mb-12 last:mb-0', className)}>
      {/* Section Header */}
      {(title || actions) && (
        <div className="flex items-center justify-between mb-6">
          <div>
            {title && (
              <h2 className="text-lg font-semibold text-vizla-text-primary tracking-tight">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-sm text-vizla-text-muted mt-1">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}

      {/* Section Content */}
      <div>{children}</div>
    </section>
  );
};

/**
 * Placeholder Card Component
 * For chart and table placeholders
 */
interface PlaceholderCardProps {
  title?: string;
  description?: string;
  height?: string;
  children?: React.ReactNode;
}

export const PlaceholderCard: React.FC<PlaceholderCardProps> = ({
  title,
  description,
  height = '400px',
  children,
}) => {
  return (
    <div
      className="rounded-xl border border-vizla-glassBorder bg-vizla-elev2/50 p-8"
      style={{ minHeight: height }}
    >
      {title && (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-vizla-text-secondary mb-1">
            {title}
          </h3>
          {description && (
            <p className="text-xs text-vizla-text-muted">{description}</p>
          )}
        </div>
      )}
      {children || (
        <div className="flex items-center justify-center h-full text-vizla-text-muted">
          <p className="text-sm">Chart/Table placeholder</p>
        </div>
      )}
    </div>
  );
};




