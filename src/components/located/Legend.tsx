import React from 'react';
import { HelpCircle } from 'lucide-react';

interface LegendProps {
  maxCount: number;
  className?: string;
}

export const Legend: React.FC<LegendProps> = ({ maxCount, className }) => {
  const steps = [0, Math.ceil(maxCount * 0.25), Math.ceil(maxCount * 0.5), Math.ceil(maxCount * 0.75), maxCount];
  
  return (
    <div className={`flex items-center justify-between ${className}`}>
      {/* Heatmap Legend */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium text-vizla-text-muted uppercase tracking-wider">
          Count Scale:
        </span>
        
        <div className="flex items-center gap-1">
          {steps.map((value, index) => (
            <div key={value} className="flex items-center gap-1">
              <div
                className="w-4 h-4 rounded border border-vizla-glassBorder"
                style={{
                  backgroundColor: value === 0 
                    ? 'rgba(255, 255, 255, 0.03)' // glass-elevated
                    : `rgba(59, 130, 246, ${value / maxCount})` // accent-primary with opacity
                }}
              />
              <span className="text-xs text-vizla-text-secondary">
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Help */}
      <div className="flex items-center gap-2 text-xs text-vizla-text-muted">
        <HelpCircle className="w-3 h-3" />
        <span>
          Click cells to filter • Use arrow keys to navigate • Enter to select
        </span>
      </div>
    </div>
  );
};
