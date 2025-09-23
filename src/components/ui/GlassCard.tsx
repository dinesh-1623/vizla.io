import React from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  title?: string;
  subtitle?: string;
  className?: string;
  children: React.ReactNode;
}

const GlassCard: React.FC<GlassCardProps> = ({
  title,
  subtitle,
  className,
  children
}) => {
  return (
    <div
      className={cn(
        "bg-vizla-glass backdrop-blur-md ring-1 ring-vizla-glassBorder text-vizla-text-secondary rounded-2xl p-4 transition hover:translate-y-[-1px] hover:shadow-2xl/5",
        className
      )}
    >
      {(title || subtitle) && (
        <div className="mb-4">
          {title && (
            <h3 className="text-lg font-semibold text-vizla-text-primary mb-1">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-vizla-text-muted">
              {subtitle}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  );
};

export { GlassCard };
