import React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, Search, FileX } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  message?: string;
  action?: React.ReactNode;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  message,
  action,
  className
}) => {
  // Default icon if none provided
  const defaultIcon = icon || <Search className="w-8 h-8 text-muted" />;

  return (
    <div className={cn(
      "glass rounded-2xl p-8 text-center border-2 border-dashed border-white/20",
      className
    )}>
      <div className="flex flex-col items-center space-y-4">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-white/5">
          {defaultIcon}
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-primary">
            {title}
          </h3>
          {message && (
            <p className="text-sm text-secondary max-w-sm">
              {message}
            </p>
          )}
        </div>
        
        {action && (
          <div className="pt-2">
            {action}
          </div>
        )}
      </div>
    </div>
  );
};

export { EmptyState };
