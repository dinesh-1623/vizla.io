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
        "glass rounded-2xl p-4",
        className
      )}
    >
      {(title || subtitle) && (
        <div className="mb-4">
          {title && (
            <h3 className="text-lg font-semibold text-primary mb-1">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-muted">
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
