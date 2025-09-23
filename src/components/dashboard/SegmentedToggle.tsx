import React from 'react';
import { cn } from '@/lib/utils';

interface SegmentedToggleProps {
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const SegmentedToggle: React.FC<SegmentedToggleProps> = ({
  options,
  value,
  onChange,
  className
}) => {
  return (
    <div className={cn(
      "inline-flex rounded-lg bg-vizla-glass ring-1 ring-vizla-glassBorder p-1",
      className
    )}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 focus-visible:ring-2 focus-visible:ring-vizla-ring-focus focus-visible:outline-none",
            value === option.value
              ? "bg-vizla-elev1 text-vizla-text-primary shadow-sm"
              : "text-vizla-text-secondary hover:text-vizla-text-primary hover:bg-vizla-glassElev"
          )}
          aria-pressed={value === option.value}
          aria-label={`Switch to ${option.label}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};
