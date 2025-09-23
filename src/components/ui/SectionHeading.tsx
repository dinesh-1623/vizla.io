import React from 'react';
import { cn } from '@/lib/utils';

interface SectionHeadingProps {
  title: string;
  actionSlot?: React.ReactNode;
  subtitle?: string;
  className?: string;
}

const SectionHeading: React.FC<SectionHeadingProps> = ({
  title,
  actionSlot,
  subtitle,
  className
}) => {
  return (
    <div className={cn("mb-6", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[22px] font-semibold tracking-[-0.01em] text-vizla-text-primary">
            {title}
          </h2>
          {subtitle && (
            <p className="text-vizla-text-secondary mt-1">
              {subtitle}
            </p>
          )}
        </div>
        {actionSlot && (
          <div className="flex items-center gap-3">
            {actionSlot}
          </div>
        )}
      </div>
    </div>
  );
};

export { SectionHeading };
